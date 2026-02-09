import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Användarvillkor – Hittayta.se",
  description: "Villkor för användning av Hittayta.se:s tjänster.",
};

export default function VillkorPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-muted/50 border-b border-border/40">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Link href="/" className="inline-block text-[12px] text-gray-400 hover:text-navy mb-6 transition-colors tracking-wide">&larr; Tillbaka till startsidan</Link>
          <h1 className="text-3xl font-bold text-navy tracking-tight">Användarvillkor</h1>
          <p className="text-gray-400 mt-2 text-[15px]">Senast uppdaterad: februari 2026</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-navy mb-3 tracking-tight">1. Godkännande</h2>
            <p className="text-[15px] text-gray-600 leading-relaxed">
              Genom att använda Hittayta.se (&quot;tjänsten&quot;) godkänner du dessa villkor. Om du inte godkänner dem får du inte använda tjänsten. Villkoren gäller alla besökare, registrerade användare och annonsörer.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-navy mb-3 tracking-tight">2. Tjänstens omfattning</h2>
            <p className="text-[15px] text-gray-600 leading-relaxed">
              Hittayta.se är en marknadsplats för kommersiella lokaler (butiker, kontor, lager m.m.). Vi tillhandahåller plattformen där annonsörer kan publicera annonser och besökare kan söka och kontakta annonsörer. Hittayta.se är inte part i affärer mellan användare och ansvarar inte för avtal som ingås mellan hyresvärd och hyresgäst.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-navy mb-3 tracking-tight">3. Registrering och konto</h2>
            <p className="text-[15px] text-gray-600 leading-relaxed mb-3">
              För att publicera annonser eller använda vissa funktioner krävs ett registrerat konto. Du ansvarar för:
            </p>
            <ul className="list-disc pl-6 text-[15px] text-gray-600 space-y-2 leading-relaxed">
              <li>Att uppgifterna du anger vid registrering är korrekta och aktuella.</li>
              <li>Att hålla dina inloggningsuppgifter säkra och inte dela dem med andra.</li>
              <li>All aktivitet som sker via ditt konto.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-navy mb-3 tracking-tight">4. Användarens ansvar</h2>
            <p className="text-[15px] text-gray-600 leading-relaxed mb-3">Du förbinder dig att:</p>
            <ul className="list-disc pl-6 text-[15px] text-gray-600 space-y-2 leading-relaxed">
              <li>Lämna korrekta uppgifter och hålla dem uppdaterade.</li>
              <li>Inte publicera innehåll som är vilseledande, olagligt, diskriminerande eller kränkande.</li>
              <li>Inte använda tjänsten för spam, skräppost eller otillbörlig datainsamling.</li>
              <li>Följa gällande lagar i samband med annonsering och uthyrning.</li>
              <li>Inte försöka kringgå tjänstens säkerhetsfunktioner.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-navy mb-3 tracking-tight">5. Annonser och innehåll</h2>
            <p className="text-[15px] text-gray-600 leading-relaxed">
              Annonsörer ansvarar fullt ut för innehållet i sina annonser, inklusive att uppgifter om lokaler, priser och villkor är korrekta. Vi förbehåller oss rätten att utan förvarning ta bort annonser eller avsluta konton som strider mot dessa villkor eller gällande lagstiftning.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-navy mb-3 tracking-tight">6. Betalning och annonspaket</h2>
            <p className="text-[15px] text-gray-600 leading-relaxed">
              Betalning för annonspaket regleras enligt gällande prislista på webbplatsen. Priser anges inklusive moms om inte annat anges. Avtal om lokaler ingås direkt mellan annonsör och intressent – Hittayta.se är inte part i sådana avtal.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-navy mb-3 tracking-tight">7. Immateriella rättigheter</h2>
            <p className="text-[15px] text-gray-600 leading-relaxed">
              Tjänsten, inklusive design, logotyper, texter och programkod, tillhör Hittayta.se eller våra licensgivare och skyddas av upphovsrätt och andra immateriella rättigheter. Användare får inte kopiera, distribuera eller på annat sätt använda material från tjänsten utan skriftligt tillstånd.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-navy mb-3 tracking-tight">8. Ansvarsbegränsning</h2>
            <p className="text-[15px] text-gray-600 leading-relaxed">
              Tjänsten tillhandahålls &quot;som den är&quot;. Vi garanterar inte att tjänsten är felfri eller alltid tillgänglig. Vi ansvarar inte för direkta eller indirekta skador som uppstår genom användning av tjänsten, utöver vad som följer av tvingande lag. Vi ansvarar inte för avtal, transaktioner eller tvister mellan användare.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-navy mb-3 tracking-tight">9. Personuppgifter</h2>
            <p className="text-[15px] text-gray-600 leading-relaxed">
              Vi behandlar personuppgifter i enlighet med vår <Link href="/integritetspolicy" className="text-navy hover:underline">integritetspolicy</Link> och gällande dataskyddslagstiftning.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-navy mb-3 tracking-tight">10. Ändringar och upphörande</h2>
            <p className="text-[15px] text-gray-600 leading-relaxed">
              Vi kan ändra dessa villkor och tjänsten. Vid väsentliga ändringar informerar vi registrerade användare via e-post eller meddelande på plattformen. Fortsatt användning efter ändringar innebär godkännande av de nya villkoren.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-navy mb-3 tracking-tight">11. Tillämplig lag och tvister</h2>
            <p className="text-[15px] text-gray-600 leading-relaxed">
              Svensk lag tillämpas. Tvister ska i första hand lösas genom förhandling. Om parterna inte kan enas ska tvisten avgöras av svensk allmän domstol.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-navy mb-3 tracking-tight">12. Kontakt</h2>
            <p className="text-[15px] text-gray-600 leading-relaxed">
              Frågor om villkoren? Kontakta oss på <a href="mailto:info@hittayta.se" className="text-navy hover:underline">info@hittayta.se</a> eller via vår <Link href="/kontakt" className="text-navy hover:underline">kontaktsida</Link>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
