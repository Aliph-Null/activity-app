import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

const PAGE_SIZE = 20;

@Injectable()
export class MembersService {
  constructor(private readonly db: DatabaseService) {}

  findAll(page = 1) {
    const offset = (page - 1) * PAGE_SIZE;
    const total = (
      this.db.getDb().prepare('SELECT COUNT(*) AS cnt FROM members').get() as any
    ).cnt;

    const items = this.db.getDb().prepare(`
      SELECT
        m.id, m.joined_at, m.created_at, p.id AS profile_id, p.name AS profile_name,
        CASE
          WHEN am.member_id IS NOT NULL THEN 'aspiring'
          WHEN fm.member_id IS NOT NULL THEN fm.full_member_kind
          ELSE 'unknown'
        END AS member_type
      FROM members m
      JOIN profiles p ON p.id = m.profile_id
      LEFT JOIN aspiring_members am ON am.member_id = m.id
      LEFT JOIN full_members fm ON fm.member_id = m.id
      ORDER BY p.name ASC
      LIMIT ? OFFSET ?
    `).all(PAGE_SIZE, offset);

    return { items, total, page, totalPages: Math.ceil(total / PAGE_SIZE) };
  }

  findById(id: number) {
    const member = this.db.getDb().prepare(`
      SELECT
        m.id, m.profile_id, m.joined_at, m.created_at, p.name AS profile_name,
        CASE
          WHEN am.member_id IS NOT NULL THEN 'aspiring'
          WHEN fm.member_id IS NOT NULL THEN 'full'
          ELSE 'unknown'
        END AS member_category,
        fm.full_member_kind
      FROM members m
      JOIN profiles p ON p.id = m.profile_id
      LEFT JOIN aspiring_members am ON am.member_id = m.id
      LEFT JOIN full_members fm ON fm.member_id = m.id
      WHERE m.id = ?
    `).get(id);

    return member;
  }

  getProfilesWithoutMember() {
    return this.db.getDb().prepare(`
      SELECT p.id, p.name FROM profiles p
      WHERE p.id NOT IN (SELECT profile_id FROM members)
      ORDER BY p.name
    `).all();
  }

  create(data: {
    profile_id: number;
    joined_at: string;
    member_category: 'aspiring' | 'full';
    full_member_kind?: string;
  }) {
    const tx = this.db.getDb().transaction(() => {
      this.db.getDb().prepare(
        'INSERT INTO members (profile_id, joined_at) VALUES (?, ?)',
      ).run(data.profile_id, data.joined_at);

      const memberId = (
        this.db.getDb().prepare('SELECT last_insert_rowid() AS id').get() as any
      ).id;

      if (data.member_category === 'aspiring') {
        this.db.getDb().prepare(
          'INSERT INTO aspiring_members (member_id) VALUES (?)',
        ).run(memberId);
      } else {
        this.db.getDb().prepare(
          'INSERT INTO full_members (member_id, full_member_kind) VALUES (?, ?)',
        ).run(memberId, data.full_member_kind);
      }

      return memberId;
    });

    return tx();
  }

  update(
    id: number,
    data: {
      joined_at: string;
      member_category: 'aspiring' | 'full';
      full_member_kind?: string;
    },
  ) {
    const tx = this.db.getDb().transaction(() => {
      this.db.getDb().prepare(
        'UPDATE members SET joined_at = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      ).run(data.joined_at, id);

      this.db.getDb().prepare('DELETE FROM aspiring_members WHERE member_id = ?').run(id);
      this.db.getDb().prepare('DELETE FROM full_members WHERE member_id = ?').run(id);

      if (data.member_category === 'aspiring') {
        this.db.getDb().prepare(
          'INSERT INTO aspiring_members (member_id) VALUES (?)',
        ).run(id);
      } else {
        this.db.getDb().prepare(
          'INSERT INTO full_members (member_id, full_member_kind) VALUES (?, ?)',
        ).run(id, data.full_member_kind);
      }
    });

    tx();
  }

  delete(id: number) {
    this.db.getDb().prepare('DELETE FROM members WHERE id = ?').run(id);
  }

  getFees(memberId: number) {
    return this.db.getDb().prepare(
      'SELECT * FROM membership_fees WHERE member_id = ? ORDER BY year DESC',
    ).all(memberId);
  }

  createFee(data: { member_id: number; year: number; amount: number; status: string }) {
    this.db.getDb().prepare(
      'INSERT INTO membership_fees (member_id, year, amount, status) VALUES (?, ?, ?, ?)',
    ).run(data.member_id, data.year, data.amount, data.status);
  }

  updateFee(id: number, data: { amount: number; status: string }) {
    this.db.getDb().prepare(
      'UPDATE membership_fees SET amount = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    ).run(data.amount, data.status, id);
  }

  deleteFee(id: number) {
    this.db.getDb().prepare('DELETE FROM membership_fees WHERE id = ?').run(id);
  }
}
