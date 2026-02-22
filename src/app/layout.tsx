import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SessionProvider from "@/components/SessionProvider";
import AISupportChat from "@/components/AISupportChat";
import CookieConsent from "@/components/CookieConsent";

const dmSans = DM_Sans({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://hittayta.se";

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
    images: [{ url: "/logohittayta.jpeg", width: 1200, height: 630, alt: "HittaYta.se – Hitta rätt lokal snabbare" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hittayta.se – Hitta rätt lokal snabbare",
    description: "Sveriges ledande marknadsplats för kommersiella lokaler.",
    images: [{ url: "/logohittayta.jpeg" }],
  },
  metadataBase: new URL(siteUrl),
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
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
    email: "info@hittayta.se",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sv">
      <body className={`${dmSans.variable} antialiased`}>
        <SessionProvider>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
          />
          <a
            href="#main-content"
            className="absolute -top-16 left-4 z-[100] px-4 py-2 bg-navy text-white rounded-lg text-sm font-medium transition-all focus:top-4 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-white"
          >
            Hoppa till innehåll
          </a>
          <Header />
          <main id="main-content" className="min-h-screen pt-16 w-full min-w-0 overflow-x-hidden">{children}</main>
          <Footer />
          <AISupportChat />
          <CookieConsent />
          <Toaster richColors position="top-center" />
        </SessionProvider>
      </body>
    </html>
  );
}
