import type { AppIconName } from "@/components/AppIcon";

export type InterestSuggestionCategory = {
  category: string;
  icon: AppIconName;
  color: string;
  terms: readonly string[];
};

export const CATEGORY_SUGGESTIONS = [
  {
    category: "Ferramentas",
    icon: "zap",
    color: "var(--warning)",
    terms: [
      "Parafusadeira 48v 2 baterias",
      "Chave de Impacto",
      "Máquina de Solda MMA200",
      "Caixa de Ferramentas 46 peças",
    ],
  },
  {
    category: "Auto & Moto",
    icon: "truck",
    color: "var(--success)",
    terms: [
      "Compressor de Ar Portátil",
      "Bomba de Ar",
      "Intercomunicador de Moto",
      "Capacetes",
      "Carregador Veicular Turbo Retrátil",
    ],
  },
  {
    category: "Eletrônicos",
    icon: "monitor",
    color: "var(--info)",
    terms: ["Smart TV 43", "Smartwatch"],
  },
] satisfies readonly InterestSuggestionCategory[];

export const POPULAR_INTEREST_SUGGESTIONS = CATEGORY_SUGGESTIONS.flatMap(
  (category) => category.terms,
);
