import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { checkRateLimit, getClientKey } from "@/lib/rateLimit";
import { SITE_CONTEXT } from "@/lib/chatbot-context";

const CHATBOT_MAX = 20;
const CHATBOT_WINDOW_MS = 5 * 60 * 1000;

const SYSTEM_PROMPT = `Du är en hjälpsam assistent på Hittayta.se – Sveriges marknadsplats för kommersiella lokaler. Du svarar ENDAST på frågor som rör:
- Kommersiella fastigheter (uthyrning, köp)
- Lokaltyper: butik, kontor, lager, restaurang, verkstad, showroom, pop-up, ateljé, gym
- Hittayta.se som tjänst (annonspaket, hur det fungerar, kontakt)

Svara kort och vänligt på svenska. Använd informationen nedan för att svara enligt Hittayta.se:s principer.

${SITE_CONTEXT}

Om frågan inte är relevant för kommersiella lokaler eller Hittayta.se: Säg vänligt att du endast hjälper med sådant och föreslå att användaren klickar "Jag vill bli kontaktad" för personlig hjälp.`;

export async function POST(req: NextRequest) {
  const key = `chatbot:${getClientKey(req)}`;
  const { limited, retryAfter } = checkRateLimit(key, CHATBOT_MAX, CHATBOT_WINDOW_MS);
  if (limited) {
    return NextResponse.json(
      { error: "För många förfrågningar. Försök igen om en stund." },
      { status: 429, headers: retryAfter ? { "Retry-After": String(retryAfter) } : undefined }
    );
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json({ error: "Chatbotten är inte konfigurerad." }, { status: 503 });
  }

  try {
    const { messages, pagePath } = (await req.json()) as {
      messages?: Array<{ role: "user" | "assistant"; content: string }>;
      pagePath?: string;
    };

    const history = Array.isArray(messages) ? messages : [];
    const userMessage = history.filter((m) => m.role === "user").pop()?.content;
    if (!userMessage || typeof userMessage !== "string" || userMessage.trim().length === 0) {
      return NextResponse.json({ error: "Meddelande saknas" }, { status: 400 });
    }

    const openai = new OpenAI({ apiKey, timeout: 15_000 });
    const contextNote = pagePath
      ? `\nAnvändaren befinner sig på sidan: ${pagePath}. Du kan anpassa svaret lätt efter sidans tema om det är relevant.`
      : "";

    const inputMessages = history.slice(-8).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    const response = await openai.responses.create({
      model: "gpt-5-mini",
      instructions: SYSTEM_PROMPT + contextNote,
      input: inputMessages,
      max_output_tokens: 500,
    });

    const reply = response.output_text?.trim() || "Jag kunde inte generera ett svar. Försök igen eller klicka på 'Jag vill bli kontaktad'.";

    return NextResponse.json({ reply });
  } catch (err) {
    console.error("[chatbot] error:", err);
    return NextResponse.json({ error: "Något gick fel. Försök igen." }, { status: 500 });
  }
}
