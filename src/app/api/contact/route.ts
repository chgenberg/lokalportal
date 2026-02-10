import { NextRequest, NextResponse } from "next/server";

const MAX_NAME = 200;
const MAX_EMAIL = 254;
const MAX_SUBJECT = 300;
const MAX_MESSAGE = 5000;

export async function POST(req: NextRequest) {
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

    // Minimal log for monitoring (no personal data or message content)
    console.info("Kontaktformulär mottaget");

    // TODO: Send email via an email service provider
    // Example with Resend:
    // await resend.emails.send({
    //   from: 'noreply@hittayta.se',
    //   to: 'info@hittayta.se',
    //   replyTo: email,
    //   subject: `Kontaktformulär: ${subject}`,
    //   text: `Från: ${name} (${email})\n\nÄmne: ${subject}\n\n${message}`,
    // });

    return NextResponse.json({ success: true, message: "Meddelande skickat" });
  } catch {
    return NextResponse.json({ error: "Internt serverfel" }, { status: 500 });
  }
}
