import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { checkRateLimit, getClientKey } from "@/lib/rateLimit";

const CONTACT_MAX = 5;
const CONTACT_WINDOW_MS = 15 * 60 * 1000;

const MAX_NAME = 200;
const MAX_EMAIL = 254;
const MAX_SUBJECT = 300;
const MAX_MESSAGE = 5000;

export async function POST(req: NextRequest) {
  const key = `contact:${getClientKey(req)}`;
  const { limited, retryAfter } = checkRateLimit(key, CONTACT_MAX, CONTACT_WINDOW_MS);
  if (limited) {
    return NextResponse.json(
      { error: "För många försök. Försök igen senare." },
      { status: 429, headers: retryAfter ? { "Retry-After": String(retryAfter) } : undefined }
    );
  }
  try {
    const { name, email, subject, message } = await req.json();

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: "Alla fält krävs" }, { status: 400 });
    }

    const nameStr = String(name).trim();
    const emailStr = String(email).trim();
    const subjectStr = String(subject).trim();
    const messageStr = String(message).trim();

    if (nameStr.length > MAX_NAME) return NextResponse.json({ error: "Namn är för långt" }, { status: 400 });
    if (emailStr.length > MAX_EMAIL) return NextResponse.json({ error: "E-postadress är för lång" }, { status: 400 });
    if (subjectStr.length > MAX_SUBJECT) return NextResponse.json({ error: "Ämne är för långt" }, { status: 400 });
    if (messageStr.length > MAX_MESSAGE) return NextResponse.json({ error: "Meddelande är för långt" }, { status: 400 });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailStr)) {
      return NextResponse.json({ error: "Ogiltig e-postadress" }, { status: 400 });
    }

    console.info("Kontaktformulär mottaget");

    const apiKey = process.env.RESEND_API_KEY?.trim();
    const toEmail = process.env.CONTACT_EMAIL_TO?.trim() || "info@hittayta.se";

    if (apiKey) {
      const resend = new Resend(apiKey);
      const fromEmail = process.env.RESEND_FROM_EMAIL?.trim() || "onboarding@resend.dev";
      const { error } = await resend.emails.send({
        from: fromEmail,
        to: toEmail,
        replyTo: emailStr,
        subject: `Kontaktformulär: ${subjectStr}`,
        text: `Från: ${nameStr} (${emailStr})\n\nÄmne: ${subjectStr}\n\n${messageStr}`,
      });
      if (error) {
        console.error("Resend send error:", error);
        return NextResponse.json({ error: "Kunde inte skicka e-post. Försök igen senare." }, { status: 500 });
      }
    } else {
      console.warn("[contact] RESEND_API_KEY not set – e-post skickas inte. Konfigurera Resend för att ta emot meddelanden.");
    }

    return NextResponse.json({ success: true, message: "Meddelande skickat" });
  } catch (err) {
    console.error("Contact POST error:", err);
    return NextResponse.json({ error: "Internt serverfel" }, { status: 500 });
  }
}
