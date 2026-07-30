"use client";

import { brand } from "@/lib/config/brand";

/**
 * Replaces the root layout when a critical error occurs.
 * Must define its own <html> and <body>.
 */
export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="nl">
      <body
        style={{
          margin: 0,
          fontFamily: "system-ui, sans-serif",
          background: "#f7f4f0",
          color: "#2a2a2a"
        }}
      >
        <main
          style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            padding: "2rem"
          }}
        >
          <div
            style={{
              maxWidth: 480,
              width: "100%",
              background: "#fff",
              borderRadius: 16,
              padding: "2rem",
              textAlign: "center",
              boxShadow: "0 8px 30px rgba(0,0,0,0.06)"
            }}
          >
            <p style={{ margin: 0, fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#c07a4a" }}>
              Er ging iets mis
            </p>
            <h1 style={{ margin: "0.5rem 0 0", fontSize: 28, color: "#404d3c" }}>{brand.name}</h1>
            <p style={{ margin: "1rem 0 0", lineHeight: 1.6, color: "#666" }}>
              De applicatie kon niet worden geladen. Probeer het opnieuw.
              <br />
              Something went wrong. Please try again.
            </p>
            {error.digest ? (
              <p style={{ margin: "0.75rem 0 0", fontSize: 12, fontFamily: "ui-monospace, monospace", color: "#999" }}>
                Ref: {error.digest}
              </p>
            ) : null}
            <div style={{ marginTop: "1.75rem", display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={reset}
                style={{
                  minHeight: 44,
                  padding: "0.6rem 1.25rem",
                  borderRadius: 10,
                  border: "none",
                  background: "#c07a4a",
                  color: "#fff",
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                Opnieuw / Try again
              </button>
              <a
                href="/"
                style={{
                  minHeight: 44,
                  padding: "0.6rem 1.25rem",
                  borderRadius: 10,
                  border: "1px solid #e5e5e5",
                  background: "#fff",
                  color: "#2a2a2a",
                  fontWeight: 700,
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center"
                }}
              >
                Home
              </a>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
