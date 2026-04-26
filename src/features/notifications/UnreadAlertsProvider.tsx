"use client";

import { createContext, useContext, useEffect, useState } from "react";

import { createBrowserClient } from "@/lib/supabase/client";

import { getUnreadAlertsCount } from "./actions";

type Props = {
  userId: string;
  accessToken: string | null;
  children: React.ReactNode;
};

const UnreadAlertsContext = createContext<number>(0);

export function UnreadAlertsProvider({ userId, accessToken, children }: Props) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getUnreadAlertsCount().then((next) => {
      if (!cancelled) setCount(next);
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    if (!accessToken) return;

    const supabase = createBrowserClient();
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let debounce: ReturnType<typeof setTimeout> | null = null;

    const refresh = () => {
      if (debounce) clearTimeout(debounce);
      debounce = setTimeout(async () => {
        const next = await getUnreadAlertsCount();
        if (!cancelled) setCount(next);
      }, 150);
    };

    (async () => {
      await supabase.realtime.setAuth(accessToken);
      if (cancelled) return;

      channel = supabase
        .channel(`unread-alerts:${userId}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "alerts", filter: `user_id=eq.${userId}` },
          refresh,
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "live_alerts", filter: `user_id=eq.${userId}` },
          refresh,
        )
        .subscribe();
    })();

    return () => {
      cancelled = true;
      if (debounce) clearTimeout(debounce);
      if (channel) supabase.removeChannel(channel);
    };
  }, [userId, accessToken]);

  return <UnreadAlertsContext.Provider value={count}>{children}</UnreadAlertsContext.Provider>;
}

export function useUnreadAlertsCount(): number {
  return useContext(UnreadAlertsContext);
}
