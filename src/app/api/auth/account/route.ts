import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

export async function DELETE(_request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    await prisma.$transaction(async (tx) => {
      await tx.event.deleteMany({ where: { userId } });
      await tx.message.deleteMany({ where: { senderId: userId } });
      await tx.conversation.deleteMany({
        where: { OR: [{ landlordId: userId }, { tenantId: userId }] },
      });
      await tx.favorite.deleteMany({ where: { userId } });
      await tx.agentClient.deleteMany({
        where: { OR: [{ agentId: userId }, { clientId: userId }] },
      });
      await tx.listing.deleteMany({ where: { ownerId: userId } });
      await tx.user.delete({ where: { id: userId } });
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Account deletion error:", err);
    return NextResponse.json({ error: "Kunde inte radera kontot" }, { status: 500 });
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        companyName: true,
        createdAt: true,
      },
    });

    const listings = await prisma.listing.findMany({
      where: { ownerId: userId },
      select: {
        id: true,
        title: true,
        description: true,
        city: true,
        address: true,
        type: true,
        category: true,
        price: true,
        size: true,
        createdAt: true,
      },
    });

    const favorites = await prisma.favorite.findMany({
      where: { userId },
      include: {
        listing: {
          select: { id: true, title: true, city: true, address: true },
        },
      },
    });

    const conversations = await prisma.conversation.findMany({
      where: { OR: [{ landlordId: userId }, { tenantId: userId }] },
      include: {
        messages: {
          select: {
            senderId: true,
            text: true,
            createdAt: true,
          },
          orderBy: { createdAt: "asc" },
        },
        listing: {
          select: { id: true, title: true },
        },
      },
    });

    const exportData = {
      exportedAt: new Date().toISOString(),
      profile: user,
      listings: listings.map((l) => ({
        ...l,
        createdAt: l.createdAt.toISOString(),
      })),
      favorites: favorites.map((f) => ({
        listingId: f.listing.id,
        listingTitle: f.listing.title,
        savedAt: f.createdAt.toISOString(),
      })),
      conversations: conversations.map((c) => ({
        listingId: c.listing.id,
        listingTitle: c.listing.title,
        messages: c.messages.map((m) => ({
          fromMe: m.senderId === userId,
          text: m.text,
          at: m.createdAt.toISOString(),
        })),
      })),
    };

    return NextResponse.json(exportData);
  } catch (err) {
    console.error("Data export error:", err);
    return NextResponse.json({ error: "Kunde inte exportera data" }, { status: 500 });
  }
}
