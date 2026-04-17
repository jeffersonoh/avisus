"use client";

import { type ReactNode, useEffect, useState } from "react";

const PULSE_DELAY_MS = 200;

/**
 * Aplica `animate-pulse` só após 200ms para navegações muito rápidas não “piscarem”.
 */
export function DeferredRouteLoading({ children }: { children: ReactNode }) {
  const [enablePulse, setEnablePulse] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setEnablePulse(true), PULSE_DELAY_MS);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <div className={enablePulse ? "animate-pulse" : undefined} aria-busy="true" aria-live="polite">
      {children}
    </div>
  );
}
