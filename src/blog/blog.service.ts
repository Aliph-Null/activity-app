import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

const PAGE_SIZE = 20;

@Injectable()
export class BlogService {
  constructor(private readonly db: DatabaseService) {}

  // ── Posts ────────────────────────────────────────────────────────────

  findAllPosts(page = 1, tagId?: number) {
    const offset = (page - 1) * PAGE_SIZE;
    const tagFilter = tagId ? 'WHERE bp.id IN (SELECT post_id FROM blog_post_tags WHERE tag_id = ?)' : '';
    const params: any[] = tagId ? [tagId] : [];

    const total = (this.db.getDb().prepare(
      `SELECT COUNT(DISTINCT bp.id) AS cnt FROM blog_posts bp ${tagFilter}`,
    ).get(...params) as any).cnt;

    const items = this.db.getDb().prepare(`
      SELECT bp.id, bp.title, bp.slug, bp.published_at, bp.created_at,
        GROUP_CONCAT(bt.name) AS tags
      FROM blog_posts bp
      LEFT JOIN blog_post_tags bpt ON bpt.post_id = bp.id
      LEFT JOIN blog_tags bt ON bt.id = bpt.tag_id
      ${tagFilter}
      GROUP BY bp.id
      ORDER BY bp.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, PAGE_SIZE, offset);
    return { items, total, page, totalPages: Math.ceil(total / PAGE_SIZE) };
  }

  findPostsByTagName(tagName: string) {
    return this.db.getDb().prepare(`
      SELECT bp.id, bp.title, bp.slug, bp.published_at, bp.created_at
      FROM blog_posts bp
      JOIN blog_post_tags bpt ON bpt.post_id = bp.id
      JOIN blog_tags bt ON bt.id = bpt.tag_id
      WHERE bt.name = ?
      ORDER BY bp.created_at DESC
      LIMIT 10
    `).all(tagName);
  }

  findPostById(id: number) {
    const post = this.db.getDb().prepare('SELECT * FROM blog_posts WHERE id = ?').get(id) as any;
    if (post) {
      post.tag_ids = this.db.getDb().prepare(
        'SELECT tag_id FROM blog_post_tags WHERE post_id = ?',
      ).all(id).map((r: any) => r.tag_id);
    }
    return post;
  }

  createPost(data: { title: string; slug?: string; summary?: string; body?: string; published_at?: string; tag_ids?: number[] }) {
    const tx = this.db.getDb().transaction(() => {
      this.db.getDb().prepare(`
        INSERT INTO blog_posts (title, slug, summary, body, published_at) VALUES (?, ?, ?, ?, ?)
      `).run(data.title, data.slug || null, data.summary || null, data.body || null, data.published_at || null);
      const postId = (this.db.getDb().prepare('SELECT last_insert_rowid() AS id').get() as any).id;
      if (data.tag_ids?.length) {
        const stmt = this.db.getDb().prepare('INSERT INTO blog_post_tags (post_id, tag_id) VALUES (?, ?)');
        for (const tagId of data.tag_ids) {
          stmt.run(postId, tagId);
        }
      }
      return postId;
    });
    return tx();
  }

  updatePost(id: number, data: { title: string; slug?: string; summary?: string; body?: string; published_at?: string; tag_ids?: number[] }) {
    const tx = this.db.getDb().transaction(() => {
      this.db.getDb().prepare(`
        UPDATE blog_posts SET title = ?, slug = ?, summary = ?, body = ?, published_at = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `).run(data.title, data.slug || null, data.summary || null, data.body || null, data.published_at || null, id);
      this.db.getDb().prepare('DELETE FROM blog_post_tags WHERE post_id = ?').run(id);
      if (data.tag_ids?.length) {
        const stmt = this.db.getDb().prepare('INSERT INTO blog_post_tags (post_id, tag_id) VALUES (?, ?)');
        for (const tagId of data.tag_ids) {
          stmt.run(id, tagId);
        }
      }
    });
    tx();
  }

  deletePost(id: number) {
    this.db.getDb().prepare('DELETE FROM blog_posts WHERE id = ?').run(id);
  }

  // ── Tags ─────────────────────────────────────────────────────────────

  findAllTags() {
    return this.db.getDb().prepare(`
      SELECT bt.*, (SELECT COUNT(*) FROM blog_post_tags bpt WHERE bpt.tag_id = bt.id) AS post_count
      FROM blog_tags bt ORDER BY bt.name
    `).all();
  }

  createTag(name: string) {
    this.db.getDb().prepare('INSERT INTO blog_tags (name) VALUES (?)').run(name);
  }

  updateTag(id: number, name: string) {
    this.db.getDb().prepare('UPDATE blog_tags SET name = ? WHERE id = ?').run(name, id);
  }

  deleteTag(id: number) {
    this.db.getDb().prepare('DELETE FROM blog_tags WHERE id = ?').run(id);
  }

  getAllTags() {
    return this.db.getDb().prepare('SELECT id, name FROM blog_tags ORDER BY name').all();
  }
}
