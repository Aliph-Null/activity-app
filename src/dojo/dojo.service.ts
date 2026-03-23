import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

const PAGE_SIZE = 20;

@Injectable()
export class DojoService {
  constructor(private readonly db: DatabaseService) {}

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

  getProfilesWithoutMentor() {
    return this.db.getDb().prepare(`
      SELECT id, name FROM profiles
      WHERE id NOT IN (SELECT profile_id FROM dojo_mentors)
      ORDER BY name
    `).all();
  }

  createMentor(data: { profile_id: number; description?: string }) {
    this.db.getDb().prepare(
      'INSERT INTO dojo_mentors (profile_id, description) VALUES (?, ?)',
    ).run(data.profile_id, data.description || null);
  }

  updateMentor(id: number, data: { description?: string }) {
    this.db.getDb().prepare(
      'UPDATE dojo_mentors SET description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    ).run(data.description || null, id);
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

  findAllNinjas(page = 1) {
    const offset = (page - 1) * PAGE_SIZE;
    const total = (this.db.getDb().prepare('SELECT COUNT(*) AS cnt FROM dojo_ninjas').get() as any).cnt;
    const items = this.db.getDb().prepare(`
      SELECT dn.id, dn.useful_info, dn.created_at,
             p.name AS profile_name, p.id AS profile_id,
             tp.name AS tutor_name, dn.tutor_id
      FROM dojo_ninjas dn
      JOIN profiles p ON p.id = dn.profile_id
      JOIN dojo_tutors dt ON dt.id = dn.tutor_id
      JOIN profiles tp ON tp.id = dt.profile_id
      ORDER BY p.name
      LIMIT ? OFFSET ?
    `).all(PAGE_SIZE, offset);
    return { items, total, page, totalPages: Math.ceil(total / PAGE_SIZE) };
  }

  findNinjaById(id: number) {
    return this.db.getDb().prepare(`
      SELECT dn.id, dn.profile_id, dn.tutor_id, dn.useful_info,
             p.name AS profile_name, tp.name AS tutor_name
      FROM dojo_ninjas dn
      JOIN profiles p ON p.id = dn.profile_id
      JOIN dojo_tutors dt ON dt.id = dn.tutor_id
      JOIN profiles tp ON tp.id = dt.profile_id
      WHERE dn.id = ?
    `).get(id);
  }

  getAllTutors() {
    return this.db.getDb().prepare(`
      SELECT dt.id, p.name AS profile_name
      FROM dojo_tutors dt
      JOIN profiles p ON p.id = dt.profile_id
      ORDER BY p.name
    `).all();
  }

  getProfiles() {
    return this.db.getDb().prepare('SELECT id, name FROM profiles ORDER BY name').all();
  }

  createNinja(data: { profile_id: number; tutor_id: number; useful_info?: string }) {
    this.db.getDb().prepare(
      'INSERT INTO dojo_ninjas (profile_id, tutor_id, useful_info) VALUES (?, ?, ?)',
    ).run(data.profile_id, data.tutor_id, data.useful_info || null);
  }

  updateNinja(id: number, data: { tutor_id: number; useful_info?: string }) {
    this.db.getDb().prepare(
      'UPDATE dojo_ninjas SET tutor_id = ?, useful_info = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    ).run(data.tutor_id, data.useful_info || null, id);
  }

  deleteNinja(id: number) {
    this.db.getDb().prepare('DELETE FROM dojo_ninjas WHERE id = ?').run(id);
  }

  // ── Sessions ─────────────────────────────────────────────────────────

  findAllSessions(page = 1) {
    const offset = (page - 1) * PAGE_SIZE;
    const total = (this.db.getDb().prepare('SELECT COUNT(*) AS cnt FROM dojo_sessions').get() as any).cnt;
    const items = this.db.getDb().prepare(`
      SELECT ds.id, ds.starts_at, ds.location, ds.theme, ds.created_at,
             p.name AS mentor_name
      FROM dojo_sessions ds
      JOIN dojo_mentors dm ON dm.id = ds.mentor_id
      JOIN profiles p ON p.id = dm.profile_id
      ORDER BY ds.starts_at DESC
      LIMIT ? OFFSET ?
    `).all(PAGE_SIZE, offset);
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

  // ── Blog posts linked via tags ───────────────────────────────────────

  getDojoRelatedPosts() {
    return this.db.getDb().prepare(`
      SELECT bp.id, bp.title, bp.slug, bp.published_at, bp.created_at,
             GROUP_CONCAT(bt.name) AS tags
      FROM blog_posts bp
      JOIN blog_post_tags bpt ON bpt.post_id = bp.id
      JOIN blog_tags bt ON bt.id = bpt.tag_id
      WHERE LOWER(bt.name) LIKE '%dojo%' OR LOWER(bt.name) LIKE '%coderdojo%'
      GROUP BY bp.id
      ORDER BY bp.created_at DESC
    `).all();
  }

  getAllBlogTags() {
    return this.db.getDb().prepare('SELECT id, name FROM blog_tags ORDER BY name').all();
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
