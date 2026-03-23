import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

const PAGE_SIZE = 20;

@Injectable()
export class ProfilesService {
  constructor(private readonly db: DatabaseService) {}

  findAll(page = 1) {
    const offset = (page - 1) * PAGE_SIZE;
    const total = (
      this.db.getDb().prepare('SELECT COUNT(*) AS cnt FROM profiles').get() as any
    ).cnt;
    const items = this.db
      .getDb()
      .prepare(
        'SELECT * FROM profiles ORDER BY name ASC LIMIT ? OFFSET ?',
      )
      .all(PAGE_SIZE, offset);
    return { items, total, page, totalPages: Math.ceil(total / PAGE_SIZE) };
  }

  findAllSimple() {
    return this.db
      .getDb()
      .prepare('SELECT id, name FROM profiles ORDER BY name ASC')
      .all();
  }

  findById(id: number) {
    return this.db
      .getDb()
      .prepare('SELECT * FROM profiles WHERE id = ?')
      .get(id);
  }

  create(data: { name: string; email?: string; phone?: string; birth_date?: string }) {
    const result = this.db
      .getDb()
      .prepare(
        'INSERT INTO profiles (name, email, phone, birth_date) VALUES (?, ?, ?, ?)',
      )
      .run(data.name, data.email || null, data.phone || null, data.birth_date || null);
    return result.lastInsertRowid;
  }

  update(
    id: number,
    data: { name: string; email?: string; phone?: string; birth_date?: string },
  ) {
    this.db
      .getDb()
      .prepare(
        `UPDATE profiles SET name = ?, email = ?, phone = ?, birth_date = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      )
      .run(data.name, data.email || null, data.phone || null, data.birth_date || null, id);
  }

  delete(id: number) {
    this.db.getDb().prepare('DELETE FROM profiles WHERE id = ?').run(id);
  }
}
