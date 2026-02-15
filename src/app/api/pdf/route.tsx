import { NextRequest, NextResponse } from "next/server";
import React from "react";
import { renderToBuffer, Document, Page, View, Text, Image } from "@react-pdf/renderer";
import { formatPrice } from "@/lib/formatPrice";
import { getPresignedUrl, readFromDisk, existsOnDisk, isUsingS3 } from "@/lib/storage";
import path from "path";

export const maxDuration = 60;

/* ── Interfaces ── */
interface NearbyItem { name: string; distance: string }
interface NearbyData { transit?: NearbyItem[]; restaurants?: NearbyItem[]; parking?: NearbyItem[] }
interface PriceContext { medianPrice: number; count: number; minPrice: number; maxPrice: number }
interface DemographicsData {
  population: number; city: string; medianIncome?: number;
  workingAgePercent?: number; totalBusinesses?: number; crimeRate?: number;
}
interface WalkabilityData {
  walkScore: number; bikeScore: number;
  walkLabel: string; bikeLabel: string;
  cycleways: number; footways: number;
}
interface AreaContextData {
  summary: string; title: string; url: string;
}
interface PdfBody {
  title: string; description: string; address: string; city: string;
  type: "sale" | "rent"; category: string; price: number; size: number;
  tags: string[]; imageUrls: string[];
  contact: { name: string; email: string; phone: string };
  nearby?: NearbyData; priceContext?: PriceContext | null;
  demographics?: DemographicsData | null;
  walkability?: WalkabilityData | null;
  areaContext?: AreaContextData | null;
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
  bg: "#fafbfc",
};

/* ── Fetch image → base64 data URI ── */
async function imageToBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { redirect: "follow" });
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") || "image/jpeg";
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 100) return null;
    return `data:${ct};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

async function resolveImageToBase64(url: string, origin: string): Promise<string | null> {
  const fullUrl = url.startsWith("/") ? `${origin}${url}` : url;
  const uploadMatch = url.match(/\/api\/upload\/(.+?)(\?|$)/);
  if (uploadMatch) {
    const filename = path.basename(uploadMatch[1]);
    try {
      if (isUsingS3()) {
        const presignedUrl = await getPresignedUrl(filename);
        if (presignedUrl) return await imageToBase64(presignedUrl);
      } else {
        const exists = await existsOnDisk(filename);
        if (exists) {
          const buf = await readFromDisk(filename);
          const ext = path.extname(filename).toLowerCase();
          const mimeMap: Record<string, string> = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".gif": "image/gif", ".webp": "image/webp" };
          return `data:${mimeMap[ext] || "image/jpeg"};base64,${buf.toString("base64")}`;
        }
      }
    } catch (e) {
      console.error(`Direct storage read failed for ${filename}:`, e);
    }
  }
  return await imageToBase64(fullUrl);
}

/* ── Description parser: split agent text into 5 labeled sections ── */
interface DescSection { heading: string; body: string }

const SECTION_HEADINGS = [
  "Om lokalen",
  "Lokalen i detalj",
  "Läge & kommunikationer",
  "Område & omgivning",
  "Sammanfattning",
];

function parseDescription(text: string): DescSection[] {
  if (!text?.trim()) return [];

  // Try splitting on double newlines first
  let blocks = text.split(/\n\n+/).map(b => b.trim()).filter(Boolean);

  // If only 1 block, try splitting on single newlines
  if (blocks.length <= 1) {
    blocks = text.split(/\n/).map(b => b.trim()).filter(Boolean);
  }

  // If still 1 block, try splitting by sentences into ~5 chunks
  if (blocks.length <= 1 && text.length > 200) {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const chunkSize = Math.max(1, Math.ceil(sentences.length / 5));
    blocks = [];
    for (let i = 0; i < sentences.length; i += chunkSize) {
      blocks.push(sentences.slice(i, i + chunkSize).join(" ").trim());
    }
  }

  // Map blocks to sections with headings
  const sections: DescSection[] = [];
  for (let i = 0; i < blocks.length; i++) {
    const heading = i < SECTION_HEADINGS.length ? SECTION_HEADINGS[i] : "";
    // If we have more blocks than headings, merge extras into last section
    if (i >= SECTION_HEADINGS.length && sections.length > 0) {
      sections[sections.length - 1].body += "\n\n" + blocks[i];
    } else {
      sections.push({ heading, body: blocks[i] });
    }
  }

  return sections;
}

/* ── Shared components ── */
function GoldDivider() {
  return <View style={{ height: 2, backgroundColor: C.gold, marginVertical: 0 }} />;
}

function SectionHeading({ children }: { children: string }) {
  return (
    <View style={{ marginBottom: 8, paddingBottom: 4, borderBottom: `1.5px solid ${C.gold}` }}>
      <Text style={{ fontSize: 9, fontWeight: "bold", color: C.navy, letterSpacing: 1.2, textTransform: "uppercase" }}>{children}</Text>
    </View>
  );
}

function SubHeading({ children }: { children: string }) {
  return (
    <View style={{ marginBottom: 6, paddingBottom: 3, borderBottom: `0.5px solid ${C.border}` }}>
      <Text style={{ fontSize: 8, fontWeight: "bold", color: C.textMuted, letterSpacing: 0.8, textTransform: "uppercase" }}>{children}</Text>
    </View>
  );
}

function Header({ logoSrc }: { logoSrc: string }) {
  return (
    <View>
      <View style={{ backgroundColor: C.navy, paddingHorizontal: 36, paddingVertical: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        {logoSrc ? <Image src={logoSrc} style={{ height: 22 }} /> : <Text style={{ color: C.gold, fontSize: 13, fontWeight: "bold" }}>HittaYta.se</Text>}
        <Text style={{ color: C.gold, fontSize: 7, fontWeight: "bold", letterSpacing: 1.5 }}>KOMMERSIELLA LOKALER I SVERIGE</Text>
      </View>
      <GoldDivider />
    </View>
  );
}

function Footer() {
  return (
    <View style={{ backgroundColor: C.navy, paddingHorizontal: 36, paddingVertical: 10, flexDirection: "row", justifyContent: "space-between", marginTop: "auto" }}>
      <Text style={{ fontSize: 6, color: "rgba(255,255,255,0.35)" }}>Genererad via HittaYta.se · {new Date().toLocaleDateString("sv-SE")}</Text>
      <Text style={{ fontSize: 6, color: C.gold, fontWeight: "bold" }}>hittayta.se</Text>
    </View>
  );
}

/* ── PDF Document ── */
function WalkScoreBar({ score, label, sublabel, color }: { score: number; label: string; sublabel: string; color: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: C.muted, borderRadius: 6, padding: 12, border: `1px solid ${C.border}` }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <Text style={{ fontSize: 8, fontWeight: "bold", color: C.navy }}>{label}</Text>
        <Text style={{ fontSize: 14, fontWeight: "bold", color }}>{score}<Text style={{ fontSize: 7, color: C.textLight }}>/100</Text></Text>
      </View>
      <View style={{ height: 6, backgroundColor: C.border, borderRadius: 3, overflow: "hidden" }}>
        <View style={{ width: `${score}%`, height: "100%", backgroundColor: color, borderRadius: 3 }} />
      </View>
      <Text style={{ fontSize: 6.5, color: C.textMuted, marginTop: 4 }}>{sublabel}</Text>
    </View>
  );
}

function ListingPdf({ data, logoSrc, imageDataUris }: { data: PdfBody; logoSrc: string; imageDataUris: string[] }) {
  const priceDisplay = formatPrice(data.price, data.type);
  const pricePerSqm = data.size > 0 ? Math.round(data.price / data.size) : 0;
  const typeLabel = TYPE_LABELS[data.type] || data.type;
  const catLabel = fmtCats(data.category);
  const heroImg = imageDataUris[0] || null;
  const galleryImgs = imageDataUris.slice(1, 10);
  const descSections = parseDescription(data.description);
  const pc = data.priceContext;
  const demo = data.demographics;
  const nearby = data.nearby;
  const walk = data.walkability;
  const areaCtx = data.areaContext;
  const hasNearby = nearby && (nearby.transit?.length || nearby.restaurants?.length || nearby.parking?.length);

  return (
    <Document>
      {/* ═══════════════════════ PAGE 1: Hero + Facts + Description ═══════════════════════ */}
      <Page size="A4" style={{ fontFamily: "Helvetica", backgroundColor: C.white }}>
        <Header logoSrc={logoSrc} />

        {/* ── Hero ── */}
        <View style={{ backgroundColor: C.navy, position: "relative", minHeight: heroImg ? 200 : 80 }}>
          {heroImg && (
            <Image src={heroImg} style={{ width: "100%", height: 200, objectFit: "cover", opacity: 0.45 }} />
          )}
          <View style={{ position: heroImg ? "absolute" : "relative", bottom: 0, left: 0, right: 0, paddingHorizontal: 36, paddingVertical: heroImg ? 20 : 24 }}>
            <View style={{ flexDirection: "row", gap: 6, marginBottom: 8 }}>
              <Text style={{ backgroundColor: C.gold, color: C.navy, fontSize: 7.5, fontWeight: "bold", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 2, letterSpacing: 0.5 }}>{typeLabel}</Text>
              <Text style={{ backgroundColor: C.gold, color: C.navy, fontSize: 7.5, fontWeight: "bold", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 2, letterSpacing: 0.5 }}>{catLabel}</Text>
            </View>
            <Text style={{ color: C.white, fontSize: 18, fontWeight: "bold", lineHeight: 1.3 }}>{data.title}</Text>
            <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 9, marginTop: 4 }}>{data.address}</Text>
          </View>
        </View>

        {/* ── Key facts row ── */}
        <View style={{ flexDirection: "row", borderBottom: `1px solid ${C.border}` }}>
          {[
            { label: "PRIS", value: priceDisplay },
            { label: "STORLEK", value: `${data.size} m²` },
            ...(pricePerSqm > 0 ? [{ label: `KR/M²${data.type === "rent" ? " /MÅN" : ""}`, value: `${fmtNum(pricePerSqm)} kr` }] : []),
            { label: "PLATS", value: data.city },
          ].map((f, i) => (
            <View key={i} style={{ flex: 1, paddingVertical: 10, paddingHorizontal: 10, alignItems: "center", borderRight: i < 3 ? `1px solid ${C.border}` : undefined }}>
              <Text style={{ fontSize: 6, fontWeight: "bold", color: C.textMuted, letterSpacing: 1, marginBottom: 3 }}>{f.label}</Text>
              <Text style={{ fontSize: 13, fontWeight: "bold", color: C.navy }}>{f.value}</Text>
            </View>
          ))}
        </View>

        {/* ── Tags ── */}
        {data.tags.length > 0 && (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 5, paddingHorizontal: 36, paddingTop: 14, paddingBottom: 4 }}>
            {data.tags.map((t, i) => (
              <Text key={i} style={{ fontSize: 7, fontWeight: "bold", color: C.navy, backgroundColor: C.muted, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, border: `1px solid ${C.border}` }}>{t}</Text>
            ))}
          </View>
        )}

        {/* ── Description sections ── */}
        <View style={{ paddingHorizontal: 36, paddingTop: 18 }}>
          {descSections.slice(0, 3).map((section, si) => (
            <View key={si} style={{ marginBottom: 14 }}>
              {si === 0 ? (
                <SectionHeading>{section.heading}</SectionHeading>
              ) : (
                <SubHeading>{section.heading}</SubHeading>
              )}
              <Text style={{ fontSize: 8.5, lineHeight: 1.7, color: "#334155" }}>{section.body}</Text>
            </View>
          ))}
        </View>

        {/* ── Contact ── */}
        <View style={{ marginHorizontal: 36, backgroundColor: C.navy, borderRadius: 6, paddingVertical: 10, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 14, marginTop: "auto", marginBottom: 12 }}>
          <Text style={{ color: C.gold, fontSize: 7, fontWeight: "bold", letterSpacing: 1 }}>KONTAKT</Text>
          <Text style={{ color: C.white, fontSize: 8.5, fontWeight: "bold" }}>{data.contact.name}</Text>
          <Text style={{ color: "rgba(255,255,255,0.55)", fontSize: 7.5 }}>{data.contact.email}{data.contact.phone ? ` · ${data.contact.phone}` : ""}</Text>
        </View>

        <Footer />
      </Page>

      {/* ═══════════════════════ PAGE 2: Gallery + More Description + Data ═══════════════════════ */}
      {(galleryImgs.length > 0 || descSections.length > 3 || pc || hasNearby || demo) && (
        <Page size="A4" style={{ fontFamily: "Helvetica", backgroundColor: C.white }}>
          <Header logoSrc={logoSrc} />

          {/* ── Gallery ── */}
          {galleryImgs.length > 0 && (
            <View style={{ paddingHorizontal: 36, paddingTop: 20, paddingBottom: 8 }}>
              <SectionHeading>Bilder</SectionHeading>
              {Array.from({ length: Math.ceil(Math.min(galleryImgs.length, 9) / 3) }).map((_, rowIdx) => {
                const rowImgs = galleryImgs.slice(rowIdx * 3, rowIdx * 3 + 3);
                return (
                  <View key={rowIdx} style={{ flexDirection: "row", gap: 6, marginBottom: 6 }}>
                    {rowImgs.map((img, i) => (
                      <Image key={i} src={img} style={{ flex: 1, height: 100, objectFit: "cover", borderRadius: 4 }} />
                    ))}
                    {rowImgs.length < 3 && Array.from({ length: 3 - rowImgs.length }).map((_, i) => (
                      <View key={`e${i}`} style={{ flex: 1 }} />
                    ))}
                  </View>
                );
              })}
            </View>
          )}

          {/* ── Remaining description sections ── */}
          {descSections.length > 3 && (
            <View style={{ paddingHorizontal: 36, paddingTop: galleryImgs.length > 0 ? 10 : 20 }}>
              {descSections.slice(3).map((section, si) => (
                <View key={si} style={{ marginBottom: 14 }}>
                  {section.heading ? <SubHeading>{section.heading}</SubHeading> : null}
                  <Text style={{ fontSize: 8.5, lineHeight: 1.7, color: "#334155" }}>{section.body}</Text>
                </View>
              ))}
            </View>
          )}

          {/* ── Price comparison ── */}
          {pc && pc.medianPrice > 0 && (
            <View style={{ marginHorizontal: 36, marginTop: 10 }}>
              <SectionHeading>Prisjämförelse</SectionHeading>
              <View style={{ backgroundColor: C.muted, borderRadius: 6, padding: 14, border: `1px solid ${C.border}` }}>
                <Text style={{ fontSize: 7, color: C.textMuted, marginBottom: 10 }}>Kr/m²{data.type === "rent" ? " per månad" : ""} – baserat på {pc.count} liknande lokaler i området</Text>
                {[
                  { label: "Denna lokal", value: pricePerSqm, color: C.gold },
                  { label: "Medianpris", value: Math.round(pc.medianPrice), color: C.navy },
                  { label: "Lägsta", value: Math.round(pc.minPrice), color: "#94a3b8" },
                  { label: "Högsta", value: Math.round(pc.maxPrice), color: "#94a3b8" },
                ].map((bar, i) => {
                  const maxVal = Math.max(pricePerSqm, pc.maxPrice) * 1.15;
                  const pct = Math.min((bar.value / maxVal) * 100, 100);
                  return (
                    <View key={i} style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
                      <Text style={{ width: 60, fontSize: 7, color: C.textMuted, textAlign: "right", marginRight: 8 }}>{bar.label}</Text>
                      <View style={{ flex: 1, height: 16, backgroundColor: "#f1f5f9", borderRadius: 4, overflow: "hidden" }}>
                        <View style={{ width: `${pct}%`, height: "100%", backgroundColor: bar.color, borderRadius: 4, justifyContent: "center", alignItems: "flex-end", paddingRight: 6, minWidth: 40 }}>
                          <Text style={{ fontSize: 6.5, fontWeight: "bold", color: bar.color === "#94a3b8" ? C.text : C.white }}>{fmtNum(bar.value)} kr</Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* ── Location score ── */}
          {hasNearby ? (
            <View style={{ marginHorizontal: 36, marginTop: 14 }}>
              <SectionHeading>Lägesanalys</SectionHeading>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {[
                  { icon: "🚌", label: "Kollektivtrafik", items: nearby!.transit },
                  { icon: "🍽", label: "Restauranger", items: nearby!.restaurants },
                  { icon: "🅿️", label: "Parkering", items: nearby!.parking },
                ].filter(g => g.items && g.items.length > 0).map((g, i) => {
                  const score = Math.min(g.items!.length, 5);
                  return (
                    <View key={i} style={{ flex: 1, backgroundColor: C.muted, borderRadius: 6, padding: 10, border: `1px solid ${C.border}` }}>
                      <Text style={{ fontSize: 7.5, fontWeight: "bold", color: C.navy, marginBottom: 5 }}>{g.label}</Text>
                      <View style={{ flexDirection: "row", gap: 3, marginBottom: 6 }}>
                        {Array.from({ length: 5 }).map((_, di) => (
                          <View key={di} style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: di < score ? C.gold : C.border }} />
                        ))}
                        <Text style={{ fontSize: 7, fontWeight: "bold", color: C.navy, marginLeft: 4 }}>{score}/5</Text>
                      </View>
                      {g.items!.slice(0, 3).map((item, j) => (
                        <View key={j} style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 2 }}>
                          <Text style={{ fontSize: 6.5, color: C.text }}>{item.name}</Text>
                          <Text style={{ fontSize: 6, color: C.textMuted }}>{item.distance}</Text>
                        </View>
                      ))}
                    </View>
                  );
                })}
              </View>
            </View>
          ) : null}

          {/* ── Demographics ── */}
          {demo && (
            <View style={{ marginHorizontal: 36, marginTop: 14 }}>
              <SectionHeading>{`Områdesstatistik – ${demo.city}`}</SectionHeading>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {[
                  { value: fmtNum(demo.population), label: "Invånare", sub: "i kommunen" },
                  ...(demo.medianIncome ? [{ value: `${fmtNum(demo.medianIncome)} tkr`, label: "Medianinkomst", sub: "per år" }] : []),
                  ...(demo.workingAgePercent ? [{ value: `${demo.workingAgePercent}%`, label: "Arbetsför ålder", sub: "20–64 år" }] : []),
                  ...(demo.totalBusinesses ? [{ value: fmtNum(demo.totalBusinesses), label: "Företag", sub: "i kommunen" }] : []),
                ].map((card, i) => (
                  <View key={i} style={{ flex: 1, backgroundColor: C.muted, borderRadius: 6, padding: 12, border: `1px solid ${C.border}`, alignItems: "center" }}>
                    <Text style={{ fontSize: 16, fontWeight: "bold", color: C.navy }}>{card.value}</Text>
                    <Text style={{ fontSize: 7, fontWeight: "bold", color: C.textMuted, marginTop: 3 }}>{card.label}</Text>
                    <Text style={{ fontSize: 6, color: C.textLight, marginTop: 1 }}>{card.sub}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ── Walkability / Bikeability ── */}
          {walk && (walk.walkScore > 0 || walk.bikeScore > 0) && (
            <View style={{ marginHorizontal: 36, marginTop: 14 }}>
              <SectionHeading>Tillgänglighet</SectionHeading>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {walk.walkScore > 0 && (
                  <WalkScoreBar
                    score={walk.walkScore}
                    label="Gångvänlighet"
                    sublabel={`${walk.walkLabel} — ${walk.footways} gångvägar`}
                    color={walk.walkScore >= 70 ? "#10b981" : walk.walkScore >= 50 ? "#f59e0b" : "#ef4444"}
                  />
                )}
                {walk.bikeScore > 0 && (
                  <WalkScoreBar
                    score={walk.bikeScore}
                    label="Cykelvänlighet"
                    sublabel={`${walk.bikeLabel} — ${walk.cycleways} cykelvägar`}
                    color={walk.bikeScore >= 70 ? "#10b981" : walk.bikeScore >= 50 ? "#f59e0b" : "#ef4444"}
                  />
                )}
              </View>
            </View>
          )}

          {/* ── Area Context (Wikipedia) ── */}
          {areaCtx && (
            <View style={{ marginHorizontal: 36, marginTop: 14 }}>
              <SectionHeading>{`Om området – ${areaCtx.title}`}</SectionHeading>
              <View style={{ backgroundColor: C.muted, borderRadius: 6, padding: 14, border: `1px solid ${C.border}` }}>
                <Text style={{ fontSize: 8, lineHeight: 1.7, color: "#334155" }}>{areaCtx.summary}</Text>
                <Text style={{ fontSize: 6, color: C.textLight, marginTop: 6 }}>Källa: Wikipedia (sv.wikipedia.org)</Text>
              </View>
            </View>
          )}

          <Footer />
        </Page>
      )}
    </Document>
  );
}

export async function POST(req: NextRequest) {
  try {
    const data = (await req.json()) as PdfBody;

    // Read logo
    const fs = await import("fs");
    const pathMod = await import("path");
    const logoPath = pathMod.join(process.cwd(), "public", "HYlogo.png");
    let logoSrc = "";
    try {
      const buf = fs.readFileSync(logoPath);
      logoSrc = `data:image/png;base64,${buf.toString("base64")}`;
    } catch { /* no logo */ }

    // Resolve image URLs
    const origin = req.nextUrl.origin;
    const resolvedUrls = (data.imageUrls || []).filter(Boolean);

    // Pre-fetch all images and convert to base64 data URIs
    const imageDataUris: string[] = [];
    for (const url of resolvedUrls.slice(0, 10)) {
      try {
        const dataUri = await resolveImageToBase64(url, origin);
        if (dataUri) imageDataUris.push(dataUri);
      } catch (e) {
        console.error(`Failed to resolve image ${url}:`, e);
      }
    }

    console.log(`PDF: resolved ${imageDataUris.length}/${resolvedUrls.length} images`);

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
