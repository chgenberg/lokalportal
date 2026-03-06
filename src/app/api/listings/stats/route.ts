import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  if (session.user.role !== "landlord" && session.user.role !== "agent") return NextResponse.json({ error: "Endast för hyresvärdar och mäklare" }, { status: 403 });

  const userId = session.user.id;

  try {
    const myListings = await prisma.listing.findMany({
      where: { ownerId: userId },
      select: { id: true, title: true, createdAt: true, viewCount: true },
    });
    const listingIds = myListings.map((l) => l.id);
    if (listingIds.length === 0) {
      return NextResponse.json({
        perListing: [],
        overview: {
          totalListings: 0,
          totalInquiries: 0,
          totalFavorites: 0,
          responseRate: 0,
          topListingId: null,
          topListingTitle: null,
          recentActivity: [],
        },
      });
    }

    const [conversationsByListing, favoritesByListing, conversationsWithLandlordReply, allConversations] = await Promise.all([
      prisma.conversation.groupBy({
        by: ["listingId"],
        where: { listingId: { in: listingIds } },
        _count: { id: true },
        _max: { createdAt: true },
      }),
      prisma.favorite.groupBy({
        by: ["listingId"],
        where: { listingId: { in: listingIds } },
        _count: { id: true },
      }),
      prisma.conversation.findMany({
        where: { landlordId: userId, listingId: { in: listingIds } },
        select: { id: true },
      }),
      prisma.conversation.findMany({
        where: { listingId: { in: listingIds } },
        select: { id: true, listingId: true, createdAt: true, lastMessageAt: true },
        orderBy: { lastMessageAt: "desc" },
      }),
    ]);

    const convMap = new Map(conversationsByListing.map((c) => [c.listingId, { count: c._count.id, lastAt: c._max.createdAt }]));
    const favMap = new Map(favoritesByListing.map((f) => [f.listingId, f._count.id]));
    const landlordRepliedIds = new Set(conversationsWithLandlordReply.map((c) => c.id));

    const perListing = myListings.map((listing) => {
      const conv = convMap.get(listing.id);
      const fav = favMap.get(listing.id);
      return {
        listingId: listing.id,
        inquiryCount: conv?.count ?? 0,
        favoriteCount: fav ?? 0,
        lastInquiryAt: conv?.lastAt?.toISOString() ?? null,
        viewCount: listing.viewCount ?? 0,
      };
    });

    const totalInquiries = conversationsByListing.reduce((s, c) => s + c._count.id, 0);
    const totalFavorites = favoritesByListing.reduce((s, f) => s + f._count.id, 0);
    const totalConversations = allConversations.length;
    const repliedCount = allConversations.filter((c) => landlordRepliedIds.has(c.id)).length;
    const responseRate = totalConversations > 0 ? Math.round((repliedCount / totalConversations) * 100) : 0;

    const inquiryCountByListing = new Map(conversationsByListing.map((c) => [c.listingId, c._count.id]));
    let topListingId: string | null = null;
    let topListingTitle: string | null = null;
    let maxInq = 0;
    for (const [lid, count] of inquiryCountByListing) {
      if (count > maxInq) {
        maxInq = count;
        topListingId = lid;
        topListingTitle = myListings.find((l) => l.id === lid)?.title ?? null;
      }
    }

    const recentFavorites = await prisma.favorite.findMany({
      where: { listingId: { in: listingIds } },
      select: { listingId: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    const titleById = new Map(myListings.map((l) => [l.id, l.title]));
    type ActivityItem = { type: "inquiry" | "message" | "favorite"; listingId: string; listingTitle: string; at: string };
    const activities: ActivityItem[] = [];
    for (const c of allConversations.slice(0, 5)) {
      activities.push({
        type: "inquiry",
        listingId: c.listingId,
        listingTitle: titleById.get(c.listingId) ?? "",
        at: c.lastMessageAt.toISOString(),
      });
    }
    for (const f of recentFavorites.slice(0, 5)) {
      activities.push({
        type: "favorite",
        listingId: f.listingId,
        listingTitle: titleById.get(f.listingId) ?? "",
        at: f.createdAt.toISOString(),
      });
    }
    activities.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
    const recentActivity = activities.slice(0, 5);

    // ── Real 30-day time-series from events table ──────────
    const totalViews = myListings.reduce((s, l) => s + (l.viewCount ?? 0), 0);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);

    const events = await prisma.event.findMany({
      where: {
        listingId: { in: listingIds },
        type: { in: ["view", "inquiry", "favorite"] },
        createdAt: { gte: thirtyDaysAgo },
      },
      select: { type: true, listingId: true, createdAt: true },
    });

    const dailyMap = new Map<string, { views: number; inquiries: number; favorites: number }>();
    const perListingDailyMap = new Map<string, Map<string, number>>();
    for (const listing of myListings) {
      perListingDailyMap.set(listing.id, new Map());
    }

    for (const ev of events) {
      const dateStr = ev.createdAt.toISOString().slice(0, 10);
      const day = dailyMap.get(dateStr) ?? { views: 0, inquiries: 0, favorites: 0 };
      if (ev.type === "view") day.views++;
      else if (ev.type === "inquiry") day.inquiries++;
      else if (ev.type === "favorite") day.favorites++;
      dailyMap.set(dateStr, day);

      if (ev.type === "view" && ev.listingId) {
        const listingDay = perListingDailyMap.get(ev.listingId);
        if (listingDay) {
          listingDay.set(dateStr, (listingDay.get(dateStr) ?? 0) + 1);
        }
      }
    }

    const dailyStats: { date: string; views: number; inquiries: number; favorites: number }[] = [];
    for (let d = 29; d >= 0; d--) {
      const date = new Date(Date.now() - d * 86400000);
      const dateStr = date.toISOString().slice(0, 10);
      const day = dailyMap.get(dateStr) ?? { views: 0, inquiries: 0, favorites: 0 };
      dailyStats.push({ date: dateStr, ...day });
    }

    const perListingDaily: { listingId: string; title: string; daily: number[] }[] = myListings.map((listing) => {
      const listingDay = perListingDailyMap.get(listing.id) ?? new Map();
      const daily: number[] = [];
      for (let d = 29; d >= 0; d--) {
        const dateStr = new Date(Date.now() - d * 86400000).toISOString().slice(0, 10);
        daily.push(listingDay.get(dateStr) ?? 0);
      }
      return { listingId: listing.id, title: listing.title, daily };
    });

    const thisWeekViews = dailyStats.slice(-7).reduce((s, d) => s + d.views, 0);
    const lastWeekViews = dailyStats.slice(-14, -7).reduce((s, d) => s + d.views, 0);
    const thisWeekInquiries = dailyStats.slice(-7).reduce((s, d) => s + d.inquiries, 0);
    const lastWeekInquiries = dailyStats.slice(-14, -7).reduce((s, d) => s + d.inquiries, 0);
    const thisWeekFavorites = dailyStats.slice(-7).reduce((s, d) => s + d.favorites, 0);
    const lastWeekFavorites = dailyStats.slice(-14, -7).reduce((s, d) => s + d.favorites, 0);

    // Category distribution
    const categoryDistribution: Record<string, number> = {};
    const listingsWithCategory = await prisma.listing.findMany({
      where: { ownerId: userId },
      select: { category: true },
    });
    for (const l of listingsWithCategory) {
      categoryDistribution[l.category] = (categoryDistribution[l.category] ?? 0) + 1;
    }

    return NextResponse.json({
      perListing,
      overview: {
        totalListings: myListings.length,
        totalInquiries,
        totalFavorites,
        totalViews,
        responseRate,
        topListingId,
        topListingTitle,
        recentActivity,
      },
      timeSeries: {
        dailyStats,
        perListingDaily,
        weeklyComparison: {
          thisWeek: { views: thisWeekViews, inquiries: thisWeekInquiries, favorites: thisWeekFavorites },
          lastWeek: { views: lastWeekViews, inquiries: lastWeekInquiries, favorites: lastWeekFavorites },
        },
        categoryDistribution,
      },
    });
  } catch (err) {
    console.error("Listings stats error:", err);
    return NextResponse.json({ error: "Kunde inte hämta statistik" }, { status: 500 });
  }
}
