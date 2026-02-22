import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  if (session.user.role !== "agent") return NextResponse.json({ error: "Endast för mäklare" }, { status: 403 });

  const { clientId } = await params;
  if (!clientId) return NextResponse.json({ error: "Klient-id saknas" }, { status: 400 });

  try {
    const ac = await prisma.agentClient.findFirst({
      where: { agentId: session.user.id, clientId },
    });

    if (!ac) {
      return NextResponse.json({ error: "Klientkopplingen hittades inte" }, { status: 404 });
    }

    await prisma.agentClient.delete({ where: { id: ac.id } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Agent client DELETE error:", err);
    return NextResponse.json({ error: "Kunde inte ta bort klient" }, { status: 500 });
  }
}
