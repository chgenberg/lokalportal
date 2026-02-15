import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer";
import { formatPrice } from "@/lib/formatPrice";

export const maxDuration = 60;

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
  nearby?: Record<string, unknown>;
  priceContext?: Record<string, unknown> | null;
  demographics?: Record<string, unknown> | null;
}

const TYPE_LABELS: Record<string, string> = { sale: "Säljes", rent: "Uthyres" };
const CATEGORY_LABELS: Record<string, string> = {
  butik: "Butik", kontor: "Kontor", lager: "Lager", restaurang: "Restaurang",
  verkstad: "Verkstad", showroom: "Showroom", popup: "Pop-up", atelje: "Ateljé",
  gym: "Gym/Studio", ovrigt: "Övrigt",
};

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function formatCats(cat: string): string {
  return cat.split(",").map((c) => CATEGORY_LABELS[c.trim()] || c.trim()).filter(Boolean).join(" · ");
}

function buildHtml(data: PdfBody, logoBase64: string): string {
  const priceDisplay = formatPrice(data.price, data.type);
  const pricePerSqm = data.size > 0 ? Math.round(data.price / data.size) : 0;
  const typeLabel = TYPE_LABELS[data.type] || data.type;
  const catLabel = formatCats(data.category);
  const images = (data.imageUrls || []).slice(0, 6);
  const descParagraphs = data.description.split(/\n\n|\n/).filter(Boolean);

  // Build nearby section
  let nearbyHtml = "";
  if (data.nearby) {
    const sections: string[] = [];
    const n = data.nearby as Record<string, unknown>;
    if (Array.isArray(n.transit) && n.transit.length > 0) {
      sections.push(`<div class="nearby-group"><h4>🚇 Kollektivtrafik</h4><ul>${(n.transit as Array<{name:string;distance:string}>).slice(0, 3).map((t) => `<li>${escapeHtml(t.name)} – ${escapeHtml(t.distance)}</li>`).join("")}</ul></div>`);
    }
    if (Array.isArray(n.restaurants) && n.restaurants.length > 0) {
      sections.push(`<div class="nearby-group"><h4>🍽 Restauranger</h4><ul>${(n.restaurants as Array<{name:string;distance:string}>).slice(0, 3).map((t) => `<li>${escapeHtml(t.name)} – ${escapeHtml(t.distance)}</li>`).join("")}</ul></div>`);
    }
    if (Array.isArray(n.parking) && n.parking.length > 0) {
      sections.push(`<div class="nearby-group"><h4>🅿️ Parkering</h4><ul>${(n.parking as Array<{name:string;distance:string}>).slice(0, 3).map((t) => `<li>${escapeHtml(t.name)} – ${escapeHtml(t.distance)}</li>`).join("")}</ul></div>`);
    }
    if (sections.length > 0) {
      nearbyHtml = `<div class="nearby-section"><h3>I närheten</h3><div class="nearby-grid">${sections.join("")}</div></div>`;
    }
  }

  // Hero image (first), gallery (rest)
  const heroImg = images[0] || "";
  const galleryImgs = images.slice(1);

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
    --muted: #f8fafc;
    --border: #e2e8f0;
    --text: #0a1628;
    --text-muted: #64748b;
    --text-light: #94a3b8;
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
    min-height: 297mm;
    padding: 0;
    position: relative;
    overflow: hidden;
  }

  /* ── Header ── */
  .header {
    background: var(--navy);
    padding: 24px 40px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .header img { height: 32px; }
  .header-right {
    color: var(--gold);
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.05em;
  }

  /* ── Hero ── */
  .hero {
    position: relative;
    height: 280px;
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
    background: linear-gradient(transparent, rgba(10,22,40,0.85));
    padding: 40px 40px 24px;
  }
  .hero-badge {
    display: inline-block;
    background: var(--gold);
    color: var(--navy);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 4px 12px;
    border-radius: 4px;
    margin-bottom: 12px;
  }
  .hero-title {
    color: white;
    font-size: 26px;
    font-weight: 700;
    line-height: 1.2;
    margin-bottom: 6px;
  }
  .hero-subtitle {
    color: rgba(255,255,255,0.7);
    font-size: 13px;
    font-weight: 400;
  }

  /* ── Key facts strip ── */
  .facts-strip {
    display: flex;
    border-bottom: 1px solid var(--border);
  }
  .fact-item {
    flex: 1;
    padding: 20px 24px;
    text-align: center;
    border-right: 1px solid var(--border);
  }
  .fact-item:last-child { border-right: none; }
  .fact-label {
    font-size: 9px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--text-muted);
    margin-bottom: 4px;
  }
  .fact-value {
    font-size: 18px;
    font-weight: 700;
    color: var(--navy);
  }
  .fact-value small {
    font-size: 11px;
    font-weight: 500;
    color: var(--text-muted);
  }

  /* ── Content area ── */
  .content {
    padding: 32px 40px;
  }

  /* ── Gallery ── */
  .gallery {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    margin-bottom: 28px;
  }
  .gallery img {
    width: 100%;
    height: 120px;
    object-fit: cover;
    border-radius: 6px;
  }

  /* ── Tags ── */
  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 24px;
  }
  .tag {
    background: var(--muted);
    color: var(--navy);
    font-size: 10px;
    font-weight: 600;
    padding: 5px 12px;
    border-radius: 20px;
    border: 1px solid var(--border);
  }

  /* ── Description ── */
  .description {
    margin-bottom: 28px;
  }
  .description h3 {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--gold-dark);
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 2px solid var(--gold);
    display: inline-block;
  }
  .description p {
    font-size: 12px;
    line-height: 1.7;
    color: var(--text);
    margin-bottom: 10px;
  }

  /* ── Nearby ── */
  .nearby-section {
    background: var(--muted);
    border-radius: 10px;
    padding: 24px;
    margin-bottom: 28px;
    border: 1px solid var(--border);
  }
  .nearby-section h3 {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--navy);
    margin-bottom: 16px;
  }
  .nearby-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }
  .nearby-group h4 {
    font-size: 11px;
    font-weight: 600;
    color: var(--navy);
    margin-bottom: 6px;
  }
  .nearby-group ul {
    list-style: none;
    padding: 0;
  }
  .nearby-group li {
    font-size: 10px;
    color: var(--text-muted);
    line-height: 1.6;
  }

  /* ── Contact card ── */
  .contact-card {
    background: var(--navy);
    border-radius: 10px;
    padding: 24px 28px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
  }
  .contact-info h4 {
    color: white;
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 2px;
  }
  .contact-info p {
    color: rgba(255,255,255,0.6);
    font-size: 11px;
  }
  .contact-cta {
    background: var(--gold);
    color: var(--navy);
    font-size: 11px;
    font-weight: 700;
    padding: 10px 24px;
    border-radius: 6px;
    text-decoration: none;
    letter-spacing: 0.03em;
  }

  /* ── Footer ── */
  .footer {
    background: var(--muted);
    border-top: 1px solid var(--border);
    padding: 16px 40px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
  }
  .footer-left {
    font-size: 9px;
    color: var(--text-light);
  }
  .footer-right {
    font-size: 9px;
    color: var(--text-light);
    text-align: right;
  }
  .footer-right a {
    color: var(--gold-dark);
    text-decoration: none;
    font-weight: 600;
  }

  /* ── Gold accent line ── */
  .gold-line {
    height: 3px;
    background: linear-gradient(90deg, var(--gold), var(--gold-dark), var(--gold));
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
    <img src="${heroImg}" alt="Lokalbild" />
    <div class="hero-overlay">
      <div class="hero-badge">${escapeHtml(typeLabel)} · ${escapeHtml(catLabel)}</div>
      <div class="hero-title">${escapeHtml(data.title)}</div>
      <div class="hero-subtitle">${escapeHtml(data.address)}</div>
    </div>
  </div>` : ""}

  <!-- Key facts -->
  <div class="facts-strip">
    <div class="fact-item">
      <div class="fact-label">Pris</div>
      <div class="fact-value">${escapeHtml(priceDisplay)}</div>
    </div>
    <div class="fact-item">
      <div class="fact-label">Storlek</div>
      <div class="fact-value">${data.size} <small>m²</small></div>
    </div>
    ${pricePerSqm > 0 ? `<div class="fact-item">
      <div class="fact-label">Kr/m²${data.type === "rent" ? "/mån" : ""}</div>
      <div class="fact-value">${pricePerSqm.toLocaleString("sv-SE")} <small>kr</small></div>
    </div>` : ""}
    <div class="fact-item">
      <div class="fact-label">Plats</div>
      <div class="fact-value" style="font-size:14px">${escapeHtml(data.city)}</div>
    </div>
  </div>

  <div class="content">
    <!-- Gallery -->
    ${galleryImgs.length > 0 ? `<div class="gallery">${galleryImgs.map((img) => `<img src="${img}" alt="Bild" />`).join("")}</div>` : ""}

    <!-- Tags -->
    ${data.tags.length > 0 ? `<div class="tags">${data.tags.map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join("")}</div>` : ""}

    <!-- Description -->
    <div class="description">
      <h3>Om lokalen</h3>
      ${descParagraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join("")}
    </div>

    <!-- Nearby -->
    ${nearbyHtml}

    <!-- Contact -->
    <div class="contact-card">
      <div class="contact-info">
        <h4>${escapeHtml(data.contact.name)}</h4>
        <p>${escapeHtml(data.contact.email)}${data.contact.phone ? ` · ${escapeHtml(data.contact.phone)}` : ""}</p>
      </div>
      <div class="contact-cta">Kontakta</div>
    </div>
  </div>

  <!-- Footer -->
  <div class="footer">
    <div class="footer-left">Genererad via HittaYta.se · ${new Date().toLocaleDateString("sv-SE")}</div>
    <div class="footer-right">
      <a href="https://hittayta.se">hittayta.se</a>
    </div>
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
