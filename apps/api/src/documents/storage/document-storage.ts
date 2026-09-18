import { createReadStream, promises as fs } from 'fs';
import { dirname, resolve, sep } from 'path';
import { Client } from 'minio';
import { Readable } from 'stream';

export const DOCUMENT_STORAGE = Symbol('DOCUMENT_STORAGE');
export interface StoredObject {
  stream: Readable;
  length?: number;
}
export interface DocumentStorage {
  readonly name: string;
  put(key: string, data: Buffer, mimeType: string): Promise<void>;
  get(key: string): Promise<StoredObject>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  signedUrl?(key: string, expiresSeconds: number): Promise<string>;
}
export class LocalDocumentStorage implements DocumentStorage {
  readonly name = 'local';
  private readonly root = resolve(process.env.UPLOAD_DIR ?? 'uploads');
  private fullPath(key: string) {
    const full = resolve(this.root, key);
    if (!full.startsWith(`${this.root}${sep}`))
      throw new Error('Invalid storage key');
    return full;
  }
  async put(key: string, data: Buffer) {
    const target = this.fullPath(key);
    await fs.mkdir(dirname(target), { recursive: true });
    await fs.writeFile(target, data, { flag: 'wx' });
  }
  async get(key: string) {
    const target = this.fullPath(key);
    const stat = await fs.stat(target);
    return { stream: createReadStream(target), length: stat.size };
  }
  async delete(key: string) {
    await fs.rm(this.fullPath(key), { force: true });
  }
  async exists(key: string) {
    try {
      await fs.access(this.fullPath(key));
      return true;
    } catch {
      return false;
    }
  }
}
export class S3DocumentStorage implements DocumentStorage {
  readonly name = 's3';
  private readonly bucket = process.env.S3_BUCKET!;
  private readonly client = new Client({
    endPoint: process.env.S3_ENDPOINT!,
    port: Number(process.env.S3_PORT ?? 443),
    useSSL: process.env.S3_USE_SSL !== 'false',
    accessKey: process.env.S3_ACCESS_KEY!,
    secretKey: process.env.S3_SECRET_KEY!,
    region: process.env.S3_REGION,
  });
  async put(key: string, data: Buffer, mimeType: string) {
    if (!(await this.client.bucketExists(this.bucket)))
      await this.client.makeBucket(this.bucket, process.env.S3_REGION);
    await this.client.putObject(this.bucket, key, data, data.length, {
      'Content-Type': mimeType,
    });
  }
  async get(key: string) {
    return { stream: await this.client.getObject(this.bucket, key) };
  }
  async delete(key: string) {
    await this.client.removeObject(this.bucket, key);
  }
  async exists(key: string) {
    try {
      await this.client.statObject(this.bucket, key);
      return true;
    } catch {
      return false;
    }
  }
  signedUrl(key: string, expiresSeconds: number) {
    return this.client.presignedGetObject(this.bucket, key, expiresSeconds);
  }
}
export function documentStorageFactory(): DocumentStorage {
  const provider =
    process.env.DOCUMENT_STORAGE_PROVIDER ??
    (process.env.NODE_ENV === 'production' ? 's3' : 'local');
  if (provider === 's3') return new S3DocumentStorage();
  if (provider !== 'local')
    throw new Error(`Unsupported DOCUMENT_STORAGE_PROVIDER: ${provider}`);
  if (process.env.NODE_ENV === 'production')
    throw new Error('Production document storage must use s3');
  return new LocalDocumentStorage();
}
