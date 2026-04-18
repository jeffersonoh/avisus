"use client";

import { createContext, useContext, type ReactNode } from "react";

import { type Plan } from "./plan-limits";

const PlanContext = createContext<Plan>("free");

export function PlanProvider({ plan, children }: { plan: Plan; children: ReactNode }) {
  return <PlanContext.Provider value={plan}>{children}</PlanContext.Provider>;
}

export function usePlan(): Plan {
  return useContext(PlanContext);
}
