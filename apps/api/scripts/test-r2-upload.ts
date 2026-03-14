/**
 * One-off script: upload a small test image to R2 to verify bucket and credentials.
 * Usage: pnpm --filter api r2:test-upload
 * Requires .env with R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME.
 * Optional: R2_PUBLIC_URL for the printed URL.
 */
import { config } from 'dotenv';
import { resolve } from 'path';
import {
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';

config({ path: resolve(__dirname, '../.env') });

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucket = process.env.R2_BUCKET_NAME ?? 'ai-marketing-content-platform';
const publicUrl = process.env.R2_PUBLIC_URL?.replace(/\/$/, '');

function fail(msg: string): never {
  console.error(msg);
  process.exit(1);
}

async function main(): Promise<void> {
  if (!accountId || !accessKeyId || !secretAccessKey) {
    fail(
      'Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY in apps/api/.env',
    );
  }

  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true,
  });

  const key = `test/smoke-check-${Date.now()}.png`;
  const body = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64',
  );

  try {
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: 'image/png',
      }),
    );
    console.log(`Uploaded: ${key} (${body.length} bytes)`);

    await client.send(
      new HeadObjectCommand({ Bucket: bucket, Key: key }),
    );
    console.log('HeadObject OK — object exists in R2');

    if (publicUrl) {
      console.log(`Public URL: ${publicUrl}/${key}`);
    } else {
      console.log('Set R2_PUBLIC_URL in .env to get a public URL for objects.');
    }

    console.log('R2 upload test passed.');
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const name =
      err && typeof err === 'object' && 'name' in err
        ? (err as { name?: string }).name
        : '';
    fail(
      `R2 test failed (${name}: ${msg}). Check bucket "${bucket}" exists, env vars, and API token has Object Read & Write.`,
    );
  }
}

main();
