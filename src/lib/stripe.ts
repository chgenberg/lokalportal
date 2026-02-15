import Stripe from "stripe";

export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

/** Monthly price in SEK öre (499 kr = 49900 öre) */
export const LISTING_PRICE_SEK = 49900;
export const LISTING_PRICE_DISPLAY = "499 kr/mån";
