import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Integritetspolicy – Lokalportal",
  description: "Så hanterar Lokalportal dina personuppgifter och cookies.",
};

export default function IntegritetspolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-muted border-b border-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Link href="/" className="inline-block text-sm text-gray-500 hover:text-navy mb-6 transition-colors">&larr; Tillbaka till startsidan</Link>
          <h1 className="text-3xl font-bold text-navy">Integritetspolicy</h1>
          <p className="text-gray-500 mt-2">Senast uppdaterad: februari 2026</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="prose prose-gray max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-navy mb-3">1. Introduktion</h2>
            <p className="text-gray-600 leading-relaxed">Lokalportal (&quot;vi&quot;, &quot;oss&quot;) värnar om din integritet. Denna policy beskriver vilka personuppgifter vi samlar in, hur vi använder dem och vilka rättigheter du har enligt GDPR (EU 2016/679).</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-navy mb-3">2. Personuppgifter vi samlar in</h2>
            <p className="text-gray-600 leading-relaxed mb-3">Vi kan samla in och behandla följande uppgifter:</p>
            <ul className="list-disc pl-6 text-gray-600 space-y-1">
              <li>Namn och kontaktuppgifter (e-post, telefon) när du publicerar annonser eller kontaktar annonsörer</li>
              <li>IP-adress och tekniska data (webbläsare, enhet) för drift och säkerhet</li>
              <li>Användningsdata (sökningar, sidvisningar) för att förbättra tjänsten</li>
            </ul>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-navy mb-3">3. Rättslig grund och ändamål</h2>
            <p className="text-gray-600 leading-relaxed">Vi behandlar personuppgifter på grund av avtal, berättigat intresse och i vissa fall samtycke.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-navy mb-3">4. Cookies</h2>
            <p className="text-gray-600 leading-relaxed">Vi använder nödvändiga cookies för att sajten ska fungera. Du kan hantera cookie-inställningar i din webbläsare.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-navy mb-3">5. Delning med tredje part</h2>
            <p className="text-gray-600 leading-relaxed">Vi delar inte dina personuppgifter med tredje part utom när det krävs för tjänsten eller enligt lag. Vi säljer inte personuppgifter.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-navy mb-3">6. Dina rättigheter</h2>
            <p className="text-gray-600 leading-relaxed">Du har rätt till tillgång, rättelse, radering, begränsning och dataportabilitet. Kontakta oss på <a href="mailto:info@lokalportal.se" className="text-navy hover:underline">info@lokalportal.se</a>.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-navy mb-3">7. Kontakt</h2>
            <p className="text-gray-600 leading-relaxed">För frågor om integritet: <a href="mailto:info@lokalportal.se" className="text-navy hover:underline">info@lokalportal.se</a>.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
