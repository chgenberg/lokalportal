import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SessionProvider from "@/components/SessionProvider";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ledigyta.se";

export const metadata: Metadata = {
  title: "Hittayta.se – Hitta rätt lokal snabbare",
  description:
    "Sveriges ledande marknadsplats för kommersiella lokaler. Hitta butiker, kontor, lager och andra lokaler till salu eller uthyrning.",
  openGraph: {
    title: "Hittayta.se – Hitta rätt lokal snabbare",
    description: "Sveriges ledande marknadsplats för kommersiella lokaler. Hitta butiker, kontor, lager och mer.",
    url: siteUrl,
    siteName: "Hittayta.se",
    locale: "sv_SE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Hittayta.se – Hitta rätt lokal snabbare",
    description: "Sveriges ledande marknadsplats för kommersiella lokaler.",
  },
  metadataBase: new URL(siteUrl),
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Hittayta.se",
  url: siteUrl,
  description: "Sveriges ledande marknadsplats för kommersiella lokaler.",
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer service",
    email: "info@ledigyta.se",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sv">
      <body className={`${inter.variable} antialiased`}>
        <SessionProvider>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
          />
          <Header />
          <main className="min-h-screen pt-16">{children}</main>
          <Footer />
        </SessionProvider>
      </body>
    </html>
  );
}
