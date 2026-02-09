import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });

  const unreadOnly = request.nextUrl.searchParams.get("unreadOnly");

  if (unreadOnly === "true") {
    const unreadCount = await prisma.message.count({
      where: {
        read: false,
        senderId: { not: session.user.id },
        conversation: {
          OR: [
            { landlordId: session.user.id },
            { tenantId: session.user.id },
          ],
        },
      },
    });
    return NextResponse.json({ unreadCount });
  }

  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [
        { landlordId: session.user.id },
        { tenantId: session.user.id },
      ],
    },
    include: {
      listing: { select: { title: true } },
      landlord: { select: { name: true, role: true } },
      tenant: { select: { name: true, role: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { lastMessageAt: "desc" },
  });

  const enriched = await Promise.all(
    conversations.map(async (conv) => {
      const isLandlord = session.user.id === conv.landlordId;
      const otherUser = isLandlord ? conv.tenant : conv.landlord;
      const unreadCount = await prisma.message.count({
        where: {
          conversationId: conv.id,
          read: false,
          senderId: { not: session.user.id },
        },
      });
      const lastMsg = conv.messages[0];

      return {
        id: conv.id,
        listingId: conv.listingId,
        landlordId: conv.landlordId,
        tenantId: conv.tenantId,
        createdAt: conv.createdAt.toISOString(),
        lastMessageAt: conv.lastMessageAt.toISOString(),
        listingTitle: conv.listing.title,
        otherUserName: otherUser.name,
        otherUserRole: otherUser.role,
        unreadCount,
        lastMessage: lastMsg ? { text: lastMsg.text, createdAt: lastMsg.createdAt.toISOString() } : null,
      };
    })
  );

  return NextResponse.json({ conversations: enriched });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });

  const { listingId } = await request.json();
  if (!listingId) return NextResponse.json({ error: "listingId krävs" }, { status: 400 });

  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) return NextResponse.json({ error: "Annons hittades inte" }, { status: 404 });

  // Check for existing conversation
  const existing = await prisma.conversation.findUnique({
    where: { listingId_tenantId: { listingId, tenantId: session.user.id } },
  });
  if (existing) {
    return NextResponse.json({
      ...existing,
      createdAt: existing.createdAt.toISOString(),
      lastMessageAt: existing.lastMessageAt.toISOString(),
    });
  }

  const landlordId = listing.ownerId || "system";

  const conversation = await prisma.conversation.create({
    data: { listingId, landlordId, tenantId: session.user.id },
  });

  return NextResponse.json({
    ...conversation,
    createdAt: conversation.createdAt.toISOString(),
    lastMessageAt: conversation.lastMessageAt.toISOString(),
  }, { status: 201 });
}
