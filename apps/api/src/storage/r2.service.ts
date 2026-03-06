import { Injectable, Logger } from '@nestjs/common';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

@Injectable()
export class R2Service {
  private readonly logger = new Logger(R2Service.name);
  private readonly client: S3Client | null = null;
  private readonly bucket: string;
  private readonly publicBaseUrl: string | null;

  constructor() {
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    this.bucket = process.env.R2_BUCKET_NAME ?? 'posts-media';
    this.publicBaseUrl = process.env.R2_PUBLIC_URL ?? null;

    if (accountId && accessKeyId && secretAccessKey) {
      this.client = new S3Client({
        region: 'auto',
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
        forcePathStyle: true,
      });
      this.logger.log(
        `R2 configured: bucket=${this.bucket}, publicUrl=${this.publicBaseUrl ?? 'not set'}`,
      );
    } else {
      this.logger.warn(
        'R2 not configured: set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY',
      );
    }
  }

  private get isConfigured(): boolean {
    return this.client !== null;
  }

  /**
   * Upload buffer to R2, return public URL or null if not configured.
   */
  async upload(
    key: string,
    body: Buffer,
    contentType: string,
  ): Promise<string | null> {
    if (!this.client) {
      this.logger.warn('R2 not configured, skipping upload');
      return null;
    }

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
    this.logger.log(`R2 upload success: ${key} (${body.length} bytes)`);

    if (this.publicBaseUrl) {
      const base = this.publicBaseUrl.replace(/\/$/, '');
      return `${base}/${key}`;
    }
    return null;
  }

  /**
   * Fetch from URL and upload to R2. Returns R2 public URL or original URL if R2 not configured.
   */
  async uploadFromUrl(
    sourceUrl: string,
    key: string,
    contentType: string = 'application/octet-stream',
  ): Promise<string> {
    if (!this.client) {
      return sourceUrl;
    }

    const res = await fetch(sourceUrl);
    if (!res.ok) {
      throw new Error(`Failed to fetch ${sourceUrl}: ${res.status}`);
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    const url = await this.upload(key, buffer, contentType);
    return url ?? sourceUrl;
  }

  /**
   * Generate a unique key for post media: projects/{projectId}/posts/{postId}/{type}/{timestamp}-{index}.{ext}
   */
  mediaKey(
    projectId: string,
    postId: string,
    type: 'image' | 'video',
    index: number,
    extension: string,
  ): string {
    const ext =
      extension.replace(/^\./, '') || (type === 'image' ? 'webp' : 'mp4');
    return `projects/${projectId}/posts/${postId}/${type}/${Date.now()}-${index}.${ext}`;
  }

  /**
   * Infer extension from URL (e.g. .webp, .mp4)
   */
  extensionFromUrl(url: string): string {
    try {
      const path = new URL(url).pathname;
      const match = path.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
      return match ? match[1] : '';
    } catch {
      return '';
    }
  }
}
