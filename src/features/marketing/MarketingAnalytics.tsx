"use client";

import { track } from "@vercel/analytics";
import { useEffect, useRef } from "react";

import { MARKETING_EVENTS, type MarketingCtaEvent, type MarketingPlanId } from "./content";

const MARKETING_EVENT_NAMES = new Set<string>(Object.values(MARKETING_EVENTS));

function isMarketingCtaEvent(value: string): value is MarketingCtaEvent {
  return MARKETING_EVENT_NAMES.has(value);
}

function normalizePlan(value: string | undefined): MarketingPlanId | undefined {
  if (value === "free" || value === "starter" || value === "pro") {
    return value;
  }

  return undefined;
}

function trackMarketingEvent(
  eventName: MarketingCtaEvent,
  metadata: { href?: string; plan?: MarketingPlanId } = {},
) {
  try {
    track(eventName, {
      source: "marketing_home",
      ...metadata,
    });
  } catch {
    // Analytics is best-effort and must never block public navigation.
  }
}

export function MarketingAnalytics() {
  const plansSectionViewed = useRef(false);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const target = event.target instanceof Element ? event.target : null;
      const trackedElement = target?.closest<HTMLElement>("[data-marketing-event]");
      const eventName = trackedElement?.dataset.marketingEvent;

      if (!eventName || !isMarketingCtaEvent(eventName)) {
        return;
      }

      const href = trackedElement.dataset.marketingHref;
      const plan = normalizePlan(trackedElement.dataset.marketingPlan);
      const metadata: { href?: string; plan?: MarketingPlanId } = {};

      if (href) {
        metadata.href = href;
      }

      if (plan) {
        metadata.plan = plan;
      }

      trackMarketingEvent(eventName, metadata);
    }

    document.addEventListener("click", handleClick);

    const plansSection = document.querySelector("[data-marketing-plans-section]");
    let observer: IntersectionObserver | undefined;

    if (plansSection && typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver(
        (entries) => {
          if (plansSectionViewed.current || !entries.some((entry) => entry.isIntersecting)) {
            return;
          }

          plansSectionViewed.current = true;
          trackMarketingEvent(MARKETING_EVENTS.plans_section_view);
          observer?.disconnect();
        },
        { threshold: 0.25 },
      );

      observer.observe(plansSection);
    }

    return () => {
      document.removeEventListener("click", handleClick);
      observer?.disconnect();
    };
  }, []);

  return null;
}
