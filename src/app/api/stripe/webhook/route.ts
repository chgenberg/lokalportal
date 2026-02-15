import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import prisma from "@/lib/db";
import { stripe } from "@/lib/stripe";

/** Helper: get current_period_end from subscription items (Stripe v20+) */
function getPeriodEnd(sub: Stripe.Subscription): Date | null {
  const end = sub.items?.data?.[0]?.current_period_end;
  return end ? new Date(end * 1000) : null;
}

export async function POST(req: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature or webhook secret" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const listingId = session.metadata?.listingId;
        const subscriptionId = session.subscription as string;

        if (listingId && subscriptionId) {
          const sub = await stripe.subscriptions.retrieve(subscriptionId);
          const periodEnd = getPeriodEnd(sub);
          await prisma.listing.update({
            where: { id: listingId },
            data: {
              stripeSubscriptionId: subscriptionId,
              stripeStatus: "active",
              stripePriceId: sub.items.data[0]?.price?.id || null,
              ...(periodEnd && { stripeCurrentPeriodEnd: periodEnd }),
            },
          });
        }
        break;
      }

      case "invoice.payment_succeeded": {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const invoice = event.data.object as any;
        const subscriptionId = invoice.parent?.subscription_details?.subscription as string | undefined
          || invoice.subscription as string | undefined;
        if (subscriptionId) {
          const sub = await stripe.subscriptions.retrieve(subscriptionId);
          const periodEnd = getPeriodEnd(sub);
          await prisma.listing.updateMany({
            where: { stripeSubscriptionId: subscriptionId },
            data: {
              stripeStatus: "active",
              ...(periodEnd && { stripeCurrentPeriodEnd: periodEnd }),
            },
          });
        }
        break;
      }

      case "invoice.payment_failed": {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const invoice = event.data.object as any;
        const subscriptionId = invoice.parent?.subscription_details?.subscription as string | undefined
          || invoice.subscription as string | undefined;
        if (subscriptionId) {
          await prisma.listing.updateMany({
            where: { stripeSubscriptionId: subscriptionId },
            data: { stripeStatus: "past_due" },
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await prisma.listing.updateMany({
          where: { stripeSubscriptionId: sub.id },
          data: {
            stripeStatus: "canceled",
            stripeSubscriptionId: null,
          },
        });
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const status = sub.status === "active" ? "active" : sub.status === "past_due" ? "past_due" : sub.status;
        const periodEnd = getPeriodEnd(sub);
        await prisma.listing.updateMany({
          where: { stripeSubscriptionId: sub.id },
          data: {
            stripeStatus: status,
            ...(periodEnd && { stripeCurrentPeriodEnd: periodEnd }),
          },
        });
        break;
      }
    }
  } catch (err) {
    console.error("Webhook handler error:", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
