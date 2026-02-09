import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getConversationById,
  getMessages,
  addMessage,
  markMessagesAsRead,
} from "@/lib/redis";
import { v4 as uuidv4 } from "uuid";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  }

  const { conversationId } = await params;

  const conversation = await getConversationById(conversationId);
  if (!conversation) {
    return NextResponse.json(
      { error: "Konversation hittades inte" },
      { status: 404 }
    );
  }

  // Verify user is part of conversation
  if (
    conversation.landlordId !== session.user.id &&
    conversation.tenantId !== session.user.id
  ) {
    return NextResponse.json({ error: "Ej behörig" }, { status: 403 });
  }

  // Mark messages as read
  await markMessagesAsRead(conversationId, session.user.id);

  const messages = await getMessages(conversationId);
  return NextResponse.json({ messages });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  }

  const { conversationId } = await params;

  const conversation = await getConversationById(conversationId);
  if (!conversation) {
    return NextResponse.json(
      { error: "Konversation hittades inte" },
      { status: 404 }
    );
  }

  // Verify user is part of conversation
  if (
    conversation.landlordId !== session.user.id &&
    conversation.tenantId !== session.user.id
  ) {
    return NextResponse.json({ error: "Ej behörig" }, { status: 403 });
  }

  const { text } = await request.json();
  if (!text || typeof text !== "string" || text.trim().length === 0) {
    return NextResponse.json(
      { error: "Meddelande får inte vara tomt" },
      { status: 400 }
    );
  }

  const message = {
    id: uuidv4(),
    conversationId,
    senderId: session.user.id,
    text: text.trim().slice(0, 2000),
    createdAt: new Date().toISOString(),
    read: false,
  };

  await addMessage(message);

  return NextResponse.json(message, { status: 201 });
}
