"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#f7f7f5",
          color: "#211e1e",
          fontFamily: "var(--font-body, sans-serif)",
          padding: 24,
          boxSizing: "border-box",
        }}
      >
        <main
          style={{
            width: "100%",
            maxWidth: 520,
            background: "#ffffff",
            border: "1px solid #e8e5e2",
            borderRadius: 20,
            boxShadow: "0 12px 32px rgba(33, 30, 30, 0.08)",
            padding: 28,
          }}
        >
          <h1 style={{ margin: 0, fontSize: 24, lineHeight: 1.2 }}>Ocorreu um erro inesperado</h1>
          <p style={{ marginTop: 12, marginBottom: 0, fontSize: 14, color: "#5b5656", lineHeight: 1.6 }}>
            Nao foi possivel concluir esta acao agora. Tente novamente em instantes.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 20,
              padding: "12px 18px",
              borderRadius: 12,
              border: "none",
              background: "#211e1e",
              color: "#fff",
              fontSize: 14,
              fontWeight: 700,
              fontFamily: "inherit",
              cursor: "pointer",
            }}
          >
            Tentar novamente
          </button>
        </main>
      </body>
    </html>
  );
}
