import { ImageResponse } from "next/og";

export const alt = "Offmarket.nu – Off-market bostäder till salu";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0a1628 0%, #1B2A4A 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", marginBottom: 24 }}>
          <span style={{ fontSize: 72, fontWeight: 800, color: "#ffffff", letterSpacing: "-2px" }}>
            Offmarket
          </span>
          <span style={{ fontSize: 72, fontWeight: 800, color: "rgba(255,255,255,0.4)", letterSpacing: "-2px" }}>
            .nu
          </span>
        </div>
        <span style={{ fontSize: 28, color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>
          Sveriges marknadsplats för off-market bostäder
        </span>
      </div>
    ),
    { ...size },
  );
}
