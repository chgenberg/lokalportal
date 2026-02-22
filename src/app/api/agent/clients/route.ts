import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rateLimit";
import prisma from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  if (session.user.role !== "agent") return NextResponse.json({ error: "Endast för mäklare" }, { status: 403 });

  try {
    const clients = await prisma.agentClient.findMany({
      where: { agentId: session.user.id },
      include: {
        client: {
          select: { id: true, name: true, email: true, phone: true, createdAt: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const clientIds = clients.map((c) => c.clientId);

    const listingCounts = clientIds.length > 0
      ? await prisma.listing.groupBy({
          by: ["ownerId"],
          where: { ownerId: { in: clientIds } },
          _count: { id: true },
        })
      : [];

    const countMap = new Map(listingCounts.map((c) => [c.ownerId, c._count.id]));

    return NextResponse.json({
      clients: clients.map((ac) => ({
        id: ac.id,
        clientId: ac.clientId,
        name: ac.client.name,
        email: ac.client.email,
        phone: ac.client.phone,
        note: ac.note,
        listingCount: countMap.get(ac.clientId) ?? 0,
        createdAt: ac.createdAt.toISOString(),
        clientSince: ac.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    console.error("Agent clients GET error:", err);
    return NextResponse.json({ error: "Kunde inte hämta klienter" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  if (session.user.role !== "agent") return NextResponse.json({ error: "Endast för mäklare" }, { status: 403 });

  const { limited, retryAfter } = checkRateLimit(`agent-client-add:${session.user.id}`, 20, 15 * 60 * 1000);
  if (limited) {
    return NextResponse.json(
      { error: "För många förfrågningar. Försök igen senare." },
      { status: 429, headers: retryAfter ? { "Retry-After": String(retryAfter) } : undefined }
    );
  }

  try {
    const body = await request.json();
    const { email, note } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "E-post krävs" }, { status: 400 });
    }

    const client = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!client) {
      return NextResponse.json({ error: "Ingen användare hittades med den e-postadressen" }, { status: 404 });
    }

    if (client.role !== "landlord") {
      return NextResponse.json({ error: "Användaren är inte en hyresvärd" }, { status: 400 });
    }

    if (client.id === session.user.id) {
      return NextResponse.json({ error: "Du kan inte lägga till dig själv som klient" }, { status: 400 });
    }

    const existing = await prisma.agentClient.findUnique({
      where: { agentId_clientId: { agentId: session.user.id, clientId: client.id } },
    });

    if (existing) {
      return NextResponse.json({ error: "Klienten är redan tillagd" }, { status: 409 });
    }

    const ac = await prisma.agentClient.create({
      data: {
        agentId: session.user.id,
        clientId: client.id,
        note: typeof note === "string" ? note.trim().slice(0, 500) : null,
      },
      include: {
        client: { select: { id: true, name: true, email: true, phone: true } },
      },
    });

    return NextResponse.json({
      id: ac.id,
      clientId: ac.clientId,
      name: ac.client.name,
      email: ac.client.email,
      phone: ac.client.phone,
      note: ac.note,
      listingCount: 0,
      createdAt: ac.createdAt.toISOString(),
      clientSince: ac.createdAt.toISOString(),
    }, { status: 201 });
  } catch (err) {
    console.error("Agent clients POST error:", err);
    return NextResponse.json({ error: "Kunde inte lägga till klient" }, { status: 500 });
  }
}
