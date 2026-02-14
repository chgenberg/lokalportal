import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rateLimit";
import { uploadBuffer } from "@/lib/storage";
import { randomUUID } from "crypto";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/zip",
  "text/plain",
  "text/csv",
] as const;

/** Only one extension per MIME to avoid double extensions (e.g. .php.jpg). */
const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/gif": ".gif",
  "image/webp": ".webp",
  "application/pdf": ".pdf",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
  "application/vnd.ms-excel": ".xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
  "application/zip": ".zip",
  "text/plain": ".txt",
  "text/csv": ".csv",
};

/** Magic bytes (hex) for MIME verification. Only verify when client MIME is in this map. */
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
  "application/pdf": (b) =>
    b.length >= 4 && b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46,
};

function verifyFileContent(mime: string, buffer: Buffer): boolean {
  const checker = MIME_MAGIC[mime];
  if (!checker) return true;
  return checker(buffer);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  }

  const key = `upload:${session.user.id}`;
  const { limited, retryAfter } = checkRateLimit(key, 30, 15 * 60 * 1000);
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

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Filen är för stor. Max 10 MB." },
        { status: 400 }
      );
    }

    if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(file.type)) {
      return NextResponse.json(
        { error: "Filtypen stöds inte." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (!verifyFileContent(file.type, buffer)) {
      return NextResponse.json(
        { error: "Filens innehåll matchar inte den angivna filtypen." },
        { status: 400 }
      );
    }

    const ext = MIME_TO_EXT[file.type] ?? ".bin";
    const uniqueName = `${randomUUID()}${ext}`;
    await uploadBuffer(buffer, uniqueName, file.type);

    return NextResponse.json({
      url: `/api/upload/${uniqueName}`,
      fileName: file.name,
      fileSize: file.size,
      fileMimeType: file.type,
    });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { error: "Kunde inte ladda upp filen." },
      { status: 500 }
    );
  }
}
