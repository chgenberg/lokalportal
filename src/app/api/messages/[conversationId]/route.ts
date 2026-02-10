import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });

  const { conversationId } = await params;

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
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });

  const { conversationId } = await params;

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

  try {
    const [message] = await Promise.all([
      prisma.message.create({
        data: {
          conversationId,
          senderId: session.user.id,
          text: hasText ? text.trim().slice(0, 2000) : "",
          fileUrl: fileUrl || null,
          fileName: fileName || null,
          fileSize: fileSize || null,
          fileMimeType: fileMimeType || null,
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
