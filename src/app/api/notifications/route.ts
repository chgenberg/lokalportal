import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });

  const unreadOnly = request.nextUrl.searchParams.get("unreadOnly") === "true";
  const limit = Math.min(parseInt(request.nextUrl.searchParams.get("limit") ?? "20"), 100);

  try {
    if (unreadOnly) {
      const count = await prisma.notification.count({
        where: { userId: session.user.id, read: false },
      });
      return NextResponse.json({ unreadCount: count });
    }

    const notifications = await prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json({
      notifications: notifications.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        body: n.body,
        read: n.read,
        link: n.link,
        createdAt: n.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    console.error("Notifications GET error:", err);
    return NextResponse.json({ error: "Kunde inte hämta notifikationer" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });

  try {
    const body = await request.json();
    const { action, notificationId } = body;

    if (action === "markAllRead") {
      await prisma.notification.updateMany({
        where: { userId: session.user.id, read: false },
        data: { read: true },
      });
      return NextResponse.json({ message: "Alla markerade som lästa" });
    }

    if (action === "markRead" && notificationId) {
      await prisma.notification.updateMany({
        where: { id: notificationId, userId: session.user.id },
        data: { read: true },
      });
      return NextResponse.json({ message: "Markerad som läst" });
    }

    return NextResponse.json({ error: "Ogiltig åtgärd" }, { status: 400 });
  } catch (err) {
    console.error("Notifications PATCH error:", err);
    return NextResponse.json({ error: "Kunde inte uppdatera notifikationer" }, { status: 500 });
  }
}
