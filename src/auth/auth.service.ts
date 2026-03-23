import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { DatabaseService } from '../database/database.service';

export interface SessionUser {
  id: number;
  username: string;
  profileId: number;
  profileName: string;
  initials: string;
  roles: string[];
}

@Injectable()
export class AuthService {
  constructor(private readonly db: DatabaseService) {}

  validateUser(username: string, password: string): SessionUser | null {
    const user = this.db.getDb().prepare(`
      SELECT u.id, u.username, u.password_hash, u.profile_id, p.name AS profile_name
      FROM users u
      JOIN profiles p ON p.id = u.profile_id
      WHERE u.username = ?
    `).get(username) as any;

    if (!user) return null;
    if (!bcrypt.compareSync(password, user.password_hash)) return null;

    const roles = this.db.getDb().prepare(`
      SELECT r.name FROM roles r
      JOIN user_roles ur ON ur.role_id = r.id
      WHERE ur.user_id = ?
    `).all(user.id) as any[];

    const initials = user.profile_name
      .split(' ')
      .map((w: string) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    return {
      id: user.id,
      username: user.username,
      profileId: user.profile_id,
      profileName: user.profile_name,
      initials,
      roles: roles.map((r) => r.name),
    };
  }

  findById(id: number): SessionUser | null {
    const user = this.db.getDb().prepare(`
      SELECT u.id, u.username, u.profile_id, p.name AS profile_name
      FROM users u
      JOIN profiles p ON p.id = u.profile_id
      WHERE u.id = ?
    `).get(id) as any;

    if (!user) return null;

    const roles = this.db.getDb().prepare(`
      SELECT r.name FROM roles r
      JOIN user_roles ur ON ur.role_id = r.id
      WHERE ur.user_id = ?
    `).all(user.id) as any[];

    const initials = user.profile_name
      .split(' ')
      .map((w: string) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    return {
      id: user.id,
      username: user.username,
      profileId: user.profile_id,
      profileName: user.profile_name,
      initials,
      roles: roles.map((r) => r.name),
    };
  }
}
