import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

const PAGE_SIZE = 20;

@Injectable()
export class MeetupsService {
  constructor(private readonly db: DatabaseService) {}

  findAll(page = 1) {
    const offset = (page - 1) * PAGE_SIZE;
    const total = (
      this.db.getDb().prepare('SELECT COUNT(*) AS cnt FROM meetups').get() as any
    ).cnt;

    const items = this.db.getDb().prepare(`
      SELECT
        m.id, m.starts_at, m.location, m.created_at,
        CASE
          WHEN mw.id IS NOT NULL THEN 'workshop'
          WHEN maw.id IS NOT NULL THEN 'anti_workshop'
          ELSE 'none'
        END AS meetup_type,
        mw.title AS workshop_title,
        mw.theme AS workshop_theme,
        p.name AS presenter_name,
        maw.agenda AS anti_workshop_agenda
      FROM meetups m
      LEFT JOIN meetup_workshops mw ON mw.meetup_id = m.id
      LEFT JOIN profiles p ON p.id = mw.presenter_id
      LEFT JOIN meetup_anti_workshops maw ON maw.meetup_id = m.id
      ORDER BY m.starts_at DESC
      LIMIT ? OFFSET ?
    `).all(PAGE_SIZE, offset);

    return { items, total, page, totalPages: Math.ceil(total / PAGE_SIZE) };
  }

  findById(id: number) {
    const meetup = this.db.getDb().prepare(`
      SELECT
        m.id, m.starts_at, m.location,
        mw.id AS workshop_id, mw.title AS workshop_title, mw.theme AS workshop_theme, mw.presenter_id,
        p.name AS presenter_name,
        maw.id AS anti_workshop_id, maw.agenda AS anti_workshop_agenda
      FROM meetups m
      LEFT JOIN meetup_workshops mw ON mw.meetup_id = m.id
      LEFT JOIN profiles p ON p.id = mw.presenter_id
      LEFT JOIN meetup_anti_workshops maw ON maw.meetup_id = m.id
      WHERE m.id = ?
    `).get(id) as any;

    if (!meetup) return null;

    meetup.meetup_type = meetup.workshop_id ? 'workshop' : meetup.anti_workshop_id ? 'anti_workshop' : 'none';

    return meetup;
  }

  getProfiles() {
    return this.db.getDb().prepare('SELECT id, name FROM profiles ORDER BY name').all();
  }

  create(data: {
    starts_at: string;
    location: string;
    meetup_type: 'workshop' | 'anti_workshop';
    workshop_title?: string;
    workshop_theme?: string;
    presenter_id?: number;
    agenda?: string;
  }) {
    const tx = this.db.getDb().transaction(() => {
      this.db.getDb().prepare(
        'INSERT INTO meetups (starts_at, location) VALUES (?, ?)',
      ).run(data.starts_at, data.location);

      const meetupId = (
        this.db.getDb().prepare('SELECT last_insert_rowid() AS id').get() as any
      ).id;

      if (data.meetup_type === 'workshop') {
        this.db.getDb().prepare(
          'INSERT INTO meetup_workshops (meetup_id, title, presenter_id, theme) VALUES (?, ?, ?, ?)',
        ).run(meetupId, data.workshop_title, data.presenter_id, data.workshop_theme);
      } else {
        this.db.getDb().prepare(
          'INSERT INTO meetup_anti_workshops (meetup_id, agenda) VALUES (?, ?)',
        ).run(meetupId, data.agenda || null);
      }

      return meetupId;
    });

    return tx();
  }

  update(
    id: number,
    data: {
      starts_at: string;
      location: string;
      meetup_type: 'workshop' | 'anti_workshop';
      workshop_title?: string;
      workshop_theme?: string;
      presenter_id?: number;
      agenda?: string;
    },
  ) {
    const tx = this.db.getDb().transaction(() => {
      this.db.getDb().prepare(
        'UPDATE meetups SET starts_at = ?, location = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      ).run(data.starts_at, data.location, id);

      this.db.getDb().prepare('DELETE FROM meetup_workshops WHERE meetup_id = ?').run(id);
      this.db.getDb().prepare('DELETE FROM meetup_anti_workshops WHERE meetup_id = ?').run(id);

      if (data.meetup_type === 'workshop') {
        this.db.getDb().prepare(
          'INSERT INTO meetup_workshops (meetup_id, title, presenter_id, theme) VALUES (?, ?, ?, ?)',
        ).run(id, data.workshop_title, data.presenter_id, data.workshop_theme);
      } else {
        this.db.getDb().prepare(
          'INSERT INTO meetup_anti_workshops (meetup_id, agenda) VALUES (?, ?)',
        ).run(id, data.agenda || null);
      }
    });

    tx();
  }

  delete(id: number) {
    this.db.getDb().prepare('DELETE FROM meetups WHERE id = ?').run(id);
  }
}
