import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { name, email, subject, message } = await req.json();

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: "Alla fält krävs" }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Ogiltig e-postadress" }, { status: 400 });
    }

    // Log the contact form submission
    // In production, integrate with an email service like SendGrid, Resend, or similar
    console.log("=== Nytt kontaktformulär ===");
    console.log(`Namn: ${name}`);
    console.log(`E-post: ${email}`);
    console.log(`Ämne: ${subject}`);
    console.log(`Meddelande: ${message}`);
    console.log("============================");

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
