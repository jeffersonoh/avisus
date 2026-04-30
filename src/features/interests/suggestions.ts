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
      "Parafusadeira",
      "Furadeira",
      "Kit Chaves",
      "Parafusadeira 48v 2 baterias",
      "Chave de Impacto",
      "Máquina de Solda MMA200",
      "Caixa de Ferramentas 46 peças",
    ],
  },
  {
    category: "Games",
    icon: "monitor",
    color: "#8B5CF6",
    terms: ["PlayStation 5", "Controle Xbox", "Nintendo Switch"],
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
    terms: ["Fone JBL", "Echo Dot", "Caixa Bluetooth", "Smart TV 43", "Smartwatch"],
  },
  {
    category: "Calçados",
    icon: "bag",
    color: "var(--success)",
    terms: ["Tênis Nike", "Air Max", "Adidas"],
  },
  {
    category: "Moda/Beleza",
    icon: "sparkles",
    color: "#EC4899",
    terms: ["Secador Taiff", "Chapinha", "Kit Maquiagem", "Skincare", "Bolsa Feminina"],
  },
  {
    category: "Kids",
    icon: "star",
    color: "#F97316",
    terms: ["Fralda Pampers", "Carrinho de Bebê", "Cadeirinha Infantil", "Brinquedos Educativos", "Mochila Infantil"],
  },
  {
    category: "Pets",
    icon: "heart",
    color: "#14B8A6",
    terms: ["Ração Golden", "Tapete Higiênico", "Bebedouro Automático", "Areia Higiênica", "Brinquedo Pet"],
  },
  {
    category: "Casa & Cozinha",
    icon: "store",
    color: "#EC4899",
    terms: ["Air Fryer", "Aspirador Robô", "Smart TV"],
  },
  {
    category: "Apple",
    icon: "star",
    color: "var(--text-2)",
    terms: ["iPhone", "AirPods", "Apple Watch"],
  },
] satisfies readonly InterestSuggestionCategory[];

export const POPULAR_INTEREST_SUGGESTIONS = CATEGORY_SUGGESTIONS.flatMap(
  (category) => category.terms,
);
