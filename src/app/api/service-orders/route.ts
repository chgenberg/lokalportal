import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

const VALID_TYPES = ["photo", "valuation", "contract", "inspection", "energy_declaration", "legal", "moving"];

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });

  try {
    const orders = await prisma.serviceOrder.findMany({
      where: { userId: session.user.id },
      include: {
        listing: { select: { title: true, address: true, city: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      orders: orders.map((o) => ({
        id: o.id,
        type: o.type,
        status: o.status,
        price: o.price,
        notes: o.notes,
        createdAt: o.createdAt.toISOString(),
        updatedAt: o.updatedAt.toISOString(),
        listing: o.listing,
      })),
    });
  } catch (err) {
    console.error("ServiceOrders GET error:", err);
    return NextResponse.json({ error: "Kunde inte hämta beställningar" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });

  try {
    const body = await request.json();
    const { type, listingId, notes } = body;

    if (!type || !VALID_TYPES.includes(type)) {
      return NextResponse.json({ error: "Ogiltig tjänstetyp" }, { status: 400 });
    }

    const typeLabels: Record<string, string> = {
      photo: "Fotografering",
      valuation: "Värdering",
      contract: "Kontrakt",
      inspection: "Besiktning",
      energy_declaration: "Energideklaration",
      legal: "Juridisk rådgivning",
      moving: "Flytthjälp",
    };

    const typePrices: Record<string, number> = {
      photo: 4990,
      valuation: 2990,
      contract: 9990,
      inspection: 5990,
      energy_declaration: 3990,
      legal: 4990,
      moving: 0,
    };

    if (listingId) {
      const listing = await prisma.listing.findUnique({ where: { id: listingId } });
      if (!listing) {
        return NextResponse.json({ error: "Annons hittades inte" }, { status: 404 });
      }
    }

    const order = await prisma.serviceOrder.create({
      data: {
        userId: session.user.id,
        listingId: listingId || null,
        type,
        price: typePrices[type] ?? null,
        notes: typeof notes === "string" ? notes.trim().slice(0, 1000) : null,
      },
    });

    await prisma.notification.create({
      data: {
        userId: session.user.id,
        type: "system",
        title: "Beställning mottagen",
        body: `Din beställning av ${typeLabels[type] ?? type} har mottagits. Vi återkommer inom kort.`,
        link: "/dashboard?tab=settings",
      },
    });

    return NextResponse.json({
      id: order.id,
      type: order.type,
      status: order.status,
      price: order.price,
      createdAt: order.createdAt.toISOString(),
    }, { status: 201 });
  } catch (err) {
    console.error("ServiceOrders POST error:", err);
    return NextResponse.json({ error: "Kunde inte skapa beställning" }, { status: 500 });
  }
}
