import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { stripe, LISTING_PRICE_SEK } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json({ error: "Stripe är inte konfigurerat" }, { status: 503 });
    }

    const body = await req.json();
    const { listing: listingData, user: userData } = body;

    if (!listingData || !userData?.email || !userData?.name) {
      return NextResponse.json({ error: "Uppgifter saknas" }, { status: 400 });
    }

    const email = String(userData.email).trim().toLowerCase();
    const name = String(userData.name).trim();
    const phone = userData.phone ? String(userData.phone).trim() : "";

    // 1. Determine user: existing session, existing account, or create new
    let userId: string;
    let stripeCustomerId: string | null = null;

    const session = await getServerSession(authOptions);

    if (session?.user?.id) {
      // Already logged in
      userId = session.user.id;
      const existingUser = await prisma.user.findUnique({ where: { id: userId } });
      stripeCustomerId = existingUser?.stripeCustomerId || null;
    } else {
      // Check if account exists with this email
      const existingUser = await prisma.user.findUnique({ where: { email } });

      if (existingUser) {
        userId = existingUser.id;
        stripeCustomerId = existingUser.stripeCustomerId || null;
      } else {
        // Auto-create account with random password (user can reset later)
        const tempPassword = crypto.randomUUID();
        const passwordHash = await bcrypt.hash(tempPassword, 12);

        const newUser = await prisma.user.create({
          data: {
            email,
            name,
            phone: phone || null,
            passwordHash,
            role: "landlord",
          },
        });
        userId = newUser.id;
      }
    }

    // 2. Get or create Stripe customer
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email,
        name,
        phone: phone || undefined,
        metadata: { userId },
      });
      stripeCustomerId = customer.id;
      await prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId },
      });
    }

    // 3. Create the listing
    const imgs = listingData.imageUrls?.length
      ? listingData.imageUrls
      : listingData.imageUrl
        ? [listingData.imageUrl]
        : [];

    const newListing = await prisma.listing.create({
      data: {
        title: String(listingData.title || "Kommersiell lokal").trim(),
        description: String(listingData.description || "").trim(),
        city: String(listingData.city || "").trim(),
        address: String(listingData.address || "").trim(),
        type: listingData.type || "rent",
        category: listingData.category || "office",
        price: Number(listingData.price) || 0,
        size: Number(listingData.size) || 0,
        tags: listingData.tags || [],
        imageUrl: imgs[0] || "",
        imageUrls: imgs.length > 0 ? imgs : [],
        videoUrl: listingData.videoUrl || null,
        lat: listingData.lat ? Number(listingData.lat) : undefined,
        lng: listingData.lng ? Number(listingData.lng) : undefined,
        areaData: listingData.nearby || listingData.priceContext || listingData.demographics || listingData.areaContext
          ? {
              nearby: listingData.nearby || undefined,
              priceContext: listingData.priceContext || undefined,
              demographics: listingData.demographics || undefined,
              areaContext: listingData.areaContext || undefined,
            }
          : undefined,
        ownerId: userId,
        stripeStatus: "pending",
      },
    });

    // 4. Create Stripe Checkout Session
    const origin = req.nextUrl.origin;
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "sek",
            unit_amount: LISTING_PRICE_SEK,
            recurring: { interval: "month" },
            product_data: {
              name: `Annons: ${newListing.title.slice(0, 60)}`,
              description: "Månadsprenumeration för annons på HittaYta.se",
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        listingId: newListing.id,
        userId,
      },
      subscription_data: {
        metadata: {
          listingId: newListing.id,
          userId,
        },
      },
      success_url: `${origin}/dashboard?payment=success&listing=${newListing.id}`,
      cancel_url: `${origin}/publicera?canceled=true`,
      locale: "sv",
    });

    return NextResponse.json({ url: checkoutSession.url, listingId: newListing.id });
  } catch (err) {
    console.error("Publish checkout error:", err);
    return NextResponse.json({ error: "Kunde inte skapa betalningssession" }, { status: 500 });
  }
}
