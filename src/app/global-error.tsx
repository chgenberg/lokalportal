"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="sv">
      <head>
        <meta charSet="utf-8" />
        <title>Fel – Hittayta.se</title>
      </head>
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#fff", color: "#0a1628" }}>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            textAlign: "center",
          }}
        >
          <div style={{ maxWidth: "28rem" }}>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>
              Något gick fel
            </h1>
            <p style={{ color: "#6b7280", marginBottom: "2rem" }}>
              Ett allvarligt fel inträffade. Försök ladda om sidan eller gå till startsidan.
            </p>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={reset}
                style={{
                  padding: "0.75rem 1.5rem",
                  background: "#0a1628",
                  color: "#fff",
                  border: "none",
                  borderRadius: "0.75rem",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Ladda om
              </button>
              <a
                href="/"
                style={{
                  padding: "0.75rem 1.5rem",
                  color: "#0a1628",
                  border: "1px solid #0a1628",
                  borderRadius: "0.75rem",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  textDecoration: "none",
                }}
              >
                Till startsidan
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
