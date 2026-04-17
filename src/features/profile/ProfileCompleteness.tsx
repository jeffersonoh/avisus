"use client";

import { useEffect, useState } from "react";

import { AppIcon } from "@/components/AppIcon";
import { useGravatar } from "@/lib/gravatar";

import { useCompleteness, type ProfileAlertChannel } from "./hooks";

type ProfileCompletenessProps = {
  name: string;
  email: string;
  uf: string;
  city: string;
  alertChannels: ProfileAlertChannel[];
};

function getInitials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase() || "?"
  );
}

export function ProfileCompleteness({ name, email, uf, city, alertChannels }: ProfileCompletenessProps) {
  const { percent, completed, total, missing } = useCompleteness({ name, email, uf, city, alertChannels });

  const gravatarUrl = useGravatar(email, 128);
  const [gravatarLoaded, setGravatarLoaded] = useState(false);
  const [gravatarError, setGravatarError] = useState(false);

  useEffect(() => {
    if (!gravatarUrl) {
      setGravatarLoaded(false);
      setGravatarError(false);
      return;
    }
    setGravatarLoaded(false);
    setGravatarError(false);
    const img = new Image();
    img.onload = () => setGravatarLoaded(true);
    img.onerror = () => setGravatarError(true);
    img.src = gravatarUrl;
  }, [gravatarUrl]);

  const hasGravatar = Boolean(gravatarUrl && gravatarLoaded && !gravatarError);

  const barColor =
    percent === 100 ? "var(--success)" : percent >= 60 ? "var(--accent-light)" : "var(--warning)";

  return (
    <div style={{
      background: "linear-gradient(145deg, color-mix(in srgb, var(--accent-light) 8%, var(--card)), color-mix(in srgb, var(--accent) 4%, var(--card)))",
      borderRadius: 24, padding: "28px 24px",
      border: "1px solid color-mix(in srgb, var(--accent-light) 15%, var(--border))",
      boxShadow: "var(--card-shadow)",
      display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap",
    }}>
      {/* Avatar */}
      <div style={{
        width: 64, height: 64, borderRadius: 20, flexShrink: 0, overflow: "hidden",
        background: "linear-gradient(135deg, var(--accent-light), var(--accent))",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: "0.04em",
        boxShadow: "0 4px 16px color-mix(in srgb, var(--accent-light) 30%, transparent)",
      }}>
        {hasGravatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={gravatarUrl!} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        ) : (
          getInitials(name)
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 180 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-1)", marginBottom: 4 }}>
          {name || "Configure seu perfil"}
        </div>
        <div style={{ fontSize: 13, color: "var(--text-3)", marginBottom: 10 }}>
          {email || "Adicione suas informações para começar"}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            flex: 1, height: 6, borderRadius: 3, maxWidth: 180,
            background: "var(--margin-block-bg)", overflow: "hidden",
          }}>
            <div style={{
              height: "100%", borderRadius: 3,
              width: `${Math.min(percent, 100)}%`,
              background: barColor,
              transition: "width 0.4s ease",
            }} />
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: percent === 100 ? "var(--success)" : "var(--text-3)" }}>
            {completed}/{total}{percent === 100 ? " Completo" : ""}
          </span>
        </div>

        {missing.length > 0 ? (
          <div style={{ fontSize: 11, color: "var(--warning)", marginTop: 6 }}>
            Falta: {missing.join(", ")}
          </div>
        ) : (
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--success)", marginTop: 6, display: "flex", alignItems: "center", gap: 4 }}>
            <AppIcon name="check" size={10} stroke="var(--success)" /> Perfil completo
          </div>
        )}

        {hasGravatar && (
          <div style={{
            marginTop: 8, display: "inline-flex", alignItems: "center", gap: 5,
            fontSize: 11, fontWeight: 600, color: "var(--accent-light)",
            background: "color-mix(in srgb, var(--accent-light) 8%, transparent)",
            border: "1px solid color-mix(in srgb, var(--accent-light) 18%, transparent)",
            borderRadius: 6, padding: "3px 8px",
          }}>
            <AppIcon name="check" size={10} stroke="var(--accent-light)" /> Gravatar conectado
          </div>
        )}
      </div>
    </div>
  );
}
