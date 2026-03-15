import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  if (!session.user.isAdmin) return NextResponse.json({ error: "Ej behörig" }, { status: 403 });

  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      newUsersThisWeek,
      newUsersThisMonth,
      verifiedUsers,
      premiumUsers,
      totalListings,
      activeListings,
      soldListings,
      totalConversations,
      totalMessages,
      totalMatches,
      totalBuyerProfiles,
      roleDistribution,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.user.count({ where: { bankIdVerified: true } }),
      prisma.user.count({ where: { subscriptionTier: "premium" } }),
      prisma.listing.count(),
      prisma.listing.count({ where: { status: "active" } }),
      prisma.listing.count({ where: { status: "sold" } }),
      prisma.conversation.count(),
      prisma.message.count(),
      prisma.match.count(),
      prisma.buyerProfile.count({ where: { active: true } }),
      prisma.user.groupBy({
        by: ["role"],
        _count: { id: true },
      }),
    ]);

    return NextResponse.json({
      users: {
        total: totalUsers,
        newThisWeek: newUsersThisWeek,
        newThisMonth: newUsersThisMonth,
        verified: verifiedUsers,
        premium: premiumUsers,
        byRole: Object.fromEntries(roleDistribution.map((r) => [r.role, r._count.id])),
      },
      listings: {
        total: totalListings,
        active: activeListings,
        sold: soldListings,
      },
      engagement: {
        conversations: totalConversations,
        messages: totalMessages,
        matches: totalMatches,
        activeBuyerProfiles: totalBuyerProfiles,
      },
    });
  } catch (err) {
    console.error("Admin stats error:", err);
    return NextResponse.json({ error: "Kunde inte hämta statistik" }, { status: 500 });
  }
}
