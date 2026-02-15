import { NextRequest, NextResponse } from "next/server";
import React from "react";
import { renderToBuffer, Document, Page, View, Text, Image } from "@react-pdf/renderer";
import { formatPrice } from "@/lib/formatPrice";

export const maxDuration = 60;

/* ── Interfaces ── */
interface NearbyItem { name: string; distance: string }
interface NearbyData { transit?: NearbyItem[]; restaurants?: NearbyItem[]; parking?: NearbyItem[] }
interface PriceContext { medianPrice: number; count: number; minPrice: number; maxPrice: number }
interface DemographicsData {
  population: number; city: string; medianIncome?: number;
  workingAgePercent?: number; totalBusinesses?: number; crimeRate?: number;
}
interface PdfBody {
  title: string; description: string; address: string; city: string;
  type: "sale" | "rent"; category: string; price: number; size: number;
  tags: string[]; imageUrls: string[];
  contact: { name: string; email: string; phone: string };
  nearby?: NearbyData; priceContext?: PriceContext | null;
  demographics?: DemographicsData | null;
}

const TYPE_LABELS: Record<string, string> = { sale: "Säljes", rent: "Uthyres" };
const CAT_LABELS: Record<string, string> = {
  butik: "Butik", kontor: "Kontor", lager: "Lager", restaurang: "Restaurang",
  verkstad: "Verkstad", showroom: "Showroom", popup: "Pop-up", atelje: "Ateljé",
  gym: "Gym/Studio", ovrigt: "Övrigt",
};

function fmtNum(n: number) { return n.toLocaleString("sv-SE"); }
function fmtCats(c: string) { return c.split(",").map(s => CAT_LABELS[s.trim()] || s.trim()).filter(Boolean).join(" · "); }

/* ── Colors ── */
const C = {
  navy: "#0a1628",
  navyLight: "#162240",
  gold: "#C9A96E",
  goldDark: "#B8955E",
  muted: "#f8fafc",
  border: "#e2e8f0",
  text: "#0a1628",
  textMuted: "#64748b",
  textLight: "#94a3b8",
  white: "#ffffff",
};

/* ── PDF Document Component ── */
function ListingPdf({ data, logoSrc }: { data: PdfBody; logoSrc: string }) {
  const priceDisplay = formatPrice(data.price, data.type);
  const pricePerSqm = data.size > 0 ? Math.round(data.price / data.size) : 0;
  const typeLabel = TYPE_LABELS[data.type] || data.type;
  const catLabel = fmtCats(data.category);
  const images = (data.imageUrls || []).slice(0, 10);
  const heroImg = images[0];
  const galleryImgs = images.slice(1);
  const descParagraphs = data.description.split(/\n\n+|\n/).filter(Boolean);

  const pc = data.priceContext;
  const demo = data.demographics;
  const nearby = data.nearby;

  return (
    <Document>
      <Page size="A4" style={{ fontFamily: "Helvetica", backgroundColor: C.white }}>
        {/* Header */}
        <View style={{ backgroundColor: C.navy, paddingHorizontal: 36, paddingVertical: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          {logoSrc ? <Image src={logoSrc} style={{ height: 22 }} /> : <Text style={{ color: C.gold, fontSize: 14, fontWeight: "bold" }}>HittaYta.se</Text>}
          <Text style={{ color: C.gold, fontSize: 8, fontWeight: "bold", letterSpacing: 1 }}>KOMMERSIELLA LOKALER I SVERIGE</Text>
        </View>
        {/* Gold line */}
        <View style={{ height: 3, backgroundColor: C.gold }} />

        {/* Hero image */}
        {heroImg && (
          <View style={{ height: 200, position: "relative", overflow: "hidden" }}>
            <Image src={heroImg} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            {/* Overlay */}
            <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, paddingHorizontal: 36, paddingBottom: 16, paddingTop: 50, backgroundColor: "rgba(10,22,40,0.7)" }}>
              <View style={{ flexDirection: "row", gap: 6, marginBottom: 6 }}>
                <Text style={{ backgroundColor: C.gold, color: C.navy, fontSize: 7, fontWeight: "bold", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 3, letterSpacing: 0.5 }}>{typeLabel}</Text>
                <Text style={{ backgroundColor: C.gold, color: C.navy, fontSize: 7, fontWeight: "bold", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 3, letterSpacing: 0.5 }}>{catLabel}</Text>
              </View>
              <Text style={{ color: C.white, fontSize: 18, fontWeight: "bold", lineHeight: 1.2 }}>{data.title}</Text>
              <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 9, marginTop: 3 }}>{data.address}</Text>
            </View>
          </View>
        )}

        {/* Key facts strip */}
        <View style={{ flexDirection: "row", borderBottom: `1px solid ${C.border}` }}>
          {[
            { label: "Pris", value: priceDisplay },
            { label: "Storlek", value: `${data.size} m²` },
            ...(pricePerSqm > 0 ? [{ label: `Kr/m²${data.type === "rent" ? "/mån" : ""}`, value: `${fmtNum(pricePerSqm)} kr` }] : []),
            { label: "Plats", value: data.city },
          ].map((f, i) => (
            <View key={i} style={{ flex: 1, paddingVertical: 10, paddingHorizontal: 10, alignItems: "center", borderRight: `1px solid ${C.border}` }}>
              <Text style={{ fontSize: 7, fontWeight: "bold", color: C.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 3 }}>{f.label}</Text>
              <Text style={{ fontSize: 14, fontWeight: "bold", color: C.navy }}>{f.value}</Text>
            </View>
          ))}
        </View>

        {/* Content */}
        <View style={{ paddingHorizontal: 36, paddingTop: 14 }}>

          {/* Gallery */}
          {galleryImgs.length > 0 && (
            <View style={{ marginBottom: 12 }}>
              {/* Render rows of 3 */}
              {Array.from({ length: Math.ceil(galleryImgs.length / 3) }).map((_, rowIdx) => (
                <View key={rowIdx} style={{ flexDirection: "row", gap: 6, marginBottom: rowIdx < Math.ceil(galleryImgs.length / 3) - 1 ? 6 : 0 }}>
                  {galleryImgs.slice(rowIdx * 3, rowIdx * 3 + 3).map((img, i) => (
                    <Image key={i} src={img} style={{ flex: 1, height: 85, objectFit: "cover", borderRadius: 4 }} />
                  ))}
                  {/* Fill empty slots so images don't stretch */}
                  {galleryImgs.slice(rowIdx * 3, rowIdx * 3 + 3).length < 3 &&
                    Array.from({ length: 3 - galleryImgs.slice(rowIdx * 3, rowIdx * 3 + 3).length }).map((_, i) => (
                      <View key={`empty-${i}`} style={{ flex: 1 }} />
                    ))
                  }
                </View>
              ))}
            </View>
          )}

          {/* Tags */}
          {data.tags.length > 0 && (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4, marginBottom: 12 }}>
              {data.tags.map((t, i) => (
                <Text key={i} style={{ fontSize: 8, fontWeight: "bold", color: C.navy, backgroundColor: C.muted, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, border: `1px solid ${C.border}` }}>{t}</Text>
              ))}
            </View>
          )}

          {/* Description */}
          <View style={{ marginBottom: 14 }}>
            <Text style={{ fontSize: 8, fontWeight: "bold", color: C.goldDark, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8, paddingBottom: 5, borderBottom: `2px solid ${C.gold}` }}>Om lokalen</Text>
            {descParagraphs.slice(0, 4).map((p, i) => (
              <Text key={i} style={{ fontSize: 9, lineHeight: 1.6, color: "#334155", marginBottom: 6 }}>{p}</Text>
            ))}
          </View>

          {/* Price comparison */}
          {pc && pc.medianPrice > 0 && (
            <View style={{ backgroundColor: C.muted, borderRadius: 8, padding: 14, marginBottom: 10, border: `1px solid ${C.border}` }}>
              <Text style={{ fontSize: 8, fontWeight: "bold", color: C.navy, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 3 }}>Prisjämförelse</Text>
              <Text style={{ fontSize: 7, color: C.textMuted, marginBottom: 12 }}>Kr/m²{data.type === "rent" ? " per månad" : ""} jämfört med {pc.count} liknande lokaler</Text>
              {[
                { label: "Denna lokal", value: pricePerSqm, color: C.gold },
                { label: "Medianpris", value: Math.round(pc.medianPrice), color: C.navy },
                { label: "Lägsta", value: Math.round(pc.minPrice), color: "#cbd5e1" },
                { label: "Högsta", value: Math.round(pc.maxPrice), color: "#cbd5e1" },
              ].map((bar, i) => {
                const maxVal = Math.max(pricePerSqm, pc.maxPrice) * 1.1;
                const pct = Math.min((bar.value / maxVal) * 100, 100);
                return (
                  <View key={i} style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
                    <Text style={{ width: 65, fontSize: 7, color: C.textMuted, textAlign: "right", marginRight: 8 }}>{bar.label}</Text>
                    <View style={{ flex: 1, height: 16, backgroundColor: "#f1f5f9", borderRadius: 4, overflow: "hidden" }}>
                      <View style={{ width: `${pct}%`, height: "100%", backgroundColor: bar.color, borderRadius: 4, justifyContent: "center", alignItems: "flex-end", paddingRight: 6, minWidth: 40 }}>
                        <Text style={{ fontSize: 7, fontWeight: "bold", color: bar.color === "#cbd5e1" ? C.textMuted : C.white }}>{fmtNum(bar.value)} kr</Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* Location score */}
          {nearby && (nearby.transit?.length || nearby.restaurants?.length || nearby.parking?.length) ? (
            <View style={{ backgroundColor: C.muted, borderRadius: 8, padding: 14, marginBottom: 10, border: `1px solid ${C.border}` }}>
              <Text style={{ fontSize: 8, fontWeight: "bold", color: C.navy, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 8 }}>Lägesanalys</Text>
              <View style={{ flexDirection: "row", gap: 10, marginBottom: 12 }}>
                {[
                  { icon: "🚇", label: "Kollektivtrafik", items: nearby.transit },
                  { icon: "🍽", label: "Restauranger", items: nearby.restaurants },
                  { icon: "🅿️", label: "Parkering", items: nearby.parking },
                ].filter(g => g.items && g.items.length > 0).map((g, i) => {
                  const score = Math.min(g.items!.length, 5);
                  return (
                    <View key={i} style={{ flex: 1, backgroundColor: C.white, borderRadius: 6, padding: 10, border: `1px solid ${C.border}` }}>
                      <Text style={{ fontSize: 14, marginBottom: 4 }}>{g.icon}</Text>
                      <Text style={{ fontSize: 7, fontWeight: "bold", color: C.navy, marginBottom: 4 }}>{g.label}</Text>
                      <View style={{ flexDirection: "row", gap: 3 }}>
                        {Array.from({ length: 5 }).map((_, di) => (
                          <View key={di} style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: di < score ? C.gold : C.border }} />
                        ))}
                      </View>
                      <Text style={{ fontSize: 7, fontWeight: "bold", color: C.navy, marginTop: 4 }}>{score}/5</Text>
                    </View>
                  );
                })}
              </View>
              {/* Nearby list */}
              <View style={{ flexDirection: "row", gap: 10 }}>
                {[
                  { title: "Hållplatser", items: nearby.transit },
                  { title: "Restauranger", items: nearby.restaurants },
                  { title: "Parkering", items: nearby.parking },
                ].filter(g => g.items && g.items.length > 0).map((g, i) => (
                  <View key={i} style={{ flex: 1 }}>
                    <Text style={{ fontSize: 7, fontWeight: "bold", color: C.navy, marginBottom: 4 }}>{g.title}</Text>
                    {g.items!.slice(0, 3).map((item, j) => (
                      <View key={j} style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 2 }}>
                        <Text style={{ fontSize: 7, color: C.text }}>{item.name}</Text>
                        <Text style={{ fontSize: 6, color: C.textMuted }}>{item.distance}</Text>
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {/* Demographics */}
          {demo && (
            <View style={{ backgroundColor: C.muted, borderRadius: 8, padding: 14, marginBottom: 10, border: `1px solid ${C.border}` }}>
              <Text style={{ fontSize: 8, fontWeight: "bold", color: C.navy, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 8 }}>Områdesstatistik – {demo.city}</Text>
              <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                {[
                  { icon: "👥", value: fmtNum(demo.population), label: "Invånare" },
                  ...(demo.medianIncome ? [{ icon: "💰", value: `${fmtNum(demo.medianIncome)} tkr/år`, label: "Medianinkomst" }] : []),
                  ...(demo.workingAgePercent ? [{ icon: "💼", value: `${demo.workingAgePercent}%`, label: "Arbetsför ålder" }] : []),
                  ...(demo.totalBusinesses ? [{ icon: "🏢", value: fmtNum(demo.totalBusinesses), label: "Företag" }] : []),
                  ...(demo.crimeRate ? [{ icon: "🛡️", value: fmtNum(demo.crimeRate), label: "Brott/100k inv." }] : []),
                ].map((card, i) => (
                  <View key={i} style={{ width: "30%", backgroundColor: C.white, borderRadius: 6, padding: 10, border: `1px solid ${C.border}`, alignItems: "center" }}>
                    <Text style={{ fontSize: 16, marginBottom: 3 }}>{card.icon}</Text>
                    <Text style={{ fontSize: 12, fontWeight: "bold", color: C.navy }}>{card.value}</Text>
                    <Text style={{ fontSize: 7, color: C.textMuted, marginTop: 2 }}>{card.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Contact */}
          <View style={{ backgroundColor: C.navy, borderRadius: 8, padding: 14, flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 10 }}>
            <Text style={{ color: C.gold, fontSize: 9, fontWeight: "bold" }}>KONTAKT</Text>
            <Text style={{ color: C.white, fontSize: 9, fontWeight: "bold" }}>{data.contact.name}</Text>
            <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 8 }}>{data.contact.email}{data.contact.phone ? ` · ${data.contact.phone}` : ""}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={{ backgroundColor: C.navy, paddingHorizontal: 36, paddingVertical: 12, flexDirection: "row", justifyContent: "space-between", marginTop: "auto" }}>
          <Text style={{ fontSize: 7, color: "rgba(255,255,255,0.35)" }}>Genererad via HittaYta.se · {new Date().toLocaleDateString("sv-SE")}</Text>
          <Text style={{ fontSize: 7, color: C.gold, fontWeight: "bold" }}>hittayta.se</Text>
        </View>
      </Page>
    </Document>
  );
}

export async function POST(req: NextRequest) {
  try {
    const data = (await req.json()) as PdfBody;

    // Read logo
    const fs = await import("fs");
    const path = await import("path");
    const logoPath = path.join(process.cwd(), "public", "HYlogo.png");
    let logoSrc = "";
    try {
      const buf = fs.readFileSync(logoPath);
      logoSrc = `data:image/png;base64,${buf.toString("base64")}`;
    } catch { /* no logo */ }

    // Resolve relative image URLs
    const origin = req.nextUrl.origin;
    data.imageUrls = (data.imageUrls || []).map(u => u?.startsWith("/") ? `${origin}${u}` : u);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buffer = await renderToBuffer(ListingPdf({ data, logoSrc }) as any);

    return new NextResponse(Buffer.from(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="annons-${data.title.slice(0, 30).replace(/[^a-zA-Z0-9åäöÅÄÖ ]/g, "").replace(/ /g, "-")}.pdf"`,
      },
    });
  } catch (err) {
    console.error("PDF generation error:", err);
    return NextResponse.json({ error: "Kunde inte generera PDF" }, { status: 500 });
  }
}
