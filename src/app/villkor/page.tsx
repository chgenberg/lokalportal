import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Användarvillkor – Lokalportal",
  description: "Villkor för användning av Lokalportals tjänster.",
};

export default function VillkorPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-muted border-b border-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-navy mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Tillbaka till startsidan
          </Link>
          <h1 className="text-3xl font-bold text-navy">Användarvillkor</h1>
          <p className="text-gray-500 mt-2">Senast uppdaterad: februari 2026</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="prose prose-gray max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-navy mb-3">1. Godkännande</h2>
            <p className="text-gray-600 leading-relaxed">
              Genom att använda Lokalportal (&quot;tjänsten&quot;) godkänner du dessa villkor. Om du inte godkänner dem får du inte använda tjänsten.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-navy mb-3">2. Tjänstens omfattning</h2>
            <p className="text-gray-600 leading-relaxed">
              Lokalportal är en marknadsplats för kommersiella lokaler (butiker, kontor, lager m.m.). Vi tillhandahåller plattformen där annonsörer kan publicera annonser och besökare kan söka och kontakta annonsörer. Lokalportal är inte part i affärer mellan användare.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-navy mb-3">3. Användarens ansvar</h2>
            <p className="text-gray-600 leading-relaxed mb-3">
              Du förbinder dig att:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-1">
              <li>Lämna korrekta uppgifter och hålla dem uppdaterade</li>
              <li>Inte publicera innehåll som är vilseledande, olagligt eller kränkande</li>
              <li>Inte använda tjänsten för spam, skräppost eller otillbörlig datainsamling</li>
              <li>Följa gällande lagar i samband med annonsering och uthyrning</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-navy mb-3">4. Annonser och innehåll</h2>
            <p className="text-gray-600 leading-relaxed">
              Annonsörer ansvarar för innehållet i sina annonser. Vi förbehåller oss rätten att ta bort annonser eller avsluta konton som strider mot dessa villkor eller våra riktlinjer. Vi garanterar inte att annonser är fullständiga eller att annonsörer uppfyller avtal.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-navy mb-3">5. Betalning och avtal</h2>
            <p className="text-gray-600 leading-relaxed">
              Betalning för annonspaket regleras enligt gällande prislista. Avtal om lokaler ingås direkt mellan annonsör och intressent; Lokalportal är inte part och ansvarar inte för uppfyllelse eller skador.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-navy mb-3">6. Immateriella rättigheter</h2>
            <p className="text-gray-600 leading-relaxed">
              Tjänsten, inklusive design, logotyper och texter, tillhör Lokalportal eller våra licensgivare. Du får inte kopiera, modifiera eller återanvända material utan tillstånd.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-navy mb-3">7. Ansvar och skadestånd</h2>
            <p className="text-gray-600 leading-relaxed">
              Tjänsten tillhandahålls &quot;som den är&quot;. Vi begränsar vårt ansvar till det som följer av tvingande lag. Vi ansvarar inte för indirekta skador eller förluster som uppstår genom användning av tjänsten eller kontakt med annonsörer.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-navy mb-3">8. Ändringar och upphörande</h2>
            <p className="text-gray-600 leading-relaxed">
              Vi kan ändra dessa villkor och tjänsten. Fortsatt användning efter ändringar innebär godkännande. Vi kan avsluta eller begränsa tillgång till tjänsten med eller utan föregående meddelande.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-navy mb-3">9. Tillämplig lag och tvister</h2>
            <p className="text-gray-600 leading-relaxed">
              Svensk lag tillämpas. Tvister ska i första hand lösas genom förhandling. Över domstol är svensk domstol behörig.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-navy mb-3">10. Kontakt</h2>
            <p className="text-gray-600 leading-relaxed">
              Frågor om villkoren: <a href="mailto:info@lokalportal.se" className="text-accent hover:underline">info@lokalportal.se</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
