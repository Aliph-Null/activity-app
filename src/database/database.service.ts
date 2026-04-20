import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Database from 'better-sqlite3';
import { readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import * as bcrypt from 'bcrypt';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private db: Database.Database;

  getDb(): Database.Database {
    return this.db;
  }

  onModuleInit() {
    const dataDir = join(process.cwd(), 'data');
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true });
    }

    this.db = new Database(join(dataDir, 'ai3.sqlite'));
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');

    this.runMigrations();
    this.seedAdmin();
  }

  onModuleDestroy() {
    if (this.db) {
      this.db.close();
    }
  }

  private runMigrations() {
    const migrationsDir = join(process.cwd(), 'db');
    const files = ['0001_initial_schema.sql', '0002_festival_difffusion.sql'];

    const tableExists = this.db
      .prepare(
        `SELECT COUNT(*) AS cnt FROM sqlite_master WHERE type='table' AND name='profiles'`,
      )
      .get() as any;

    if (tableExists.cnt > 0) {
      this.runIncrementalMigrations();
      return;
    }

    for (const file of files) {
      const filePath = join(migrationsDir, file);
      if (!existsSync(filePath)) continue;

      let sql = readFileSync(filePath, 'utf-8');
      sql = sql.replace(/PRAGMA foreign_keys\s*=\s*ON;\s*/g, '');
      sql = sql.replace(/BEGIN;\s*/g, '');
      sql = sql.replace(/COMMIT;\s*/g, '');

      this.db.exec(sql);
    }
  }

  private runIncrementalMigrations() {
    const cols = this.db.prepare("PRAGMA table_info('agreement_documents')").all() as any[];
    const colNames = cols.map((c) => c.name);
    if (!colNames.includes('file_path')) {
      this.db.exec('ALTER TABLE agreement_documents ADD COLUMN file_path TEXT');
      this.db.exec('ALTER TABLE agreement_documents ADD COLUMN original_filename TEXT');
    }

    const festActCols = this.db.prepare("PRAGMA table_info('festival_activities')").all() as any[];
    const festActNames = festActCols.map((c) => c.name);
    if (!festActNames.includes('guest_id')) {
      this.db.exec('ALTER TABLE festival_activities ADD COLUMN guest_id INTEGER');
    }
  }

  private seedAdmin() {
    const userCount = this.db
      .prepare('SELECT COUNT(*) AS cnt FROM users')
      .get() as any;

    if (userCount.cnt > 0) return;

    const hash = bcrypt.hashSync('admin', 10);

    const seedTx = this.db.transaction(() => {
      this.db
        .prepare('INSERT INTO profiles (name, email) VALUES (?, ?)')
        .run('Administrator', 'admin@ai3.ro');

      const profileId = (
        this.db.prepare('SELECT last_insert_rowid() AS id').get() as any
      ).id;

      this.db
        .prepare(
          'INSERT INTO users (profile_id, username, password_hash) VALUES (?, ?, ?)',
        )
        .run(profileId, 'admin', hash);

      const userId = (
        this.db.prepare('SELECT last_insert_rowid() AS id').get() as any
      ).id;

      const existingRole = this.db
        .prepare("SELECT id FROM roles WHERE name = 'admin'")
        .get() as any;

      let roleId: number;
      if (existingRole) {
        roleId = existingRole.id;
      } else {
        this.db.prepare("INSERT INTO roles (name) VALUES ('admin')").run();
        roleId = (
          this.db.prepare('SELECT last_insert_rowid() AS id').get() as any
        ).id;
      }

      this.db
        .prepare('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)')
        .run(userId, roleId);
    });

    seedTx();
    console.log('Seeded admin user (admin/admin)');
  }
}
