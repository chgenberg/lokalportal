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
      select: { clientId: true },
    });
    const clientIds = clientLinks.map((c) => c.clientId);

    const listings = await prisma.listing.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { agentId: userId },
          ...(clientIds.length > 0 ? [{ ownerId: { in: clientIds } }] : []),
        ],
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      listings: listings.map((l) => ({
        id: l.id,
        title: l.title,
        description: l.description,
        city: l.city,
        address: l.address,
        type: l.type,
        category: l.category,
        price: l.price,
        size: l.size,
        imageUrl: l.imageUrl,
        imageUrls: l.imageUrls ?? [],
        tags: l.tags,
        viewCount: l.viewCount,
        createdAt: l.createdAt.toISOString(),
        ownerId: l.ownerId,
        agentId: l.agentId,
        ownerName: l.owner?.name ?? null,
        ownerEmail: l.owner?.email ?? null,
        stripeStatus: l.stripeStatus,
        contact: { name: l.contactName, email: l.contactEmail, phone: l.contactPhone },
      })),
    });
  } catch (err) {
    console.error("Agent portfolio GET error:", err);
    return NextResponse.json({ error: "Kunde inte hämta portfölj" }, { status: 500 });
  }
}
