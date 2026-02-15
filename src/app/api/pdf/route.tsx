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

const C = {
  navy: "#0a1628", navyLight: "#162240", gold: "#C9A96E", goldDark: "#B8955E",
  muted: "#f8fafc", border: "#e2e8f0", text: "#0a1628",
  textMuted: "#64748b", textLight: "#94a3b8", white: "#ffffff",
};

/* ── Fetch image → base64 data URI ── */
async function imageToBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { redirect: "follow" });
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") || "image/jpeg";
    const buf = Buffer.from(await res.arrayBuffer());
    return `data:${ct};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

/* ── PDF Document ── */
function ListingPdf({ data, logoSrc, imageDataUris }: { data: PdfBody; logoSrc: string; imageDataUris: string[] }) {
  const priceDisplay = formatPrice(data.price, data.type);
  const pricePerSqm = data.size > 0 ? Math.round(data.price / data.size) : 0;
  const typeLabel = TYPE_LABELS[data.type] || data.type;
  const catLabel = fmtCats(data.category);
  const heroImg = imageDataUris[0] || null;
  const galleryImgs = imageDataUris.slice(1);
  const descParagraphs = data.description.split(/\n\n+|\n/).filter(Boolean);
  const pc = data.priceContext;
  const demo = data.demographics;
  const nearby = data.nearby;

  return (
    <Document>
      <Page size="A4" style={{ fontFamily: "Helvetica", backgroundColor: C.white }}>

        {/* ── Header ── */}
        <View style={{ backgroundColor: C.navy, paddingHorizontal: 32, paddingVertical: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          {logoSrc ? <Image src={logoSrc} style={{ height: 20 }} /> : <Text style={{ color: C.gold, fontSize: 12, fontWeight: "bold" }}>HittaYta.se</Text>}
          <Text style={{ color: C.gold, fontSize: 7, fontWeight: "bold", letterSpacing: 1 }}>KOMMERSIELLA LOKALER I SVERIGE</Text>
        </View>
        <View style={{ height: 2, backgroundColor: C.gold }} />

        {/* ── Hero: navy background with optional image ── */}
        <View style={{ backgroundColor: C.navy, position: "relative" }}>
          {heroImg && (
            <Image src={heroImg} style={{ width: "100%", height: 180, objectFit: "cover", opacity: 0.5 }} />
          )}
          <View style={{ position: heroImg ? "absolute" : "relative", bottom: 0, left: 0, right: 0, paddingHorizontal: 32, paddingVertical: heroImg ? 16 : 20 }}>
            <View style={{ flexDirection: "row", gap: 5, marginBottom: 5 }}>
              <Text style={{ backgroundColor: C.gold, color: C.navy, fontSize: 7, fontWeight: "bold", paddingHorizontal: 7, paddingVertical: 2, borderRadius: 2, letterSpacing: 0.5 }}>{typeLabel}</Text>
              <Text style={{ backgroundColor: C.gold, color: C.navy, fontSize: 7, fontWeight: "bold", paddingHorizontal: 7, paddingVertical: 2, borderRadius: 2, letterSpacing: 0.5 }}>{catLabel}</Text>
            </View>
            <Text style={{ color: C.white, fontSize: 16, fontWeight: "bold", lineHeight: 1.25 }}>{data.title}</Text>
            <Text style={{ color: "rgba(255,255,255,0.55)", fontSize: 8, marginTop: 2 }}>{data.address}</Text>
          </View>
        </View>

        {/* ── Key facts ── */}
        <View style={{ flexDirection: "row", borderBottom: `1px solid ${C.border}` }}>
          {[
            { label: "Pris", value: priceDisplay },
            { label: "Storlek", value: `${data.size} m²` },
            ...(pricePerSqm > 0 ? [{ label: `Kr/m²${data.type === "rent" ? "/mån" : ""}`, value: `${fmtNum(pricePerSqm)} kr` }] : []),
            { label: "Plats", value: data.city },
          ].map((f, i) => (
            <View key={i} style={{ flex: 1, paddingVertical: 8, paddingHorizontal: 8, alignItems: "center", borderRight: `1px solid ${C.border}` }}>
              <Text style={{ fontSize: 6, fontWeight: "bold", color: C.textMuted, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 2 }}>{f.label}</Text>
              <Text style={{ fontSize: 12, fontWeight: "bold", color: C.navy }}>{f.value}</Text>
            </View>
          ))}
        </View>

        {/* ── Gallery (between facts and tags) ── */}
        {galleryImgs.length > 0 && (
          <View style={{ paddingHorizontal: 32, paddingTop: 10, paddingBottom: 4 }}>
            {Array.from({ length: Math.ceil(Math.min(galleryImgs.length, 6) / 3) }).map((_, rowIdx) => {
              const rowImgs = galleryImgs.slice(rowIdx * 3, rowIdx * 3 + 3);
              return (
                <View key={rowIdx} style={{ flexDirection: "row", gap: 5, marginBottom: 5 }}>
                  {rowImgs.map((img, i) => (
                    <Image key={i} src={img} style={{ flex: 1, height: 75, objectFit: "cover", borderRadius: 3 }} />
                  ))}
                  {rowImgs.length < 3 && Array.from({ length: 3 - rowImgs.length }).map((_, i) => (
                    <View key={`e${i}`} style={{ flex: 1 }} />
                  ))}
                </View>
              );
            })}
          </View>
        )}

        {/* ── Content ── */}
        <View style={{ paddingHorizontal: 32, paddingTop: galleryImgs.length > 0 ? 4 : 10 }}>

          {/* Tags */}
          {data.tags.length > 0 && (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
              {data.tags.map((t, i) => (
                <Text key={i} style={{ fontSize: 7, fontWeight: "bold", color: C.navy, backgroundColor: C.muted, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8, border: `1px solid ${C.border}` }}>{t}</Text>
              ))}
            </View>
          )}

          {/* Description */}
          <View style={{ marginBottom: 10 }}>
            <Text style={{ fontSize: 7, fontWeight: "bold", color: C.goldDark, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 6, paddingBottom: 4, borderBottom: `2px solid ${C.gold}` }}>Om lokalen</Text>
            {descParagraphs.slice(0, 5).map((p, i) => (
              <Text key={i} style={{ fontSize: 8, lineHeight: 1.55, color: "#334155", marginBottom: 4 }}>{p}</Text>
            ))}
          </View>

          {/* Price comparison */}
          {pc && pc.medianPrice > 0 && (
            <View style={{ backgroundColor: C.muted, borderRadius: 6, padding: 10, marginBottom: 8, border: `1px solid ${C.border}` }}>
              <Text style={{ fontSize: 7, fontWeight: "bold", color: C.navy, letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 2 }}>Prisjämförelse</Text>
              <Text style={{ fontSize: 6, color: C.textMuted, marginBottom: 8 }}>Kr/m²{data.type === "rent" ? " per månad" : ""} – {pc.count} liknande lokaler</Text>
              {[
                { label: "Denna lokal", value: pricePerSqm, color: C.gold },
                { label: "Medianpris", value: Math.round(pc.medianPrice), color: C.navy },
                { label: "Lägsta", value: Math.round(pc.minPrice), color: "#cbd5e1" },
                { label: "Högsta", value: Math.round(pc.maxPrice), color: "#cbd5e1" },
              ].map((bar, i) => {
                const maxVal = Math.max(pricePerSqm, pc.maxPrice) * 1.15;
                const pct = Math.min((bar.value / maxVal) * 100, 100);
                return (
                  <View key={i} style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                    <Text style={{ width: 55, fontSize: 6, color: C.textMuted, textAlign: "right", marginRight: 6 }}>{bar.label}</Text>
                    <View style={{ flex: 1, height: 12, backgroundColor: "#f1f5f9", borderRadius: 3, overflow: "hidden" }}>
                      <View style={{ width: `${pct}%`, height: "100%", backgroundColor: bar.color, borderRadius: 3, justifyContent: "center", alignItems: "flex-end", paddingRight: 4, minWidth: 35 }}>
                        <Text style={{ fontSize: 6, fontWeight: "bold", color: bar.color === "#cbd5e1" ? C.textMuted : C.white }}>{fmtNum(bar.value)} kr</Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* Location score */}
          {nearby && (nearby.transit?.length || nearby.restaurants?.length || nearby.parking?.length) ? (
            <View style={{ backgroundColor: C.muted, borderRadius: 6, padding: 10, marginBottom: 8, border: `1px solid ${C.border}` }}>
              <Text style={{ fontSize: 7, fontWeight: "bold", color: C.navy, letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 6 }}>Lägesanalys</Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {[
                  { icon: "🚇", label: "Kollektivtrafik", items: nearby.transit },
                  { icon: "🍽", label: "Restauranger", items: nearby.restaurants },
                  { icon: "🅿️", label: "Parkering", items: nearby.parking },
                ].filter(g => g.items && g.items.length > 0).map((g, i) => {
                  const score = Math.min(g.items!.length, 5);
                  return (
                    <View key={i} style={{ flex: 1, backgroundColor: C.white, borderRadius: 4, padding: 8, border: `1px solid ${C.border}` }}>
                      <Text style={{ fontSize: 6, fontWeight: "bold", color: C.navy, marginBottom: 3 }}>{g.icon} {g.label}</Text>
                      <View style={{ flexDirection: "row", gap: 2, marginBottom: 4 }}>
                        {Array.from({ length: 5 }).map((_, di) => (
                          <View key={di} style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: di < score ? C.gold : C.border }} />
                        ))}
                        <Text style={{ fontSize: 6, fontWeight: "bold", color: C.navy, marginLeft: 3 }}>{score}/5</Text>
                      </View>
                      {g.items!.slice(0, 2).map((item, j) => (
                        <View key={j} style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 1 }}>
                          <Text style={{ fontSize: 5.5, color: C.text }}>{item.name}</Text>
                          <Text style={{ fontSize: 5, color: C.textMuted }}>{item.distance}</Text>
                        </View>
                      ))}
                    </View>
                  );
                })}
              </View>
            </View>
          ) : null}

          {/* Demographics */}
          {demo && (
            <View style={{ backgroundColor: C.muted, borderRadius: 6, padding: 10, marginBottom: 8, border: `1px solid ${C.border}` }}>
              <Text style={{ fontSize: 7, fontWeight: "bold", color: C.navy, letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 6 }}>Områdesstatistik – {demo.city}</Text>
              <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
                {[
                  { icon: "👥", value: fmtNum(demo.population), label: "Invånare" },
                  ...(demo.medianIncome ? [{ icon: "💰", value: `${fmtNum(demo.medianIncome)} tkr`, label: "Medianinkomst" }] : []),
                  ...(demo.workingAgePercent ? [{ icon: "💼", value: `${demo.workingAgePercent}%`, label: "Arbetsför ålder" }] : []),
                  ...(demo.totalBusinesses ? [{ icon: "🏢", value: fmtNum(demo.totalBusinesses), label: "Företag" }] : []),
                ].map((card, i) => (
                  <View key={i} style={{ width: "22%", backgroundColor: C.white, borderRadius: 4, padding: 6, border: `1px solid ${C.border}`, alignItems: "center" }}>
                    <Text style={{ fontSize: 10, fontWeight: "bold", color: C.navy }}>{card.value}</Text>
                    <Text style={{ fontSize: 5.5, color: C.textMuted, marginTop: 1 }}>{card.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Contact */}
          <View style={{ backgroundColor: C.navy, borderRadius: 6, paddingVertical: 8, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 12 }}>
            <Text style={{ color: C.gold, fontSize: 7, fontWeight: "bold" }}>KONTAKT</Text>
            <Text style={{ color: C.white, fontSize: 8, fontWeight: "bold" }}>{data.contact.name}</Text>
            <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 7 }}>{data.contact.email}{data.contact.phone ? ` · ${data.contact.phone}` : ""}</Text>
          </View>
        </View>

        {/* ── Footer ── */}
        <View style={{ backgroundColor: C.navy, paddingHorizontal: 32, paddingVertical: 10, flexDirection: "row", justifyContent: "space-between", marginTop: "auto" }}>
          <Text style={{ fontSize: 6, color: "rgba(255,255,255,0.3)" }}>Genererad via HittaYta.se · {new Date().toLocaleDateString("sv-SE")}</Text>
          <Text style={{ fontSize: 6, color: C.gold, fontWeight: "bold" }}>hittayta.se</Text>
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

    // Resolve relative image URLs to absolute
    const origin = req.nextUrl.origin;
    const resolvedUrls = (data.imageUrls || []).map(u => u?.startsWith("/") ? `${origin}${u}` : u).filter(Boolean);

    // Pre-fetch all images and convert to base64 data URIs
    // This is critical because @react-pdf/renderer can't follow redirects (S3 presigned URLs)
    const imageDataUris: string[] = [];
    for (const url of resolvedUrls.slice(0, 8)) {
      const dataUri = await imageToBase64(url);
      if (dataUri) imageDataUris.push(dataUri);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buffer = await renderToBuffer(ListingPdf({ data, logoSrc, imageDataUris }) as any);

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
