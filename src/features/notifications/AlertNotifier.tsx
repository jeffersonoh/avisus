"use client";

import { useEffect, useState } from "react";

import { createBrowserClient } from "@/lib/supabase/client";

type Props = {
  userId: string;
  accessToken: string | null;
};

type PermissionState = "default" | "granted" | "denied" | "unsupported";

function readPermission(): PermissionState {
  if (typeof window === "undefined" || typeof Notification === "undefined") {
    return "unsupported";
  }
  return Notification.permission;
}

export function AlertNotifier({ userId, accessToken }: Props) {
  const [permission, setPermission] = useState<PermissionState>("unsupported");

  useEffect(() => {
    setPermission(readPermission());
  }, []);

  useEffect(() => {
    if (permission !== "granted" || !accessToken) {
      return;
    }

    const supabase = createBrowserClient();
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    (async () => {
      await supabase.realtime.setAuth(accessToken);
      if (cancelled) return;

      channel = supabase
        .channel(`alerts:${userId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "alerts",
            filter: `user_id=eq.${userId}`,
          },
          async (payload) => {
            const row = payload.new as {
              id: string;
              opportunity_id: string;
              channel: string;
              status: string;
            };

            if (row.channel !== "web" || (row.status !== "pending" && row.status !== "sent")) {
              return;
            }

            const { data: opportunity } = await supabase
              .from("opportunities")
              .select("name, marketplace, buy_url")
              .eq("id", row.opportunity_id)
              .maybeSingle();

            const title = opportunity?.name ?? "Nova oportunidade";
            const body = opportunity?.marketplace
              ? `${opportunity.marketplace} · clique para abrir`
              : "Clique para abrir";

            const notification = new Notification(title, {
              body,
              icon: "/favicon.png",
              tag: `alert-${row.id}`,
            });

            notification.onclick = () => {
              window.focus();
              if (opportunity?.buy_url) {
                window.open(opportunity.buy_url, "_blank", "noopener,noreferrer");
              } else {
                window.location.href = "/alertas";
              }
              notification.close();
            };
          },
        )
        .subscribe();
    })();

    return () => {
      cancelled = true;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [permission, userId, accessToken]);

  async function handleEnable() {
    if (typeof Notification === "undefined") {
      return;
    }
    const result = await Notification.requestPermission();
    setPermission(result);
  }

  if (permission !== "default") {
    return null;
  }

  return (
    <div
      role="status"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: "10px 14px",
        borderRadius: 12,
        border: "1px solid color-mix(in srgb, var(--accent-light) 30%, var(--border))",
        background: "color-mix(in srgb, var(--accent-light) 8%, var(--card))",
        fontSize: 13,
        color: "var(--text-2)",
      }}
    >
      <span>Ative notificações do navegador para receber alertas em tempo real.</span>
      <button
        type="button"
        onClick={handleEnable}
        style={{
          padding: "6px 12px",
          borderRadius: 8,
          border: "1px solid color-mix(in srgb, var(--accent-light) 40%, var(--border))",
          background: "var(--accent-light)",
          color: "#fff",
          fontWeight: 700,
          fontSize: 12,
          cursor: "pointer",
        }}
      >
        Ativar
      </button>
    </div>
  );
}
