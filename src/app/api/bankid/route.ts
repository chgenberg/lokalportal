import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

/**
 * BankID verification stub.
 * In production, integrate with a BankID provider (Criipto, Signicat, or direct BankID RP API).
 * This stub simulates the verification flow for development.
 */

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action } = body;

    if (action === "initiate") {
      // In production: call BankID API to start auth/sign, return orderRef + autoStartToken
      return NextResponse.json({
        orderRef: `stub-${Date.now()}`,
        autoStartToken: `stub-token-${Date.now()}`,
        qrData: null,
        status: "pending",
        message: "BankID-verifiering initierad (utvecklingsläge)",
      });
    }

    if (action === "collect") {
      // In production: poll BankID API with orderRef to check status
      // Stub: immediately mark as verified
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          bankIdVerified: true,
          bankIdPersonalNumber: "XXXXXXXX-XXXX", // Would come from BankID response
        },
      });

      return NextResponse.json({
        status: "complete",
        verified: true,
        message: "Verifiering genomförd (utvecklingsläge)",
      });
    }

    if (action === "status") {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { bankIdVerified: true },
      });
      return NextResponse.json({ verified: user?.bankIdVerified ?? false });
    }

    return NextResponse.json({ error: "Ogiltig åtgärd" }, { status: 400 });
  } catch (err) {
    console.error("BankID error:", err);
    return NextResponse.json({ error: "BankID-verifiering misslyckades" }, { status: 500 });
  }
}
