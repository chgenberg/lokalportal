import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Cookiepolicy – Hittayta.se",
  description: "Information om hur Hittayta.se använder cookies.",
};

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-muted/50 border-b border-border/40">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Link href="/" className="inline-block text-[12px] text-gray-400 hover:text-navy mb-6 transition-colors tracking-wide">&larr; Tillbaka till startsidan</Link>
          <h1 className="text-3xl font-bold text-navy tracking-tight">Cookiepolicy</h1>
          <p className="text-gray-400 mt-2 text-[15px]">Senast uppdaterad: februari 2026</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-navy mb-3 tracking-tight">1. Vad är cookies?</h2>
            <p className="text-[15px] text-gray-600 leading-relaxed">
              Cookies är små textfiler som lagras på din enhet när du besöker en webbplats. De används för att webbplatsen ska fungera korrekt, för att förbättra användarupplevelsen och för att samla in statistik.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-navy mb-3 tracking-tight">2. Vilka cookies använder vi?</h2>
            <p className="text-[15px] text-gray-600 leading-relaxed mb-4">Hittayta.se använder följande typer av cookies:</p>

            <div className="space-y-4">
              <div className="bg-muted/50 rounded-xl p-5 border border-border/40">
                <h3 className="text-[14px] font-semibold text-navy mb-1">Nödvändiga cookies</h3>
                <p className="text-[13px] text-gray-500 leading-relaxed">
                  Dessa cookies krävs för att webbplatsen ska fungera. De hanterar inloggning, sessionshantering och säkerhet. Dessa kan inte stängas av.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="px-2.5 py-1 text-[11px] font-medium rounded-full bg-navy/[0.04] text-navy/60">next-auth.session-token</span>
                  <span className="px-2.5 py-1 text-[11px] font-medium rounded-full bg-navy/[0.04] text-navy/60">next-auth.csrf-token</span>
                </div>
              </div>

              <div className="bg-muted/50 rounded-xl p-5 border border-border/40">
                <h3 className="text-[14px] font-semibold text-navy mb-1">Funktionella cookies</h3>
                <p className="text-[13px] text-gray-500 leading-relaxed">
                  Dessa cookies kommer ihåg dina val och inställningar, som språk och filterpreferenser, för att ge dig en bättre upplevelse.
                </p>
              </div>

              <div className="bg-muted/50 rounded-xl p-5 border border-border/40">
                <h3 className="text-[14px] font-semibold text-navy mb-1">Analytiska cookies</h3>
                <p className="text-[13px] text-gray-500 leading-relaxed">
                  Vi kan använda analytiska cookies för att förstå hur besökare använder webbplatsen. Denna data är anonymiserad och hjälper oss att förbättra tjänsten.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-navy mb-3 tracking-tight">3. Hur länge sparas cookies?</h2>
            <p className="text-[15px] text-gray-600 leading-relaxed">
              Sessionscookies raderas när du stänger webbläsaren. Permanenta cookies sparas under en bestämd period (vanligtvis 30 dagar) eller tills du raderar dem manuellt.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-navy mb-3 tracking-tight">4. Hantera cookies</h2>
            <p className="text-[15px] text-gray-600 leading-relaxed">
              Du kan hantera och radera cookies via din webbläsares inställningar. Observera att om du blockerar nödvändiga cookies kan det påverka webbplatsens funktionalitet. De flesta webbläsare tillåter dig att se vilka cookies som är lagrade och radera dem individuellt.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-navy mb-3 tracking-tight">5. Tredjepartscookies</h2>
            <p className="text-[15px] text-gray-600 leading-relaxed">
              Vi använder OpenStreetMap för kartvisning. Karttjänsten kan sätta egna cookies. Vi har ingen kontroll över dessa tredjepartscookies. Läs mer i <a href="https://wiki.osmfoundation.org/wiki/Privacy_Policy" target="_blank" rel="noopener noreferrer" className="text-navy hover:underline">OpenStreetMap Foundations integritetspolicy</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-navy mb-3 tracking-tight">6. Kontakt</h2>
            <p className="text-[15px] text-gray-600 leading-relaxed">
              Har du frågor om vår användning av cookies? Kontakta oss på <a href="mailto:info@hittayta.se" className="text-navy hover:underline">info@hittayta.se</a> eller via vår <Link href="/kontakt" className="text-navy hover:underline">kontaktsida</Link>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
