import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { ProfilesService } from '../profiles/profiles.service';

const PAGE_SIZE = 20;

@Injectable()
export class DojoService {
  constructor(
    private readonly db: DatabaseService,
    private readonly profilesService: ProfilesService,
  ) {}

  // ── Mentors ──────────────────────────────────────────────────────────

  findAllMentors(page = 1) {
    const offset = (page - 1) * PAGE_SIZE;
    const total = (this.db.getDb().prepare('SELECT COUNT(*) AS cnt FROM dojo_mentors').get() as any).cnt;
    const items = this.db.getDb().prepare(`
      SELECT dm.id, dm.description, dm.created_at, p.name AS profile_name, p.id AS profile_id
      FROM dojo_mentors dm
      JOIN profiles p ON p.id = dm.profile_id
      ORDER BY p.name
      LIMIT ? OFFSET ?
    `).all(PAGE_SIZE, offset);
    return { items, total, page, totalPages: Math.ceil(total / PAGE_SIZE) };
  }

  findMentorById(id: number) {
    return this.db.getDb().prepare(`
      SELECT dm.id, dm.profile_id, dm.description, p.name AS profile_name
      FROM dojo_mentors dm
      JOIN profiles p ON p.id = dm.profile_id
      WHERE dm.id = ?
    `).get(id);
  }

  /** Mentor + full profile for the combined form (profile link fixed on edit). */
  findMentorWithProfile(id: number) {
    const row = this.db.getDb().prepare(`
      SELECT dm.id, dm.description,
        p.id AS profile_id, p.name AS profile_name, p.email AS profile_email, p.phone AS profile_phone, p.birth_date AS profile_birth_date
      FROM dojo_mentors dm
      JOIN profiles p ON p.id = dm.profile_id
      WHERE dm.id = ?
    `).get(id) as any;
    if (!row) return null;
    return {
      id: row.id,
      description: row.description,
      profile: {
        id: row.profile_id,
        name: row.profile_name,
        email: row.profile_email,
        phone: row.profile_phone,
        birth_date: row.profile_birth_date,
      },
    };
  }

  getProfilesWithoutMentor() {
    return this.db.getDb().prepare(`
      SELECT id, name FROM profiles
      WHERE id NOT IN (SELECT profile_id FROM dojo_mentors)
      ORDER BY name
    `).all();
  }

  createMentorReturnId(profileId: number, description: string | null): number {
    this.db.getDb().prepare(
      'INSERT INTO dojo_mentors (profile_id, description) VALUES (?, ?)',
    ).run(profileId, description);
    return (this.db.getDb().prepare('SELECT last_insert_rowid() AS id').get() as any).id;
  }

  /** New mentor: existing profile or new profile fields + agreement JSON. */
  registerMentor(body: Record<string, any>) {
    const description = String(body.description ?? '').trim() || null;
    const mode = body.mentor_profile_mode === 'new' ? 'new' : 'existing';
    const tx = this.db.getDb().transaction(() => {
      let profileId: number;
      if (mode === 'new') {
        const p = this.parseProfileFieldsFromBody(body, 'mentor');
        if (!p.name) {
          throw new Error('Name is required for a new profile.');
        }
        profileId = Number(this.profilesService.create(p));
      } else {
        profileId = parseInt(body.profile_id || '', 10);
        if (!Number.isFinite(profileId)) {
          throw new Error('Select a profile, or choose “New profile”.');
        }
      }
      const mentorId = this.createMentorReturnId(profileId, description);
      this.replaceMentorSignaturesFromPayload(mentorId, body);
    });
    tx();
  }

  /** Update mentor profile fields, description, and agreement list (no profile re-link). */
  updateMentorWizard(id: number, body: Record<string, any>) {
    const row = this.findMentorWithProfile(id);
    if (!row) {
      throw new Error('Mentor not found.');
    }
    const p = this.parseProfileFieldsFromBody(body, 'mentor');
    if (!p.name) {
      throw new Error('Name is required.');
    }
    const description = String(body.description ?? '').trim() || null;
    const tx = this.db.getDb().transaction(() => {
      this.profilesService.update(row.profile.id, p);
      this.db.getDb().prepare(
        'UPDATE dojo_mentors SET description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      ).run(description, id);
      this.replaceMentorSignaturesFromPayload(id, body);
    });
    tx();
  }

  deleteMentor(id: number) {
    this.db.getDb().prepare('DELETE FROM dojo_mentors WHERE id = ?').run(id);
  }

  // ── Tutors ───────────────────────────────────────────────────────────

  findAllTutors(page = 1) {
    const offset = (page - 1) * PAGE_SIZE;
    const total = (this.db.getDb().prepare('SELECT COUNT(*) AS cnt FROM dojo_tutors').get() as any).cnt;
    const items = this.db.getDb().prepare(`
      SELECT dt.id, dt.created_at, p.name AS profile_name, p.id AS profile_id
      FROM dojo_tutors dt
      JOIN profiles p ON p.id = dt.profile_id
      ORDER BY p.name
      LIMIT ? OFFSET ?
    `).all(PAGE_SIZE, offset);
    return { items, total, page, totalPages: Math.ceil(total / PAGE_SIZE) };
  }

  findTutorById(id: number) {
    return this.db.getDb().prepare(`
      SELECT dt.id, dt.profile_id, p.name AS profile_name
      FROM dojo_tutors dt
      JOIN profiles p ON p.id = dt.profile_id
      WHERE dt.id = ?
    `).get(id);
  }

  getProfilesWithoutTutor() {
    return this.db.getDb().prepare(`
      SELECT id, name FROM profiles
      WHERE id NOT IN (SELECT profile_id FROM dojo_tutors)
      ORDER BY name
    `).all();
  }

  createTutor(data: { profile_id: number }) {
    this.db.getDb().prepare('INSERT INTO dojo_tutors (profile_id) VALUES (?)').run(data.profile_id);
  }

  deleteTutor(id: number) {
    this.db.getDb().prepare('DELETE FROM dojo_tutors WHERE id = ?').run(id);
  }

  // ── Ninjas ───────────────────────────────────────────────────────────

  findAllNinjas(page = 1, search?: string) {
    const offset = (page - 1) * PAGE_SIZE;
    const q = search?.trim();
    let where = '';
    const countParams: unknown[] = [];
    if (q) {
      where = 'WHERE (LOWER(p.name) LIKE \'%\' || LOWER(?) || \'%\' OR LOWER(tp.name) LIKE \'%\' || LOWER(?) || \'%\')';
      countParams.push(q, q);
    }
    const total = (
      this.db.getDb().prepare(`SELECT COUNT(*) AS cnt FROM dojo_ninjas dn
        JOIN profiles p ON p.id = dn.profile_id
        JOIN dojo_tutors dt ON dt.id = dn.tutor_id
        JOIN profiles tp ON tp.id = dt.profile_id ${where}`).get(...countParams) as any
    ).cnt;
    const listParams = [...countParams, PAGE_SIZE, offset];
    const items = this.db.getDb().prepare(`
      SELECT dn.id, dn.created_at,
             p.name AS profile_name, p.id AS profile_id,
             tp.name AS tutor_name, dn.tutor_id,
             (SELECT COUNT(*) FROM tutor_agreement_signatures tas WHERE tas.tutor_id = dn.tutor_id) AS tutor_agreement_signed_count
      FROM dojo_ninjas dn
      JOIN profiles p ON p.id = dn.profile_id
      JOIN dojo_tutors dt ON dt.id = dn.tutor_id
      JOIN profiles tp ON tp.id = dt.profile_id
      ${where}
      ORDER BY p.name
      LIMIT ? OFFSET ?
    `).all(...listParams) as any[];
    for (const row of items) {
      row.tutor_agreement_signed_count = Number(row.tutor_agreement_signed_count) || 0;
    }
    return { items, total, page, totalPages: Math.ceil(total / PAGE_SIZE) };
  }

  /** Ninja row plus full child and guardian profiles for the combined form (no re-linking). */
  findNinjaWithProfiles(id: number) {
    const row = this.db.getDb().prepare(`
      SELECT dn.id, dn.useful_info, dn.tutor_id,
        np.id AS ninja_profile_id, np.name AS ninja_name, np.email AS ninja_email, np.phone AS ninja_phone, np.birth_date AS ninja_birth_date,
        tp.id AS tutor_profile_id, tp.name AS tutor_name, tp.email AS tutor_email, tp.phone AS tutor_phone, tp.birth_date AS tutor_birth_date
      FROM dojo_ninjas dn
      JOIN profiles np ON np.id = dn.profile_id
      JOIN dojo_tutors dt ON dt.id = dn.tutor_id
      JOIN profiles tp ON tp.id = dt.profile_id
      WHERE dn.id = ?
    `).get(id) as any;
    if (!row) return null;
    return {
      id: row.id,
      useful_info: row.useful_info,
      tutor_id: row.tutor_id,
      ninjaProfile: {
        id: row.ninja_profile_id,
        name: row.ninja_name,
        email: row.ninja_email,
        phone: row.ninja_phone,
        birth_date: row.ninja_birth_date,
      },
      tutorProfile: {
        id: row.tutor_profile_id,
        name: row.tutor_name,
        email: row.tutor_email,
        phone: row.tutor_phone,
        birth_date: row.tutor_birth_date,
      },
    };
  }

  createTutorReturnId(profileId: number): number {
    this.db.getDb().prepare('INSERT INTO dojo_tutors (profile_id) VALUES (?)').run(profileId);
    return (this.db.getDb().prepare('SELECT last_insert_rowid() AS id').get() as any).id;
  }

  /** Rows for the ninja wizard: document + date only (one row per signed document). */
  getTutorSignatureRowsForWizard(tutorId: number | null) {
    if (tutorId == null) return [];
    return this.db.getDb().prepare(`
      SELECT ad.id AS document_id,
        CASE WHEN tas.signed_at IS NOT NULL AND length(tas.signed_at) >= 10 THEN substr(tas.signed_at, 1, 10) ELSE '' END AS signed_at
      FROM tutor_agreement_signatures tas
      JOIN agreement_documents ad ON ad.id = tas.document_id
      WHERE tas.tutor_id = ?
      ORDER BY ad.name
    `).all(tutorId) as { document_id: number; signed_at: string }[];
  }

  getMentorSignatureRowsForWizard(mentorId: number | null) {
    if (mentorId == null) return [];
    return this.db.getDb().prepare(`
      SELECT ad.id AS document_id,
        CASE WHEN mas.signed_at IS NOT NULL AND length(mas.signed_at) >= 10 THEN substr(mas.signed_at, 1, 10) ELSE '' END AS signed_at
      FROM mentor_agreement_signatures mas
      JOIN agreement_documents ad ON ad.id = mas.document_id
      WHERE mas.mentor_id = ?
      ORDER BY ad.name
    `).all(mentorId) as { document_id: number; signed_at: string }[];
  }

  /** Replaces mentor agreement rows from JSON `[{ document_id, signed_at }]`. No-op if no agreement documents exist. */
  private replaceMentorSignaturesFromPayload(mentorId: number, body: Record<string, any>) {
    const docCount = (this.db.getDb().prepare('SELECT COUNT(*) AS c FROM agreement_documents').get() as any).c;
    if (!docCount) return;

    const raw = body.mentor_signatures_json;
    let rows: { document_id?: unknown; signed_at?: unknown }[] = [];
    if (typeof raw === 'string' && raw.trim()) {
      try {
        rows = JSON.parse(raw);
      } catch {
        throw new Error('Invalid mentor agreement data.');
      }
    }
    if (!Array.isArray(rows)) rows = [];

    const validDocIds = new Set(
      (this.db.getDb().prepare('SELECT id FROM agreement_documents').all() as { id: number }[]).map((d) => d.id),
    );
    const seen = new Map<number, string>();
    for (const r of rows) {
      const did = typeof r.document_id === 'number' ? r.document_id : parseInt(String(r.document_id), 10);
      const dts = typeof r.signed_at === 'string' ? r.signed_at.trim() : '';
      if (!Number.isFinite(did) || !validDocIds.has(did) || dts.length < 8) continue;
      seen.set(did, dts);
    }

    const db = this.db.getDb();
    db.prepare('DELETE FROM mentor_agreement_signatures WHERE mentor_id = ?').run(mentorId);
    const ins = db.prepare(
      'INSERT INTO mentor_agreement_signatures (mentor_id, document_id, signed_at) VALUES (?, ?, ?)',
    );
    for (const [documentId, signedAt] of seen) {
      ins.run(mentorId, documentId, signedAt);
    }
  }

  private parseProfileFieldsFromBody(body: Record<string, any>, prefix: string) {
    const name = String(body[`${prefix}_name`] ?? '').trim();
    const email = String(body[`${prefix}_email`] ?? '').trim();
    const phone = String(body[`${prefix}_phone`] ?? '').trim();
    const birth_date = String(body[`${prefix}_birth_date`] ?? '').trim();
    return {
      name,
      email: email || undefined,
      phone: phone || undefined,
      birth_date: birth_date || undefined,
    };
  }

  /** Replaces all tutor agreement rows from JSON `[{ document_id, signed_at }]`. No-op if there are no agreement documents in the system. */
  private replaceTutorSignaturesFromPayload(tutorId: number, body: Record<string, any>) {
    const docCount = (this.db.getDb().prepare('SELECT COUNT(*) AS c FROM agreement_documents').get() as any).c;
    if (!docCount) return;

    const raw = body.tutor_signatures_json;
    let rows: { document_id?: unknown; signed_at?: unknown }[] = [];
    if (typeof raw === 'string' && raw.trim()) {
      try {
        rows = JSON.parse(raw);
      } catch {
        throw new Error('Invalid tutor agreement data.');
      }
    }
    if (!Array.isArray(rows)) rows = [];

    const validDocIds = new Set(
      (this.db.getDb().prepare('SELECT id FROM agreement_documents').all() as { id: number }[]).map((d) => d.id),
    );
    const seen = new Map<number, string>();
    for (const r of rows) {
      const did = typeof r.document_id === 'number' ? r.document_id : parseInt(String(r.document_id), 10);
      const dt = typeof r.signed_at === 'string' ? r.signed_at.trim() : '';
      if (!Number.isFinite(did) || !validDocIds.has(did) || dt.length < 8) continue;
      seen.set(did, dt);
    }

    const db = this.db.getDb();
    db.prepare('DELETE FROM tutor_agreement_signatures WHERE tutor_id = ?').run(tutorId);
    const ins = db.prepare(
      'INSERT INTO tutor_agreement_signatures (tutor_id, document_id, signed_at) VALUES (?, ?, ?)',
    );
    for (const [documentId, signedAt] of seen) {
      ins.run(tutorId, documentId, signedAt);
    }
  }

  /** Creates two profiles (child + guardian), tutor row, ninja row, and tutor agreement signatures. */
  registerNinjaWithTutor(body: Record<string, any>) {
    const ninjaP = this.parseProfileFieldsFromBody(body, 'ninja');
    const tutorP = this.parseProfileFieldsFromBody(body, 'tutor');
    if (!ninjaP.name) {
      throw new Error('Ninja name is required.');
    }
    if (!tutorP.name) {
      throw new Error('Guardian name is required.');
    }
    const tx = this.db.getDb().transaction(() => {
      const childProfileId = Number(this.profilesService.create(ninjaP));
      const tutorProfileId = Number(this.profilesService.create(tutorP));
      const tutorId = this.createTutorReturnId(tutorProfileId);
      this.db.getDb().prepare(
        'INSERT INTO dojo_ninjas (profile_id, tutor_id, useful_info) VALUES (?, ?, ?)',
      ).run(childProfileId, tutorId, String(body.useful_info ?? '').trim() || null);
      this.replaceTutorSignaturesFromPayload(tutorId, body);
    });
    tx();
  }

  /** Updates both profiles and ninja notes; tutor link and profile IDs stay fixed. */
  updateNinjaWizard(ninjaId: number, body: Record<string, any>) {
    const row = this.findNinjaWithProfiles(ninjaId);
    if (!row) {
      throw new Error('Ninja not found.');
    }
    const ninjaP = this.parseProfileFieldsFromBody(body, 'ninja');
    const tutorP = this.parseProfileFieldsFromBody(body, 'tutor');
    if (!ninjaP.name) {
      throw new Error('Ninja name is required.');
    }
    if (!tutorP.name) {
      throw new Error('Guardian name is required.');
    }
    const tx = this.db.getDb().transaction(() => {
      this.profilesService.update(row.ninjaProfile.id, ninjaP);
      this.profilesService.update(row.tutorProfile.id, tutorP);
      this.db.getDb().prepare(`
        UPDATE dojo_ninjas SET useful_info = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `).run(String(body.useful_info ?? '').trim() || null, ninjaId);
      this.replaceTutorSignaturesFromPayload(row.tutor_id, body);
    });
    tx();
  }

  getProfiles() {
    return this.db.getDb().prepare('SELECT id, name FROM profiles ORDER BY name').all();
  }

  createNinja(data: { profile_id: number; tutor_id: number; useful_info?: string }) {
    this.db.getDb().prepare(
      'INSERT INTO dojo_ninjas (profile_id, tutor_id, useful_info) VALUES (?, ?, ?)',
    ).run(data.profile_id, data.tutor_id, data.useful_info || null);
  }

  updateNinja(id: number, data: { tutor_id: number; useful_info?: string; profile_id?: number }) {
    if (data.profile_id != null) {
      this.db.getDb().prepare(
        'UPDATE dojo_ninjas SET profile_id = ?, tutor_id = ?, useful_info = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      ).run(data.profile_id, data.tutor_id, data.useful_info || null, id);
    } else {
      this.db.getDb().prepare(
        'UPDATE dojo_ninjas SET tutor_id = ?, useful_info = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      ).run(data.tutor_id, data.useful_info || null, id);
    }
  }

  deleteNinja(id: number) {
    this.db.getDb().prepare('DELETE FROM dojo_ninjas WHERE id = ?').run(id);
  }

  // ── Sessions ─────────────────────────────────────────────────────────

  findAllSessions(
    page = 1,
    filters: { date_from?: string; date_to?: string; theme?: string } = {},
  ) {
    const offset = (page - 1) * PAGE_SIZE;
    const conditions: string[] = [];
    const params: unknown[] = [];
    const df = filters.date_from?.trim();
    const dt = filters.date_to?.trim();
    const th = filters.theme?.trim();
    if (df) {
      conditions.push('ds.starts_at >= ?');
      params.push(df.length === 10 ? `${df}T00:00:00.000` : df);
    }
    if (dt) {
      conditions.push('ds.starts_at <= ?');
      params.push(dt.length === 10 ? `${dt}T23:59:59.999` : dt);
    }
    if (th) {
      conditions.push('LOWER(COALESCE(ds.theme, \'\')) LIKE \'%\' || LOWER(?) || \'%\'');
      params.push(th);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const total = (
      this.db.getDb().prepare(`
        SELECT COUNT(*) AS cnt FROM dojo_sessions ds ${where}
      `).get(...params) as any
    ).cnt;
    const items = this.db.getDb().prepare(`
      SELECT ds.id, ds.starts_at, ds.location, ds.theme, ds.created_at,
             p.name AS mentor_name
      FROM dojo_sessions ds
      JOIN dojo_mentors dm ON dm.id = ds.mentor_id
      JOIN profiles p ON p.id = dm.profile_id
      ${where}
      ORDER BY ds.starts_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, PAGE_SIZE, offset);
    return { items, total, page, totalPages: Math.ceil(total / PAGE_SIZE) };
  }

  findSessionById(id: number) {
    return this.db.getDb().prepare(`
      SELECT ds.id, ds.starts_at, ds.location, ds.theme, ds.mentor_id,
             p.name AS mentor_name
      FROM dojo_sessions ds
      JOIN dojo_mentors dm ON dm.id = ds.mentor_id
      JOIN profiles p ON p.id = dm.profile_id
      WHERE ds.id = ?
    `).get(id);
  }

  getAllMentors() {
    return this.db.getDb().prepare(`
      SELECT dm.id, p.name AS profile_name
      FROM dojo_mentors dm
      JOIN profiles p ON p.id = dm.profile_id
      ORDER BY p.name
    `).all();
  }

  createSession(data: { starts_at: string; location: string; theme?: string; mentor_id: number }) {
    this.db.getDb().prepare(
      'INSERT INTO dojo_sessions (starts_at, location, theme, mentor_id) VALUES (?, ?, ?, ?)',
    ).run(data.starts_at, data.location, data.theme || null, data.mentor_id);
  }

  updateSession(id: number, data: { starts_at: string; location: string; theme?: string; mentor_id: number }) {
    this.db.getDb().prepare(
      'UPDATE dojo_sessions SET starts_at = ?, location = ?, theme = ?, mentor_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    ).run(data.starts_at, data.location, data.theme || null, data.mentor_id, id);
  }

  deleteSession(id: number) {
    this.db.getDb().prepare('DELETE FROM dojo_sessions WHERE id = ?').run(id);
  }

  // ── Agreement Documents ──────────────────────────────────────────────

  findAllDocuments() {
    return this.db.getDb().prepare('SELECT * FROM agreement_documents ORDER BY name').all();
  }

  findDocumentById(id: number) {
    return this.db.getDb().prepare('SELECT * FROM agreement_documents WHERE id = ?').get(id) as any;
  }

  createDocument(data: { name: string; file_path?: string; original_filename?: string }) {
    this.db.getDb().prepare(
      'INSERT INTO agreement_documents (name, file_path, original_filename) VALUES (?, ?, ?)',
    ).run(data.name, data.file_path || null, data.original_filename || null);
  }

  updateDocument(id: number, data: { name: string; file_path?: string; original_filename?: string }) {
    const doc = this.findDocumentById(id);
    this.db.getDb().prepare(
      'UPDATE agreement_documents SET name = ?, file_path = ?, original_filename = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    ).run(data.name, data.file_path ?? doc?.file_path ?? null, data.original_filename ?? doc?.original_filename ?? null, id);
  }

  clearDocumentFile(id: number) {
    this.db.getDb().prepare(
      'UPDATE agreement_documents SET file_path = NULL, original_filename = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    ).run(id);
  }

  deleteDocument(id: number) {
    this.db.getDb().prepare('DELETE FROM agreement_documents WHERE id = ?').run(id);
  }

  // ── Signatures ───────────────────────────────────────────────────────

  getMentorSignatures(mentorId: number) {
    return this.db.getDb().prepare(`
      SELECT mas.id, mas.signed_at, ad.name AS document_name, ad.id AS document_id
      FROM mentor_agreement_signatures mas
      JOIN agreement_documents ad ON ad.id = mas.document_id
      WHERE mas.mentor_id = ?
      ORDER BY mas.signed_at DESC
    `).all(mentorId);
  }

  createMentorSignature(mentorId: number, documentId: number, signedAt: string) {
    this.db.getDb().prepare(
      'INSERT INTO mentor_agreement_signatures (mentor_id, document_id, signed_at) VALUES (?, ?, ?)',
    ).run(mentorId, documentId, signedAt);
  }

  deleteMentorSignature(id: number) {
    this.db.getDb().prepare('DELETE FROM mentor_agreement_signatures WHERE id = ?').run(id);
  }

  getTutorSignatures(tutorId: number) {
    return this.db.getDb().prepare(`
      SELECT tas.id, tas.signed_at, ad.name AS document_name, ad.id AS document_id
      FROM tutor_agreement_signatures tas
      JOIN agreement_documents ad ON ad.id = tas.document_id
      WHERE tas.tutor_id = ?
      ORDER BY tas.signed_at DESC
    `).all(tutorId);
  }

  createTutorSignature(tutorId: number, documentId: number, signedAt: string) {
    this.db.getDb().prepare(
      'INSERT INTO tutor_agreement_signatures (tutor_id, document_id, signed_at) VALUES (?, ?, ?)',
    ).run(tutorId, documentId, signedAt);
  }

  deleteTutorSignature(id: number) {
    this.db.getDb().prepare('DELETE FROM tutor_agreement_signatures WHERE id = ?').run(id);
  }

  // ── Agreements overview ─────────────────────────────────────────────

  getAgreementsOverview() {
    const documents = this.db.getDb().prepare('SELECT id, name FROM agreement_documents ORDER BY name').all() as any[];
    const mentors = this.db.getDb().prepare(`
      SELECT dm.id, p.name AS profile_name FROM dojo_mentors dm
      JOIN profiles p ON p.id = dm.profile_id ORDER BY p.name
    `).all() as any[];
    const tutors = this.db.getDb().prepare(`
      SELECT dt.id, p.name AS profile_name FROM dojo_tutors dt
      JOIN profiles p ON p.id = dt.profile_id ORDER BY p.name
    `).all() as any[];

    const mentorSigs = this.db.getDb().prepare(
      'SELECT mentor_id, document_id, signed_at FROM mentor_agreement_signatures',
    ).all() as any[];
    const tutorSigs = this.db.getDb().prepare(
      'SELECT tutor_id, document_id, signed_at FROM tutor_agreement_signatures',
    ).all() as any[];

    const mentorSigMap = new Map<string, string>();
    for (const s of mentorSigs) mentorSigMap.set(`${s.mentor_id}-${s.document_id}`, s.signed_at);
    const tutorSigMap = new Map<string, string>();
    for (const s of tutorSigs) tutorSigMap.set(`${s.tutor_id}-${s.document_id}`, s.signed_at);

    const mentorRows = mentors.map((m) => ({
      ...m,
      type: 'mentor',
      docs: documents.map((d) => ({
        document_id: d.id,
        signed_at: mentorSigMap.get(`${m.id}-${d.id}`) || null,
      })),
    }));
    const tutorRows = tutors.map((t) => ({
      ...t,
      type: 'tutor',
      docs: documents.map((d) => ({
        document_id: d.id,
        signed_at: tutorSigMap.get(`${t.id}-${d.id}`) || null,
      })),
    }));

    return { documents, mentorRows, tutorRows };
  }
}
