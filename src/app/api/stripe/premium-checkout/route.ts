import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

const PREMIUM_PRICE_SEK = 29900; // 299 kr/mån in öre
const PREMIUM_PRICE_DISPLAY = "299 kr/mån";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });

  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return NextResponse.json({ error: "Stripe ej konfigurerad" }, { status: 500 });
    }

    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(stripeKey);

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) return NextResponse.json({ error: "Användare hittades inte" }, { status: 404 });

    if (user.subscriptionTier === "premium" && user.subscriptionStripeId) {
      return NextResponse.json({ error: "Du har redan premium", price: PREMIUM_PRICE_DISPLAY }, { status: 400 });
    }

    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [
        {
          price_data: {
            currency: "sek",
            unit_amount: PREMIUM_PRICE_SEK,
            recurring: { interval: "month" },
            product_data: {
              name: "Offmarket Premium",
              description: "Full tillgång till alla bostäder, adresser, bilder och planlösningar",
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/dashboard?payment=premium-success`,
      cancel_url: `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/dashboard?payment=premium-canceled`,
      metadata: { userId: user.id, type: "premium" },
    });

    return NextResponse.json({ url: checkoutSession.url, price: PREMIUM_PRICE_DISPLAY });
  } catch (err) {
    console.error("Premium checkout error:", err);
    return NextResponse.json({ error: "Kunde inte starta betalning" }, { status: 500 });
  }
}
