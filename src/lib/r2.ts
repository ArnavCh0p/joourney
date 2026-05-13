// Cloudflare R2 client — R2 is S3-compatible so we use the AWS SDK.
// Required env vars:
//   R2_ACCOUNT_ID        — found on the Cloudflare dashboard home
//   R2_ACCESS_KEY_ID     — R2 API token access key
//   R2_SECRET_ACCESS_KEY — R2 API token secret
//   R2_BUCKET_NAME       — name of the R2 bucket
//   R2_PUBLIC_URL        — public base URL for the bucket (e.g. https://pub-xxx.r2.dev)

import { S3Client, DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";

export const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export function r2PublicUrl(key: string): string {
  return `${process.env.R2_PUBLIC_URL}/${key}`;
}

// Upload a file directly from the server — avoids browser CORS issues with presigned PUT URLs.
export async function uploadToR2(
  key: string,
  contentType: string,
  body: Buffer,
): Promise<void> {
  await r2.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      ContentType: contentType,
      ContentDisposition: "inline",
      Body: body,
    })
  );
}

export async function deleteFromR2(key: string): Promise<void> {
  await r2.send(
    new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET_NAME!, Key: key })
  );
}
