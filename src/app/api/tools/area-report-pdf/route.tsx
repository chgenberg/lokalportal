import { NextRequest, NextResponse } from "next/server";
import React from "react";
import { renderToBuffer, Document, Page, View, Text } from "@react-pdf/renderer";
import { checkRateLimit, getClientKey } from "@/lib/rateLimit";

export const maxDuration = 60;

interface DemographicsData {
  population: number;
  city: string;
  medianIncome?: number;
  workingAgePercent?: number;
  totalBusinesses?: number;
  crimeRate?: number;
}

interface NearbyData {
  restaurants: number;
  shops: number;
  gyms: number;
  busStops: { count: number; nearest?: string; nearestDistance?: number };
  trainStations: { count: number; nearest?: string; nearestDistance?: number };
  parking: number;
  schools: number;
  healthcare: number;
}

interface PriceContext {
  medianPrice: number;
  count: number;
  minPrice: number;
  maxPrice: number;
}

interface AreaContext {
  summary: string;
  title: string;
  url: string;
}

interface ReportBody {
  address: string;
  city: string;
  demographics: DemographicsData | null;
  nearby: NearbyData | null;
  areaContext: AreaContext | null;
  priceContext: { rent: PriceContext | null; sale: PriceContext | null };
  aiAnalysis: string;
}

function fmtNum(n: number) { return n.toLocaleString("sv-SE"); }

const C = {
  navy: "#0a1628",
  navyLight: "#162240",
  gold: "#C9A96E",
  muted: "#f8fafc",
  border: "#e2e8f0",
  text: "#0a1628",
  textMuted: "#64748b",
  textLight: "#94a3b8",
  white: "#ffffff",
  bg: "#fafbfc",
};

function AreaReportPdf({ data }: { data: ReportBody }) {
  const { address, city, demographics, nearby, areaContext, priceContext, aiAnalysis } = data;
  const today = new Date().toLocaleDateString("sv-SE", { year: "numeric", month: "long", day: "numeric" });

  return (
    <Document>
      {/* Page 1: Cover + Demographics */}
      <Page size="A4" style={{ backgroundColor: C.bg, fontFamily: "Helvetica", padding: 0 }}>
        {/* Header */}
        <View style={{ backgroundColor: C.navy, padding: 40, paddingBottom: 30 }}>
          <Text style={{ fontSize: 9, color: C.gold, letterSpacing: 3, marginBottom: 8 }}>OMRÅDESRAPPORT</Text>
          <Text style={{ fontSize: 22, color: C.white, fontFamily: "Helvetica-Bold", marginBottom: 6 }}>{address}</Text>
          <Text style={{ fontSize: 11, color: C.textLight }}>{city} &middot; {today}</Text>
        </View>

        <View style={{ padding: 32 }}>
          {/* AI Analysis */}
          {aiAnalysis && (
            <View style={{ marginBottom: 24 }}>
              <Text style={{ fontSize: 13, fontFamily: "Helvetica-Bold", color: C.navy, marginBottom: 10 }}>Sammanfattning</Text>
              {aiAnalysis.split("\n").filter(Boolean).map((line, i) => {
                const isHeading = /^(#{1,3}\s|[A-ZÅÄÖ][A-ZÅÄÖ\s&]+$)/.test(line.trim());
                if (isHeading) {
                  return <Text key={i} style={{ fontSize: 11, fontFamily: "Helvetica-Bold", color: C.navy, marginTop: 10, marginBottom: 4 }}>{line.replace(/^#+\s*/, "")}</Text>;
                }
                return <Text key={i} style={{ fontSize: 9, color: C.textMuted, lineHeight: 1.6, marginBottom: 4 }}>{line}</Text>;
              })}
            </View>
          )}

          {/* Demographics */}
          {demographics && (
            <View style={{ marginBottom: 24 }}>
              <Text style={{ fontSize: 13, fontFamily: "Helvetica-Bold", color: C.navy, marginBottom: 12 }}>Demografi &amp; Ekonomi</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                <StatCard label="Befolkning" value={fmtNum(demographics.population)} />
                {demographics.medianIncome != null && <StatCard label="Medianinkomst" value={`${fmtNum(demographics.medianIncome)} tkr/år`} />}
                {demographics.workingAgePercent != null && <StatCard label="Arbetsför befolkning" value={`${demographics.workingAgePercent}%`} />}
                {demographics.totalBusinesses != null && <StatCard label="Antal företag" value={fmtNum(demographics.totalBusinesses)} />}
                {demographics.crimeRate != null && <StatCard label="Brott/100 000 inv." value={fmtNum(demographics.crimeRate)} />}
              </View>
            </View>
          )}

          {/* Area context */}
          {areaContext && (
            <View style={{ marginBottom: 24, backgroundColor: C.muted, borderRadius: 8, padding: 16 }}>
              <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold", color: C.navy, marginBottom: 6 }}>{areaContext.title}</Text>
              <Text style={{ fontSize: 9, color: C.textMuted, lineHeight: 1.6 }}>{areaContext.summary}</Text>
              <Text style={{ fontSize: 8, color: C.textLight, marginTop: 6 }}>Källa: Wikipedia</Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={{ position: "absolute", bottom: 20, left: 32, right: 32, flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={{ fontSize: 7, color: C.textLight }}>HittaYta.se – Områdesrapport</Text>
          <Text style={{ fontSize: 7, color: C.textLight }}>Sida 1</Text>
        </View>
      </Page>

      {/* Page 2: Nearby + Market */}
      <Page size="A4" style={{ backgroundColor: C.bg, fontFamily: "Helvetica", padding: 32 }}>
        {/* Nearby amenities */}
        {nearby && (
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 13, fontFamily: "Helvetica-Bold", color: C.navy, marginBottom: 12 }}>Infrastruktur &amp; Tillgänglighet</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              <StatCard label="Restauranger" value={String(nearby.restaurants)} />
              <StatCard label="Butiker" value={String(nearby.shops)} />
              <StatCard label="Gym" value={String(nearby.gyms)} />
              <StatCard label="Busshållplatser" value={String(nearby.busStops.count)} sub={nearby.busStops.nearest ? `Närmaste: ${nearby.busStops.nearest}` : undefined} />
              <StatCard label="Tågstationer" value={String(nearby.trainStations.count)} sub={nearby.trainStations.nearest ? `Närmaste: ${nearby.trainStations.nearest}` : undefined} />
              <StatCard label="Parkering" value={String(nearby.parking)} />
              <StatCard label="Skolor" value={String(nearby.schools)} />
              <StatCard label="Sjukvård" value={String(nearby.healthcare)} />
            </View>
          </View>
        )}

        {/* Price context */}
        {(priceContext.rent || priceContext.sale) && (
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 13, fontFamily: "Helvetica-Bold", color: C.navy, marginBottom: 12 }}>Marknad &amp; Priser</Text>
            {priceContext.rent && (
              <View style={{ backgroundColor: C.muted, borderRadius: 8, padding: 16, marginBottom: 8 }}>
                <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", color: C.navy, marginBottom: 6 }}>Hyresmarknaden (kontor)</Text>
                <View style={{ flexDirection: "row", gap: 16 }}>
                  <View>
                    <Text style={{ fontSize: 8, color: C.textLight }}>Median</Text>
                    <Text style={{ fontSize: 12, fontFamily: "Helvetica-Bold", color: C.navy }}>{fmtNum(priceContext.rent.medianPrice)} kr/mån</Text>
                  </View>
                  <View>
                    <Text style={{ fontSize: 8, color: C.textLight }}>Intervall</Text>
                    <Text style={{ fontSize: 10, color: C.textMuted }}>{fmtNum(priceContext.rent.minPrice)} – {fmtNum(priceContext.rent.maxPrice)} kr/mån</Text>
                  </View>
                  <View>
                    <Text style={{ fontSize: 8, color: C.textLight }}>Antal objekt</Text>
                    <Text style={{ fontSize: 10, color: C.textMuted }}>{priceContext.rent.count}</Text>
                  </View>
                </View>
              </View>
            )}
            {priceContext.sale && (
              <View style={{ backgroundColor: C.muted, borderRadius: 8, padding: 16 }}>
                <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", color: C.navy, marginBottom: 6 }}>Köpmarknaden (kontor)</Text>
                <View style={{ flexDirection: "row", gap: 16 }}>
                  <View>
                    <Text style={{ fontSize: 8, color: C.textLight }}>Median</Text>
                    <Text style={{ fontSize: 12, fontFamily: "Helvetica-Bold", color: C.navy }}>{fmtNum(priceContext.sale.medianPrice)} kr</Text>
                  </View>
                  <View>
                    <Text style={{ fontSize: 8, color: C.textLight }}>Intervall</Text>
                    <Text style={{ fontSize: 10, color: C.textMuted }}>{fmtNum(priceContext.sale.minPrice)} – {fmtNum(priceContext.sale.maxPrice)} kr</Text>
                  </View>
                  <View>
                    <Text style={{ fontSize: 8, color: C.textLight }}>Antal objekt</Text>
                    <Text style={{ fontSize: 10, color: C.textMuted }}>{priceContext.sale.count}</Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Disclaimer */}
        <View style={{ backgroundColor: C.muted, borderRadius: 8, padding: 16, marginTop: "auto" }}>
          <Text style={{ fontSize: 8, color: C.textLight, lineHeight: 1.6 }}>
            Denna rapport är genererad automatiskt baserat på offentliga datakällor (SCB, BRÅ, OpenStreetMap, Wikipedia) och tillgängliga annonser på HittaYta.se. Informationen är avsedd som vägledning och utgör inte professionell rådgivning. Kontakta en fastighetsmäklare för specifik rådgivning.
          </Text>
        </View>

        {/* Footer */}
        <View style={{ position: "absolute", bottom: 20, left: 32, right: 32, flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={{ fontSize: 7, color: C.textLight }}>HittaYta.se – Områdesrapport</Text>
          <Text style={{ fontSize: 7, color: C.textLight }}>Sida 2</Text>
        </View>
      </Page>
    </Document>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <View style={{ backgroundColor: C.white, borderRadius: 8, border: `1px solid ${C.border}`, padding: 12, width: "30%", minWidth: 120 }}>
      <Text style={{ fontSize: 8, color: C.textLight, marginBottom: 4 }}>{label}</Text>
      <Text style={{ fontSize: 14, fontFamily: "Helvetica-Bold", color: C.navy }}>{value}</Text>
      {sub && <Text style={{ fontSize: 7, color: C.textLight, marginTop: 2 }}>{sub}</Text>}
    </View>
  );
}

export async function POST(req: NextRequest) {
  const rateKey = `area-report-pdf:${getClientKey(req)}`;
  const { limited } = checkRateLimit(rateKey, 4);
  if (limited) {
    return NextResponse.json({ error: "För många förfrågningar" }, { status: 429 });
  }

  let body: ReportBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ogiltig JSON" }, { status: 400 });
  }

  if (!body.address || !body.city) {
    return NextResponse.json({ error: "Adress och stad krävs" }, { status: 400 });
  }

  try {
    const buffer = await renderToBuffer(<AreaReportPdf data={body} />);
    const uint8 = new Uint8Array(buffer);

    return new NextResponse(uint8, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="omradesrapport-${body.city.toLowerCase().replace(/\s+/g, "-")}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[area-report-pdf] Error:", err);
    return NextResponse.json({ error: "Kunde inte generera PDF" }, { status: 500 });
  }
}
