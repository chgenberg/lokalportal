import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientKey } from "@/lib/rateLimit";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

/** Public upload for lead flow (skapa-annons). Images and video, no auth required. */
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50 MB
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/gif", "image/webp", "video/mp4", "video/webm"] as const;
const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/gif": ".gif",
  "image/webp": ".webp",
  "video/mp4": ".mp4",
  "video/webm": ".webm",
};

const MIME_MAGIC: Record<string, (buf: Buffer) => boolean> = {
  "image/jpeg": (b) => b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  "image/png": (b) =>
    b.length >= 8 &&
    b[0] === 0x89 &&
    b[1] === 0x50 &&
    b[2] === 0x4e &&
    b[3] === 0x47 &&
    b[4] === 0x0d &&
    b[5] === 0x0a &&
    b[6] === 0x1a &&
    b[7] === 0x0a,
  "image/gif": (b) =>
    b.length >= 6 &&
    b[0] === 0x47 &&
    b[1] === 0x49 &&
    b[2] === 0x46 &&
    b[3] === 0x38 &&
    (b[4] === 0x37 || b[4] === 0x39) &&
    b[5] === 0x61,
  "image/webp": (b) =>
    b.length >= 12 &&
    b[0] === 0x52 &&
    b[1] === 0x49 &&
    b[2] === 0x46 &&
    b[3] === 0x46 &&
    b[8] === 0x57 &&
    b[9] === 0x45 &&
    b[10] === 0x42 &&
    b[11] === 0x50,
};

function verifyFileContent(mime: string, buffer: Buffer): boolean {
  const checker = MIME_MAGIC[mime];
  if (!checker) return true;
  return checker(buffer);
}

export async function POST(request: NextRequest) {
  const clientKey = getClientKey(request);
  const key = `upload-public:${clientKey}`;
  const { limited, retryAfter } = checkRateLimit(key, 10, 15 * 60 * 1000);
  if (limited) {
    const headers = retryAfter ? { "Retry-After": String(retryAfter) } : undefined;
    return NextResponse.json(
      { error: "För många uppladdningar. Försök igen senare." },
      { status: 429, headers }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Ingen fil bifogad" }, { status: 400 });
    }

    const isVideo = file.type.startsWith("video/");
    const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: isVideo ? "Videon får max vara 50 MB." : "Bilden får max vara 5 MB." },
        { status: 400 }
      );
    }

    if (!(ALLOWED_MIME as readonly string[]).includes(file.type)) {
      return NextResponse.json(
        { error: "Endast bilder (JPEG, PNG, GIF, WebP) och video (MP4, WebM) stöds." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (!isVideo && !verifyFileContent(file.type, buffer)) {
      return NextResponse.json(
        { error: "Filens innehåll matchar inte den angivna filtypen." },
        { status: 400 }
      );
    }

    const ext = MIME_TO_EXT[file.type] ?? ".jpg";
    const uniqueName = `${randomUUID()}${ext}`;
    const uploadsDir = path.join(process.cwd(), "uploads");

    await mkdir(uploadsDir, { recursive: true });

    const filePath = path.join(uploadsDir, uniqueName);
    await writeFile(filePath, buffer);

    return NextResponse.json({
      url: `/api/upload/${uniqueName}`,
      fileName: file.name,
      fileSize: file.size,
      fileMimeType: file.type,
    });
  } catch (err) {
    console.error("Upload public error:", err);
    return NextResponse.json(
      { error: "Kunde inte ladda upp filen." },
      { status: 500 }
    );
  }
}
