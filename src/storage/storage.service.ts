import { Injectable, OnModuleInit } from '@nestjs/common';
import { existsSync, mkdirSync, writeFileSync, readFileSync, unlinkSync } from 'fs';
import { join, extname } from 'path';
import { randomUUID } from 'crypto';

@Injectable()
export class StorageService implements OnModuleInit {
  private useS3 = false;
  private s3Client: any;
  private s3Bucket: string;
  private localRoot: string;

  onModuleInit() {
    this.useS3 = process.env.STORAGE_DRIVER === 's3';
    this.s3Bucket = process.env.S3_BUCKET || '';
    this.localRoot = join(process.cwd(), 'data', 'uploads');

    if (this.useS3) {
      this.initS3();
    } else {
      if (!existsSync(this.localRoot)) {
        mkdirSync(this.localRoot, { recursive: true });
      }
    }
  }

  private async initS3() {
    const { S3Client } = await import('@aws-sdk/client-s3');
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || 'eu-central-1',
    });
  }

  /**
   * Store a file and return the storage key (relative path).
   * The key is prefixed with a subfolder for organisation.
   */
  async upload(file: Express.Multer.File, subfolder: string): Promise<string> {
    const ext = extname(file.originalname);
    const key = `${subfolder}/${randomUUID()}${ext}`;

    if (this.useS3) {
      const { PutObjectCommand } = await import('@aws-sdk/client-s3');
      await this.s3Client.send(new PutObjectCommand({
        Bucket: this.s3Bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }));
    } else {
      const dir = join(this.localRoot, subfolder);
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      writeFileSync(join(this.localRoot, key), file.buffer);
    }

    return key;
  }

  /**
   * Read a file by its storage key. Returns { buffer, mimetype }.
   */
  async read(key: string): Promise<{ buffer: Buffer; mimetype: string }> {
    if (this.useS3) {
      const { GetObjectCommand } = await import('@aws-sdk/client-s3');
      const resp = await this.s3Client.send(new GetObjectCommand({
        Bucket: this.s3Bucket,
        Key: key,
      }));
      const chunks: Uint8Array[] = [];
      for await (const chunk of resp.Body as AsyncIterable<Uint8Array>) {
        chunks.push(chunk);
      }
      return { buffer: Buffer.concat(chunks), mimetype: resp.ContentType || 'application/octet-stream' };
    }

    const fullPath = join(this.localRoot, key);
    const buffer = readFileSync(fullPath);
    const ext = extname(key).toLowerCase();
    const mimeMap: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
    };
    return { buffer, mimetype: mimeMap[ext] || 'application/octet-stream' };
  }

  /**
   * Delete a file by its storage key.
   */
  async delete(key: string): Promise<void> {
    if (this.useS3) {
      const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
      await this.s3Client.send(new DeleteObjectCommand({
        Bucket: this.s3Bucket,
        Key: key,
      }));
      return;
    }

    const fullPath = join(this.localRoot, key);
    if (existsSync(fullPath)) unlinkSync(fullPath);
  }
}
