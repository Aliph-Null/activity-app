import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import * as bcrypt from 'bcrypt';

const PAGE_SIZE = 20;

@Injectable()
export class UsersService {
  constructor(private readonly db: DatabaseService) {}

  findAll(page = 1) {
    const offset = (page - 1) * PAGE_SIZE;
    const total = (
      this.db.getDb().prepare('SELECT COUNT(*) AS cnt FROM users').get() as any
    ).cnt;
    const items = this.db.getDb().prepare(`
      SELECT u.id, u.username, u.profile_id, p.name AS profile_name, u.created_at
      FROM users u
      JOIN profiles p ON p.id = u.profile_id
      ORDER BY u.username ASC
      LIMIT ? OFFSET ?
    `).all(PAGE_SIZE, offset);
    return { items, total, page, totalPages: Math.ceil(total / PAGE_SIZE) };
  }

  findById(id: number) {
    const user = this.db.getDb().prepare(`
      SELECT u.id, u.username, u.profile_id, p.name AS profile_name, u.created_at
      FROM users u
      JOIN profiles p ON p.id = u.profile_id
      WHERE u.id = ?
    `).get(id) as any;

    if (!user) return null;

    const roles = this.db.getDb().prepare(`
      SELECT r.id, r.name FROM roles r
      JOIN user_roles ur ON ur.role_id = r.id
      WHERE ur.user_id = ?
    `).all(id);

    return { ...user, roles };
  }

  getAllRoles() {
    return this.db.getDb().prepare('SELECT * FROM roles ORDER BY name').all();
  }

  getProfilesWithoutUser() {
    return this.db.getDb().prepare(`
      SELECT p.id, p.name FROM profiles p
      WHERE p.id NOT IN (SELECT profile_id FROM users)
      ORDER BY p.name
    `).all();
  }

  create(data: {
    profile_id: number;
    username: string;
    password: string;
    role_ids?: number[];
  }) {
    const hash = bcrypt.hashSync(data.password, 10);

    const tx = this.db.getDb().transaction(() => {
      this.db.getDb().prepare(
        'INSERT INTO users (profile_id, username, password_hash) VALUES (?, ?, ?)',
      ).run(data.profile_id, data.username, hash);

      const userId = (
        this.db.getDb().prepare('SELECT last_insert_rowid() AS id').get() as any
      ).id;

      if (data.role_ids?.length) {
        const stmt = this.db.getDb().prepare(
          'INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)',
        );
        for (const roleId of data.role_ids) {
          stmt.run(userId, roleId);
        }
      }

      return userId;
    });

    return tx();
  }

  update(
    id: number,
    data: { username: string; password?: string; role_ids?: number[] },
  ) {
    const tx = this.db.getDb().transaction(() => {
      if (data.password) {
        const hash = bcrypt.hashSync(data.password, 10);
        this.db.getDb().prepare(
          'UPDATE users SET username = ?, password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        ).run(data.username, hash, id);
      } else {
        this.db.getDb().prepare(
          'UPDATE users SET username = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        ).run(data.username, id);
      }

      this.db.getDb().prepare('DELETE FROM user_roles WHERE user_id = ?').run(id);

      if (data.role_ids?.length) {
        const stmt = this.db.getDb().prepare(
          'INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)',
        );
        for (const roleId of data.role_ids) {
          stmt.run(id, roleId);
        }
      }
    });

    tx();
  }

  delete(id: number) {
    this.db.getDb().prepare('DELETE FROM users WHERE id = ?').run(id);
  }

  createRole(name: string) {
    this.db.getDb().prepare('INSERT INTO roles (name) VALUES (?)').run(name);
  }

  deleteRole(id: number) {
    this.db.getDb().prepare('DELETE FROM roles WHERE id = ?').run(id);
  }
}
