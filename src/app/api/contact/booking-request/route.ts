import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { checkRateLimit, getClientKey } from "@/lib/rateLimit";

const BOOKING_MAX = 5;
const BOOKING_WINDOW_MS = 15 * 60 * 1000;

const MAX_NAME = 200;
const MAX_EMAIL = 254;
const MAX_PHONE = 50;
const MAX_COMPANY = 150;
const MAX_MESSAGE = 2000;

export async function POST(req: NextRequest) {
  const key = `booking:${getClientKey(req)}`;
  const { limited, retryAfter } = checkRateLimit(key, BOOKING_MAX, BOOKING_WINDOW_MS);
  if (limited) {
    return NextResponse.json(
      { error: "För många bokningsförfrågningar. Försök igen senare." },
      { status: 429, headers: retryAfter ? { "Retry-After": String(retryAfter) } : undefined }
    );
  }

  try {
    const body = await req.json();
    const { date, time, name, email, phone, company, message, bookingType } = body;

    if (bookingType !== "callback") {
      return NextResponse.json({ error: "Ogiltig bokningstyp" }, { status: 400 });
    }
    if (!date || !time || !name || !email || !phone) {
      return NextResponse.json({ error: "Datum, tid, namn, e-post och telefon krävs" }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(String(email).trim())) {
      return NextResponse.json({ error: "Ogiltig e-postadress" }, { status: 400 });
    }

    const nameStr = String(name).trim().slice(0, MAX_NAME);
    const emailStr = String(email).trim().slice(0, MAX_EMAIL);
    const phoneStr = String(phone).trim().slice(0, MAX_PHONE);
    const companyStr = company != null ? String(company).trim().slice(0, MAX_COMPANY) : "";
    const messageStr = message != null ? String(message).trim().slice(0, MAX_MESSAGE) : "";

    const toEmail = process.env.CONTACT_EMAIL_TO?.trim() || "info@hittayta.se";
    const apiKey = process.env.RESEND_API_KEY?.trim();

    if (apiKey) {
      const resend = new Resend(apiKey);
      const fromEmail = process.env.RESEND_FROM_EMAIL?.trim() || "onboarding@resend.dev";

      const teamText = `Ny uppringningsbokning från Hittayta.se

Datum: ${date}
Tid: ${time}

Namn: ${nameStr}
E-post: ${emailStr}
Telefon: ${phoneStr}
${companyStr ? `Företag: ${companyStr}` : ""}
${messageStr ? `\nMeddelande:\n${messageStr}` : ""}`;

      await resend.emails.send({
        from: fromEmail,
        to: toEmail,
        replyTo: emailStr,
        subject: `Uppringningsbokning: ${nameStr} – ${date} kl ${time}`,
        text: teamText,
      });

      const confirmText = `Hej ${nameStr}!

Tack för din bokning. Vi ringer dig ${date} kl ${time}.

Har du frågor? Svara på detta mejl eller kontakta oss på info@hittayta.se.

Med vänliga hälsningar,
Hittayta.se`;

      await resend.emails.send({
        from: fromEmail,
        to: emailStr,
        subject: "Bekräftelse: Vi ringer dig – Hittayta.se",
        text: confirmText,
      });
    } else {
      console.warn("[booking-request] RESEND_API_KEY not set – e-post skickas inte");
    }

    return NextResponse.json({ success: true, message: "Bokning mottagen" });
  } catch (err) {
    console.error("[booking-request] error:", err);
    return NextResponse.json({ error: "Kunde inte skicka bokning. Försök igen." }, { status: 500 });
  }
}
