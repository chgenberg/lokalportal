import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: "Ej inloggad", status: 401 };
  if (!session.user.isAdmin) return { error: "Ej behörig", status: 403 };
  return { session };
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const page = parseInt(request.nextUrl.searchParams.get("page") ?? "1");
  const limit = Math.min(parseInt(request.nextUrl.searchParams.get("limit") ?? "50"), 100);
  const search = request.nextUrl.searchParams.get("search") ?? "";
  const role = request.nextUrl.searchParams.get("role") ?? "";

  try {
    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }
    if (role) where.role = role;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isBuyer: true,
          isSeller: true,
          isAdmin: true,
          phone: true,
          bankIdVerified: true,
          subscriptionTier: true,
          createdAt: true,
          _count: {
            select: {
              listings: true,
              favorites: true,
              buyerProfiles: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      users: users.map((u) => ({
        ...u,
        createdAt: u.createdAt.toISOString(),
        listingCount: u._count.listings,
        favoriteCount: u._count.favorites,
        profileCount: u._count.buyerProfiles,
      })),
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("Admin users GET error:", err);
    return NextResponse.json({ error: "Kunde inte hämta användare" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const body = await request.json();
    const { userId, action } = body;

    if (!userId || !action) {
      return NextResponse.json({ error: "userId och action krävs" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: "Användare hittades inte" }, { status: 404 });

    if (action === "verify") {
      await prisma.user.update({
        where: { id: userId },
        data: { bankIdVerified: true },
      });
      return NextResponse.json({ message: "Användare verifierad" });
    }

    if (action === "unverify") {
      await prisma.user.update({
        where: { id: userId },
        data: { bankIdVerified: false },
      });
      return NextResponse.json({ message: "Verifiering borttagen" });
    }

    if (action === "makeAdmin") {
      await prisma.user.update({
        where: { id: userId },
        data: { isAdmin: true, role: "admin" },
      });
      return NextResponse.json({ message: "Användare upphöjd till admin" });
    }

    if (action === "removeAdmin") {
      await prisma.user.update({
        where: { id: userId },
        data: { isAdmin: false, role: user.isSeller ? "seller" : "buyer" },
      });
      return NextResponse.json({ message: "Adminrättigheter borttagna" });
    }

    if (action === "setPremium") {
      await prisma.user.update({
        where: { id: userId },
        data: { subscriptionTier: "premium" },
      });
      return NextResponse.json({ message: "Premium aktiverat" });
    }

    if (action === "removePremium") {
      await prisma.user.update({
        where: { id: userId },
        data: { subscriptionTier: "free" },
      });
      return NextResponse.json({ message: "Premium borttaget" });
    }

    return NextResponse.json({ error: "Ogiltig åtgärd" }, { status: 400 });
  } catch (err) {
    console.error("Admin users PATCH error:", err);
    return NextResponse.json({ error: "Kunde inte uppdatera användare" }, { status: 500 });
  }
}
