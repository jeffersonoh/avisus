"use client";

import { useEffect } from "react";

import { markAlertsAsRead } from "./actions";

export function MarkAlertsOnMount() {
  useEffect(() => {
    void markAlertsAsRead();
  }, []);
  return null;
}
