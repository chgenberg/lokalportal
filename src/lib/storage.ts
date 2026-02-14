/**
 * Storage abstraction: Railway Bucket (S3-compatible) when configured,
 * otherwise local disk. Use BUCKET + ENDPOINT from Railway variable refs.
 */
import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3Client } from "@aws-sdk/client-s3";
import { writeFile, mkdir, readFile, stat } from "fs/promises";
import path from "path";

const BUCKET = process.env.BUCKET;
const ENDPOINT = process.env.S3_ENDPOINT ?? process.env.ENDPOINT;
const ACCESS_KEY_ID = process.env.S3_ACCESS_KEY_ID ?? process.env.ACCESS_KEY_ID;
const SECRET_ACCESS_KEY = process.env.S3_SECRET_ACCESS_KEY ?? process.env.SECRET_ACCESS_KEY;
const REGION = process.env.S3_REGION ?? process.env.REGION ?? "auto";

const useS3 = !!(BUCKET && ENDPOINT && ACCESS_KEY_ID && SECRET_ACCESS_KEY);

let s3Client: S3Client | null = null;
function getS3Client(): S3Client {
  if (!s3Client) {
    s3Client = new S3Client({
      endpoint: ENDPOINT,
      region: REGION,
      credentials: { accessKeyId: ACCESS_KEY_ID!, secretAccessKey: SECRET_ACCESS_KEY! },
      forcePathStyle: true,
    });
  }
  return s3Client;
}

/**
 * Upload buffer to storage. Returns the object key (filename) to use in URLs.
 */
export async function uploadBuffer(buffer: Buffer, key: string, contentType?: string): Promise<string> {
  if (useS3) {
    const client = getS3Client();
    await client.send(
      new PutObjectCommand({
        Bucket: BUCKET!,
        Key: key,
        Body: buffer,
        ContentType: contentType ?? "application/octet-stream",
      })
    );
    return key;
  }
  const uploadsDir = path.join(process.cwd(), "uploads");
  await mkdir(uploadsDir, { recursive: true });
  const filePath = path.join(uploadsDir, key);
  await writeFile(filePath, buffer);
  return key;
}

export const MIME_MAP: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".zip": "application/zip",
  ".txt": "text/plain",
  ".csv": "text/csv",
};

/**
 * Get a presigned URL for an S3 object, or null if using disk (caller serves from disk).
 * Expires in 1 hour.
 */
export async function getPresignedUrl(key: string, expiresIn = 3600): Promise<string | null> {
  if (!useS3) return null;
  const client = getS3Client();
  const ext = path.extname(key).toLowerCase();
  const contentType = MIME_MAP[ext] ?? "application/octet-stream";
  const url = await getSignedUrl(
    client,
    new GetObjectCommand({
      Bucket: BUCKET!,
      Key: key,
      ResponseContentType: contentType,
    }),
    { expiresIn }
  );
  return url;
}

/**
 * Check if file exists in disk storage.
 */
export async function existsOnDisk(key: string): Promise<boolean> {
  if (useS3) return false;
  const filePath = path.join(process.cwd(), "uploads", path.basename(key));
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Read file from disk storage. Throws if not found or using S3.
 */
export async function readFromDisk(key: string): Promise<Buffer> {
  const filePath = path.join(process.cwd(), "uploads", path.basename(key));
  return readFile(filePath);
}

export function isUsingS3(): boolean {
  return useS3;
}
