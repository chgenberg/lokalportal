import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer";
import { formatPrice } from "@/lib/formatPrice";

export const maxDuration = 60;

interface NearbyItem { name: string; distance: string }
interface NearbyData {
  transit?: NearbyItem[];
  restaurants?: NearbyItem[];
  parking?: NearbyItem[];
}
interface PriceContext {
  medianPrice: number;
  count: number;
  minPrice: number;
  maxPrice: number;
}
interface DemographicsData {
  population: number;
  city: string;
  medianIncome?: number;
  workingAgePercent?: number;
  totalBusinesses?: number;
  crimeRate?: number;
}

interface PdfBody {
  title: string;
  description: string;
  address: string;
  city: string;
  type: "sale" | "rent";
  category: string;
  price: number;
  size: number;
  tags: string[];
  imageUrls: string[];
  contact: { name: string; email: string; phone: string };
  listingUrl?: string;
  nearby?: NearbyData;
  priceContext?: PriceContext | null;
  demographics?: DemographicsData | null;
}

const TYPE_LABELS: Record<string, string> = { sale: "Säljes", rent: "Uthyres" };
const CATEGORY_LABELS: Record<string, string> = {
  butik: "Butik", kontor: "Kontor", lager: "Lager", restaurang: "Restaurang",
  verkstad: "Verkstad", showroom: "Showroom", popup: "Pop-up", atelje: "Ateljé",
  gym: "Gym/Studio", ovrigt: "Övrigt",
};

function esc(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function formatCats(cat: string): string {
  return cat.split(",").map((c) => CATEGORY_LABELS[c.trim()] || c.trim()).filter(Boolean).join(" · ");
}

function fmtNum(n: number): string {
  return n.toLocaleString("sv-SE");
}

/* ── Build chart sections ── */

function buildPriceChart(data: PdfBody): string {
  const pc = data.priceContext;
  if (!pc || !pc.medianPrice) return "";

  const thisPrice = data.size > 0 ? Math.round(data.price / data.size) : data.price;
  const median = Math.round(pc.medianPrice);
  const min = Math.round(pc.minPrice);
  const max = Math.round(pc.maxPrice);
  const chartMax = Math.max(thisPrice, max) * 1.15;

  const thisPct = Math.min((thisPrice / chartMax) * 100, 100);
  const medianPct = Math.min((median / chartMax) * 100, 100);
  const minPct = Math.min((min / chartMax) * 100, 100);
  const maxPct = Math.min((max / chartMax) * 100, 100);

  const diff = median > 0 ? Math.round(((thisPrice - median) / median) * 100) : 0;
  const diffLabel = diff > 0 ? `+${diff}% över snitt` : diff < 0 ? `${diff}% under snitt` : "Samma som snitt";
  const diffColor = diff <= 0 ? "#22c55e" : diff <= 15 ? "#C9A96E" : "#ef4444";

  return `
  <div class="chart-section">
    <div class="chart-header">
      <h3>Prisjämförelse</h3>
      <span class="chart-badge" style="background:${diffColor}15;color:${diffColor};border:1px solid ${diffColor}30">${diffLabel}</span>
    </div>
    <div class="chart-subtitle">Kr/m²${data.type === "rent" ? " per månad" : ""} jämfört med ${pc.count} liknande lokaler i området</div>
    <div class="bar-chart">
      <div class="bar-row">
        <div class="bar-label">Denna lokal</div>
        <div class="bar-track">
          <div class="bar-fill bar-gold" style="width:${thisPct}%">
            <span class="bar-value">${fmtNum(thisPrice)} kr</span>
          </div>
        </div>
      </div>
      <div class="bar-row">
        <div class="bar-label">Medianpris</div>
        <div class="bar-track">
          <div class="bar-fill bar-navy" style="width:${medianPct}%">
            <span class="bar-value">${fmtNum(median)} kr</span>
          </div>
        </div>
      </div>
      <div class="bar-row">
        <div class="bar-label">Lägsta</div>
        <div class="bar-track">
          <div class="bar-fill bar-light" style="width:${minPct}%">
            <span class="bar-value">${fmtNum(min)} kr</span>
          </div>
        </div>
      </div>
      <div class="bar-row">
        <div class="bar-label">Högsta</div>
        <div class="bar-track">
          <div class="bar-fill bar-light" style="width:${maxPct}%">
            <span class="bar-value">${fmtNum(max)} kr</span>
          </div>
        </div>
      </div>
    </div>
  </div>`;
}

function buildLocationScore(data: PdfBody): string {
  const n = data.nearby;
  if (!n) return "";

  const transitCount = n.transit?.length || 0;
  const restaurantCount = n.restaurants?.length || 0;
  const parkingCount = n.parking?.length || 0;

  if (transitCount === 0 && restaurantCount === 0 && parkingCount === 0) return "";

  // Score 0-5 based on count of nearby amenities
  const transitScore = Math.min(transitCount, 5);
  const foodScore = Math.min(restaurantCount, 5);
  const parkingScore = Math.min(parkingCount, 5);
  const totalScore = Math.round(((transitScore + foodScore + parkingScore) / 15) * 100);

  const buildDots = (score: number, label: string, icon: string) => {
    const dots = Array.from({ length: 5 }, (_, i) =>
      `<div class="score-dot ${i < score ? "score-dot-active" : ""}"></div>`
    ).join("");
    return `<div class="score-item">
      <div class="score-icon">${icon}</div>
      <div class="score-details">
        <div class="score-name">${label}</div>
        <div class="score-dots">${dots}</div>
      </div>
      <div class="score-num">${score}/5</div>
    </div>`;
  };

  const nearbyList = (items: NearbyItem[] | undefined, max: number) => {
    if (!items || items.length === 0) return "";
    return `<div class="nearby-list">${items.slice(0, max).map((t) =>
      `<div class="nearby-item"><span class="nearby-name">${esc(t.name)}</span><span class="nearby-dist">${esc(t.distance)}</span></div>`
    ).join("")}</div>`;
  };

  return `
  <div class="chart-section">
    <div class="chart-header">
      <h3>Lägesanalys</h3>
      <div class="location-total">
        <svg width="36" height="36" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="16" fill="none" stroke="#e2e8f0" stroke-width="3"/>
          <circle cx="18" cy="18" r="16" fill="none" stroke="#C9A96E" stroke-width="3"
            stroke-dasharray="${totalScore} ${100 - totalScore}"
            stroke-dashoffset="25" stroke-linecap="round"/>
        </svg>
        <span class="location-total-num">${totalScore}%</span>
      </div>
    </div>
    <div class="score-grid">
      ${buildDots(transitScore, "Kollektivtrafik", "🚇")}
      ${buildDots(foodScore, "Restauranger & service", "🍽")}
      ${buildDots(parkingScore, "Parkering", "🅿️")}
    </div>
    <div class="nearby-columns">
      ${n.transit && n.transit.length > 0 ? `<div class="nearby-col"><h4>Närmaste hållplatser</h4>${nearbyList(n.transit, 3)}</div>` : ""}
      ${n.restaurants && n.restaurants.length > 0 ? `<div class="nearby-col"><h4>Restauranger</h4>${nearbyList(n.restaurants, 3)}</div>` : ""}
      ${n.parking && n.parking.length > 0 ? `<div class="nearby-col"><h4>Parkering</h4>${nearbyList(n.parking, 3)}</div>` : ""}
    </div>
  </div>`;
}

function buildDemographics(data: PdfBody): string {
  const d = data.demographics;
  if (!d) return "";

  const cards: string[] = [];

  // Population
  cards.push(`
    <div class="demo-card">
      <div class="demo-icon">👥</div>
      <div class="demo-value">${fmtNum(d.population)}</div>
      <div class="demo-label">Invånare</div>
      <div class="demo-sub">${esc(d.city)}</div>
    </div>`);

  // Median income
  if (d.medianIncome) {
    const incomeBar = Math.min((d.medianIncome / 500) * 100, 100); // 500 tkr as reference max
    cards.push(`
    <div class="demo-card">
      <div class="demo-icon">💰</div>
      <div class="demo-value">${fmtNum(d.medianIncome)} <small>tkr/år</small></div>
      <div class="demo-label">Medianinkomst</div>
      <div class="demo-bar-track"><div class="demo-bar-fill" style="width:${incomeBar}%"></div></div>
    </div>`);
  }

  // Working age
  if (d.workingAgePercent) {
    cards.push(`
    <div class="demo-card">
      <div class="demo-icon">💼</div>
      <div class="demo-value">${d.workingAgePercent}%</div>
      <div class="demo-label">Arbetsför ålder (20–64)</div>
      <div class="demo-bar-track"><div class="demo-bar-fill" style="width:${d.workingAgePercent}%"></div></div>
    </div>`);
  }

  // Businesses
  if (d.totalBusinesses) {
    cards.push(`
    <div class="demo-card">
      <div class="demo-icon">🏢</div>
      <div class="demo-value">${fmtNum(d.totalBusinesses)}</div>
      <div class="demo-label">Registrerade företag</div>
      <div class="demo-sub">I kommunen</div>
    </div>`);
  }

  // Crime rate
  if (d.crimeRate) {
    const crimeColor = d.crimeRate < 10000 ? "#22c55e" : d.crimeRate < 15000 ? "#C9A96E" : "#ef4444";
    cards.push(`
    <div class="demo-card">
      <div class="demo-icon">🛡️</div>
      <div class="demo-value" style="color:${crimeColor}">${fmtNum(d.crimeRate)}</div>
      <div class="demo-label">Brott/100 000 inv.</div>
      <div class="demo-sub">${d.crimeRate < 10000 ? "Låg nivå" : d.crimeRate < 15000 ? "Medel" : "Hög nivå"}</div>
    </div>`);
  }

  if (cards.length === 0) return "";

  return `
  <div class="chart-section">
    <div class="chart-header">
      <h3>Områdesstatistik – ${esc(d.city)}</h3>
    </div>
    <div class="demo-grid">${cards.join("")}</div>
  </div>`;
}

/* ── Main HTML builder ── */

function buildHtml(data: PdfBody, logoBase64: string): string {
  const priceDisplay = formatPrice(data.price, data.type);
  const pricePerSqm = data.size > 0 ? Math.round(data.price / data.size) : 0;
  const typeLabel = TYPE_LABELS[data.type] || data.type;
  const catLabel = formatCats(data.category);
  const images = (data.imageUrls || []).slice(0, 6);
  const descParagraphs = data.description.split(/\n\n|\n/).filter(Boolean);

  const heroImg = images[0] || "";
  const galleryImgs = images.slice(1);

  const priceChartHtml = buildPriceChart(data);
  const locationScoreHtml = buildLocationScore(data);
  const demographicsHtml = buildDemographics(data);
  const hasDataSection = priceChartHtml || locationScoreHtml || demographicsHtml;

  return `<!DOCTYPE html>
<html lang="sv">
<head>
<meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  :root {
    --navy: #0a1628;
    --navy-light: #162240;
    --gold: #C9A96E;
    --gold-dark: #B8955E;
    --gold-light: #d4bc8a;
    --muted: #f8fafc;
    --border: #e2e8f0;
    --text: #0a1628;
    --text-muted: #64748b;
    --text-light: #94a3b8;
    --green: #22c55e;
  }

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    color: var(--text);
    background: white;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .page {
    width: 210mm;
    padding: 0;
    position: relative;
  }

  /* ── Header ── */
  .header {
    background: var(--navy);
    padding: 20px 40px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .header img { height: 28px; }
  .header-right {
    color: var(--gold);
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.06em;
  }

  /* ── Gold accent line ── */
  .gold-line {
    height: 3px;
    background: linear-gradient(90deg, var(--gold), var(--gold-dark), var(--gold));
  }

  /* ── Hero ── */
  .hero {
    position: relative;
    height: 260px;
    overflow: hidden;
    background: var(--navy-light);
  }
  .hero img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .hero-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: linear-gradient(transparent 0%, rgba(10,22,40,0.9) 100%);
    padding: 48px 40px 22px;
  }
  .hero-badge {
    display: inline-block;
    background: var(--gold);
    color: var(--navy);
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    padding: 4px 12px;
    border-radius: 4px;
    margin-bottom: 10px;
  }
  .hero-title {
    color: white;
    font-size: 24px;
    font-weight: 700;
    line-height: 1.2;
    margin-bottom: 4px;
  }
  .hero-subtitle {
    color: rgba(255,255,255,0.65);
    font-size: 12px;
    font-weight: 400;
  }

  /* ── Key facts strip ── */
  .facts-strip {
    display: flex;
    border-bottom: 1px solid var(--border);
    background: white;
  }
  .fact-item {
    flex: 1;
    padding: 16px 20px;
    text-align: center;
    border-right: 1px solid var(--border);
  }
  .fact-item:last-child { border-right: none; }
  .fact-label {
    font-size: 8px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--text-muted);
    margin-bottom: 3px;
  }
  .fact-value {
    font-size: 16px;
    font-weight: 700;
    color: var(--navy);
  }
  .fact-value small {
    font-size: 10px;
    font-weight: 500;
    color: var(--text-muted);
  }

  /* ── Content area ── */
  .content {
    padding: 28px 40px 20px;
  }

  /* ── Gallery ── */
  .gallery {
    display: grid;
    grid-template-columns: repeat(${Math.min(galleryImgs.length, 3)}, 1fr);
    gap: 6px;
    margin-bottom: 24px;
  }
  .gallery img {
    width: 100%;
    height: 110px;
    object-fit: cover;
    border-radius: 6px;
  }

  /* ── Tags ── */
  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    margin-bottom: 20px;
  }
  .tag {
    background: var(--muted);
    color: var(--navy);
    font-size: 9px;
    font-weight: 600;
    padding: 4px 10px;
    border-radius: 20px;
    border: 1px solid var(--border);
  }

  /* ── Description ── */
  .description {
    margin-bottom: 24px;
  }
  .section-title {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--gold-dark);
    margin-bottom: 10px;
    padding-bottom: 6px;
    border-bottom: 2px solid var(--gold);
    display: inline-block;
  }
  .description p {
    font-size: 11px;
    line-height: 1.7;
    color: #334155;
    margin-bottom: 8px;
  }

  /* ══════════════════════════════════════
     CHARTS & DATA VISUALIZATIONS
     ══════════════════════════════════════ */

  .chart-section {
    background: var(--muted);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 22px 24px;
    margin-bottom: 20px;
    page-break-inside: avoid;
  }
  .chart-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 6px;
  }
  .chart-header h3 {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--navy);
  }
  .chart-badge {
    font-size: 9px;
    font-weight: 600;
    padding: 3px 10px;
    border-radius: 20px;
  }
  .chart-subtitle {
    font-size: 9px;
    color: var(--text-muted);
    margin-bottom: 16px;
  }

  /* ── Bar chart ── */
  .bar-chart { display: flex; flex-direction: column; gap: 8px; }
  .bar-row { display: flex; align-items: center; gap: 10px; }
  .bar-label {
    width: 80px;
    font-size: 9px;
    font-weight: 500;
    color: var(--text-muted);
    text-align: right;
    flex-shrink: 0;
  }
  .bar-track {
    flex: 1;
    height: 24px;
    background: #f1f5f9;
    border-radius: 6px;
    overflow: hidden;
    position: relative;
  }
  .bar-fill {
    height: 100%;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding-right: 8px;
    min-width: 60px;
    transition: width 0.5s ease;
  }
  .bar-gold { background: linear-gradient(90deg, var(--gold), var(--gold-dark)); }
  .bar-navy { background: linear-gradient(90deg, var(--navy-light), var(--navy)); }
  .bar-light { background: #cbd5e1; }
  .bar-value {
    font-size: 9px;
    font-weight: 700;
    color: white;
    white-space: nowrap;
  }
  .bar-light .bar-value { color: var(--text-muted); }

  /* ── Location score ── */
  .score-grid {
    display: flex;
    gap: 16px;
    margin-bottom: 16px;
  }
  .score-item {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 10px;
    background: white;
    border-radius: 8px;
    padding: 12px 14px;
    border: 1px solid var(--border);
  }
  .score-icon { font-size: 20px; flex-shrink: 0; }
  .score-details { flex: 1; }
  .score-name {
    font-size: 9px;
    font-weight: 600;
    color: var(--navy);
    margin-bottom: 4px;
  }
  .score-dots { display: flex; gap: 4px; }
  .score-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #e2e8f0;
  }
  .score-dot-active {
    background: var(--gold);
  }
  .score-num {
    font-size: 11px;
    font-weight: 700;
    color: var(--navy);
    flex-shrink: 0;
  }

  .location-total {
    position: relative;
    width: 36px;
    height: 36px;
  }
  .location-total svg {
    transform: rotate(-90deg);
  }
  .location-total-num {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 9px;
    font-weight: 700;
    color: var(--navy);
  }

  .nearby-columns {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }
  .nearby-col h4 {
    font-size: 9px;
    font-weight: 600;
    color: var(--navy);
    margin-bottom: 6px;
  }
  .nearby-list { display: flex; flex-direction: column; gap: 3px; }
  .nearby-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 9px;
    padding: 3px 0;
  }
  .nearby-name { color: var(--text); font-weight: 500; }
  .nearby-dist { color: var(--text-muted); font-size: 8px; }

  /* ── Demographics ── */
  .demo-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
    gap: 10px;
  }
  .demo-card {
    background: white;
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 14px 16px;
    text-align: center;
  }
  .demo-icon { font-size: 22px; margin-bottom: 6px; }
  .demo-value {
    font-size: 18px;
    font-weight: 800;
    color: var(--navy);
    margin-bottom: 2px;
  }
  .demo-value small {
    font-size: 10px;
    font-weight: 500;
    color: var(--text-muted);
  }
  .demo-label {
    font-size: 9px;
    font-weight: 500;
    color: var(--text-muted);
    margin-bottom: 6px;
  }
  .demo-sub {
    font-size: 8px;
    color: var(--text-light);
  }
  .demo-bar-track {
    height: 4px;
    background: #e2e8f0;
    border-radius: 2px;
    overflow: hidden;
    margin-top: 4px;
  }
  .demo-bar-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--gold), var(--gold-dark));
    border-radius: 2px;
  }

  /* ── Contact card ── */
  .contact-card {
    background: var(--navy);
    border-radius: 10px;
    padding: 20px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
  }
  .contact-info h4 {
    color: white;
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 2px;
  }
  .contact-info p {
    color: rgba(255,255,255,0.55);
    font-size: 10px;
  }
  .contact-cta {
    background: var(--gold);
    color: var(--navy);
    font-size: 10px;
    font-weight: 700;
    padding: 8px 20px;
    border-radius: 6px;
    letter-spacing: 0.03em;
  }

  /* ── Footer ── */
  .footer {
    background: var(--navy);
    padding: 14px 40px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .footer-left {
    font-size: 8px;
    color: rgba(255,255,255,0.4);
  }
  .footer-right {
    font-size: 8px;
    color: var(--gold);
    font-weight: 600;
  }
</style>
</head>
<body>
<div class="page">
  <!-- Header -->
  <div class="header">
    <img src="${logoBase64}" alt="HittaYta.se" />
    <div class="header-right">KOMMERSIELLA LOKALER I SVERIGE</div>
  </div>
  <div class="gold-line"></div>

  <!-- Hero -->
  ${heroImg ? `<div class="hero">
    <img src="${heroImg}" alt="" />
    <div class="hero-overlay">
      <div class="hero-badge">${esc(typeLabel)} · ${esc(catLabel)}</div>
      <div class="hero-title">${esc(data.title)}</div>
      <div class="hero-subtitle">${esc(data.address)}</div>
    </div>
  </div>` : ""}

  <!-- Key facts -->
  <div class="facts-strip">
    <div class="fact-item">
      <div class="fact-label">Pris</div>
      <div class="fact-value">${esc(priceDisplay)}</div>
    </div>
    <div class="fact-item">
      <div class="fact-label">Storlek</div>
      <div class="fact-value">${data.size} <small>m²</small></div>
    </div>
    ${pricePerSqm > 0 ? `<div class="fact-item">
      <div class="fact-label">Kr/m²${data.type === "rent" ? "/mån" : ""}</div>
      <div class="fact-value">${fmtNum(pricePerSqm)} <small>kr</small></div>
    </div>` : ""}
    <div class="fact-item">
      <div class="fact-label">Plats</div>
      <div class="fact-value" style="font-size:13px">${esc(data.city)}</div>
    </div>
  </div>

  <div class="content">
    <!-- Gallery -->
    ${galleryImgs.length > 0 ? `<div class="gallery">${galleryImgs.map((img) => `<img src="${img}" alt="" />`).join("")}</div>` : ""}

    <!-- Tags -->
    ${data.tags.length > 0 ? `<div class="tags">${data.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</div>` : ""}

    <!-- Description -->
    <div class="description">
      <h3 class="section-title">Om lokalen</h3>
      ${descParagraphs.map((p) => `<p>${esc(p)}</p>`).join("")}
    </div>

    <!-- Price comparison chart -->
    ${priceChartHtml}

    <!-- Location score -->
    ${locationScoreHtml}

    <!-- Demographics -->
    ${demographicsHtml}

    <!-- Contact -->
    <div class="contact-card">
      <div class="contact-info">
        <h4>${esc(data.contact.name)}</h4>
        <p>${esc(data.contact.email)}${data.contact.phone ? ` · ${esc(data.contact.phone)}` : ""}</p>
      </div>
      <div class="contact-cta">Kontakta</div>
    </div>
  </div>

  <!-- Footer -->
  <div class="footer">
    <div class="footer-left">Genererad via HittaYta.se · ${new Date().toLocaleDateString("sv-SE")}</div>
    <div class="footer-right">hittayta.se</div>
  </div>
</div>
</body>
</html>`;
}

export async function POST(req: NextRequest) {
  try {
    const data = (await req.json()) as PdfBody;

    // Read logo and convert to base64
    const fs = await import("fs");
    const path = await import("path");
    const logoPath = path.join(process.cwd(), "public", "HYlogo.png");
    let logoBase64 = "";
    try {
      const logoBuf = fs.readFileSync(logoPath);
      logoBase64 = `data:image/png;base64,${logoBuf.toString("base64")}`;
    } catch {
      logoBase64 = "";
    }

    // Convert relative image URLs to absolute
    const origin = req.nextUrl.origin;
    const resolveUrl = (u: string) => {
      if (!u) return u;
      if (u.startsWith("/")) return `${origin}${u}`;
      return u;
    };
    data.imageUrls = (data.imageUrls || []).map(resolveUrl);

    const html = buildHtml(data, logoBase64);

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0", timeout: 30000 });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });

    await browser.close();

    return new NextResponse(Buffer.from(pdfBuffer), {
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
