import { Injectable } from '@nestjs/common';
import { Client as MinioClient } from 'minio';
import { randomUUID } from 'crypto';
import { extname } from 'path';

@Injectable()
export class StorageService {
  private client: MinioClient;

  constructor() {
    this.client = new MinioClient({
      endPoint: process.env.MINIO_ENDPOINT ?? 'localhost',
      port: Number(process.env.MINIO_PORT ?? 9000),
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey: process.env.MINIO_ACCESS_KEY ?? '',
      secretKey: process.env.MINIO_SECRET_KEY ?? '',
    });
  }

  async upload(buffer: Buffer, originalName: string, mimetype: string, bucket: string): Promise<string> {
    const ext = extname(originalName) || '.webp';
    const objectName = `${randomUUID()}${ext}`;

    await this.client.putObject(bucket, objectName, buffer, buffer.length, {
      'Content-Type': mimetype,
    });

    return objectName;
  }

  async getPresignedUrl(bucket: string, objectName: string, expirySeconds = 3600): Promise<string> {
    return this.client.presignedGetObject(bucket, objectName, expirySeconds);
  }

  async delete(bucket: string, objectName: string): Promise<void> {
    await this.client.removeObject(bucket, objectName);
  }

  getPublicUrl(bucket: string, objectName: string): string {
    const endpoint = process.env.MINIO_ENDPOINT ?? 'localhost';
    const port = process.env.MINIO_PORT ?? '9000';
    const proto = process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http';
    return `${proto}://${endpoint}:${port}/${bucket}/${objectName}`;
  }

  getImgproxyUrl(objectName: string, bucket: string): string {
    const base = process.env.IMGPROXY_BASE_URL ?? 'http://localhost:8080';
    const s3Path = `s3://${bucket}/${objectName}`;
    const encoded = Buffer.from(s3Path).toString('base64url');
    return `${base}/insecure/rs:fit:1200:0/f:webp/${encoded}`;
  }
}
