import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

const PAGE_SIZE = 20;

@Injectable()
export class FestivalService {
  constructor(private readonly db: DatabaseService) {}

  // ── Editions ─────────────────────────────────────────────────────────

  findAllEditions() {
    return this.db.getDb().prepare(`
      SELECT fe.*, bt.name AS blog_tag_name
      FROM festival_editions fe
      LEFT JOIN blog_tags bt ON bt.id = fe.blog_tag_id
      ORDER BY fe.year DESC
    `).all();
  }

  findEditionById(id: number) {
    return this.db.getDb().prepare(`
      SELECT fe.*, bt.name AS blog_tag_name
      FROM festival_editions fe
      LEFT JOIN blog_tags bt ON bt.id = fe.blog_tag_id
      WHERE fe.id = ?
    `).get(id) as any;
  }

  getAllBlogTags() {
    return this.db.getDb().prepare('SELECT id, name FROM blog_tags ORDER BY name').all();
  }

  createEdition(data: any) {
    this.db.getDb().prepare(`
      INSERT INTO festival_editions (year, title, theme, short_description, long_description, main_color, secondary_color, accent_color, blog_tag_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(data.year, data.title || null, data.theme || null, data.short_description || null, data.long_description || null,
      data.main_color || null, data.secondary_color || null, data.accent_color || null, data.blog_tag_id || null);
  }

  updateEdition(id: number, data: any) {
    this.db.getDb().prepare(`
      UPDATE festival_editions SET year = ?, title = ?, theme = ?, short_description = ?, long_description = ?,
        main_color = ?, secondary_color = ?, accent_color = ?, blog_tag_id = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(data.year, data.title || null, data.theme || null, data.short_description || null, data.long_description || null,
      data.main_color || null, data.secondary_color || null, data.accent_color || null, data.blog_tag_id || null, id);
  }

  deleteEdition(id: number) {
    this.db.getDb().prepare('DELETE FROM festival_editions WHERE id = ?').run(id);
  }

  // ── Sections ─────────────────────────────────────────────────────────

  getSections(editionId: number) {
    return this.db.getDb().prepare(`
      SELECT fs.*, (SELECT COUNT(*) FROM festival_activities fa WHERE fa.section_id = fs.id) AS activity_count
      FROM festival_sections fs WHERE fs.edition_id = ? ORDER BY fs.name
    `).all(editionId);
  }

  createSection(editionId: number, name: string) {
    this.db.getDb().prepare('INSERT INTO festival_sections (edition_id, name) VALUES (?, ?)').run(editionId, name);
  }

  updateSection(id: number, name: string) {
    this.db.getDb().prepare('UPDATE festival_sections SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(name, id);
  }

  deleteSection(id: number) {
    this.db.getDb().prepare('DELETE FROM festival_sections WHERE id = ?').run(id);
  }

  // ── Activities ───────────────────────────────────────────────────────

  getActivities(sectionId: number) {
    return this.db.getDb().prepare(`
      SELECT * FROM festival_activities WHERE section_id = ? ORDER BY title
    `).all(sectionId);
  }

  findActivityById(id: number) {
    return this.db.getDb().prepare('SELECT * FROM festival_activities WHERE id = ?').get(id);
  }

  getSectionById(id: number) {
    return this.db.getDb().prepare('SELECT * FROM festival_sections WHERE id = ?').get(id) as any;
  }

  createActivity(data: any) {
    this.db.getDb().prepare(`
      INSERT INTO festival_activities (section_id, title, description, activity_type, audience) VALUES (?, ?, ?, ?, ?)
    `).run(data.section_id, data.title || null, data.description || null, data.activity_type, data.audience);
  }

  updateActivity(id: number, data: any) {
    this.db.getDb().prepare(`
      UPDATE festival_activities SET title = ?, description = ?, activity_type = ?, audience = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(data.title || null, data.description || null, data.activity_type, data.audience, id);
  }

  deleteActivity(id: number) {
    this.db.getDb().prepare('DELETE FROM festival_activities WHERE id = ?').run(id);
  }

  // ── Volunteers ───────────────────────────────────────────────────────

  getVolunteers(editionId: number) {
    return this.db.getDb().prepare(`
      SELECT fv.id, fv.created_at, p.name AS profile_name, p.id AS profile_id
      FROM festival_volunteers fv
      JOIN profiles p ON p.id = fv.profile_id
      WHERE fv.edition_id = ?
      ORDER BY p.name
    `).all(editionId);
  }

  getProfilesNotVolunteer(editionId: number) {
    return this.db.getDb().prepare(`
      SELECT id, name FROM profiles
      WHERE id NOT IN (SELECT profile_id FROM festival_volunteers WHERE edition_id = ?)
      ORDER BY name
    `).all(editionId);
  }

  createVolunteer(editionId: number, profileId: number) {
    this.db.getDb().prepare('INSERT INTO festival_volunteers (edition_id, profile_id) VALUES (?, ?)').run(editionId, profileId);
  }

  deleteVolunteer(id: number) {
    this.db.getDb().prepare('DELETE FROM festival_volunteers WHERE id = ?').run(id);
  }

  // ── Locations ────────────────────────────────────────────────────────

  getLocations(editionId: number) {
    return this.db.getDb().prepare(`
      SELECT fl.*, p.name AS coordinator_name
      FROM festival_locations fl
      LEFT JOIN festival_volunteers fv ON fv.id = fl.coordinator_id
      LEFT JOIN profiles p ON p.id = fv.profile_id
      WHERE fl.edition_id = ?
      ORDER BY fl.name
    `).all(editionId);
  }

  findLocationById(id: number) {
    return this.db.getDb().prepare('SELECT * FROM festival_locations WHERE id = ?').get(id);
  }

  createLocation(data: any) {
    this.db.getDb().prepare(`
      INSERT INTO festival_locations (edition_id, name, address, description, coordinator_id) VALUES (?, ?, ?, ?, ?)
    `).run(data.edition_id, data.name, data.address || null, data.description || null, data.coordinator_id || null);
  }

  updateLocation(id: number, data: any) {
    this.db.getDb().prepare(`
      UPDATE festival_locations SET name = ?, address = ?, description = ?, coordinator_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(data.name, data.address || null, data.description || null, data.coordinator_id || null, id);
  }

  deleteLocation(id: number) {
    this.db.getDb().prepare('DELETE FROM festival_locations WHERE id = ?').run(id);
  }

  // ── Guests ───────────────────────────────────────────────────────────

  getGuests(editionId: number) {
    return this.db.getDb().prepare(`
      SELECT fg.id, fg.created_at, p.name AS profile_name, p.id AS profile_id,
        GROUP_CONCAT(fgr.role) AS roles
      FROM festival_guests fg
      JOIN profiles p ON p.id = fg.profile_id
      LEFT JOIN festival_guest_roles fgr ON fgr.guest_id = fg.id
      WHERE fg.edition_id = ?
      GROUP BY fg.id
      ORDER BY p.name
    `).all(editionId);
  }

  findGuestById(id: number) {
    const guest = this.db.getDb().prepare(`
      SELECT fg.id, fg.edition_id, fg.profile_id, p.name AS profile_name
      FROM festival_guests fg
      JOIN profiles p ON p.id = fg.profile_id
      WHERE fg.id = ?
    `).get(id) as any;
    if (guest) {
      guest.roles = this.db.getDb().prepare('SELECT role FROM festival_guest_roles WHERE guest_id = ?').all(id).map((r: any) => r.role);
    }
    return guest;
  }

  getProfilesNotGuest(editionId: number) {
    return this.db.getDb().prepare(`
      SELECT id, name FROM profiles
      WHERE id NOT IN (SELECT profile_id FROM festival_guests WHERE edition_id = ?)
      ORDER BY name
    `).all(editionId);
  }

  createGuest(editionId: number, profileId: number, roles: string[]) {
    const tx = this.db.getDb().transaction(() => {
      this.db.getDb().prepare('INSERT INTO festival_guests (edition_id, profile_id) VALUES (?, ?)').run(editionId, profileId);
      const guestId = (this.db.getDb().prepare('SELECT last_insert_rowid() AS id').get() as any).id;
      for (const role of roles) {
        this.db.getDb().prepare('INSERT INTO festival_guest_roles (guest_id, role) VALUES (?, ?)').run(guestId, role);
      }
    });
    tx();
  }

  updateGuestRoles(guestId: number, roles: string[]) {
    const tx = this.db.getDb().transaction(() => {
      this.db.getDb().prepare('DELETE FROM festival_guest_roles WHERE guest_id = ?').run(guestId);
      for (const role of roles) {
        this.db.getDb().prepare('INSERT INTO festival_guest_roles (guest_id, role) VALUES (?, ?)').run(guestId, role);
      }
    });
    tx();
  }

  deleteGuest(id: number) {
    this.db.getDb().prepare('DELETE FROM festival_guests WHERE id = ?').run(id);
  }

  // ── Sponsors ─────────────────────────────────────────────────────────

  getSponsors(editionId: number) {
    return this.db.getDb().prepare(`
      SELECT fs.*,
        (SELECT COUNT(*) FROM festival_sponsor_discount_locations dl WHERE dl.sponsor_id = fs.id) AS discount_count
      FROM festival_sponsors fs WHERE fs.edition_id = ? ORDER BY fs.name
    `).all(editionId);
  }

  findSponsorById(id: number) {
    return this.db.getDb().prepare('SELECT * FROM festival_sponsors WHERE id = ?').get(id);
  }

  createSponsor(data: any) {
    this.db.getDb().prepare(`
      INSERT INTO festival_sponsors (edition_id, name, sponsorship_type, sponsorship_level, website) VALUES (?, ?, ?, ?, ?)
    `).run(data.edition_id, data.name, data.sponsorship_type, data.sponsorship_level, data.website || null);
  }

  updateSponsor(id: number, data: any) {
    this.db.getDb().prepare(`
      UPDATE festival_sponsors SET name = ?, sponsorship_type = ?, sponsorship_level = ?, website = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(data.name, data.sponsorship_type, data.sponsorship_level, data.website || null, id);
  }

  deleteSponsor(id: number) {
    this.db.getDb().prepare('DELETE FROM festival_sponsors WHERE id = ?').run(id);
  }

  // ── Discount Locations ───────────────────────────────────────────────

  getDiscountLocations(sponsorId: number) {
    return this.db.getDb().prepare(`
      SELECT dl.*,
        (SELECT COUNT(*) FROM festival_discount_redeemings dr WHERE dr.discount_location_id = dl.id) AS redeem_count
      FROM festival_sponsor_discount_locations dl WHERE dl.sponsor_id = ? ORDER BY dl.name
    `).all(sponsorId);
  }

  createDiscountLocation(data: any) {
    this.db.getDb().prepare(`
      INSERT INTO festival_sponsor_discount_locations (sponsor_id, name, address, discount_percent, redeem_max) VALUES (?, ?, ?, ?, ?)
    `).run(data.sponsor_id, data.name, data.address || null, data.discount_percent, data.redeem_max);
  }

  deleteDiscountLocation(id: number) {
    this.db.getDb().prepare('DELETE FROM festival_sponsor_discount_locations WHERE id = ?').run(id);
  }

  // ── Program ──────────────────────────────────────────────────────────

  getProgram(editionId: number) {
    return this.db.getDb().prepare(`
      SELECT fp.id, fp.starts_at, fp.ends_at,
             fl.name AS location_name,
             fa.title AS activity_title, fa.activity_type,
             GROUP_CONCAT(gp.name) AS presenter_names
      FROM festival_program fp
      JOIN festival_locations fl ON fl.id = fp.location_id
      JOIN festival_activities fa ON fa.id = fp.activity_id
      LEFT JOIN festival_program_presenters fpp ON fpp.program_id = fp.id
      LEFT JOIN festival_guests fg ON fg.id = fpp.guest_id
      LEFT JOIN profiles gp ON gp.id = fg.profile_id
      WHERE fp.edition_id = ?
      GROUP BY fp.id
      ORDER BY fp.starts_at
    `).all(editionId);
  }

  createProgramEntry(data: any) {
    const tx = this.db.getDb().transaction(() => {
      this.db.getDb().prepare(`
        INSERT INTO festival_program (edition_id, location_id, activity_id, starts_at, ends_at) VALUES (?, ?, ?, ?, ?)
      `).run(data.edition_id, data.location_id, data.activity_id, data.starts_at, data.ends_at || null);
      const progId = (this.db.getDb().prepare('SELECT last_insert_rowid() AS id').get() as any).id;
      if (data.presenter_ids) {
        for (const gid of data.presenter_ids) {
          this.db.getDb().prepare('INSERT INTO festival_program_presenters (program_id, guest_id) VALUES (?, ?)').run(progId, gid);
        }
      }
    });
    tx();
  }

  deleteProgramEntry(id: number) {
    this.db.getDb().prepare('DELETE FROM festival_program WHERE id = ?').run(id);
  }

  // ── Tickets ──────────────────────────────────────────────────────────

  getTickets(editionId: number, page = 1) {
    const offset = (page - 1) * PAGE_SIZE;
    const total = (this.db.getDb().prepare('SELECT COUNT(*) AS cnt FROM festival_tickets WHERE edition_id = ?').get(editionId) as any).cnt;
    const items = this.db.getDb().prepare(`
      SELECT ft.id, ft.code, ft.guest_count, ft.created_at, p.name AS holder_name
      FROM festival_tickets ft
      JOIN profiles p ON p.id = ft.holder_profile_id
      WHERE ft.edition_id = ?
      ORDER BY ft.created_at DESC
      LIMIT ? OFFSET ?
    `).all(editionId, PAGE_SIZE, offset);
    return { items, total, page, totalPages: Math.ceil(total / PAGE_SIZE) };
  }

  createTicket(data: any) {
    this.db.getDb().prepare(`
      INSERT INTO festival_tickets (edition_id, holder_profile_id, code, guest_count) VALUES (?, ?, ?, ?)
    `).run(data.edition_id, data.holder_profile_id, data.code, data.guest_count || 0);
  }

  deleteTicket(id: number) {
    this.db.getDb().prepare('DELETE FROM festival_tickets WHERE id = ?').run(id);
  }

  // ── Staff Members ────────────────────────────────────────────────────

  getStaffMembers(editionId: number) {
    return this.db.getDb().prepare(`
      SELECT fsm.edition_id, fsm.member_id, p.name AS member_name
      FROM festival_staff_members fsm
      JOIN members m ON m.id = fsm.member_id
      JOIN profiles p ON p.id = m.profile_id
      WHERE fsm.edition_id = ?
      ORDER BY p.name
    `).all(editionId);
  }

  getMembersNotStaff(editionId: number) {
    return this.db.getDb().prepare(`
      SELECT m.id, p.name FROM members m
      JOIN profiles p ON p.id = m.profile_id
      WHERE m.id NOT IN (SELECT member_id FROM festival_staff_members WHERE edition_id = ?)
      ORDER BY p.name
    `).all(editionId);
  }

  addStaffMember(editionId: number, memberId: number) {
    this.db.getDb().prepare('INSERT INTO festival_staff_members (edition_id, member_id) VALUES (?, ?)').run(editionId, memberId);
  }

  removeStaffMember(editionId: number, memberId: number) {
    this.db.getDb().prepare('DELETE FROM festival_staff_members WHERE edition_id = ? AND member_id = ?').run(editionId, memberId);
  }

  // ── Blog Tags ────────────────────────────────────────────────────────

  findAllBlogTags() {
    return this.db.getDb().prepare('SELECT * FROM blog_tags ORDER BY name').all();
  }

  createBlogTag(name: string) {
    this.db.getDb().prepare('INSERT INTO blog_tags (name) VALUES (?)').run(name);
  }

  deleteBlogTag(id: number) {
    this.db.getDb().prepare('DELETE FROM blog_tags WHERE id = ?').run(id);
  }

  // ── Helpers ──────────────────────────────────────────────────────────

  getProfiles() {
    return this.db.getDb().prepare('SELECT id, name FROM profiles ORDER BY name').all();
  }

  getAllActivitiesForEdition(editionId: number) {
    return this.db.getDb().prepare(`
      SELECT fa.id, fa.title, fa.activity_type, fs.name AS section_name
      FROM festival_activities fa
      JOIN festival_sections fs ON fs.id = fa.section_id
      WHERE fs.edition_id = ?
      ORDER BY fs.name, fa.title
    `).all(editionId);
  }
}
