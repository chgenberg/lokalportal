import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getConversationsForUser,
  saveConversation,
  findExistingConversation,
  getListingById,
  getMessages,
  getUnreadCount,
  getUserById,
} from "@/lib/redis";
import { v4 as uuidv4 } from "uuid";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  }

  const unreadOnly = request.nextUrl.searchParams.get("unreadOnly");

  if (unreadOnly === "true") {
    const unreadCount = await getUnreadCount(session.user.id);
    return NextResponse.json({ unreadCount });
  }

  const conversations = await getConversationsForUser(session.user.id);

  // Enrich conversations with listing info and other user info
  const enriched = await Promise.all(
    conversations.map(async (conv) => {
      const listing = await getListingById(conv.listingId);
      const otherUserId =
        session.user.id === conv.landlordId
          ? conv.tenantId
          : conv.landlordId;
      const otherUser = await getUserById(otherUserId);
      const messages = await getMessages(conv.id);
      const unreadCount = messages.filter(
        (m) => m.senderId !== session.user.id && !m.read
      ).length;
      const lastMessage = messages[messages.length - 1];

      return {
        ...conv,
        listingTitle: listing?.title || "Okänd annons",
        otherUserName: otherUser?.name || "Okänd användare",
        otherUserRole: otherUser?.role || "tenant",
        unreadCount,
        lastMessage: lastMessage
          ? { text: lastMessage.text, createdAt: lastMessage.createdAt }
          : null,
      };
    })
  );

  return NextResponse.json({ conversations: enriched });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  }

  const { listingId } = await request.json();
  if (!listingId) {
    return NextResponse.json({ error: "listingId krävs" }, { status: 400 });
  }

  const listing = await getListingById(listingId);
  if (!listing) {
    return NextResponse.json(
      { error: "Annons hittades inte" },
      { status: 404 }
    );
  }

  // Check for existing conversation
  const existing = await findExistingConversation(listingId, session.user.id);
  if (existing) {
    return NextResponse.json(existing);
  }

  // Determine landlord - use ownerId if available, otherwise use a default
  const landlordId = listing.ownerId || "system";

  const conversation = {
    id: uuidv4(),
    listingId,
    landlordId,
    tenantId: session.user.id,
    createdAt: new Date().toISOString(),
    lastMessageAt: new Date().toISOString(),
  };

  await saveConversation(conversation);

  return NextResponse.json(conversation, { status: 201 });
}
