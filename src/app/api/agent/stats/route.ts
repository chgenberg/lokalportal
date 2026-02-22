import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  if (session.user.role !== "agent") return NextResponse.json({ error: "Endast för mäklare" }, { status: 403 });

  const userId = session.user.id;

  try {
    const clientLinks = await prisma.agentClient.findMany({
      where: { agentId: userId },
      select: { clientId: true, client: { select: { id: true, name: true } } },
    });
    const clientIds = clientLinks.map((c) => c.clientId);

    const allListings = await prisma.listing.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { agentId: userId },
          ...(clientIds.length > 0 ? [{ ownerId: { in: clientIds } }] : []),
        ],
      },
      select: { id: true, title: true, ownerId: true, agentId: true, viewCount: true, price: true, category: true, createdAt: true },
    });

    const listingIds = allListings.map((l) => l.id);

    if (listingIds.length === 0) {
      return NextResponse.json({
        totalClients: clientIds.length,
        totalListings: 0,
        totalViews: 0,
        totalInquiries: 0,
        totalFavorites: 0,
        portfolioValue: 0,
        responseRate: 0,
        recentActivity: [],
        perClient: clientLinks.map((c) => ({
          clientId: c.clientId,
          clientName: c.client.name,
          listingCount: 0,
          totalViews: 0,
          totalInquiries: 0,
        })),
        categoryDistribution: {},
      });
    }

    const [conversationsByListing, favoritesByListing, unreadMessages] = await Promise.all([
      prisma.conversation.groupBy({
        by: ["listingId"],
        where: { listingId: { in: listingIds } },
        _count: { id: true },
      }),
      prisma.favorite.groupBy({
        by: ["listingId"],
        where: { listingId: { in: listingIds } },
        _count: { id: true },
      }),
      prisma.message.count({
        where: {
          read: false,
          senderId: { not: userId },
          conversation: { listingId: { in: listingIds } },
        },
      }),
    ]);

    const convMap = new Map(conversationsByListing.map((c) => [c.listingId, c._count.id]));
    const favMap = new Map(favoritesByListing.map((f) => [f.listingId, f._count.id]));

    const totalViews = allListings.reduce((s, l) => s + (l.viewCount ?? 0), 0);
    const totalInquiries = conversationsByListing.reduce((s, c) => s + c._count.id, 0);
    const totalFavorites = favoritesByListing.reduce((s, f) => s + f._count.id, 0);
    const portfolioValue = allListings.reduce((s, l) => s + l.price, 0);

    const allConversations = await prisma.conversation.findMany({
      where: { listingId: { in: listingIds } },
      select: { id: true },
    });
    const repliedConversations = await prisma.conversation.findMany({
      where: { landlordId: userId, listingId: { in: listingIds } },
      select: { id: true },
    });
    const responseRate = allConversations.length > 0
      ? Math.round((repliedConversations.length / allConversations.length) * 100)
      : 0;

    // Per-client breakdown
    const perClient = clientLinks.map((c) => {
      const clientListings = allListings.filter((l) => l.ownerId === c.clientId);
      const clientListingIds = clientListings.map((l) => l.id);
      return {
        clientId: c.clientId,
        clientName: c.client.name,
        listingCount: clientListings.length,
        totalViews: clientListings.reduce((s, l) => s + (l.viewCount ?? 0), 0),
        totalInquiries: clientListingIds.reduce((s, id) => s + (convMap.get(id) ?? 0), 0),
      };
    });

    // Category distribution
    const categoryDistribution: Record<string, number> = {};
    for (const l of allListings) {
      categoryDistribution[l.category] = (categoryDistribution[l.category] ?? 0) + 1;
    }

    // Recent activity
    const recentConvs = await prisma.conversation.findMany({
      where: { listingId: { in: listingIds } },
      select: { listingId: true, lastMessageAt: true },
      orderBy: { lastMessageAt: "desc" },
      take: 5,
    });
    const recentFavs = await prisma.favorite.findMany({
      where: { listingId: { in: listingIds } },
      select: { listingId: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    const titleById = new Map(allListings.map((l) => [l.id, l.title]));
    type ActivityItem = { type: "inquiry" | "favorite"; listingId: string; listingTitle: string; at: string };
    const activities: ActivityItem[] = [];
    for (const c of recentConvs) {
      activities.push({ type: "inquiry", listingId: c.listingId, listingTitle: titleById.get(c.listingId) ?? "", at: c.lastMessageAt.toISOString() });
    }
    for (const f of recentFavs) {
      activities.push({ type: "favorite", listingId: f.listingId, listingTitle: titleById.get(f.listingId) ?? "", at: f.createdAt.toISOString() });
    }
    activities.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

    return NextResponse.json({
      totalClients: clientIds.length,
      totalListings: allListings.length,
      totalViews,
      totalInquiries,
      totalFavorites,
      portfolioValue,
      responseRate,
      unreadMessages,
      recentActivity: activities.slice(0, 8),
      perClient,
      categoryDistribution,
    });
  } catch (err) {
    console.error("Agent stats GET error:", err);
    return NextResponse.json({ error: "Kunde inte hämta statistik" }, { status: 500 });
  }
}
