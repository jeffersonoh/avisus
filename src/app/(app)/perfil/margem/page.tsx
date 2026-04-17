import { redirect } from "next/navigation";

import { ResaleChannelsForm } from "@/features/profile/ResaleChannelsForm";
import { createServerClient } from "@/lib/supabase/server";

type ResaleMode = "average" | "custom";

type ResaleFees = {
  "Mercado Livre": number;
  "Magazine Luiza": number;
};

const DEFAULT_FEES: ResaleFees = {
  "Mercado Livre": 15,
  "Magazine Luiza": 16,
};

function parseResaleMode(value: string | null | undefined): ResaleMode {
  if (value === "custom") {
    return "custom";
  }
  return "average";
}

function parseResaleFees(raw: unknown): ResaleFees {
  if (!raw || typeof raw !== "object") {
    return DEFAULT_FEES;
  }

  const maybeMl = (raw as Record<string, unknown>)["Mercado Livre"];
  const maybeMagalu = (raw as Record<string, unknown>)["Magazine Luiza"];

  const ml = typeof maybeMl === "number" ? maybeMl : DEFAULT_FEES["Mercado Livre"];
  const magalu =
    typeof maybeMagalu === "number" ? maybeMagalu : DEFAULT_FEES["Magazine Luiza"];

  return {
    "Mercado Livre": ml,
    "Magazine Luiza": magalu,
  };
}

export default async function PerfilMargemPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("resale_margin_mode, resale_fee_pct")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <ResaleChannelsForm
      initialMode={parseResaleMode(profile?.resale_margin_mode)}
      initialFees={parseResaleFees(profile?.resale_fee_pct)}
    />
  );
}
