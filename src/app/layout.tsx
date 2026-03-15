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

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://offmarket.nu";

export const metadata: Metadata = {
  title: "Offmarket.nu – Off-market bostäder till salu",
  description:
    "Sveriges marknadsplats för off-market bostäder. Hitta villor, lägenheter, fritidshus och tomter till salu – innan de når den öppna marknaden.",
  openGraph: {
    title: "Offmarket.nu – Off-market bostäder till salu",
    description: "Sveriges marknadsplats för off-market bostäder. Villor, lägenheter, fritidshus och tomter till salu.",
    url: siteUrl,
    siteName: "Offmarket.nu",
    locale: "sv_SE",
    type: "website",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Offmarket.nu – Off-market bostäder till salu" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Offmarket.nu – Off-market bostäder till salu",
    description: "Sveriges marknadsplats för off-market bostäder.",
    images: [{ url: "/opengraph-image" }],
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
  name: "Offmarket.nu",
  url: siteUrl,
  description: "Sveriges marknadsplats för off-market bostäder till salu.",
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer service",
    email: "info@offmarket.nu",
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
