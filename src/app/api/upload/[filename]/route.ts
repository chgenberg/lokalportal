import { NextRequest, NextResponse } from "next/server";
import path from "path";
import {
  getPresignedUrl,
  existsOnDisk,
  readFromDisk,
  MIME_MAP,
} from "@/lib/storage";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;

  const sanitized = path.basename(filename);
  if (!sanitized) return new NextResponse(null, { status: 404 });

  // S3: redirect to presigned URL
  const presignedUrl = await getPresignedUrl(sanitized);
  if (presignedUrl) {
    return NextResponse.redirect(presignedUrl, { status: 302 });
  }

  // Disk: serve locally
  try {
    const exists = await existsOnDisk(sanitized);
    if (!exists) return new NextResponse(null, { status: 404 });

    const buffer = await readFromDisk(sanitized);
    const ext = path.extname(sanitized).toLowerCase();
    const contentType = MIME_MAP[ext] || "application/octet-stream";

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
