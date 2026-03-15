import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

/** POST: Submit a budget intent for a listing (budget gate) */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });

  try {
    const body = await request.json();
    const { listingId, budget } = body;

    if (!listingId || typeof budget !== "number" || budget <= 0) {
      return NextResponse.json({ error: "listingId och budget (positivt tal) krävs" }, { status: 400 });
    }

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { id: true, acceptancePrice: true, ownerId: true, status: true },
    });

    if (!listing || listing.status !== "active") {
      return NextResponse.json({ error: "Annons hittades inte eller är inte aktiv" }, { status: 404 });
    }

    if (listing.ownerId === session.user.id) {
      return NextResponse.json({ error: "Du kan inte lägga budget på egna annonser" }, { status: 400 });
    }

    const matched = listing.acceptancePrice ? budget >= listing.acceptancePrice : true;

    const intent = await prisma.budgetIntent.upsert({
      where: {
        userId_listingId: {
          userId: session.user.id,
          listingId,
        },
      },
      create: {
        userId: session.user.id,
        listingId,
        budget,
        matched,
      },
      update: {
        budget,
        matched,
      },
    });

    if (!matched) {
      return NextResponse.json({
        matched: false,
        message: "Din budget matchar inte säljarens krav. Du kan inte kontakta säljaren för detta objekt.",
      });
    }

    return NextResponse.json({
      id: intent.id,
      matched: true,
      message: "Din budget matchar! Du kan nu kontakta säljaren.",
    });
  } catch (err) {
    console.error("BudgetIntent POST error:", err);
    return NextResponse.json({ error: "Kunde inte spara budgetavsikt" }, { status: 500 });
  }
}

/** GET: Check budget intent status for a listing */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });

  const listingId = request.nextUrl.searchParams.get("listingId");
  if (!listingId) {
    return NextResponse.json({ error: "listingId krävs" }, { status: 400 });
  }

  try {
    const intent = await prisma.budgetIntent.findUnique({
      where: {
        userId_listingId: {
          userId: session.user.id,
          listingId,
        },
      },
    });

    if (!intent) {
      return NextResponse.json({ hasIntent: false, matched: false });
    }

    return NextResponse.json({
      hasIntent: true,
      matched: intent.matched,
      createdAt: intent.createdAt.toISOString(),
    });
  } catch (err) {
    console.error("BudgetIntent GET error:", err);
    return NextResponse.json({ error: "Kunde inte hämta budgetavsikt" }, { status: 500 });
  }
}
