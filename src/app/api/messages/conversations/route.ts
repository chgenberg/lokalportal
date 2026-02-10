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

  const convIds = conversations.map((c) => c.id);
  const unreadCounts =
    convIds.length > 0
      ? await prisma.message.groupBy({
          by: ["conversationId"],
          where: {
            conversationId: { in: convIds },
            read: false,
            senderId: { not: session.user.id },
          },
          _count: { id: true },
        })
      : [];
  const unreadMap = Object.fromEntries(unreadCounts.map((u) => [u.conversationId, u._count.id]));

  const enriched = conversations.map((conv) => {
    const isLandlord = session.user.id === conv.landlordId;
    const otherUser = isLandlord ? conv.tenant : conv.landlord;
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
      unreadCount: unreadMap[conv.id] ?? 0,
      lastMessage: lastMsg ? { text: lastMsg.text, createdAt: lastMsg.createdAt.toISOString() } : null,
    };
  });

  return NextResponse.json({ conversations: enriched });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });

  let body: { listingId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ogiltig JSON" }, { status: 400 });
  }

  const { listingId } = body;
  if (!listingId) return NextResponse.json({ error: "listingId krävs" }, { status: 400 });

  try {
    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) return NextResponse.json({ error: "Annons hittades inte" }, { status: 404 });

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

    if (!listing.ownerId) {
      return NextResponse.json(
        { error: "Denna annons har ingen hyresvärd kopplad. Kontakta support." },
        { status: 400 }
      );
    }

    const conversation = await prisma.conversation.create({
      data: { listingId, landlordId: listing.ownerId, tenantId: session.user.id },
    });

    return NextResponse.json({
      ...conversation,
      createdAt: conversation.createdAt.toISOString(),
      lastMessageAt: conversation.lastMessageAt.toISOString(),
    }, { status: 201 });
  } catch (err) {
    console.error("Conversations POST error:", err);
    return NextResponse.json({ error: "Kunde inte skapa konversation" }, { status: 500 });
  }
}
