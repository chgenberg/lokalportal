import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { stripe, LISTING_PRICE_SEK } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json({ error: "Stripe är inte konfigurerat" }, { status: 503 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
    }

    const { listingId } = await req.json();
    if (!listingId) {
      return NextResponse.json({ error: "listingId krävs" }, { status: 400 });
    }

    // Verify listing belongs to user
    const listing = await prisma.listing.findFirst({
      where: { id: listingId, ownerId: session.user.id },
    });
    if (!listing) {
      return NextResponse.json({ error: "Annons hittades inte" }, { status: 404 });
    }

    // Get or create Stripe customer
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    let customerId = user?.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user?.email || session.user.email || "",
        name: user?.name || session.user.name || "",
        metadata: { userId: session.user.id },
      });
      customerId = customer.id;
      await prisma.user.update({
        where: { id: session.user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    // Create Stripe Checkout Session with a recurring price
    const origin = req.nextUrl.origin;
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "sek",
            unit_amount: LISTING_PRICE_SEK,
            recurring: { interval: "month" },
            product_data: {
              name: `Annons: ${listing.title.slice(0, 60)}`,
              description: `Månadsprenumeration för annons på HittaYta.se`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        listingId,
        userId: session.user.id,
      },
      subscription_data: {
        metadata: {
          listingId,
          userId: session.user.id,
        },
      },
      success_url: `${origin}/dashboard?payment=success&listing=${listingId}`,
      cancel_url: `${origin}/dashboard?payment=canceled`,
      locale: "sv",
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json({ error: "Kunde inte skapa betalningssession" }, { status: 500 });
  }
}
