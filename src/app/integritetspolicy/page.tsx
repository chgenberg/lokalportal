import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Integritetspolicy – Hittayta.se",
  description: "Så hanterar Hittayta.se dina personuppgifter och cookies.",
};

export default function IntegritetspolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-muted/50 border-b border-border/40">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Link href="/" className="inline-block text-[12px] text-gray-400 hover:text-navy mb-6 transition-colors tracking-wide">&larr; Tillbaka till startsidan</Link>
          <h1 className="text-3xl font-bold text-navy tracking-tight">Integritetspolicy</h1>
          <p className="text-gray-400 mt-2 text-[15px]">Senast uppdaterad: februari 2026</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-navy mb-3 tracking-tight">1. Introduktion</h2>
            <p className="text-[15px] text-gray-600 leading-relaxed">
              Hittayta.se (&quot;vi&quot;, &quot;oss&quot;) värnar om din integritet. Denna policy beskriver vilka personuppgifter vi samlar in, hur vi använder dem och vilka rättigheter du har enligt GDPR (EU 2016/679).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-navy mb-3 tracking-tight">2. Personuppgiftsansvarig</h2>
            <p className="text-[15px] text-gray-600 leading-relaxed">
              Hittayta.se är personuppgiftsansvarig för behandlingen av dina personuppgifter. Du kan kontakta oss via <a href="mailto:info@hittayta.se" className="text-navy hover:underline">info@hittayta.se</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-navy mb-3 tracking-tight">3. Personuppgifter vi samlar in</h2>
            <p className="text-[15px] text-gray-600 leading-relaxed mb-3">Vi kan samla in och behandla följande uppgifter:</p>
            <ul className="list-disc pl-6 text-[15px] text-gray-600 space-y-2 leading-relaxed">
              <li><strong className="text-navy/80">Kontouppgifter:</strong> Namn, e-postadress och telefonnummer när du registrerar ett konto eller publicerar annonser.</li>
              <li><strong className="text-navy/80">Annonsuppgifter:</strong> Information du anger i dina annonser, inklusive kontaktuppgifter, adresser och beskrivningar.</li>
              <li><strong className="text-navy/80">Tekniska data:</strong> IP-adress, webbläsartyp, enhetsinformation och operativsystem för drift, säkerhet och felsökning.</li>
              <li><strong className="text-navy/80">Användningsdata:</strong> Sökningar, sidvisningar och interaktioner för att förbättra tjänsten.</li>
              <li><strong className="text-navy/80">Kommunikation:</strong> Meddelanden du skickar via plattformens chattfunktion eller kontaktformulär.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-navy mb-3 tracking-tight">4. Rättslig grund och ändamål</h2>
            <p className="text-[15px] text-gray-600 leading-relaxed mb-3">Vi behandlar personuppgifter baserat på:</p>
            <ul className="list-disc pl-6 text-[15px] text-gray-600 space-y-2 leading-relaxed">
              <li><strong className="text-navy/80">Avtal:</strong> För att tillhandahålla tjänsten, hantera ditt konto och publicera annonser.</li>
              <li><strong className="text-navy/80">Berättigat intresse:</strong> För att förbättra tjänsten, förhindra missbruk och säkerställa drift.</li>
              <li><strong className="text-navy/80">Samtycke:</strong> För marknadsföring och icke-nödvändiga cookies (när tillämpligt).</li>
              <li><strong className="text-navy/80">Rättslig förpliktelse:</strong> När vi är skyldiga att behandla uppgifter enligt lag.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-navy mb-3 tracking-tight">5. Lagring och säkerhet</h2>
            <p className="text-[15px] text-gray-600 leading-relaxed">
              Personuppgifter lagras så länge det är nödvändigt för ändamålet eller enligt lagkrav. Vi använder kryptering och säkerhetsåtgärder för att skydda dina uppgifter. Data lagras inom EU/EES.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-navy mb-3 tracking-tight">6. Cookies</h2>
            <p className="text-[15px] text-gray-600 leading-relaxed">
              Vi använder nödvändiga cookies för att sajten ska fungera korrekt. Läs mer i vår <Link href="/cookies" className="text-navy hover:underline">cookiepolicy</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-navy mb-3 tracking-tight">7. Delning med tredje part</h2>
            <p className="text-[15px] text-gray-600 leading-relaxed">
              Vi delar inte dina personuppgifter med tredje part utom när det krävs för att tillhandahålla tjänsten (t.ex. hosting-leverantörer) eller enligt lag. Vi säljer aldrig personuppgifter. Eventuella underleverantörer är bundna av personuppgiftsbiträdesavtal.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-navy mb-3 tracking-tight">8. Dina rättigheter</h2>
            <p className="text-[15px] text-gray-600 leading-relaxed mb-3">Enligt GDPR har du rätt att:</p>
            <ul className="list-disc pl-6 text-[15px] text-gray-600 space-y-2 leading-relaxed">
              <li><strong className="text-navy/80">Tillgång:</strong> Begära information om vilka personuppgifter vi behandlar om dig.</li>
              <li><strong className="text-navy/80">Rättelse:</strong> Begära att felaktiga uppgifter korrigeras.</li>
              <li><strong className="text-navy/80">Radering:</strong> Begära att dina uppgifter raderas (&quot;rätten att bli glömd&quot;).</li>
              <li><strong className="text-navy/80">Begränsning:</strong> Begära att behandlingen begränsas under vissa omständigheter.</li>
              <li><strong className="text-navy/80">Dataportabilitet:</strong> Få ut dina uppgifter i ett maskinläsbart format.</li>
              <li><strong className="text-navy/80">Invändning:</strong> Invända mot behandling baserad på berättigat intresse.</li>
            </ul>
            <p className="text-[15px] text-gray-600 leading-relaxed mt-3">
              Du har även rätt att lämna klagomål till Integritetsskyddsmyndigheten (IMY).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-navy mb-3 tracking-tight">9. Kontakt</h2>
            <p className="text-[15px] text-gray-600 leading-relaxed">
              För frågor om integritet och personuppgifter, kontakta oss på <a href="mailto:info@hittayta.se" className="text-navy hover:underline">info@hittayta.se</a> eller via vår <Link href="/kontakt" className="text-navy hover:underline">kontaktsida</Link>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
