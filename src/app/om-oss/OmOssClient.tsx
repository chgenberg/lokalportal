"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

/* ── Wavy interactive portrait frame ─────────────────── */
function ThomasPortrait() {
  const [hover, setHover] = useState(false);

  return (
    <div
      className="relative w-40 h-40 sm:w-48 sm:h-48 mx-auto sm:mx-0 shrink-0 group cursor-pointer"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* Animated wavy blob behind the image */}
      <svg
        viewBox="0 0 200 200"
        className="absolute inset-0 w-full h-full transition-transform duration-700 ease-out"
        style={{ transform: hover ? "rotate(15deg) scale(1.05)" : "rotate(0deg) scale(1)" }}
      >
        <defs>
          <clipPath id="blob-clip">
            <path d={hover
              ? "M 100,15 C 140,15 175,35 185,75 C 195,115 185,155 155,175 C 125,195 75,195 45,175 C 15,155 5,115 15,75 C 25,35 60,15 100,15 Z"
              : "M 100,10 C 145,10 180,40 190,80 C 200,120 180,160 150,180 C 120,200 80,200 50,180 C 20,160 0,120 10,80 C 20,40 55,10 100,10 Z"
            } />
          </clipPath>
        </defs>
        {/* Navy glow blob */}
        <path
          d={hover
            ? "M 100,15 C 140,15 175,35 185,75 C 195,115 185,155 155,175 C 125,195 75,195 45,175 C 15,155 5,115 15,75 C 25,35 60,15 100,15 Z"
            : "M 100,10 C 145,10 180,40 190,80 C 200,120 180,160 150,180 C 120,200 80,200 50,180 C 20,160 0,120 10,80 C 20,40 55,10 100,10 Z"
          }
          className="transition-all duration-700 ease-out"
          fill="rgba(10, 22, 40, 0.06)"
          stroke="rgba(10, 22, 40, 0.12)"
          strokeWidth="1.5"
        />
        {/* Accent ring */}
        <path
          d={hover
            ? "M 100,20 C 138,20 170,38 180,75 C 190,112 180,150 152,170 C 124,190 76,190 48,170 C 20,150 10,112 20,75 C 30,38 62,20 100,20 Z"
            : "M 100,16 C 142,16 174,43 184,80 C 194,117 176,156 148,175 C 120,194 80,194 52,175 C 24,156 6,117 16,80 C 26,43 58,16 100,16 Z"
          }
          className="transition-all duration-700 ease-out"
          fill="none"
          stroke={hover ? "rgba(10, 22, 40, 0.20)" : "rgba(10, 22, 40, 0.06)"}
          strokeWidth="1"
          strokeDasharray={hover ? "8 4" : "0"}
        />
      </svg>

      {/* Image clipped to blob shape */}
      <div className="absolute inset-0">
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <defs>
            <clipPath id="portrait-clip">
              <path
                d={hover
                  ? "M 100,15 C 140,15 175,35 185,75 C 195,115 185,155 155,175 C 125,195 75,195 45,175 C 15,155 5,115 15,75 C 25,35 60,15 100,15 Z"
                  : "M 100,10 C 145,10 180,40 190,80 C 200,120 180,160 150,180 C 120,200 80,200 50,180 C 20,160 0,120 10,80 C 20,40 55,10 100,10 Z"
                }
              />
            </clipPath>
          </defs>
          <foreignObject width="200" height="200" clipPath="url(#portrait-clip)">
            <div className="w-full h-full">
              <Image
                src="/Thomas.png"
                alt="Thomas Claesson – Grundare av Hittayta.se"
                width={200}
                height={200}
                className="w-full h-full object-cover transition-transform duration-700 ease-out"
                style={{ transform: hover ? "scale(1.08)" : "scale(1)" }}
                priority
              />
            </div>
          </foreignObject>
        </svg>
      </div>

      {/* Floating particles on hover */}
      <div
        className="absolute -top-2 -right-2 w-3 h-3 rounded-full bg-navy/10 transition-all duration-500"
        style={{
          opacity: hover ? 1 : 0,
          transform: hover ? "translate(4px, -4px) scale(1)" : "translate(0, 0) scale(0)",
        }}
      />
      <div
        className="absolute -bottom-1 -left-1 w-2 h-2 rounded-full bg-navy/15 transition-all duration-500 delay-100"
        style={{
          opacity: hover ? 1 : 0,
          transform: hover ? "translate(-3px, 3px) scale(1)" : "translate(0, 0) scale(0)",
        }}
      />
      <div
        className="absolute top-1/2 -right-3 w-1.5 h-1.5 rounded-full bg-navy/10 transition-all duration-500 delay-200"
        style={{
          opacity: hover ? 1 : 0,
          transform: hover ? "translate(5px, 0) scale(1)" : "translate(0, 0) scale(0)",
        }}
      />
    </div>
  );
}

/* ── Main page ───────────────────────────────────────── */
export default function OmOssClient() {
  return (
    <div className="min-h-screen bg-muted/30">
      {/* Hero */}
      <div className="bg-navy relative overflow-hidden min-h-[280px]">
        <Image
          src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1920&q=80"
          alt=""
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-br from-navy/95 via-navy/85 to-navy-light/90" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "24px 24px" }} />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-28 md:pt-32 pb-12 sm:pb-16 text-center">
          <p className="text-[11px] font-semibold tracking-[0.25em] uppercase text-white/40 mb-3">Om oss</p>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">
            En man. En vision.<br />Väldigt många kvadratmeter.
          </h1>
          <p className="text-white/50 text-[15px] max-w-lg mx-auto leading-relaxed">
            Bakom Hittayta.se står Thomas Claesson – mannen som kan lukta sig till en bra lokal på 500 meters avstånd.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

        {/* Thomas intro */}
        <div className="bg-white rounded-2xl border border-border/40 p-8 shadow-sm mb-6">
          <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
            <ThomasPortrait />
            <div className="text-center sm:text-left">
              <p className="text-[11px] font-semibold text-gray-400 tracking-[0.15em] uppercase mb-1">Grundare & Chefslokalletare</p>
              <h2 className="text-xl font-bold text-navy mb-1 tracking-tight">Thomas Claesson</h2>
              <p className="text-[13px] text-gray-400 mb-4">&ldquo;Jag har aldrig träffat en lokal jag inte gillade. Okej, kanske den i Borås utan fönster. Men annars.&rdquo;</p>
              <p className="text-[15px] text-gray-600 leading-relaxed">
                Thomas har jobbat med kommersiella lokaler i över 25 år. Det hela började 1998 när han av misstag hyrde ut sitt garage till en startup som behövde &ldquo;ett litet kontor med karaktär&rdquo;. Startupen gick under efter tre månader, men Thomas hade hittat sin livs passion: att matcha rätt lokal med rätt människa.
              </p>
            </div>
          </div>
        </div>

        {/* Thomas resa */}
        <div className="relative bg-white rounded-2xl border border-border/40 overflow-hidden shadow-sm mb-6">
          <div className="absolute top-0 right-0 w-full max-w-xs h-full opacity-[0.06] hidden sm:block">
            <Image
              src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80"
              alt=""
              fill
              className="object-cover object-right"
              sizes="320px"
            />
          </div>
          <div className="relative p-8">
          <p className="text-[11px] font-semibold text-gray-400 tracking-[0.15em] uppercase mb-3">Thomas resa</p>
          <h2 className="text-xl font-bold text-navy mb-6 tracking-tight">Från garageuthyrning till Sveriges smartaste lokalplattform</h2>
          <div className="space-y-6">
            {[
              {
                year: "1998",
                title: "Det oavsiktliga geniet",
                text: "Thomas hyr ut sitt garage i Mölndal. Hyresgästen klagar på att det luktar motorolja. Thomas svarar: \"Det är karaktär.\" En bransch-legend föds.",
              },
              {
                year: "2003",
                title: "500 lokaler och en insikt",
                text: "Efter att ha förmedlat sin 500:e lokal inser Thomas att han kan uppskatta en lokals yta med blotta ögat, med max 2 m² felmarginal. Hans fru är mindre imponerad än han hade hoppats.",
              },
              {
                year: "2012",
                title: "\"Det måste finnas ett bättre sätt\"",
                text: "Thomas sitter i sin bil utanför en lokal i Västerås och scrollar genom PDF:er i sin mejl. Han bestämmer sig: lokalmarknaden behöver digitaliseras. Hans tonårsdotter förklarar vad en app är.",
              },
              {
                year: "2024",
                title: "Hittayta.se lanseras",
                text: "Efter år av research, prototyper och alldeles för mycket kaffe lanseras Hittayta.se – med agentgenererade annonser, kartvisning och Thomas personliga kvalitetsstämpel på varje funktion.",
              },
            ].map((item) => (
              <div key={item.year} className="flex gap-5">
                <div className="w-14 h-10 rounded-xl bg-navy/[0.04] flex items-center justify-center shrink-0">
                  <span className="text-[12px] font-bold text-navy/60 tabular-nums">{item.year}</span>
                </div>
                <div>
                  <h3 className="text-[15px] font-semibold text-navy mb-1 tracking-tight">{item.title}</h3>
                  <p className="text-[13px] text-gray-500 leading-relaxed">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
          </div>
        </div>

        {/* Fun facts */}
        <div className="bg-white rounded-2xl border border-border/40 p-8 shadow-sm mb-6">
          <p className="text-[11px] font-semibold text-gray-400 tracking-[0.15em] uppercase mb-3">Saker du inte visste om Thomas</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { stat: "3 000+", label: "Lokaler personligen besökta", note: "Och han minns varje en." },
              { stat: "±2 m²", label: "Felmarginal vid ögonmått", note: "Testat och verifierat av hans fru." },
              { stat: "Kvadrat", label: "Hundens namn", note: "En golden retriever. Gillar öppna planlösningar." },
              { stat: "0", label: "Lokaler han ångrar", note: "Okej, kanske den i Borås." },
            ].map((f) => (
              <div key={f.label} className="p-4 rounded-xl bg-muted/30 border border-border/30">
                <p className="text-2xl font-bold text-navy tracking-tight">{f.stat}</p>
                <p className="text-[13px] font-semibold text-navy/70 mt-0.5">{f.label}</p>
                <p className="text-[12px] text-gray-400 mt-1">{f.note}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Mission */}
        <div className="bg-white rounded-2xl border border-border/40 p-8 shadow-sm mb-6">
          <p className="text-[11px] font-semibold text-gray-400 tracking-[0.15em] uppercase mb-3">Vår mission</p>
          <h2 className="text-xl font-bold text-navy mb-4 tracking-tight">Att göra lokalmarknaden transparent, snabb och – ja – lite roligare</h2>
          <p className="text-[15px] text-gray-600 leading-relaxed mb-4">
            Bakom humorn finns ett genuint uppdrag. Lokalmarknaden har länge varit opak, långsam och onödigt krånglig. Vi bygger Hittayta.se för att ändra på det.
          </p>
          <p className="text-[15px] text-gray-600 leading-relaxed mb-4">
            Varje annonsör verifieras med BankID. Varje annons kan skapas med vår agent på under fem minuter. Och varje hyresgäst kan söka, filtrera och kontakta direkt – utan mellanhänder, utan krångel.
          </p>
          <p className="text-[15px] text-gray-600 leading-relaxed">
            Thomas brukar säga: <em>&ldquo;En bra lokal kan förändra ett företag. En dålig plattform ska inte stå i vägen.&rdquo;</em> Vi håller med honom. Mest för att han är chefen.
          </p>
        </div>

        {/* Values */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {[
            { title: "Transparens", text: "Inga dolda avgifter, inga överraskningar. Förutom att Thomas ibland dyker upp med tårta." },
            { title: "Enkelhet", text: "Från sökning till kontrakt – allt ska vara så smidigt att till och med Thomas klarar det." },
            { title: "Trygghet", text: "BankID-verifiering, tydliga villkor och en grundare som tar ditt förtroende på allvar." },
          ].map((v) => (
            <div key={v.title} className="bg-white rounded-2xl border border-border/40 p-6 shadow-sm text-center">
              <h3 className="text-base font-bold text-navy mb-2 tracking-tight">{v.title}</h3>
              <p className="text-[13px] text-gray-400 leading-relaxed">{v.text}</p>
            </div>
          ))}
        </div>

        {/* Thomas-citat */}
        <div className="bg-navy/[0.03] rounded-2xl border border-navy/10 p-8 mb-6 text-center">
          <p className="text-[17px] text-navy/80 leading-relaxed italic max-w-lg mx-auto mb-4">
            &ldquo;Folk frågar mig varför jag brinner för lokaler. Jag svarar: har du någonsin stått i en tom lokal med 4,5 meters takhöjd och sydvänt skyltfönster? Exakt. Det är poesi.&rdquo;
          </p>
          <p className="text-[13px] font-semibold text-navy">Thomas Claesson</p>
          <p className="text-[12px] text-gray-400">Grundare, Hittayta.se</p>
        </div>

        {/* CTA */}
        <div className="bg-navy rounded-2xl p-8 text-center">
          <h2 className="text-xl font-bold text-white mb-2 tracking-tight">Vill du prata lokaler med Thomas?</h2>
          <p className="text-[13px] text-white/40 mb-6">Han svarar på allt. Utom frågor om den där lokalen i Borås.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/kontakt" className="inline-block px-6 py-2.5 bg-white text-navy text-[13px] font-semibold rounded-xl transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
              Kontakta oss
            </Link>
            <Link href="/skapa-annons" className="inline-block px-6 py-2.5 border border-white/15 text-white/70 text-[13px] font-medium rounded-xl hover:bg-white/[0.05] hover:text-white transition-all">
              Testa vår agent
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
