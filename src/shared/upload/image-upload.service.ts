import { Injectable, BadRequestException } from '@nestjs/common';
import { Client } from 'minio';
import { randomUUID } from 'crypto';
import { MulterFile } from '../../types/multer-file.type';

@Injectable()
export class ImageUploadService {
  private readonly client: Client;
  private readonly bucket: string;
  private readonly publicUrl: string;
  private readonly urlStyle: 'path' | 'virtual-host';

  constructor() {
    this.client = new Client({
      endPoint: process.env.MINIO_ENDPOINT,
      port: parseInt(process.env.MINIO_PORT, 10),
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey: process.env.MINIO_ACCESS_KEY,
      secretKey: process.env.MINIO_SECRET_KEY,
      region: process.env.MINIO_REGION || undefined,
    });
    this.bucket = process.env.MINIO_BUCKET;
    this.publicUrl = process.env.MINIO_PUBLIC_URL;
    this.urlStyle = process.env.MINIO_URL_STYLE as 'path' | 'virtual-host';
  }

  async uploadImage(
    file: MulterFile,
    folder: string,
    entityId: number | string,
    options?: { maxSizeMb?: number; allowedMimeTypes?: string[] },
  ): Promise<string> {
    const maxSizeMb = options?.maxSizeMb ?? 100;
    const allowedMimeTypes = options?.allowedMimeTypes ?? [
      'image/jpeg',
      'image/png',
      'image/webp',
    ];

    if (file.size > maxSizeMb * 1024 * 1024) {
      throw new BadRequestException(
        `Le fichier dépasse la taille maximale de ${maxSizeMb} Mo`,
      );
    }

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Format non autorisé. Formats acceptés : ${allowedMimeTypes.join(', ')}`,
      );
    }

    const extension = file.originalname.split('.').pop();
    const objectKey = `${folder}/${entityId}/${randomUUID()}.${extension}`;

    await this.client.putObject(
      this.bucket,
      objectKey,
      file.buffer,
      file.size,
      { 'Content-Type': file.mimetype, 'x-amz-acl': 'public-read' },
    );

    return this.buildPublicUrl(objectKey);
  }

  async deleteImageByUrl(url: string): Promise<void> {
    const objectKey = this.extractObjectKeyFromUrl(url);
    if (!objectKey) return;
    await this.client.removeObject(this.bucket, objectKey);
  }

  private buildPublicUrl(objectKey: string): string {
    if (this.urlStyle === 'virtual-host') {
      return `${this.publicUrl}/${objectKey}`;
    }
    return `${this.publicUrl}/${this.bucket}/${objectKey}`;
  }

  private extractObjectKeyFromUrl(url: string): string | null {
    const base =
      this.urlStyle === 'virtual-host'
        ? `${this.publicUrl}/`
        : `${this.publicUrl}/${this.bucket}/`;

    if (!url.startsWith(base)) return null;
    return url.substring(base.length);
  }
}
