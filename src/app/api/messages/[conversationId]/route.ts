import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

const CONVERSATION_ID_REGEX = /^[a-zA-Z0-9_-]{1,50}$/;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });

  const { conversationId } = await params;
  if (!conversationId || !CONVERSATION_ID_REGEX.test(conversationId)) {
    return NextResponse.json({ error: "Ogiltigt konversations-id" }, { status: 400 });
  }

  try {
    const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!conversation) return NextResponse.json({ error: "Konversation hittades inte" }, { status: 404 });
    if (conversation.landlordId !== session.user.id && conversation.tenantId !== session.user.id) {
      return NextResponse.json({ error: "Ej behörig" }, { status: 403 });
    }

    // Mark messages as read
    await prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: session.user.id },
        read: false,
      },
      data: { read: true },
    });

    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({
      messages: messages.map((m) => ({
        id: m.id,
        conversationId: m.conversationId,
        senderId: m.senderId,
        text: m.text,
        read: m.read,
        createdAt: m.createdAt.toISOString(),
        fileUrl: m.fileUrl,
        fileName: m.fileName,
        fileSize: m.fileSize,
        fileMimeType: m.fileMimeType,
      })),
    });
  } catch (err) {
    console.error("Messages GET error:", err);
    return NextResponse.json({ error: "Kunde inte hämta meddelanden" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });

  const { conversationId } = await params;
  if (!conversationId || !CONVERSATION_ID_REGEX.test(conversationId)) {
    return NextResponse.json({ error: "Ogiltigt konversations-id" }, { status: 400 });
  }

  const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
  if (!conversation) return NextResponse.json({ error: "Konversation hittades inte" }, { status: 404 });
  if (conversation.landlordId !== session.user.id && conversation.tenantId !== session.user.id) {
    return NextResponse.json({ error: "Ej behörig" }, { status: 403 });
  }

  let body: { text?: string; fileUrl?: string; fileName?: string; fileSize?: number; fileMimeType?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ogiltig JSON" }, { status: 400 });
  }

  const { text, fileUrl, fileName, fileSize, fileMimeType } = body;
  const hasFile = fileUrl && fileName;
  const hasText = text && typeof text === "string" && text.trim().length > 0;

  if (!hasText && !hasFile) {
    return NextResponse.json({ error: "Meddelande eller fil krävs" }, { status: 400 });
  }

  let safeFileUrl: string | null = null;
  let safeFileName: string | null = null;
  let safeFileSize: number | null = null;
  let safeFileMimeType: string | null = null;
  if (hasFile) {
    const urlStr = String(fileUrl).trim();
    if (!urlStr.startsWith("/api/upload/")) {
      return NextResponse.json({ error: "Ogiltig fil-URL" }, { status: 400 });
    }
    safeFileUrl = urlStr.slice(0, 500);
    const nameStr = String(fileName).trim().replace(/^.*[/\\]/, "").slice(0, 255);
    if (!nameStr) {
      return NextResponse.json({ error: "Ogiltigt filnamn" }, { status: 400 });
    }
    safeFileName = nameStr;
    if (fileSize != null) {
      const n = Number(fileSize);
      if (!Number.isInteger(n) || n < 0 || n > 50_000_000) {
        return NextResponse.json({ error: "Ogiltig filstorlek" }, { status: 400 });
      }
      safeFileSize = n;
    }
    safeFileMimeType = typeof fileMimeType === "string" ? fileMimeType.trim().slice(0, 100) : null;
  }

  try {
    const [message] = await Promise.all([
      prisma.message.create({
        data: {
          conversationId,
          senderId: session.user.id,
          text: hasText ? text.trim().slice(0, 2000) : "",
          fileUrl: safeFileUrl,
          fileName: safeFileName,
          fileSize: safeFileSize,
          fileMimeType: safeFileMimeType,
        },
      }),
      prisma.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date() },
      }),
    ]);

    return NextResponse.json({
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      text: message.text,
      read: message.read,
      createdAt: message.createdAt.toISOString(),
      fileUrl: message.fileUrl,
      fileName: message.fileName,
      fileSize: message.fileSize,
      fileMimeType: message.fileMimeType,
    }, { status: 201 });
  } catch (err) {
    console.error("Messages POST error:", err);
    return NextResponse.json({ error: "Kunde inte skicka meddelande" }, { status: 500 });
  }
}
