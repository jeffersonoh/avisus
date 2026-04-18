"use client";

import Link from "next/link";

import { AppIcon } from "@/components/AppIcon";
import { Toggle } from "@/components/Toggle";
import type { Plan } from "@/lib/plan-limits";

import { cardOverflowStyle, inputWithIconStyle, labelStyle } from "@/lib/styles";

import { ProfileCompleteness } from "./ProfileCompleteness";
import { RegionSelector } from "./RegionSelector";
import { useProfile, type ProfileAlertChannel } from "./hooks";

type ProfileFormProps = {
  plan: Plan;
  initialName: string;
  initialEmail: string;
  initialPhone: string | null;
  initialUf: string | null;
  initialCity: string | null;
  initialTelegramUsername: string | null;
  initialAlertChannels: string[];
};

const PLAN_CONFIG: Record<Plan, { color: string; icon: "sparkles" | "zap" | "crown"; limits: string }> = {
  free: { color: "#7B42C9", icon: "sparkles", limits: "5 termos • 5 alertas/dia • Scan 2h" },
  starter: { color: "#D4A017", icon: "zap", limits: "20 termos • Ilimitado • Scan 30min • Score básico" },
  pro: { color: "#2E8B57", icon: "crown", limits: "Ilimitado • Scan 5min • Score IA • Tendência 90d" },
};

const PLAN_LABEL: Record<Plan, string> = { free: "FREE", starter: "STARTER", pro: "PRO" };

function normalizeInitialChannels(channels: string[]): ProfileAlertChannel[] {
  const output = new Set<ProfileAlertChannel>();
  for (const channel of channels) {
    if (channel === "web" || channel === "telegram") output.add(channel);
  }
  if (output.size === 0) output.add("web");
  return [...output];
}

export function ProfileForm({
  plan,
  initialName,
  initialEmail,
  initialPhone,
  initialUf,
  initialCity,
  initialTelegramUsername,
  initialAlertChannels,
}: ProfileFormProps) {
  const { profile, updateProfileField, toggleAlertChannel, isSaving, error, saveFeedback } = useProfile({
    initialProfile: {
      name: initialName,
      email: initialEmail,
      phone: initialPhone ?? "",
      uf: initialUf ?? "",
      city: initialCity ?? "",
      telegramUsername: initialTelegramUsername ?? "",
      alertChannels: normalizeInitialChannels(initialAlertChannels),
      lgpdConsent: true,
    },
  });

  const pc = PLAN_CONFIG[plan];
  const canDisableWeb = !(profile.alertChannels.length === 1 && profile.alertChannels.includes("web"));
  const canDisableTelegram = !(profile.alertChannels.length === 1 && profile.alertChannels.includes("telegram"));

  const telegramRaw = profile.telegramUsername.trim();
  const telegramValid = /^@\w{3,}$/.test(telegramRaw);
  const telegramInlineError = error && /telegram/i.test(error) ? error : null;

  const webActive = profile.alertChannels.includes("web");
  const telegramActive = profile.alertChannels.includes("telegram");

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {/* Hero / completeness */}
      <ProfileCompleteness
        name={profile.name}
        email={profile.email}
        uf={profile.uf}
        city={profile.city}
        alertChannels={profile.alertChannels}
      />

      {/* Plan card */}
      <div style={{
        background: "var(--card)", borderRadius: 20, padding: "18px 20px",
        border: `1px solid color-mix(in srgb, ${pc.color} 22%, var(--border))`,
        boxShadow: "var(--card-shadow)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: `color-mix(in srgb, ${pc.color} 12%, transparent)`,
              border: `1px solid color-mix(in srgb, ${pc.color} 22%, transparent)`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <AppIcon name={pc.icon} size={20} stroke={pc.color} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: pc.color }}>
                Plano {PLAN_LABEL[plan]}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>{pc.limits}</div>
            </div>
          </div>
          <Link
            href="/planos"
            style={{
              padding: "8px 14px", borderRadius: 10, textDecoration: "none",
              border: plan === "pro" ? `1px solid color-mix(in srgb, ${pc.color} 40%, transparent)` : "none",
              background: plan === "pro" ? "transparent" : pc.color,
              color: plan === "pro" ? pc.color : "#fff",
              fontSize: 12, fontWeight: 700,
              display: "inline-flex", alignItems: "center", gap: 5,
            }}
          >
            {plan === "pro"
              ? <><AppIcon name="layers" size={12} stroke={pc.color} /> Planos</>
              : <><AppIcon name="crown" size={12} stroke="#fff" /> Upgrade</>
            }
          </Link>
        </div>
      </div>

      {/* Personal info card */}
      <div style={cardOverflowStyle}>
        <div style={{
          background: "color-mix(in srgb, var(--accent-light) 6%, var(--card))",
          borderBottom: "1px solid var(--border)",
          padding: "16px 20px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: "color-mix(in srgb, var(--accent-light) 12%, transparent)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <AppIcon name="star" size={18} stroke="var(--accent-light)" />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)" }}>Informações pessoais</div>
              <div style={{ fontSize: 11, color: "var(--text-3)" }}>Dados básicos de identificação</div>
            </div>
          </div>
          {saveFeedback ? (
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--success)", display: "inline-flex", alignItems: "center", gap: 4 }}>
              <AppIcon name="check" size={12} stroke="var(--success)" /> {saveFeedback}
            </span>
          ) : isSaving ? (
            <span style={{ fontSize: 12, color: "var(--text-3)" }}>Salvando...</span>
          ) : null}
        </div>

        <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Name */}
          <div>
            <label style={labelStyle}>Nome completo</label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", display: "inline-flex", pointerEvents: "none" }}>
                <AppIcon name="star" size={14} stroke={profile.name.trim() ? "var(--accent-light)" : "var(--text-3)"} />
              </span>
              <input
                value={profile.name}
                onChange={(e) => updateProfileField("name", e.target.value)}
                placeholder="Ex: Carlos Silva"
                style={inputWithIconStyle}
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label style={labelStyle}>E-mail</label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", display: "inline-flex", pointerEvents: "none" }}>
                <AppIcon name="globe" size={14} stroke="var(--text-3)" />
              </span>
              <input
                value={profile.email}
                readOnly
                style={{ ...inputWithIconStyle, color: "var(--text-3)", cursor: "default" }}
              />
            </div>
            <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 5, display: "flex", alignItems: "center", gap: 4 }}>
              <AppIcon name="info" size={10} stroke="var(--text-3)" /> O e-mail é gerenciado pelo login da conta.
            </div>
          </div>

          {/* Phone */}
          <div>
            <label style={labelStyle}>
              Telefone{" "}
              <span style={{ fontWeight: 400, textTransform: "none" as const }}>(opcional)</span>
            </label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", display: "inline-flex", pointerEvents: "none" }}>
                <AppIcon name="send" size={14} stroke={profile.phone.trim() ? "var(--accent-light)" : "var(--text-3)"} />
              </span>
              <input
                value={profile.phone}
                onChange={(e) => updateProfileField("phone", e.target.value)}
                placeholder="Ex: +5548999999999"
                style={inputWithIconStyle}
              />
            </div>
          </div>

          {/* Telegram */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={labelStyle}>
                Telegram{" "}
                <span style={{ fontWeight: 400, textTransform: "none" as const }}>(opcional)</span>
              </span>
              {telegramRaw && (
                <span style={{
                  fontSize: 10, fontWeight: 700,
                  color: telegramValid ? "var(--success)" : "var(--warning)",
                  display: "inline-flex", alignItems: "center", gap: 3,
                }}>
                  <AppIcon name={telegramValid ? "check" : "info"} size={9} stroke={telegramValid ? "var(--success)" : "var(--warning)"} />
                  {telegramValid ? "Válido" : "Formato: @usuario"}
                </span>
              )}
            </div>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", display: "inline-flex", pointerEvents: "none" }}>
                <AppIcon name="send" size={14} stroke={telegramValid ? "#229ED9" : "var(--text-3)"} />
              </span>
              <input
                value={profile.telegramUsername}
                onChange={(e) => updateProfileField("telegramUsername", e.target.value)}
                placeholder="@seuusuario"
                style={{
                  ...inputWithIconStyle,
                  borderColor: telegramRaw && !telegramValid
                    ? "color-mix(in srgb, var(--warning) 50%, var(--border))"
                    : undefined,
                }}
              />
            </div>
            <div
              style={{
                fontSize: 11,
                color: telegramInlineError ? "var(--danger)" : "var(--text-3)",
                marginTop: 5,
              }}
              role={telegramInlineError ? "alert" : undefined}
            >
              {telegramInlineError ?? "Seu @username do Telegram, sem espaços"}
            </div>
          </div>
        </div>
      </div>

      {/* Region card */}
      <div style={cardOverflowStyle}>
        <div style={{
          background: "color-mix(in srgb, var(--accent) 6%, var(--card))",
          borderBottom: "1px solid var(--border)",
          padding: "16px 20px",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "color-mix(in srgb, var(--accent) 14%, transparent)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <AppIcon name="globe" size={18} stroke="var(--accent)" />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)" }}>Região de atuação</div>
            <div style={{ fontSize: 11, color: "var(--text-3)" }}>Usada para filtros e relevância das ofertas</div>
          </div>
        </div>
        <div style={{ padding: "20px 22px" }}>
          <RegionSelector
            uf={profile.uf}
            city={profile.city}
            onUfChange={(nextUf) => {
              updateProfileField("uf", nextUf.trim().toUpperCase());
              updateProfileField("city", "");
            }}
            onCityChange={(nextCity) => updateProfileField("city", nextCity)}
          />
          <div style={{ marginTop: 14 }}>
            <Link
              href="/perfil/margem"
              style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color: "var(--accent-light)", textDecoration: "none" }}
            >
              <AppIcon name="trending-up" size={13} stroke="var(--accent-light)" />
              Configurar taxas de margem de revenda
            </Link>
          </div>
        </div>
      </div>

      {/* Alert channels card */}
      <div style={cardOverflowStyle}>
        <div style={{
          background: "color-mix(in srgb, var(--success) 5%, var(--card))",
          borderBottom: "1px solid var(--border)",
          padding: "16px 20px",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "color-mix(in srgb, var(--success) 12%, transparent)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <AppIcon name="bell" size={18} stroke="var(--success)" />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)" }}>Canais de alerta</div>
            <div style={{ fontSize: 11, color: "var(--text-3)" }}>Onde você quer receber notificações</div>
          </div>
        </div>
        <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 10 }}>
          {/* Web */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "12px 14px", borderRadius: 12,
            background: webActive ? "color-mix(in srgb, var(--accent-light) 6%, var(--card))" : "var(--margin-block-bg)",
            border: webActive ? "1px solid color-mix(in srgb, var(--accent-light) 25%, var(--border))" : "1px solid var(--border)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "color-mix(in srgb, var(--accent-light) 12%, transparent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <AppIcon name="monitor" size={15} stroke={webActive ? "var(--accent-light)" : "var(--text-3)"} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>Web App</div>
                <div style={{ fontSize: 10, fontWeight: 600, color: webActive ? "var(--accent-light)" : "var(--text-3)" }}>
                  {webActive ? "Ativo" : "Inativo"}
                </div>
              </div>
            </div>
            <Toggle
              checked={webActive}
              onChange={(next) => toggleAlertChannel("web", next)}
              disabled={!canDisableWeb}
              aria-label="Canal web"
            />
          </div>

          {/* Telegram */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "12px 14px", borderRadius: 12,
            background: telegramActive ? "color-mix(in srgb, #229ED9 5%, var(--card))" : "var(--margin-block-bg)",
            border: telegramActive ? "1px solid color-mix(in srgb, #229ED9 22%, var(--border))" : "1px solid var(--border)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "color-mix(in srgb, #229ED9 12%, transparent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <AppIcon name="send" size={15} stroke={telegramActive ? "#229ED9" : "var(--text-3)"} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>Telegram</div>
                <div style={{ fontSize: 10, fontWeight: 600, color: telegramActive ? "#229ED9" : "var(--text-3)" }}>
                  {telegramActive ? "Ativo" : "Inativo"}
                </div>
              </div>
            </div>
            <Toggle
              checked={telegramActive}
              onChange={(next) => toggleAlertChannel("telegram", next)}
              disabled={!canDisableTelegram}
              aria-label="Canal telegram"
            />
          </div>

          <div style={{ fontSize: 11, color: "var(--text-3)" }}>
            É necessário manter ao menos um canal ativo.
          </div>

          {/* Status indicator */}
          <div style={{
            padding: "10px 14px", borderRadius: 12, display: "flex", alignItems: "center", gap: 10,
            background: profile.alertChannels.length > 0
              ? "color-mix(in srgb, var(--success) 6%, var(--card))"
              : "color-mix(in srgb, var(--warning) 6%, var(--card))",
            border: profile.alertChannels.length > 0
              ? "1px solid color-mix(in srgb, var(--success) 20%, var(--border))"
              : "1px solid color-mix(in srgb, var(--warning) 20%, var(--border))",
          }}>
            <AppIcon
              name={profile.alertChannels.length > 0 ? "check" : "info"}
              size={15}
              stroke={profile.alertChannels.length > 0 ? "var(--success)" : "var(--warning)"}
            />
            <div style={{ fontSize: 12, color: "var(--text-2)" }}>
              {profile.alertChannels.length > 0
                ? <>Recebendo alertas via <strong>{profile.alertChannels.map((c) => c === "web" ? "Web App" : "Telegram").join(" e ")}</strong></>
                : "Ative pelo menos um canal para receber oportunidades em tempo real"
              }
            </div>
          </div>
        </div>
      </div>

      {/* LGPD */}
      <div style={{
        background: "var(--margin-block-bg)", borderRadius: 16, padding: "14px 18px",
        border: "1px solid var(--border)",
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
          <div style={{ flexShrink: 0, marginTop: 2 }}>
            <AppIcon name="info" size={16} stroke="var(--text-3)" />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-2)", marginBottom: 4 }}>
              Privacidade e dados (LGPD)
            </div>
            <div style={{ fontSize: 11, color: "var(--text-3)", lineHeight: 1.5, marginBottom: 8 }}>
              Seus dados pessoais são usados exclusivamente para personalizar alertas e calcular frete/margem.
              Não compartilhamos suas informações com terceiros.
            </div>
            <label style={{ display: "flex", alignItems: "flex-start", gap: 8, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={profile.lgpdConsent}
                onChange={(e) => updateProfileField("lgpdConsent", e.target.checked)}
                style={{ marginTop: 2, width: 14, height: 14, cursor: "pointer", accentColor: "var(--accent)" }}
              />
              <span style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.5 }}>
                Concordo com o uso dos meus dados conforme a LGPD.{" "}
                <Link
                  href="https://avisus.app/politica-de-privacidade"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "var(--accent-light)", fontWeight: 600 }}
                >
                  Política de privacidade
                </Link>
              </span>
            </label>
          </div>
        </div>
      </div>

      {error && (
        <div style={{
          padding: "10px 14px", borderRadius: 10, fontSize: 12,
          color: "var(--danger)",
          background: "color-mix(in srgb, var(--danger) 8%, var(--card))",
          border: "1px solid color-mix(in srgb, var(--danger) 25%, var(--border))",
        }} role="alert">
          {error}
        </div>
      )}
    </div>
  );
}
