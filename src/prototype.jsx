import { useState, useEffect, useMemo } from "react";

async function sha256(message) {
  const data = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function useGravatar(email, size = 128) {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    if (!email || !email.trim().includes("@")) { setUrl(null); return; }
    let cancelled = false;
    sha256(email.trim().toLowerCase()).then(hash => {
      if (!cancelled) setUrl(`https://gravatar.com/avatar/${hash}?s=${size}&d=404`);
    });
    return () => { cancelled = true; };
  }, [email, size]);
  return url;
}

function useViewportMaxWidth(maxPx) {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const mq = window.matchMedia(`(max-width: ${maxPx}px)`);
    const onChange = () => setMatches(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [maxPx]);
  return matches;
}

const PRODUCT_VISUALS = {
  drill:      { image: "/assets/products/drill.jpg", gradient: "linear-gradient(135deg, #1e3a5f, #2d6a9f, #1e3a5f)" },
  ps5:        { image: "/assets/products/ps5.jpg", gradient: "linear-gradient(135deg, #0f0f2e, #1a1a4e, #2d1b69)" },
  sneakers:   { image: "/assets/products/sneakers.jpg", gradient: "linear-gradient(135deg, #0f5e47, #1D8F95, #2ab5a0)" },
  headphones: { image: "/assets/products/headphones.jpg", gradient: "linear-gradient(135deg, #1a1a2e, #2c3e50, #34495e)" },
  toolkit:    { image: "/assets/products/toolkit.jpg", gradient: "linear-gradient(135deg, #1b4332, #2d6a4f, #40916c)" },
  speaker:    { image: "/assets/products/speaker.jpg", gradient: "linear-gradient(135deg, #14403a, #1b6b5a, #1D8F95)" },
  echodot:    { image: "/assets/products/echodot.jpg", gradient: "linear-gradient(135deg, #1a1a2e, #2c3e50, #34495e)" },
  controller: { image: "/assets/products/controller.jpg", gradient: "linear-gradient(135deg, #1a1a2e, #2e1065, #4c1d95)" },
  powerdrill: { image: "/assets/products/powerdrill.jpg", gradient: "linear-gradient(135deg, #78590a, #b8860b, #d4a017)" },
};

const MOCK_OPPORTUNITIES = [
  {
    id: 1, name: "Parafusadeira Bosch GSR 12V", marketplace: "Mercado Livre", visual: PRODUCT_VISUALS.drill,
    price: 289.90, originalPrice: 459.90, freight: 12.50, freightFree: false, margin: 38,
    quality: "exceptional", category: "Ferramentas", region: "SC", city: "Palhoça", expires: "2h 15min", hot: true,
    buyUrl: "https://lista.mercadolivre.com.br/parafusadeira-bosch-gsr-12v",
    channelMargins: [
      { channel: "Mercado Livre", marketPrice: 459.90, fee: 0.15, netMargin: 38 },
      { channel: "Shopee",        marketPrice: 449.00, fee: 0.18, netMargin: 31 },
      { channel: "Magazine Luiza",marketPrice: 452.00, fee: 0.16, netMargin: 34 },
    ],
  },
  {
    id: 2, name: "PlayStation 5 Slim Digital", marketplace: "Shopee", visual: PRODUCT_VISUALS.ps5,
    price: 2799.00, originalPrice: 3699.00, freight: 0, freightFree: true, margin: 24,
    quality: "great", category: "Games", region: "SP", city: "São Paulo", expires: "5h 30min", hot: false,
    buyUrl: "https://shopee.com.br/search?keyword=playstation%205%20slim%20digital",
    channelMargins: [
      { channel: "Mercado Livre", marketPrice: 3699.00, fee: 0.15, netMargin: 24 },
      { channel: "Shopee",        marketPrice: 3650.00, fee: 0.18, netMargin: 19 },
      { channel: "Magazine Luiza",marketPrice: 3680.00, fee: 0.16, netMargin: 21 },
    ],
  },
  {
    id: 3, name: "Tênis Nike Air Max 90", marketplace: "Magazine Luiza", visual: PRODUCT_VISUALS.sneakers,
    price: 349.90, originalPrice: 599.90, freight: 18.90, freightFree: false, margin: 42,
    quality: "exceptional", category: "Calçados", region: "SC", city: "Florianópolis", expires: "1h 45min", hot: true,
    buyUrl: "https://www.magazineluiza.com.br/busca/tenis+nike+air+max+90/",
    channelMargins: [
      { channel: "Mercado Livre", marketPrice: 599.90, fee: 0.15, netMargin: 38 },
      { channel: "Shopee",        marketPrice: 589.00, fee: 0.18, netMargin: 33 },
      { channel: "Magazine Luiza",marketPrice: 599.90, fee: 0.16, netMargin: 42 },
    ],
  },
  {
    id: 4, name: "Fone JBL Tune 520BT", marketplace: "Shopee", visual: PRODUCT_VISUALS.headphones,
    price: 149.90, originalPrice: 279.90, freight: 0, freightFree: true, margin: 46,
    quality: "exceptional", category: "Eletrônicos", region: "PR", city: "Curitiba", expires: "3h 10min", hot: true,
    buyUrl: "https://shopee.com.br/search?keyword=fone%20jbl%20tune%20520bt",
    channelMargins: [
      { channel: "Mercado Livre", marketPrice: 279.90, fee: 0.15, netMargin: 38 },
      { channel: "Shopee",        marketPrice: 279.90, fee: 0.18, netMargin: 46 },
      { channel: "Magazine Luiza",marketPrice: 275.00, fee: 0.16, netMargin: 35 },
    ],
  },
  {
    id: 5, name: "Kit Chaves Tramontina Pro 44pcs", marketplace: "Mercado Livre", visual: PRODUCT_VISUALS.toolkit,
    price: 189.90, originalPrice: 329.90, freight: 22.00, freightFree: false, margin: 35,
    quality: "great", category: "Ferramentas", region: "SC", city: "Palhoça", expires: "6h 00min", hot: false,
    buyUrl: "https://lista.mercadolivre.com.br/kit-chaves-tramontina-pro-44",
    channelMargins: [
      { channel: "Mercado Livre", marketPrice: 329.90, fee: 0.15, netMargin: 35 },
      { channel: "Shopee",        marketPrice: 325.00, fee: 0.18, netMargin: 28 },
      { channel: "Magazine Luiza",marketPrice: 330.00, fee: 0.16, netMargin: 32 },
    ],
  },
  {
    id: 6, name: "Echo Dot 5ª Geração", marketplace: "Magazine Luiza", visual: PRODUCT_VISUALS.echodot,
    price: 199.00, originalPrice: 399.00, freight: 0, freightFree: true, margin: 50,
    quality: "exceptional", category: "Eletrônicos", region: "SP", city: "Campinas", expires: "45min", hot: true,
    buyUrl: "https://www.magazineluiza.com.br/busca/echo+dot+5/",
    channelMargins: [
      { channel: "Mercado Livre", marketPrice: 399.00, fee: 0.15, netMargin: 45 },
      { channel: "Shopee",        marketPrice: 399.00, fee: 0.18, netMargin: 50 },
      { channel: "Magazine Luiza",marketPrice: 395.00, fee: 0.16, netMargin: 42 },
    ],
  },
  {
    id: 7, name: "Controle Xbox Series S/X", marketplace: "Shopee", visual: PRODUCT_VISUALS.controller,
    price: 299.90, originalPrice: 449.90, freight: 15.00, freightFree: false, margin: 28,
    quality: "good", category: "Games", region: "RJ", city: "Rio de Janeiro", expires: "4h 20min", hot: false,
    buyUrl: "https://shopee.com.br/search?keyword=controle%20xbox%20series%20x",
    channelMargins: [
      { channel: "Mercado Livre", marketPrice: 449.90, fee: 0.15, netMargin: 28 },
      { channel: "Shopee",        marketPrice: 445.00, fee: 0.18, netMargin: 22 },
      { channel: "Magazine Luiza",marketPrice: 448.00, fee: 0.16, netMargin: 25 },
    ],
  },
  {
    id: 8, name: "Furadeira Dewalt DCD708", marketplace: "Mercado Livre", visual: PRODUCT_VISUALS.powerdrill,
    price: 549.00, originalPrice: 899.00, freight: 0, freightFree: true, margin: 39,
    quality: "exceptional", category: "Ferramentas", region: "SC", city: "Joinville", expires: "2h 50min", hot: false,
    buyUrl: "https://lista.mercadolivre.com.br/furadeira-dewalt-dcd708",
    channelMargins: [
      { channel: "Mercado Livre", marketPrice: 899.00, fee: 0.15, netMargin: 39 },
      { channel: "Shopee",        marketPrice: 885.00, fee: 0.18, netMargin: 32 },
      { channel: "Magazine Luiza",marketPrice: 892.00, fee: 0.16, netMargin: 36 },
    ],
  },
  {
    id: 9, name: "Caixa JBL Flip 6 Bluetooth", marketplace: "Shopee", visual: PRODUCT_VISUALS.speaker,
    price: 429.90, originalPrice: 699.90, freight: 0, freightFree: true, margin: 33,
    quality: "great", category: "Eletrônicos", region: "SC", city: "Palhoça", expires: "3h 40min", hot: true,
    buyUrl: "https://shopee.com.br/search?keyword=caixa%20jbl%20flip%206",
    channelMargins: [
      { channel: "Mercado Livre", marketPrice: 699.90, fee: 0.15, netMargin: 30 },
      { channel: "Shopee",        marketPrice: 699.90, fee: 0.18, netMargin: 33 },
      { channel: "Magazine Luiza",marketPrice: 692.00, fee: 0.16, netMargin: 28 },
    ],
  },
];

/** Canais de revenda do usuário (filtra melhor margem e detalhe por canal). */
const DEFAULT_RESALE_CHANNELS = {
  "Mercado Livre": true,
  "Shopee": true,
  "Magazine Luiza": true,
};

/** Percentuais médios de referência para o modo personalizado (editável). */
const DEFAULT_RESALE_FEE_PCT = {
  "Mercado Livre": 15,
  "Shopee": 18,
  "Magazine Luiza": 16,
};

/** Custo de aquisição: preço do produto + frete estimado. */
function getAcquisitionCost(opp) {
  const f = opp.freightFree ? 0 : (typeof opp.freight === "number" ? opp.freight : 0);
  return opp.price + f;
}

/**
 * Receita líquida estimada no canal = preço médio × (1 − taxa).
 * Retorna margem líquida aproximada sobre o custo de aquisição.
 */
function marginPctFromResaleFees(opp, marketPrice, feeDecimal) {
  const acq = getAcquisitionCost(opp);
  if (acq <= 0 || !marketPrice || marketPrice <= 0) return 0;
  const fd = Math.min(0.99, Math.max(0, feeDecimal));
  const netRev = marketPrice * (1 - fd);
  return Math.round(((netRev - acq) / acq) * 100);
}

function feeDecimalFromProfilePct(channel, profile, fallbackDecimal) {
  if (profile?.resaleMarginMode !== "custom") return fallbackDecimal;
  const raw = profile?.resaleFeePct?.[channel];
  if (raw === undefined || raw === null || raw === "") return fallbackDecimal;
  const n = Number(String(raw).replace(",", "."));
  if (Number.isNaN(n)) return fallbackDecimal;
  return Math.min(0.99, Math.max(0, n / 100));
}

function enrichChannelRow(opp, ch, profile) {
  const baselineFee = typeof ch.fee === "number" ? ch.fee : 0.16;
  if (profile?.resaleMarginMode !== "custom") {
    return { ...ch, fee: baselineFee, netMargin: ch.netMargin };
  }
  const feeDec = feeDecimalFromProfilePct(ch.channel, profile, baselineFee);
  const netMargin = marginPctFromResaleFees(opp, ch.marketPrice, feeDec);
  return { ...ch, fee: feeDec, netMargin };
}

function getResaleChannelMargins(opp, profile) {
  const margins = opp.channelMargins;
  if (!margins?.length) return [];
  const rc = profile?.resaleChannels;
  let list = margins;
  if (rc && typeof rc === "object") {
    const filtered = margins.filter(ch => rc[ch.channel] !== false);
    if (filtered.length) list = filtered;
  }
  return list.map(ch => enrichChannelRow(opp, ch, profile));
}

function getBestChannel(opp, profile) {
  const list = getResaleChannelMargins(opp, profile);
  if (!list.length) return null;
  return list.reduce((a, b) => a.netMargin > b.netMargin ? a : b);
}

function effectiveMargin(opp, profile) {
  return getBestChannel(opp, profile)?.netMargin ?? opp.margin;
}

function ResaleChannelsForm({ value, onChange, compact }) {
  const rows = [
    { channel: "Mercado Livre", label: "Mercado Livre" },
    { channel: "Shopee", label: "Shopee" },
    { channel: "Magazine Luiza", label: "Magazine Luiza" },
  ];
  const activeCount = () => rows.filter(r => value[r.channel] !== false).length;
  const toggle = (channel) => {
    const on = value[channel] !== false;
    if (on && activeCount() <= 1) return;
    onChange({ ...value, [channel]: !on });
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: compact ? 8 : 10 }}>
      {rows.map(({ channel, label }) => {
        const on = value[channel] !== false;
        const mp = marketplaceConfig[channel];
        return (
          <div key={channel} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: compact ? "10px 12px" : "12px 14px", borderRadius: 14,
            border: on ? "1px solid color-mix(in srgb, var(--accent-light) 35%, var(--border))" : "1px solid var(--border)",
            background: on ? "color-mix(in srgb, var(--accent-light) 6%, var(--card))" : "var(--margin-block-bg)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ width: 32, height: 32, borderRadius: 10, background: "#fff", border: "1px solid var(--border)", display: "inline-flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                {mp?.logo ? <img src={mp.logo} alt="" style={{ width: 18, height: 18, objectFit: "contain" }} /> : null}
              </span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)" }}>{label}</div>
                <div style={{ fontSize: 11, color: "var(--text-3)" }}>Incluir na estimativa de margem de revenda</div>
              </div>
            </div>
            <Toggle checked={on} onChange={() => toggle(channel)} />
          </div>
        );
      })}
      <div style={{ fontSize: 11, color: "var(--text-3)", lineHeight: 1.45 }}>
        Pelo menos um canal deve ficar ativo. A melhor margem e o detalhe por canal usam apenas os canais marcados (taxas médias por marketplace).
      </div>
    </div>
  );
}

const INTERESTS = [
  { id: 1, term: "Parafusadeira", active: true },
  { id: 2, term: "PlayStation 5", active: true },
  { id: 3, term: "Tênis Nike", active: true },
  { id: 4, term: "Fone JBL", active: false },
  { id: 5, term: "Echo Dot", active: true },
];

function cloneDefaultInterests() {
  return INTERESTS.map(({ id, term, active }) => ({ id, term, active }));
}

/** Palavras-chave genéricas → categorias do catálogo (aproximação para o protótipo). */
const INTEREST_CATEGORY_HINTS = [
  { re: /ferramenta|furade|parafus|kit chave|chave tramontina/i, categories: ["Ferramentas"] },
  { re: /calçad|tenis|tênis|nike|air max/i, categories: ["Calçados"] },
  { re: /game|playstation|ps5|xbox|controle/i, categories: ["Games"] },
  { re: /eletr|jbl|fone|echo|speaker|caixa|flip|dot/i, categories: ["Eletrônicos"] },
];

function normalizeInterestTerm(t) {
  return String(t || "").trim().toLowerCase();
}

function categoriesSuggestedByInterestTerm(term) {
  const out = new Set();
  for (const row of INTEREST_CATEGORY_HINTS) {
    if (row.re.test(term)) row.categories.forEach(c => out.add(c));
  }
  return [...out];
}

function opportunityMatchesInterest(opp, termRaw) {
  const term = normalizeInterestTerm(termRaw);
  if (!term) return false;
  const name = opp.name.toLowerCase();
  const cat = (opp.category || "").toLowerCase();
  if (name.includes(term)) return true;
  if (cat === term) return true;
  for (const c of categoriesSuggestedByInterestTerm(term)) {
    if ((opp.category || "") === c) return true;
  }
  return false;
}

/** Se não houver termos ativos, não filtra por interesse (mostra o catálogo). */
function opportunityMatchesInterests(opp, interestList) {
  const active = (interestList || []).filter(i => i.active);
  if (!active.length) return true;
  return active.some(i => opportunityMatchesInterest(opp, i.term));
}

function isDomesticBrazilListing(opp) {
  if (opp?.international) return false;
  return true;
}

const HISTORY_PERIOD_OPTIONS = [
  { id: "40d", label: "40 dias" },
  { id: "3m", label: "3 meses" },
  { id: "6m", label: "6 meses" },
  { id: "1y", label: "1 ano" },
];

const HISTORY_AXIS_LABELS = {
  "40d": ["04 mar", "10 mar", "15 mar", "21 mar", "26 mar", "01 abr", "06 abr", "Hoje"],
  "3m": ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "Hoje"],
  "6m": ["nov", "dez", "jan", "fev", "mar", "abr", "mai", "Hoje"],
  "1y": ["jun", "ago", "out", "dez", "fev", "abr", "mai", "Hoje"],
};

const SEARCH_PRICE_HISTORY = {
  Parafusadeira: {
    "40d": [339, 339, 336, 336, 334, 349, 359, 329],
    "3m": [389, 374, 362, 358, 349, 342, 336, 329],
    "6m": [419, 406, 399, 384, 372, 359, 344, 329],
    "1y": [449, 438, 429, 414, 398, 379, 352, 329],
  },
  "PlayStation 5": {
    "40d": [2949, 2929, 2910, 2889, 2869, 2899, 2939, 2799],
    "3m": [3199, 3149, 3099, 3049, 2989, 2939, 2879, 2799],
    "6m": [3399, 3329, 3249, 3179, 3099, 2999, 2899, 2799],
    "1y": [3599, 3499, 3399, 3299, 3199, 3059, 2939, 2799],
  },
  "Tênis Nike": {
    "40d": [439, 429, 418, 412, 406, 399, 379, 349],
    "3m": [499, 482, 465, 449, 428, 406, 389, 349],
    "6m": [539, 519, 499, 482, 458, 432, 398, 349],
    "1y": [589, 569, 549, 518, 486, 454, 409, 349],
  },
  "Fone JBL": {
    "40d": [199, 194, 189, 188, 182, 176, 169, 149],
    "3m": [229, 219, 212, 206, 198, 188, 174, 149],
    "6m": [249, 238, 229, 219, 206, 192, 176, 149],
    "1y": [279, 266, 252, 239, 224, 205, 181, 149],
  },
  "Echo Dot": {
    "40d": [249, 244, 239, 236, 232, 229, 219, 199],
    "3m": [289, 279, 269, 259, 248, 236, 219, 199],
    "6m": [319, 304, 289, 279, 262, 244, 224, 199],
    "1y": [359, 344, 324, 304, 284, 259, 229, 199],
  },
};

const qualityConfig = {
  exceptional: { label: "Excepcional", color: "#B7DB47", icon: "flame" },
  great: { label: "Ótima", color: "#1D8F95", icon: "zap" },
  good: { label: "Boa", color: "#7B42C9", icon: "sparkles" },
};

const marketplaceConfig = {
  "Mercado Livre": { color: "#ffe600", logo: "/assets/marketplaces/mercado-livre.svg" },
  "Shopee": { color: "#ee4d2d", logo: "/assets/marketplaces/shopee.svg" },
  "Magazine Luiza": { color: "#0086ff", logo: "/assets/marketplaces/magalu.svg" },
};

function AppIcon({ name, size = 16, stroke = "currentColor" }) {
  const props = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke,
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    style: { display: "block" },
    "aria-hidden": true,
  };

  const icons = {
    grid: <><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></>,
    star: <path d="m12 3 2.85 5.77 6.37.93-4.61 4.49 1.09 6.34L12 17.77 6.3 20.53l1.09-6.34L2.78 9.7l6.37-.93L12 3z" />,
    bell: <><path d="M10.3 21a1.7 1.7 0 0 0 3.4 0" /><path d="M18.3 16v-5a6.3 6.3 0 1 0-12.6 0v5l-2 2h16z" /></>,
    crown: <path d="m3 8 5 5 4-6 4 6 5-5-2 12H5L3 8z" />,
    flame: <path d="M12 3s4 3.5 4 7.5A4 4 0 0 1 8 10c0-3 1.5-4.5 4-7zM7.5 14A4.5 4.5 0 1 0 16.5 14c0-1.9-1.2-3.2-2.4-4.1-.5 2.4-2 3.1-3.5 3.6-.7.2-1.8.6-3.1.5z" />,
    zap: <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" />,
    sparkles: <><path d="m12 3-1.4 4.3a2 2 0 0 1-1.3 1.3L5 10l4.3 1.4a2 2 0 0 1 1.3 1.3L12 17l1.4-4.3a2 2 0 0 1 1.3-1.3L19 10l-4.3-1.4a2 2 0 0 1-1.3-1.3L12 3z" /><path d="M5 3v3" /><path d="M19 18v3" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    pin: <><path d="M12 21s-6-5.5-6-10a6 6 0 1 1 12 0c0 4.5-6 10-6 10z" /><circle cx="12" cy="11" r="2" /></>,
    truck: <><path d="M10 17H3V6h11v11h-4" /><path d="M14 9h4l3 3v5h-2" /><circle cx="7" cy="17" r="2" /><circle cx="17" cy="17" r="2" /></>,
    globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3a15 15 0 0 1 0 18" /><path d="M12 3a15 15 0 0 0 0 18" /></>,
    map: <><path d="m3 6 6-2 6 2 6-2v14l-6 2-6-2-6 2V6z" /><path d="M9 4v14" /><path d="M15 6v14" /></>,
    target: <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="4" /><circle cx="12" cy="12" r="1" /></>,
    layers: <><path d="m12 3 9 5-9 5-9-5 9-5z" /><path d="m3 12 9 5 9-5" /></>,
    tag: <><path d="M20 12 12 20 4 12V4h8z" /><circle cx="9" cy="9" r="1" /></>,
    percent: <><line x1="19" y1="5" x2="5" y2="19" /><circle cx="7" cy="7" r="2" /><circle cx="17" cy="17" r="2" /></>,
    trophy: <><path d="M8 4h8v4a4 4 0 0 1-8 0z" /><path d="M6 6H4a2 2 0 0 0 0 4h2" /><path d="M18 6h2a2 2 0 0 1 0 4h-2" /><path d="M12 12v4" /><path d="M9 20h6" /></>,
    trend: <polyline points="3 17 9 11 13 15 21 7" />,
    "trending-up": <><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></>,
    arrowUpRight: <><line x1="7" y1="17" x2="17" y2="7" /><polyline points="10 7 17 7 17 14" /></>,
    store: <><path d="M3 9h18" /><path d="M5 9V6h14v3" /><rect x="4" y="9" width="16" height="11" rx="2" /></>,
    bag: <><path d="M6 8h12l-1 12H7L6 8z" /><path d="M9 8a3 3 0 0 1 6 0" /></>,
    cart: <><circle cx="9" cy="19" r="1.8" /><circle cx="17" cy="19" r="1.8" /><path d="M3 5h2l2.4 10h9.8L20 8H7" /></>,
    monitor: <><rect x="3" y="4" width="18" height="12" rx="2" /><line x1="8" y1="20" x2="16" y2="20" /><line x1="12" y1="16" x2="12" y2="20" /></>,
    send: <path d="m3 11 18-8-8 18-2-6-8-4z" />,
    message: <path d="M21 12a8 8 0 0 1-8 8H5l-2 2v-8a8 8 0 1 1 18-2z" />,
    moon: <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4 7 7 0 0 0 20 14.5z" />,
    sun: <><circle cx="12" cy="12" r="4" /><line x1="12" y1="2" x2="12" y2="5" /><line x1="12" y1="19" x2="12" y2="22" /><line x1="2" y1="12" x2="5" y2="12" /><line x1="19" y1="12" x2="22" y2="12" /></>,
    plus: <><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>,
    minus: <line x1="5" y1="12" x2="19" y2="12" />,
    chevronDown: <polyline points="6 9 12 15 18 9" />,
    chevronUp: <polyline points="6 15 12 9 18 15" />,
    info: <><circle cx="12" cy="12" r="9" /><line x1="12" y1="10" x2="12" y2="16" /><circle cx="12" cy="7" r="1" fill="currentColor" stroke="none" /></>,
    x: <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>,
    check: <polyline points="20 6 9 17 4 12" />,
    fire: <path d="M12 3s4 3.5 4 7.5A4 4 0 0 1 8 10c0-3 1.5-4.5 4-7zM7.5 14A4.5 4.5 0 1 0 16.5 14c0-1.9-1.2-3.2-2.4-4.1-.5 2.4-2 3.1-3.5 3.6-.7.2-1.8.6-3.1.5z" />,
    "log-out": <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></>,
  };

  return <svg {...props}>{icons[name] || icons.sparkles}</svg>;
}

function Badge({ children, variant = "default", style: s }) {
  const variants = {
    default: { bg: "var(--badge-default-bg)", color: "var(--badge-default-color)", border: "1px solid var(--badge-default-border)" },
    accent: { bg: "color-mix(in srgb, var(--accent) 12%, transparent)", color: "var(--accent)", border: "1px solid color-mix(in srgb, var(--accent) 26%, transparent)" },
    success: { bg: "color-mix(in srgb, var(--success) 14%, transparent)", color: "var(--success)", border: "1px solid color-mix(in srgb, var(--success) 30%, transparent)" },
    pro: { bg: "color-mix(in srgb, var(--accent) 12%, transparent)", color: "var(--accent-dark)", border: "1px solid color-mix(in srgb, var(--accent) 24%, transparent)" },
  };
  const v = variants[variant] || variants.default;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "4px 10px", borderRadius: 8, fontSize: 11, fontWeight: 600,
      color: v.color, background: v.bg, border: v.border,
      letterSpacing: "0.03em", whiteSpace: "nowrap", backdropFilter: "blur(8px)", ...s,
    }}>{children}</span>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <button onClick={onChange} style={{
      width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer",
      background: checked ? "var(--accent)" : "var(--toggle-off)",
      position: "relative", transition: "background 0.2s",
    }}>
      <span style={{
        position: "absolute", top: 2, left: checked ? 22 : 2,
        width: 20, height: 20, borderRadius: "50%", background: "#fff",
        transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
      }} />
    </button>
  );
}

function Chip({ label, active, onClick, icon }) {
  return (
    <button onClick={onClick} style={{
      padding: "7px 14px", borderRadius: 10, cursor: "pointer",
      fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 600,
      display: "inline-flex", alignItems: "center", gap: 5,
      transition: "all 0.2s",
      background: active ? "color-mix(in srgb, var(--accent) 10%, transparent)" : "var(--chip-bg)",
      color: active ? "var(--accent-dark)" : "var(--text-3)",
      border: active ? "1px solid color-mix(in srgb, var(--accent) 26%, transparent)" : "1px solid var(--chip-border)",
    }}>
      {icon && <span style={{ display: "inline-flex", alignItems: "center" }}>{typeof icon === "string" ? <AppIcon name={icon} size={14} /> : icon}</span>}{label}
    </button>
  );
}

function StatCard({ label, value, sub, icon, accent = "var(--accent)", trend, progress = 60, trendColor, trendBackground, trendBorder }) {
  return (
    <div style={{
      background: "var(--card)", borderRadius: 18, padding: "16px",
      border: "1px solid var(--border)", minWidth: 180,
      position: "relative", overflow: "hidden", boxShadow: "var(--card-shadow)",
    }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "color-mix(in srgb, var(--accent-light) 40%, transparent)" }} />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 14 }}>
        <span style={{ fontSize: 10, color: "var(--text-3)", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>{label}</span>
        {trend && (
          <span style={{
            fontSize: 11,
            color: trendColor || accent,
            background: trendBackground || `color-mix(in srgb, ${accent} 14%, transparent)`,
            border: trendBorder || `1px solid color-mix(in srgb, ${accent} 30%, transparent)`,
            borderRadius: 999,
            padding: "4px 8px",
            fontWeight: 700,
          }}>
            {trend}
          </span>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 34, fontWeight: 800, color: "var(--text-1)", fontFamily: "var(--font-mono)", lineHeight: 1 }}>{value}</div>
          {sub && <div style={{ fontSize: 12, color: "var(--text-2)", marginTop: 6 }}>{sub}</div>}
        </div>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: `color-mix(in srgb, ${accent} 16%, transparent)`, border: `1px solid color-mix(in srgb, ${accent} 30%, transparent)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {typeof icon === "string" ? <AppIcon name={icon} size={18} stroke={accent} /> : icon}
        </div>
      </div>

      <div style={{ height: 5, borderRadius: 999, background: "var(--margin-bar-bg)", overflow: "hidden" }}>
        <div style={{ width: `${Math.min(100, Math.max(8, progress))}%`, height: "100%", borderRadius: 999, background: accent }} />
      </div>
    </div>
  );
}

// ─── Product Card ─────────────────────────────────

function ProductCard({ opp, index, bought, onToggleBought, freightCap, onSelect, profile, onDismiss }) {
  const [hovered, setHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const q = qualityConfig[opp.quality];
  const discount = Math.round((1 - opp.price / opp.originalPrice) * 100);
  const profit = opp.originalPrice - opp.price - (opp.freightFree ? 0 : opp.freight);
  const urgent = opp.expires.includes("min") && !opp.expires.includes("h");
  const mp = marketplaceConfig[opp.marketplace];
  const aboveFreightCap = !opp.freightFree && opp.freight > freightCap;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "var(--card)", borderRadius: 20, overflow: "hidden",
        border: bought ? "1px solid color-mix(in srgb, var(--success) 45%, var(--border))" : "1px solid var(--border)",
        transition: "transform 0.35s cubic-bezier(.2,.8,.3,1), box-shadow 0.35s cubic-bezier(.2,.8,.3,1)",
        transform: hovered ? "translateY(-6px)" : "translateY(0)",
        boxShadow: hovered ? "var(--card-shadow-hover)" : "var(--card-shadow)",
        animation: `cardIn 0.5s cubic-bezier(.2,.8,.3,1) ${index * 70}ms both`,
        cursor: "pointer", position: "relative",
      }}
    >
      {/* Bought bookmark */}
      {bought && (
        <div style={{ position: "absolute", top: 0, right: 16, zIndex: 2, width: 28, height: 36, background: "var(--success)", clipPath: "polygon(0 0, 100% 0, 100% 100%, 50% 75%, 0 100%)", display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 6 }}>
          <AppIcon name="check" size={12} stroke="#fff" />
        </div>
      )}

      {/* Quick dismiss */}
      {typeof onDismiss === "function" && (
        <button
          onClick={(e) => { e.stopPropagation(); onDismiss(opp.id); }}
          title="Ocultar esta oferta"
          style={{
            position: "absolute", top: 8, right: bought ? 50 : 8, zIndex: 3,
            width: 28, height: 28, borderRadius: "50%", border: "none",
            background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)",
            color: "#fff", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            opacity: hovered ? 1 : 0.5, transition: "opacity 0.2s",
          }}
        >
          <AppIcon name="x" size={14} stroke="#fff" />
        </button>
      )}

      {/* Visual */}
      <div onClick={onSelect} style={{ position: "relative", height: 170, overflow: "hidden", background: "var(--margin-block-bg)", cursor: "pointer" }}>
        {!imageLoaded && (
          <div style={{ position: "absolute", inset: 0, background: "var(--margin-block-bg)" }}>
            <div style={{ position: "absolute", inset: 0, background: "color-mix(in srgb, var(--chip-border) 35%, var(--margin-block-bg))", animation: "skeletonPulse 1.6s ease-in-out infinite" }} />
            <div style={{
              position: "absolute", top: 0, bottom: 0, left: "-45%", width: "45%",
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.38), transparent)",
              animation: "skeletonShimmer 1.25s ease-in-out infinite",
            }} />
          </div>
        )}
        <img
          src={opp.visual.image}
          alt={opp.name}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageLoaded(true)}
          style={{
            position: "absolute", inset: 0,
            width: "100%", height: "100%", objectFit: "cover",
            transition: "transform 0.5s cubic-bezier(.2,.8,.3,1), opacity 0.25s ease",
            transform: hovered ? "scale(1.08)" : "scale(1)",
            opacity: imageLoaded ? 1 : 0,
          }}
        />
        {/* Noise texture */}
        <div style={{
          position: "absolute", inset: 0, opacity: imageLoaded ? 0.05 : 0,
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          backgroundSize: "128px 128px",
        }} />
        {/* Bottom gradient */}
        <div style={{ position: "absolute", inset: 0, background: imageLoaded ? "rgba(10,10,15,0.28)" : "transparent" }} />

        {/* Top badges */}
        <div style={{ position: "absolute", top: 12, left: 12, right: 12, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <span style={{
              background: "rgba(0,0,0,0.55)", backdropFilter: "blur(12px)",
              color: mp.color, padding: "5px 10px", borderRadius: 8,
              fontSize: 11, fontWeight: 700, border: `1px solid ${mp.color}33`, letterSpacing: "0.04em",
              display: "inline-flex", alignItems: "center", gap: 6,
            }}>
              <span style={{ width: 16, height: 16, borderRadius: 4, background: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                <img src={mp.logo} alt={opp.marketplace} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </span>
              {opp.marketplace}
            </span>
            {opp.hot && (
              <span style={{
                background: "rgba(239,68,68,0.2)", backdropFilter: "blur(12px)",
                color: "var(--danger)", padding: "5px 10px", borderRadius: 8,
                fontSize: 11, fontWeight: 700, border: "1px solid rgba(239,68,68,0.2)",
                animation: "pulse 2s infinite",
                display: "inline-flex", alignItems: "center", gap: 4,
              }}><AppIcon name="fire" size={12} stroke="var(--danger)" /> HOT</span>
            )}
          </div>
          <span style={{
            background: "var(--accent)", color: "#fff",
            padding: "6px 12px", borderRadius: 10,
            fontSize: 14, fontWeight: 800, fontFamily: "var(--font-mono)",
            boxShadow: "0 4px 16px color-mix(in srgb, var(--accent) 38%, transparent)",
          }}>-{discount}%</span>
        </div>

        {/* Bottom timer + region */}
        <div style={{ position: "absolute", bottom: 12, left: 12, right: 12, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            background: urgent ? "rgba(239,68,68,0.25)" : "rgba(0,0,0,0.45)", backdropFilter: "blur(12px)",
            color: urgent ? "var(--danger)" : "rgba(255,255,255,0.8)",
            padding: "5px 10px", borderRadius: 8, fontSize: 11, fontWeight: 600,
            border: urgent ? "1px solid rgba(239,68,68,0.3)" : "1px solid rgba(255,255,255,0.08)",
            animation: urgent ? "pulse 1.5s infinite" : "none",
          }}><AppIcon name="clock" size={12} stroke={urgent ? "var(--danger)" : "rgba(255,255,255,0.8)"} /> {opp.expires}</span>
          <span style={{
            background: "rgba(0,0,0,0.45)", backdropFilter: "blur(12px)",
            color: "rgba(255,255,255,0.7)", padding: "5px 10px", borderRadius: 8,
            fontSize: 11, fontWeight: 500, border: "1px solid rgba(255,255,255,0.06)",
            display: "inline-flex", alignItems: "center", gap: 4,
          }}><AppIcon name="pin" size={12} stroke="rgba(255,255,255,0.7)" /> {opp.region}</span>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "16px 18px 18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 14 }}>
          <h3 onClick={onSelect} style={{
            fontSize: 15, fontWeight: 700, color: "var(--text-1)", lineHeight: 1.35, margin: 0, flex: 1,
            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", cursor: "pointer",
          }}>{opp.name}</h3>
          <span style={{
            fontSize: 11, fontWeight: 700, color: q.color,
            background: `${q.color}18`, padding: "4px 8px", borderRadius: 6,
            border: `1px solid ${q.color}25`, whiteSpace: "nowrap", flexShrink: 0,
            display: "inline-flex", alignItems: "center", gap: 4,
          }}><AppIcon name={q.icon} size={12} stroke={q.color} /> {q.label}</span>
        </div>

        {/* Prices */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 14 }}>
          <span style={{ fontSize: 26, fontWeight: 800, color: "var(--text-1)", fontFamily: "var(--font-mono)", letterSpacing: "-0.02em", lineHeight: 1 }}>
            R$ {opp.price.toFixed(2).replace(".", ",")}
          </span>
          <span style={{ fontSize: 14, color: "var(--text-3)", textDecoration: "line-through", fontFamily: "var(--font-mono)" }}>
            R$ {opp.originalPrice.toFixed(2).replace(".", ",")}
          </span>
        </div>

        {/* Margin block */}
        {(() => {
          const best = getBestChannel(opp, profile);
          const displayMargin = best ? best.netMargin : opp.margin;
          return (
            <div style={{
              background: "var(--margin-block-bg)", borderRadius: 12, padding: "12px 14px",
              border: "1px solid var(--border)", marginBottom: 14,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 500 }}>Melhor revenda via</span>
                  {best && marketplaceConfig[best.channel]?.logo && (
                    <span style={{ width: 14, height: 14, borderRadius: 3, background: "#fff", border: "1px solid var(--border)", display: "inline-flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                      <img src={marketplaceConfig[best.channel].logo} alt={best.channel} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </span>
                  )}
                  <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-1)" }}>{best?.channel ?? "—"}</span>
                </div>
                <span style={{ fontSize: 16, fontWeight: 800, color: "var(--success)", fontFamily: "var(--font-mono)" }}>{displayMargin}%</span>
              </div>
              <div style={{ height: 4, background: "var(--margin-bar-bg)", borderRadius: 2, overflow: "hidden", marginBottom: 8 }}>
                <div style={{
                  height: "100%", borderRadius: 2, transition: "width 0.8s cubic-bezier(.2,.8,.3,1)",
                  width: `${Math.min(displayMargin * 2, 100)}%`,
                  background: displayMargin >= 40 ? "#B7DB47" : displayMargin >= 25 ? "#1D8F95" : "#7B42C9",
                }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, color: "var(--text-3)" }}>
                  Lucro est. <strong style={{ color: "var(--success)" }}>R$ {profit.toFixed(2).replace(".", ",")}</strong>
                </span>
                {opp.freightFree && <span style={{ fontSize: 11, fontWeight: 700, color: "var(--success)", display: "inline-flex", alignItems: "center", gap: 4 }}><AppIcon name="check" size={11} stroke="var(--success)" /> Frete grátis</span>}
                {!opp.freightFree && !aboveFreightCap && <span style={{ fontSize: 11, color: "var(--text-3)" }}>Frete R$ {opp.freight.toFixed(2).replace(".", ",")}</span>}
                {!opp.freightFree && aboveFreightCap && <span style={{ fontSize: 11, fontWeight: 700, color: "var(--danger)" }}>Frete acima do teto</span>}
              </div>
            </div>
          );
        })()}

        {/* CTA row */}
        <div style={{ display: "flex", gap: 8, alignItems: "stretch" }}>
          <a
            href={opp.buyUrl}
            target="_blank"
            rel="noreferrer"
            style={{
              flex: 1, padding: "11px 0", borderRadius: 12,
              background: hovered ? "var(--accent)" : "color-mix(in srgb, var(--accent) 10%, transparent)",
              color: hovered ? "#fff" : "var(--accent-dark)",
              fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)",
              transition: "all 0.3s cubic-bezier(.2,.8,.3,1)",
              border: hovered ? "1px solid transparent" : "1px solid color-mix(in srgb, var(--accent) 24%, transparent)",
              display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none",
            }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
              Comprar <AppIcon name="arrowUpRight" size={13} stroke={hovered ? "#fff" : "var(--accent-dark)"} />
            </span>
          </a>
          <button
            onClick={(e) => { e.stopPropagation(); onToggleBought(opp.id); }}
            title={bought ? "Desmarcar como comprada" : "Marcar como comprada"}
            aria-label={bought ? "Desmarcar como comprada" : "Marcar como comprada"}
            style={{
              padding: "0 12px", borderRadius: 12, flexShrink: 0,
              border: bought ? "1px solid color-mix(in srgb, var(--success) 45%, var(--border))" : "1px solid var(--border)",
              background: bought ? "color-mix(in srgb, var(--success) 12%, transparent)" : "transparent",
              color: bought ? "var(--success)" : "var(--text-3)",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
              fontSize: 11, fontWeight: 700, fontFamily: "var(--font-body)",
              transition: "all 0.2s",
            }}
          >
            <AppIcon name={bought ? "check" : "bag"} size={14} stroke={bought ? "var(--success)" : "var(--text-3)"} />
            {bought ? "Comprada" : "Comprei"}
          </button>
        </div>
      </div>
    </div>
  );
}

function MiniSparkline({ values, width = 80, height = 32, color = "var(--accent-light)" }) {
  if (!values || values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(1, max - min);
  const pad = range * 0.15;
  const points = values.map((v, i) => ({
    x: (i / (values.length - 1)) * width,
    y: height - ((v - min + pad) / (range + pad * 2)) * height,
  }));
  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const area = `${line} L${width},${height} L0,${height} Z`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: "block" }}>
      <defs><linearGradient id={`spark-${color.replace(/[^a-z0-9]/gi, "")}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.25" /><stop offset="100%" stopColor={color} stopOpacity="0.03" /></linearGradient></defs>
      <path d={area} fill={`url(#spark-${color.replace(/[^a-z0-9]/gi, "")})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="3" fill="var(--card)" stroke={color} strokeWidth="2" />
    </svg>
  );
}

function SearchHistoryPanel({ expanded, onToggle, interests }) {
  const list = interests?.length ? interests : INTERESTS;
  const trackedTerms = list.filter(i => i.active).map(i => i.term);
  const fallbackTerm = trackedTerms[0] || list[0]?.term || "Parafusadeira";
  const [selectedTerm, setSelectedTerm] = useState(fallbackTerm);
  const [period, setPeriod] = useState("40d");
  const [notifyWhenDrops, setNotifyWhenDrops] = useState(true);

  const safeTerm = SEARCH_PRICE_HISTORY[selectedTerm] ? selectedTerm : fallbackTerm;
  const labels = HISTORY_AXIS_LABELS[period];
  const values = SEARCH_PRICE_HISTORY[safeTerm][period] || [];
  const points = labels.map((label, index) => ({ label, value: values[index] ?? values[values.length - 1] ?? 0 }));

  const currentPrice = points[points.length - 1]?.value || 0;
  const averagePrice = points.reduce((sum, p) => sum + p.value, 0) / (points.length || 1);
  const minPrice = Math.min(...points.map(p => p.value));
  const maxPrice = Math.max(...points.map(p => p.value));
  const spread = Math.max(1, maxPrice - minPrice);
  const paddedMin = Math.max(0, minPrice - spread * 0.25);
  const paddedMax = maxPrice + spread * 0.2;

  const chartWidth = 760;
  const chartHeight = 288;
  const margin = { top: 16, right: 14, bottom: 36, left: 58 };
  const innerWidth = chartWidth - margin.left - margin.right;
  const innerHeight = chartHeight - margin.top - margin.bottom;

  const coords = points.map((p, index) => ({
    x: margin.left + (index / Math.max(1, points.length - 1)) * innerWidth,
    y: margin.top + (1 - (p.value - paddedMin) / Math.max(1, paddedMax - paddedMin)) * innerHeight,
    value: p.value,
    label: p.label,
  }));

  const linePath = coords.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = coords.length
    ? `${linePath} L ${coords[coords.length - 1].x} ${chartHeight - margin.bottom} L ${coords[0].x} ${chartHeight - margin.bottom} Z`
    : "";

  const latest = coords[coords.length - 1] || { x: margin.left, y: chartHeight - margin.bottom };
  const bubbleX = Math.min(chartWidth - 176, Math.max(margin.left + 10, latest.x - 72));
  const bubbleY = Math.max(margin.top + 8, latest.y - 74);
  const ticks = Array.from({ length: 4 }, (_, i) => {
    const ratio = i / 3;
    return {
      y: margin.top + ratio * innerHeight,
      value: paddedMax - ratio * (paddedMax - paddedMin),
    };
  });

  const score = (currentPrice - minPrice) / Math.max(1, maxPrice - minPrice);
  const markerPosition = Math.min(94, Math.max(6, score * 100));
  const rangeLabel = HISTORY_PERIOD_OPTIONS.find(option => option.id === period)?.label || "40 dias";

  let priceTone = { label: "bom", color: "var(--info)" };
  if (currentPrice <= averagePrice * 0.95) priceTone = { label: "ótimo", color: "var(--success)" };
  if (currentPrice >= averagePrice * 1.07) priceTone = { label: "alto", color: "var(--warning)" };

  const formatBRL = value => `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const getTermTrend = (term) => {
    const data = SEARCH_PRICE_HISTORY[term];
    if (!data) return { values: [], drop: 0, current: 0, tone: "var(--info)" };
    const vals = data["40d"] || [];
    const first = vals[0] || 0;
    const last = vals[vals.length - 1] || 0;
    const avg = vals.reduce((s, v) => s + v, 0) / (vals.length || 1);
    const dropPct = first > 0 ? Math.round(((first - last) / first) * 100) : 0;
    let tone = "var(--info)";
    if (last <= avg * 0.95) tone = "var(--success)";
    if (last >= avg * 1.07) tone = "var(--warning)";
    return { values: vals, drop: dropPct, current: last, tone };
  };

  return (
    <div style={{ background: "var(--card)", borderRadius: 18, border: "1px solid var(--border)", overflow: "hidden", marginBottom: 16, boxShadow: "var(--card-shadow)" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, padding: "14px 16px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: "color-mix(in srgb, var(--accent-light) 14%, transparent)", border: "1px solid color-mix(in srgb, var(--accent-light) 28%, transparent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <AppIcon name="trend" size={16} stroke="var(--accent-light)" />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)" }}>Tendência de Preços</div>
            <div style={{ fontSize: 11, color: "var(--text-3)" }}>{trackedTerms.length} produtos monitorados</div>
          </div>
        </div>
        <button
          onClick={onToggle}
          style={{
            border: "1px solid color-mix(in srgb, var(--accent) 22%, var(--border))",
            background: expanded ? "color-mix(in srgb, var(--accent) 12%, var(--chip-bg))" : "var(--chip-bg)",
            color: "var(--accent-dark)", borderRadius: 10, padding: "7px 12px",
            fontSize: 12, fontWeight: 700, cursor: "pointer",
            display: "inline-flex", alignItems: "center", gap: 6,
          }}
        >
          {expanded ? "Recolher" : "Ver gráfico completo"}
          <AppIcon name={expanded ? "chevronUp" : "chevronDown"} size={13} stroke="var(--accent-dark)" />
        </button>
      </div>

      {/* Trend cards strip - always visible */}
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${trackedTerms.length}, 1fr)`, gap: 0, borderTop: "1px solid var(--border)" }}>
        {trackedTerms.map((term, idx) => {
          const trend = getTermTrend(term);
          const isSelected = term === safeTerm && expanded;
          return (
            <button
              key={term}
              onClick={() => { setSelectedTerm(term); if (!expanded) onToggle(); }}
              style={{
                padding: "14px 16px", cursor: "pointer", border: "none",
                borderRight: idx < trackedTerms.length - 1 ? "1px solid var(--border)" : "none",
                background: isSelected ? "color-mix(in srgb, var(--accent) 6%, var(--card))" : "transparent",
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
                fontFamily: "var(--font-body)", transition: "background 0.15s",
              }}
            >
              <div style={{ textAlign: "left", minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{term}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-1)", fontFamily: "var(--font-mono)", lineHeight: 1.2, marginTop: 2 }}>
                  {formatBRL(trend.current)}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
                  {trend.drop > 0 ? (
                    <span style={{ fontSize: 11, fontWeight: 700, color: "var(--success)", display: "inline-flex", alignItems: "center", gap: 2 }}>
                      <AppIcon name="trend" size={10} stroke="var(--success)" /> -{trend.drop}%
                    </span>
                  ) : (
                    <span style={{ fontSize: 11, fontWeight: 700, color: "var(--warning)", display: "inline-flex", alignItems: "center", gap: 2 }}>
                      <AppIcon name="arrowUpRight" size={10} stroke="var(--warning)" /> +{Math.abs(trend.drop)}%
                    </span>
                  )}
                  <span style={{ fontSize: 10, color: "var(--text-3)" }}>40d</span>
                </div>
              </div>
              <MiniSparkline values={trend.values} width={70} height={36} color={trend.drop > 0 ? "var(--success)" : "var(--warning)"} />
            </button>
          );
        })}
      </div>

      {/* Expanded chart */}
      {expanded && (
        <div style={{ borderTop: "1px solid var(--border)", padding: 16 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
            {trackedTerms.map(term => (
              <button
                key={term}
                onClick={() => setSelectedTerm(term)}
                style={{
                  borderRadius: 10,
                  border: term === safeTerm ? "1px solid color-mix(in srgb, var(--accent) 34%, transparent)" : "1px solid var(--chip-border)",
                  background: term === safeTerm ? "color-mix(in srgb, var(--accent) 11%, transparent)" : "var(--chip-bg)",
                  color: term === safeTerm ? "var(--accent-dark)" : "var(--text-3)",
                  padding: "8px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer",
                }}
              >{term}</button>
            ))}
          </div>

          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
            <div style={{ background: "var(--margin-block-bg)", border: "1px solid var(--border)", borderRadius: 16, padding: 12 }}>
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{ width: "100%", height: 280, display: "block" }}>
                <defs>
                  <linearGradient id="historyFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="color-mix(in srgb, var(--accent-light) 28%, transparent)" />
                    <stop offset="100%" stopColor="color-mix(in srgb, var(--accent-light) 4%, transparent)" />
                  </linearGradient>
                </defs>
                {ticks.map((tick, index) => (
                  <g key={index}>
                    <line x1={margin.left} y1={tick.y} x2={chartWidth - margin.right} y2={tick.y} stroke="var(--border)" strokeWidth="1" />
                    <text x={10} y={tick.y + 4} fill="var(--text-3)" fontSize="12">{Math.round(tick.value)}</text>
                  </g>
                ))}
                <line x1={latest.x} y1={margin.top} x2={latest.x} y2={chartHeight - margin.bottom} stroke="var(--border)" strokeWidth="1" strokeDasharray="6 4" />
                <path d={areaPath} fill="url(#historyFill)" />
                <path d={linePath} fill="none" stroke="var(--accent-light)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx={latest.x} cy={latest.y} r="6" fill="var(--card)" stroke="var(--accent-light)" strokeWidth="3" />
                <g transform={`translate(${bubbleX}, ${bubbleY})`}>
                  <rect width="166" height="58" rx="10" fill="var(--card)" stroke="var(--border)" />
                  <text x="12" y="25" fill="var(--text-1)" fontSize="16" fontWeight="700">{formatBRL(currentPrice)}</text>
                  <text x="12" y="43" fill="var(--text-3)" fontSize="11">agora</text>
                </g>
                {coords.map((point, index) => (
                  <text key={index} x={point.x} y={chartHeight - 10} fill="var(--text-3)" fontSize="11" textAnchor="middle">{point.label}</text>
                ))}
              </svg>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                {HISTORY_PERIOD_OPTIONS.map(option => (
                  <button key={option.id} onClick={() => setPeriod(option.id)} style={{
                    borderRadius: 999,
                    border: period === option.id ? "1px solid transparent" : "1px solid var(--border)",
                    background: period === option.id ? "var(--text-1)" : "transparent",
                    color: period === option.id ? "var(--card)" : "var(--text-2)",
                    padding: "8px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer",
                  }}>{option.label}</button>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ background: "var(--margin-block-bg)", border: "1px solid var(--border)", borderRadius: 14, padding: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-1)" }}>O preço está <span style={{ color: priceTone.color }}>{priceTone.label}</span></div>
                  <div style={{ color: "var(--text-3)", display: "inline-flex", alignItems: "center" }}><AppIcon name="info" size={16} /></div>
                </div>
                <div style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.5, marginBottom: 12 }}>
                  Com base nos últimos {rangeLabel}, o valor atual está perto da média de {formatBRL(averagePrice)}.
                </div>
                <div style={{ position: "relative", paddingTop: 12 }}>
                  <div style={{ height: 6, borderRadius: 999, background: "var(--margin-bar-bg)" }} />
                  <div style={{ position: "absolute", top: 2, left: `calc(${markerPosition}% - 6px)`, width: 12, height: 12, borderRadius: "50%", background: "var(--card)", border: `2px solid ${priceTone.color}` }} />
                  <div style={{ position: "absolute", top: -6, left: `calc(${markerPosition}% - 7px)`, width: 0, height: 0, borderLeft: "7px solid transparent", borderRight: "7px solid transparent", borderBottom: `9px solid ${priceTone.color}` }} />
                </div>
              </div>

              <div style={{ background: "var(--margin-block-bg)", border: "1px solid var(--border)", borderRadius: 14, padding: 14, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-1)", marginBottom: 4 }}>Quer pagar mais barato?</div>
                  <div style={{ fontSize: 13, color: "var(--text-3)" }}>Avisamos quando o preço cair para {safeTerm}.</div>
                </div>
                <Toggle checked={notifyWhenDrops} onChange={() => setNotifyWhenDrops(v => !v)} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Product Detail Modal ─────────────────────────

function ProductDetailModal({ opp, bought, onToggleBought, onClose, freightCap, profile, onDismissProduct }) {
  const [channelExpanded, setChannelExpanded] = useState(false);
  if (!opp) return null;
  const q = qualityConfig[opp.quality];
  const discount = Math.round((1 - opp.price / opp.originalPrice) * 100);
  const freightCost = opp.freightFree ? 0 : opp.freight;
  const acqTotal = getAcquisitionCost(opp);
  const best = getBestChannel(opp, profile);
  const channelRows = getResaleChannelMargins(opp, profile);
  const profit = best
    ? Math.round((best.marketPrice * (1 - best.fee) - acqTotal) * 100) / 100
    : opp.originalPrice - acqTotal;
  const netMargin = best ? best.netMargin : Math.round(((opp.originalPrice - acqTotal) / opp.originalPrice) * 100);
  const mp = marketplaceConfig[opp.marketplace];

  const termKey = Object.keys(SEARCH_PRICE_HISTORY).find(k => opp.name.toLowerCase().includes(k.toLowerCase()));
  const historyValues = termKey ? SEARCH_PRICE_HISTORY[termKey]["3m"] : null;

  const details = [
    { label: "Preco de compra", value: `R$ ${opp.price.toFixed(2).replace(".", ",")}`, color: "var(--accent-light)", icon: "tag", bold: true },
    { label: "Frete de compra", value: opp.freightFree ? "Gratis" : `R$ ${opp.freight.toFixed(2).replace(".", ",")}`, color: opp.freightFree ? "var(--success)" : (opp.freight > freightCap ? "var(--danger)" : "var(--text-2)"), icon: "truck" },
    { label: "Custo de aquisicao", value: `R$ ${acqTotal.toFixed(2).replace(".", ",")}`, color: "var(--text-2)", icon: "dollar-sign", bold: true },
    { label: "Desconto detectado", value: `-${discount}%`, color: "var(--accent-light)", icon: "percent" },
    { label: "Melhor canal de revenda", value: best ? `${best.channel} — ${best.netMargin}%` : `${netMargin}%`, color: "var(--success)", icon: "trending-up", bold: true },
    { label: "Lucro estimado", value: `R$ ${profit.toFixed(2).replace(".", ",")}`, color: "var(--success)", icon: "bar-chart", bold: true },
    { label: "Validade estimada", value: opp.expires, color: "var(--warning)", icon: "clock" },
    { label: "Regiao do vendedor", value: `${opp.city}, ${opp.region}`, color: "var(--text-2)", icon: "pin" },
    { label: "Categoria", value: opp.category, color: "var(--text-2)", icon: "grid" },
  ];

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "72px 16px 24px", overflow: "auto", animation: "fadeIn 0.2s ease" }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "var(--card)", borderRadius: 24, border: "1px solid var(--border)", boxShadow: "0 24px 64px rgba(0,0,0,0.25)",
        width: "100%", maxWidth: 520, flexShrink: 0, position: "relative",
        display: "flex", flexDirection: "column", maxHeight: "calc(100vh - 96px)", overflow: "hidden",
      }}>
        {/* Hero image */}
        <div style={{ position: "relative", height: 200, overflow: "hidden", borderRadius: "24px 24px 0 0", background: opp.visual.gradient }}>
          <img src={opp.visual.image} alt={opp.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 80, background: "linear-gradient(to top, var(--card), transparent)", pointerEvents: "none" }} />
          <button onClick={onClose} style={{ position: "absolute", top: 12, right: 12, zIndex: 10, width: 36, height: 36, borderRadius: 10, border: "1px solid rgba(255,255,255,0.2)", background: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <AppIcon name="x" size={16} stroke="#fff" />
          </button>
          <div style={{ position: "absolute", top: 12, left: 12, display: "flex", gap: 6 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 8, background: "var(--glass-strong)", backdropFilter: "blur(8px)", fontSize: 11, fontWeight: 700, border: "1px solid var(--border)" }}>
              <span style={{ width: 16, height: 16, borderRadius: 4, background: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                {mp?.logo ? <img src={mp.logo} alt="" style={{ width: 12, height: 12, objectFit: "contain" }} /> : null}
              </span>
              {opp.marketplace}
            </span>
            {opp.hot && <span style={{ padding: "4px 10px", borderRadius: 8, background: "var(--glass-strong)", backdropFilter: "blur(8px)", fontSize: 11, fontWeight: 700, color: "var(--danger)" }}>HOT</span>}
          </div>
          <div style={{ position: "absolute", bottom: 16, left: 16 }}>
            <span style={{ padding: "5px 12px", borderRadius: 8, background: "var(--accent)", color: "#fff", fontSize: 16, fontWeight: 800, fontFamily: "var(--font-mono)" }}>-{discount}%</span>
          </div>
        </div>

        <div style={{ padding: "16px 20px 20px", overflowY: "auto", flex: 1 }}>
          {/* Title and quality */}
          <div style={{ marginBottom: 14 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-1)", margin: "0 0 6px", lineHeight: 1.3 }}>{opp.name}</h2>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Badge variant="success"><AppIcon name={q?.icon || "zap"} size={10} stroke={q?.color} /> {q?.label || opp.quality}</Badge>
              {bought && <Badge variant="success"><AppIcon name="check" size={10} stroke="var(--success)" /> Comprada</Badge>}
              {opp.freightFree && <Badge><AppIcon name="truck" size={10} /> Frete gratis</Badge>}
            </div>
          </div>

          {/* Price highlight */}
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 16, padding: "14px 16px", borderRadius: 14, background: "var(--margin-block-bg)", border: "1px solid var(--border)" }}>
            <span style={{ fontSize: 28, fontWeight: 800, color: "var(--text-1)", fontFamily: "var(--font-mono)", lineHeight: 1 }}>R$ {opp.price.toFixed(2).replace(".", ",")}</span>
            <span style={{ fontSize: 14, color: "var(--text-3)", textDecoration: "line-through", fontFamily: "var(--font-mono)" }}>R$ {opp.originalPrice.toFixed(2).replace(".", ",")}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--success)", marginLeft: "auto" }}>
              Economia R$ {(opp.originalPrice - opp.price).toFixed(2).replace(".", ",")}
            </span>
          </div>

          {/* Detail rows */}
          <div style={{ display: "flex", flexDirection: "column", gap: 0, marginBottom: 16, borderRadius: 14, border: "1px solid var(--border)", overflow: "hidden" }}>
            {details.map((d, i) => (
              <div key={d.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: i % 2 === 0 ? "var(--margin-block-bg)" : "var(--card)", borderBottom: i < details.length - 1 ? "1px solid var(--border)" : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <AppIcon name={d.icon} size={14} stroke="var(--text-3)" />
                  <span style={{ fontSize: 12, color: "var(--text-2)" }}>{d.label}</span>
                </div>
                <span style={{ fontSize: 13, fontWeight: d.bold ? 800 : 700, color: d.color, fontFamily: "var(--font-mono)" }}>{d.value}</span>
              </div>
            ))}
          </div>

          {/* Detalhe de margem por canal */}
          {channelRows.length > 0 && (
            <div style={{ marginBottom: 16, borderRadius: 14, border: "1px solid var(--border)", overflow: "hidden" }}>
              <button
                onClick={() => setChannelExpanded(v => !v)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "12px 14px", background: "var(--margin-block-bg)", border: "none",
                  cursor: "pointer", fontFamily: "var(--font-body)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <AppIcon name="trending-up" size={14} stroke="var(--accent-light)" />
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>Margem por canal de revenda</span>
                  {best && (
                    <span style={{ fontSize: 11, fontWeight: 700, color: "var(--success)", background: "color-mix(in srgb, var(--success) 12%, transparent)", padding: "2px 8px", borderRadius: 6, border: "1px solid color-mix(in srgb, var(--success) 25%, var(--border))" }}>
                      Melhor: {best.netMargin}% via {best.channel}
                    </span>
                  )}
                </div>
                <AppIcon name={channelExpanded ? "chevronUp" : "chevronDown"} size={14} stroke="var(--text-3)" />
              </button>
              {channelExpanded && (
                <div style={{ padding: "0 0 4px" }}>
                  {/* Header row */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 90px 52px 80px", gap: 0, padding: "8px 14px 6px", borderTop: "1px solid var(--border)" }}>
                    {["Canal", "Preço médio", "Taxa", "Margem"].map(h => (
                      <span key={h} style={{ fontSize: 10, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</span>
                    ))}
                  </div>
                  {[...channelRows].sort((a, b) => b.netMargin - a.netMargin).map((ch, i) => {
                    const isBest = ch.channel === best?.channel;
                    const mpCfg = marketplaceConfig[ch.channel];
                    return (
                      <div key={ch.channel} style={{
                        display: "grid", gridTemplateColumns: "1fr 90px 52px 80px", gap: 0,
                        padding: "10px 14px",
                        background: isBest ? "color-mix(in srgb, var(--success) 7%, var(--card))" : i % 2 === 0 ? "var(--card)" : "var(--margin-block-bg)",
                        borderTop: "1px solid var(--border)",
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          {mpCfg?.logo && (
                            <span style={{ width: 16, height: 16, borderRadius: 4, background: "#fff", border: "1px solid var(--border)", display: "inline-flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                              <img src={mpCfg.logo} alt={ch.channel} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            </span>
                          )}
                          <span style={{ fontSize: 12, fontWeight: isBest ? 700 : 500, color: isBest ? "var(--text-1)" : "var(--text-2)" }}>
                            {ch.channel}{isBest ? " ★" : ""}
                          </span>
                        </div>
                        <span style={{ fontSize: 12, color: "var(--text-2)", fontFamily: "var(--font-mono)" }}>R$ {ch.marketPrice.toFixed(0)}</span>
                        <span style={{ fontSize: 12, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>{Math.round(ch.fee * 100)}%</span>
                        <span style={{ fontSize: 13, fontWeight: 800, color: isBest ? "var(--success)" : "var(--text-2)", fontFamily: "var(--font-mono)" }}>{ch.netMargin}%</span>
                      </div>
                    );
                  })}
                  <div style={{ padding: "8px 14px", fontSize: 11, color: "var(--text-3)", borderTop: "1px solid var(--border)", background: "var(--margin-block-bg)", lineHeight: 1.45 }}>
                    {profile?.resaleMarginMode === "custom"
                      ? "Modo personalizado: a margem % é recalculada com as taxas que você definiu na tela Margem. Ainda é uma estimativa — as taxas reais variam por categoria e tipo de anúncio."
                      : "Margens com taxas médias estimadas por oportunidade. Ative o cálculo personalizado na tela Margem para usar suas próprias taxas."}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Freight warning */}
          {!opp.freightFree && opp.freight > freightCap && (
            <div style={{ padding: "10px 14px", borderRadius: 10, background: "color-mix(in srgb, var(--danger) 8%, var(--card))", border: "1px solid color-mix(in srgb, var(--danger) 25%, var(--border))", marginBottom: 16, display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--danger)" }}>
              <AppIcon name="info" size={14} stroke="var(--danger)" />
              Frete acima do seu teto (R$ {freightCap}) — nao gera push, apenas aparece no dashboard.
            </div>
          )}

          {/* Price trend mini chart */}
          {historyValues && (
            <div style={{ marginBottom: 16, padding: 14, borderRadius: 14, border: "1px solid var(--border)", background: "var(--margin-block-bg)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <AppIcon name="trending-down" size={14} stroke="var(--accent-light)" />
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-1)" }}>Tendencia de preco (3 meses)</span>
                </div>
                <span style={{ fontSize: 11, color: "var(--text-3)" }}>
                  {historyValues[0] > historyValues[historyValues.length - 1] ? "Em queda" : "Estavel"}
                </span>
              </div>
              <MiniSparkline values={historyValues} width={440} height={50} color="var(--accent-light)" />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--text-3)", marginTop: 4 }}>
                <span>3 meses atras: R$ {historyValues[0]}</span>
                <span>Hoje: R$ {historyValues[historyValues.length - 1]}</span>
              </div>
            </div>
          )}

          <div style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 0, lineHeight: 1.45 }}>
            O link abre a página de busca do marketplace com este produto (simulação). Compra internacional ficará para quando houver AliExpress e similares.
          </div>
        </div>

        {/* Sticky CTA bar */}
        <div style={{
          position: "sticky", bottom: 0, padding: "14px 20px 18px",
          background: "var(--card)", borderTop: "1px solid var(--border)",
          borderRadius: "0 0 24px 24px",
          display: "flex", flexDirection: "column", gap: 8,
        }}>
          <div style={{ display: "flex", gap: 10 }}>
            <a href={opp.buyUrl} target="_blank" rel="noreferrer" style={{
              flex: 1, padding: "14px 16px", borderRadius: 14, textDecoration: "none", textAlign: "center",
              background: "var(--accent)", color: "#fff", fontSize: 15, fontWeight: 700, fontFamily: "var(--font-body)",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              boxShadow: "0 4px 16px color-mix(in srgb, var(--accent) 38%, transparent)",
            }}>
              <AppIcon name="arrowUpRight" size={16} stroke="#fff" /> Ver no {opp.marketplace}
            </a>
            <button onClick={() => { onToggleBought(opp.id); }} style={{
              padding: "14px 18px", borderRadius: 14, cursor: "pointer", fontFamily: "var(--font-body)",
              border: bought ? "1px solid color-mix(in srgb, var(--success) 45%, var(--border))" : "1px solid var(--border)",
              background: bought ? "color-mix(in srgb, var(--success) 12%, transparent)" : "var(--margin-block-bg)",
              color: bought ? "var(--success)" : "var(--text-2)", fontSize: 13, fontWeight: 700,
              display: "flex", alignItems: "center", gap: 6,
            }}>
              <AppIcon name={bought ? "check" : "bag"} size={16} stroke={bought ? "var(--success)" : "var(--text-2)"} />
              {bought ? "Comprada" : "Comprei"}
            </button>
          </div>
          {typeof onDismissProduct === "function" && (
            <button
              type="button"
              onClick={() => { onDismissProduct(opp.id); onClose(); }}
              style={{
                width: "100%", padding: "10px 14px", borderRadius: 12, cursor: "pointer", fontFamily: "var(--font-body)",
                border: "1px dashed var(--border)", background: "transparent", color: "var(--text-3)", fontSize: 12, fontWeight: 600,
              }}
            >
              Não tenho interesse — ocultar desta lista
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Pages ────────────────────────────────────────

function MargemRevendaPage({ profile, onProfileChange }) {
  const rc = { ...DEFAULT_RESALE_CHANNELS, ...(profile.resaleChannels || {}) };
  const setResale = (next) => onProfileChange({ resaleChannels: next });
  const mode = profile.resaleMarginMode === "custom" ? "custom" : "average";
  const feePct = { ...DEFAULT_RESALE_FEE_PCT, ...(profile.resaleFeePct || {}) };
  const setMode = (next) => onProfileChange({ resaleMarginMode: next });
  const setFee = (channel, value) => {
    onProfileChange({
      resaleFeePct: { ...feePct, [channel]: value },
    });
  };
  const feeRows = [
    { channel: "Mercado Livre", label: "Mercado Livre" },
    { channel: "Shopee", label: "Shopee" },
    { channel: "Magazine Luiza", label: "Magazine Luiza" },
  ];
  const inputFeeStyle = {
    width: "100%", maxWidth: 88, padding: "10px 12px", borderRadius: 12,
    border: "1px solid var(--border)", background: "var(--input-bg)", color: "var(--text-1)",
    fontSize: 15, fontWeight: 700, fontFamily: "var(--font-mono)", textAlign: "right", boxSizing: "border-box",
  };
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{
        background: "linear-gradient(145deg, color-mix(in srgb, var(--accent-light) 10%, var(--card)), color-mix(in srgb, var(--accent) 5%, var(--card)))",
        borderRadius: 20, padding: "22px 20px", border: "1px solid color-mix(in srgb, var(--accent-light) 20%, var(--border))",
        boxShadow: "var(--card-shadow)",
      }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: "var(--accent-light)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Margem por canal de revenda</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-1)", marginBottom: 10, fontFamily: "var(--font-display)", lineHeight: 1.25 }}>
          Cadastro dos canais onde você revende
        </div>
        <p style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.6, margin: 0 }}>
          O Avisus estima a <strong>margem líquida</strong> em cada marketplace (Mercado Livre, Shopee e Magazine Luiza) usando preço médio de mercado e <strong>taxas médias</strong> por canal.
          Só entram no cálculo da <strong>melhor margem</strong> e no detalhe da oportunidade os canais que você marcar abaixo.
        </p>
      </div>

      <div style={{ background: "var(--card)", borderRadius: 20, padding: "20px 20px 18px", border: "1px solid var(--border)", boxShadow: "var(--card-shadow)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: "color-mix(in srgb, var(--accent-light) 14%, transparent)", border: "1px solid color-mix(in srgb, var(--accent-light) 28%, transparent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <AppIcon name="percent" size={20} stroke="var(--accent-light)" />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-1)" }}>Modelo de cálculo da margem</div>
            <div style={{ fontSize: 12, color: "var(--text-3)", lineHeight: 1.45 }}>
              <strong>Estimativa</strong>: margem % vem dos dados do scanner (taxas médias já embutidas por oportunidade).
              <strong style={{ marginLeft: 6 }}>Personalizado</strong>: você informa a taxa total estimada (comissão + frete reverso + pagamento) por canal; a margem é calculada em cima do seu custo de aquisição (preço de compra + frete).
            </div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10, marginBottom: mode === "custom" ? 18 : 0 }}>
          <button
            type="button"
            onClick={() => setMode("average")}
            style={{
              textAlign: "left", padding: "14px 16px", borderRadius: 14, cursor: "pointer", fontFamily: "var(--font-body)",
              border: mode === "average" ? "2px solid var(--accent-light)" : "1px solid var(--border)",
              background: mode === "average" ? "color-mix(in srgb, var(--accent-light) 8%, var(--card))" : "var(--margin-block-bg)",
              color: "var(--text-1)",
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 4 }}>Estimativa padrão</div>
            <div style={{ fontSize: 11, color: "var(--text-3)", lineHeight: 1.4 }}>Taxas médias por oportunidade.</div>
          </button>
          <button
            type="button"
            onClick={() => setMode("custom")}
            style={{
              textAlign: "left", padding: "14px 16px", borderRadius: 14, cursor: "pointer", fontFamily: "var(--font-body)",
              border: mode === "custom" ? "2px solid var(--accent-light)" : "1px solid var(--border)",
              background: mode === "custom" ? "color-mix(in srgb, var(--accent-light) 8%, var(--card))" : "var(--margin-block-bg)",
              color: "var(--text-1)",
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 4 }}>Cálculo personalizado</div>
            <div style={{ fontSize: 11, color: "var(--text-3)", lineHeight: 1.4 }}>Suas taxas % por canal.</div>
          </button>
        </div>
        {mode === "custom" && (
          <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-2)", marginBottom: 12 }}>Taxa total estimada por canal (%)</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {feeRows.map(({ channel, label }) => {
                const mp = marketplaceConfig[channel];
                const v = feePct[channel] ?? DEFAULT_RESALE_FEE_PCT[channel];
                return (
                  <div key={channel} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
                    padding: "12px 14px", borderRadius: 14, border: "1px solid var(--border)", background: "var(--margin-block-bg)",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                      <span style={{ width: 32, height: 32, borderRadius: 10, background: "#fff", border: "1px solid var(--border)", display: "inline-flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                        {mp?.logo ? <img src={mp.logo} alt="" style={{ width: 18, height: 18, objectFit: "contain" }} /> : null}
                      </span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)" }}>{label}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={v === undefined || v === null ? "" : String(v)}
                        onChange={e => setFee(channel, e.target.value)}
                        aria-label={`Taxa percentual ${label}`}
                        style={inputFeeStyle}
                      />
                      <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-3)" }}>%</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 14, alignItems: "center" }}>
              <button
                type="button"
                onClick={() => onProfileChange({ resaleFeePct: { ...DEFAULT_RESALE_FEE_PCT } })}
                style={{
                  padding: "10px 14px", borderRadius: 12, cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 700,
                  border: "1px solid var(--border)", background: "var(--card)", color: "var(--text-2)",
                }}
              >
                Restaurar taxas de referência
              </button>
            </div>
            <p style={{ fontSize: 11, color: "var(--text-3)", lineHeight: 1.5, margin: "12px 0 0" }}>
              Margem % ≈ (preço médio de mercado × (1 − taxa) − (preço de compra + frete)) ÷ (preço de compra + frete). Valores são estimativas; taxas reais variam por categoria e tipo de anúncio.
            </p>
          </div>
        )}
      </div>

      <div style={{ background: "var(--card)", borderRadius: 20, padding: "20px 20px 18px", border: "1px solid var(--border)", boxShadow: "var(--card-shadow)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: "color-mix(in srgb, var(--accent-light) 14%, transparent)", border: "1px solid color-mix(in srgb, var(--accent-light) 28%, transparent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <AppIcon name="trending-up" size={20} stroke="var(--accent-light)" />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-1)" }}>Seus canais de revenda</div>
            <div style={{ fontSize: 12, color: "var(--text-3)" }}>Altere quando quiser; o dashboard atualiza na hora.</div>
          </div>
        </div>
        <ResaleChannelsForm value={rc} onChange={setResale} />
      </div>
    </div>
  );
}

function DashboardPage({ profile, boughtIds, onToggleBought, onGoToPlan, onGoToInterests, onGoToProfile, showWelcomeBanner, onDismissWelcome, interests, dismissedIds, onDismissProduct, maxInterestTerms, planLabel, subscriptionPlan }) {
  const [filter, setFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [discountFilter, setDiscountFilter] = useState("all");
  const [marginFilter, setMarginFilter] = useState("all");
  const [sort, setSort] = useState("margin");
  const [regionFilter, setRegionFilter] = useState("all");
  const [hideBought, setHideBought] = useState(false);
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [showTrends, setShowTrends] = useState(false);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const statsCompact = useViewportMaxWidth(640);
  const statsTight = useViewportMaxWidth(380);

  const getDiscount = (opportunity) => Math.round((1 - opportunity.price / opportunity.originalPrice) * 100);
  const normalizedCity = profile.city.trim().toLowerCase();

  let filtered = [...MOCK_OPPORTUNITIES];
  filtered = filtered.filter(isDomesticBrazilListing);
  filtered = filtered.filter(o => !dismissedIds?.includes(o.id));
  filtered = filtered.filter(o => opportunityMatchesInterests(o, interests));
  if (searchQuery.trim()) filtered = filtered.filter(o => o.name.toLowerCase().includes(searchQuery.trim().toLowerCase()));
  if (filter !== "all") filtered = filtered.filter(o => o.marketplace === filter);
  if (categoryFilter !== "all") filtered = filtered.filter(o => o.category === categoryFilter);
  if (discountFilter === "d15") filtered = filtered.filter(o => getDiscount(o) >= 15);
  if (discountFilter === "d30") filtered = filtered.filter(o => getDiscount(o) >= 30);
  if (discountFilter === "d45") filtered = filtered.filter(o => getDiscount(o) >= 45);
  if (marginFilter === "m25") filtered = filtered.filter(o => effectiveMargin(o, profile) >= 25);
  if (marginFilter === "m30") filtered = filtered.filter(o => effectiveMargin(o, profile) > 30);
  if (marginFilter === "m40") filtered = filtered.filter(o => effectiveMargin(o, profile) >= 40);
  if (regionFilter === "my") filtered = filtered.filter(o => o.region === profile.state && (!normalizedCity || o.city.toLowerCase() === normalizedCity));
  if (regionFilter === "state") filtered = filtered.filter(o => o.region === profile.state);
  if (regionFilter === "free") filtered = filtered.filter(o => o.freightFree);
  if (regionFilter === "cap") filtered = filtered.filter(o => o.freightFree || o.freight <= profile.freightCap);
  if (hideBought) filtered = filtered.filter(o => !boughtIds.includes(o.id));
  if (sort === "margin") filtered.sort((a, b) => effectiveMargin(b, profile) - effectiveMargin(a, profile));
  if (sort === "discount") filtered.sort((a, b) => (b.originalPrice - b.price) / b.originalPrice - (a.originalPrice - a.price) / a.originalPrice);
  if (sort === "expiring") filtered.sort((a, b) => a.expires.localeCompare(b.expires));

  const avgMargin = Math.round(filtered.reduce((s, o) => s + effectiveMargin(o, profile), 0) / (filtered.length || 1));
  const freeShippingCount = filtered.filter(o => o.freightFree).length;
  const hotCount = filtered.filter(o => o.hot).length;
  const activeProgress = Math.round((filtered.length / (MOCK_OPPORTUNITIES.length || 1)) * 100);
  const marginProgress = Math.min(avgMargin * 2, 100);
  const freeProgress = Math.round((freeShippingCount / (filtered.length || 1)) * 100);
  const hotProgress = Math.round((hotCount / (filtered.length || 1)) * 100);
  const marketplaceLogoIcon = (name) => (
    <span style={{ width: 16, height: 16, borderRadius: 4, background: "#fff", border: "1px solid var(--border)", display: "inline-flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      <img src={marketplaceConfig[name].logo} alt={name} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    </span>
  );
  const marketplaceFilters = [
    { id: "all", label: "Todos", icon: "store" },
    { id: "Mercado Livre", label: "Mercado Livre", icon: marketplaceLogoIcon("Mercado Livre") },
    { id: "Shopee", label: "Shopee", icon: marketplaceLogoIcon("Shopee") },
    { id: "Magazine Luiza", label: "Magalu", icon: marketplaceLogoIcon("Magazine Luiza") },
  ];
  const regionFilters = [{ id: "all", label: "Todo Brasil", icon: "globe" }, { id: "my", label: `Minha cidade (${profile.city})`, icon: "pin" }, { id: "state", label: `Meu estado (${profile.state})`, icon: "map" }, { id: "free", label: "Frete grátis", icon: "truck" }, { id: "cap", label: `Até R$ ${profile.freightCap}`, icon: "target" }];
  const categoryFilters = [{ id: "all", label: "Todas", icon: "layers" }, ...Array.from(new Set(MOCK_OPPORTUNITIES.map(o => o.category))).map(category => ({ id: category, label: category, icon: "layers" }))];
  const discountFilters = [{ id: "all", label: "Qualquer", icon: "percent" }, { id: "d15", label: "15%+", icon: "tag" }, { id: "d30", label: "30%+", icon: "tag" }, { id: "d45", label: "45%+", icon: "flame" }];
  const marginFilters = [{ id: "all", label: "Qualquer", icon: "trend" }, { id: "m25", label: "25%+", icon: "trend" }, { id: "m30", label: "> 30%", icon: "check" }, { id: "m40", label: "40%+", icon: "trophy" }];
  const sortFilters = [{ id: "margin", label: "Maior margem", icon: "arrowUpRight" }, { id: "discount", label: "Maior desconto", icon: "percent" }, { id: "expiring", label: "Expirando", icon: "clock" }];
  const hasCustomFilters = filter !== "all" || categoryFilter !== "all" || discountFilter !== "all" || marginFilter !== "all" || regionFilter !== "all" || sort !== "margin" || hideBought;
  const activeFiltersCount = [filter !== "all", categoryFilter !== "all", discountFilter !== "all", marginFilter !== "all", regionFilter !== "all", sort !== "margin", hideBought].filter(Boolean).length;

  const activeInterestTerms = (interests || []).filter(i => i.active).map(i => i.term);
  const filterChipRow = [];
  if (filter !== "all") {
    const lab = marketplaceFilters.find(f => f.id === filter)?.label || filter;
    filterChipRow.push({ key: "mp", label: `Canal: ${lab}`, onRemove: () => setFilter("all") });
  }
  if (categoryFilter !== "all") filterChipRow.push({ key: "cat", label: `Categoria: ${categoryFilter}`, onRemove: () => setCategoryFilter("all") });
  if (discountFilter !== "all") {
    const lab = discountFilters.find(f => f.id === discountFilter)?.label || discountFilter;
    filterChipRow.push({ key: "disc", label: `Desconto: ${lab}`, onRemove: () => setDiscountFilter("all") });
  }
  if (marginFilter !== "all") {
    const lab = marginFilters.find(f => f.id === marginFilter)?.label || marginFilter;
    filterChipRow.push({ key: "marg", label: `Margem: ${lab}`, onRemove: () => setMarginFilter("all") });
  }
  if (regionFilter !== "all") {
    const lab = regionFilters.find(f => f.id === regionFilter)?.label || regionFilter;
    filterChipRow.push({ key: "reg", label: `Região: ${lab}`, onRemove: () => setRegionFilter("all") });
  }
  if (sort !== "margin") {
    const lab = sortFilters.find(f => f.id === sort)?.label || sort;
    filterChipRow.push({ key: "sort", label: `Ordem: ${lab}`, onRemove: () => setSort("margin") });
  }
  if (hideBought) filterChipRow.push({ key: "bought", label: "Ocultar compradas", onRemove: () => setHideBought(false) });

  return (
    <div>
      {/* Welcome banner after onboarding */}
      {showWelcomeBanner && (
        <div style={{
          background: "linear-gradient(135deg, color-mix(in srgb, var(--accent-light) 12%, var(--card)), color-mix(in srgb, var(--success) 8%, var(--card)))",
          borderRadius: 18, padding: "16px 20px", marginBottom: 16,
          border: "1px solid color-mix(in srgb, var(--accent-light) 25%, var(--border))",
          position: "relative", animation: "fadeIn 0.3s ease",
        }}>
          <button onClick={onDismissWelcome} style={{
            position: "absolute", top: 10, right: 10, background: "none", border: "none",
            cursor: "pointer", color: "var(--text-3)", padding: 4,
          }}><AppIcon name="x" size={16} /></button>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)", marginBottom: 4 }}>
            Tudo pronto! Suas oportunidades já estão sendo monitoradas.
          </div>
          <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 12 }}>
            Você pode ajustar suas preferências a qualquer momento.
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={onGoToInterests} style={{
              padding: "8px 14px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--card)",
              color: "var(--accent-dark)", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)",
              display: "inline-flex", alignItems: "center", gap: 5,
            }}>
              <AppIcon name="star" size={13} stroke="var(--accent-dark)" /> Editar interesses
            </button>
            <button onClick={onGoToProfile} style={{
              padding: "8px 14px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--card)",
              color: "var(--accent-dark)", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)",
              display: "inline-flex", alignItems: "center", gap: 5,
            }}>
              <AppIcon name="user" size={13} stroke="var(--accent-dark)" /> Ajustar perfil
            </button>
            <button onClick={() => { onGoToProfile(); }} style={{
              padding: "8px 14px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--card)",
              color: "var(--accent-dark)", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)",
              display: "inline-flex", alignItems: "center", gap: 5,
            }}>
              <AppIcon name="trending-up" size={13} stroke="var(--accent-dark)" /> Canais de revenda
            </button>
          </div>
        </div>
      )}

      {/* Search bar */}
      <div style={{ position: "relative", marginBottom: 16 }}>
        <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", display: "inline-flex", alignItems: "center", color: "var(--text-3)", pointerEvents: "none" }}>
          <AppIcon name="target" size={16} />
        </span>
        <input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Buscar no catálogo... ex: PlayStation, Nike, JBL"
          style={{
            width: "100%", padding: "13px 14px 13px 40px", borderRadius: 14,
            border: "1px solid var(--border)", background: "var(--card)",
            color: "var(--text-1)", fontSize: 14, fontFamily: "var(--font-body)",
            outline: "none", boxShadow: "var(--card-shadow)",
          }}
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery("")} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", display: "inline-flex", alignItems: "center" }}>
            <AppIcon name="x" size={16} />
          </button>
        )}
        <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 8, lineHeight: 1.45 }}>
          Listagens com envio no Brasil. Links de compra abrem a busca no marketplace (protótipo).
          {activeInterestTerms.length > 0 && (
            <> Interesses ativos: <strong style={{ color: "var(--text-2)" }}>{activeInterestTerms.join(", ")}</strong>.</>
          )}
        </div>
      </div>

      {/* Plan status strip */}
      {(() => {
        const planColor = subscriptionPlan === "pro" ? "#2E8B57" : subscriptionPlan === "starter" ? "#D4A017" : "#7B42C9";
        return (
        <div onClick={onGoToPlan} style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "10px 16px", marginBottom: 14, borderRadius: 14, cursor: "pointer",
          background: `linear-gradient(135deg, color-mix(in srgb, ${planColor} 10%, var(--card)), color-mix(in srgb, ${planColor} 4%, var(--card)))`,
          border: `1px solid color-mix(in srgb, ${planColor} 25%, var(--border))`,
          transition: "transform 0.15s",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8, flexShrink: 0,
              background: `color-mix(in srgb, ${planColor} 16%, transparent)`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <AppIcon name="crown" size={15} stroke={planColor} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.04em", color: planColor }}>
                  {planLabel || "FREE"}
                </span>
                <span style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 500 }}>
                  • {maxInterestTerms ?? 5} termos • {subscriptionPlan === "free" ? "Scan 2h" : subscriptionPlan === "starter" ? "Scan 30min" : "Scan 5min"}
                </span>
              </div>
            </div>
          </div>
          {subscriptionPlan !== "pro" ? (
            <div style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "5px 12px", borderRadius: 8,
              background: `color-mix(in srgb, ${planColor} 12%, transparent)`,
              border: `1px solid color-mix(in srgb, ${planColor} 25%, transparent)`,
              fontSize: 11, fontWeight: 700, color: planColor,
            }}>
              <AppIcon name="zap" size={11} stroke={planColor} /> Upgrade
            </div>
          ) : (
            <div style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "5px 12px", borderRadius: 8,
              background: `color-mix(in srgb, ${planColor} 12%, transparent)`,
              border: `1px solid color-mix(in srgb, ${planColor} 25%, transparent)`,
              fontSize: 11, fontWeight: 700, color: planColor,
            }}>
              <AppIcon name="check" size={11} stroke={planColor} /> Ativo
            </div>
          )}
        </div>
        );
      })()}

      {/* Stats strip — 2×2 em telas estreitas para rótulos como "Frete grátis" / "Em alta" */}
      <div style={{
        display: "grid",
        gridTemplateColumns: statsCompact ? "repeat(2, minmax(0, 1fr))" : "repeat(4, minmax(0, 1fr))",
        gap: statsCompact ? 8 : 10,
        marginBottom: 16,
      }}>
        {[
          { id: "active", label: "Ativas", value: filtered.length, accent: "var(--accent)", icon: "grid" },
          { id: "margin", label: "Margem", value: `${avgMargin}%`, accent: "var(--success)", icon: "trend" },
          { id: "freight", label: statsTight ? "Grátis" : "Frete grátis", value: freeShippingCount, accent: "var(--info)", icon: "truck" },
          { id: "hot", label: "Em alta", value: hotCount, accent: "var(--warning)", icon: "flame" },
        ].map(stat => (
          <div key={stat.id} style={{
            display: "flex", alignItems: "center", gap: statsTight ? 8 : 10,
            padding: statsTight ? "10px 10px" : statsCompact ? "10px 12px" : "12px 14px",
            background: "var(--card)", borderRadius: statsTight ? 12 : 14, border: "1px solid var(--border)",
            boxShadow: "var(--card-shadow)", minWidth: 0,
          }}>
            <div style={{
              width: statsTight ? 32 : 36, height: statsTight ? 32 : 36, borderRadius: 10,
              background: `color-mix(in srgb, ${stat.accent} 14%, transparent)`,
              border: `1px solid color-mix(in srgb, ${stat.accent} 28%, transparent)`,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <AppIcon name={stat.icon} size={statsTight ? 14 : 16} stroke={stat.accent} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{
                fontSize: statsTight ? 17 : statsCompact ? 18 : 20,
                fontWeight: 800, color: "var(--text-1)", fontFamily: "var(--font-mono)", lineHeight: 1,
              }}>{stat.value}</div>
              <div style={{
                fontSize: statsTight ? 9 : statsCompact ? 10 : 11,
                color: "var(--text-3)", fontWeight: 600, textTransform: "uppercase",
                letterSpacing: statsTight ? "0.04em" : "0.06em", marginTop: 2,
                lineHeight: 1.25, hyphens: "auto", overflowWrap: "break-word",
              }}>{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick inline filters */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 6, overflowX: "auto", flex: 1, paddingBottom: 2 }}>
            {marketplaceFilters.map(f => <Chip key={f.id} label={f.label} icon={f.icon} active={filter === f.id} onClick={() => setFilter(f.id)} />)}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            <Badge>{filtered.length}</Badge>
            {hasCustomFilters && (
              <button
                onClick={() => { setFilter("all"); setCategoryFilter("all"); setDiscountFilter("all"); setMarginFilter("all"); setRegionFilter("all"); setSort("margin"); setHideBought(false); }}
                style={{ borderRadius: 8, border: "1px solid var(--border)", background: "var(--chip-bg)", color: "var(--accent-dark)", padding: "5px 8px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}
              >Limpar</button>
            )}
            <button
              onClick={() => setFiltersExpanded(v => !v)}
              style={{
                borderRadius: 10, border: "1px solid color-mix(in srgb, var(--accent) 22%, var(--border))",
                background: filtersExpanded ? "color-mix(in srgb, var(--accent) 12%, var(--chip-bg))" : "color-mix(in srgb, var(--accent) 6%, var(--chip-bg))",
                color: "var(--accent-dark)", padding: "5px 10px", fontSize: 12, fontWeight: 700, cursor: "pointer",
                display: "inline-flex", alignItems: "center", gap: 5,
              }}
            >
              <AppIcon name="sliders" size={13} stroke="var(--accent-dark)" />
              Filtros{activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ""}
              <AppIcon name={filtersExpanded ? "chevronUp" : "chevronDown"} size={12} stroke="var(--accent-dark)" />
            </button>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
          {sortFilters.map(s => <Chip key={s.id} label={s.label} icon={s.icon} active={sort === s.id} onClick={() => setSort(s.id)} />)}
        </div>
      </div>

      {/* Expanded filter drawer */}
      {filtersExpanded && (
        <div style={{
          background: "var(--card)", borderRadius: 18, padding: 16, border: "1px solid var(--border)", marginBottom: 20,
          boxShadow: "var(--card-shadow)", animation: "fadeIn 0.2s ease",
        }}>
          {filterChipRow.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14, alignItems: "center" }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Ativos</span>
              {filterChipRow.map(c => (
                <button key={c.key} type="button" onClick={c.onRemove} title="Remover este filtro" style={{
                  display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 999,
                  border: "1px solid var(--border)", background: "var(--chip-bg)", color: "var(--text-2)",
                  fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body)",
                }}>
                  {c.label}
                  <span style={{ fontSize: 14, lineHeight: 1, color: "var(--text-3)", fontWeight: 800 }}>×</span>
                </button>
              ))}
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10 }}>
            <div style={{ background: "var(--margin-block-bg)", border: "1px solid var(--border)", borderRadius: 14, padding: "12px" }}>
              <div style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>Categoria</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {categoryFilters.map(category => <Chip key={category.id} label={category.label} icon={category.icon} active={categoryFilter === category.id} onClick={() => setCategoryFilter(category.id)} />)}
              </div>
            </div>
            <div style={{ background: "var(--margin-block-bg)", border: "1px solid var(--border)", borderRadius: 14, padding: "12px" }}>
              <div style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>Região</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {regionFilters.map(f => <Chip key={f.id} label={f.label} icon={f.icon} active={regionFilter === f.id} onClick={() => setRegionFilter(f.id)} />)}
              </div>
            </div>
            <div style={{ background: "var(--margin-block-bg)", border: "1px solid var(--border)", borderRadius: 14, padding: "12px" }}>
              <div style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>Desconto</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {discountFilters.map(discount => <Chip key={discount.id} label={discount.label} icon={discount.icon} active={discountFilter === discount.id} onClick={() => setDiscountFilter(discount.id)} />)}
              </div>
            </div>
            <div style={{ background: "var(--margin-block-bg)", border: "1px solid var(--border)", borderRadius: 14, padding: "12px" }}>
              <div style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>Margem</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {marginFilters.map(margin => <Chip key={margin.id} label={margin.label} icon={margin.icon} active={marginFilter === margin.id} onClick={() => setMarginFilter(margin.id)} />)}
              </div>
            </div>
            <div style={{ background: "var(--margin-block-bg)", border: "1px solid var(--border)", borderRadius: 14, padding: "12px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
              <div>
                <div style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>Compradas</div>
                <div style={{ fontSize: 12, color: "var(--text-2)" }}>Ocultar produtos já comprados</div>
              </div>
              <Toggle checked={hideBought} onChange={() => setHideBought(!hideBought)} />
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(310px, 1fr))", gap: 18 }}>
        {filtered.map((opp, i) => (
          <ProductCard
            key={opp.id}
            opp={opp}
            index={i}
            bought={boughtIds.includes(opp.id)}
            onToggleBought={onToggleBought}
            freightCap={profile.freightCap}
            profile={profile}
            onSelect={() => setSelectedProduct(opp)}
            onDismiss={onDismissProduct}
          />
        ))}
      </div>
      {filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "48px 20px", background: "var(--card)", borderRadius: 20, border: "1px solid var(--border)" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16, opacity: 0.4 }}><AppIcon name="target" size={48} /></div>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Nenhuma oportunidade</div>
          <div style={{ fontSize: 13, color: "var(--text-3)", marginBottom: 18 }}>Não encontramos resultados com os filtros atuais.</div>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            {hasCustomFilters && (
              <button onClick={() => { setFilter("all"); setCategoryFilter("all"); setDiscountFilter("all"); setMarginFilter("all"); setRegionFilter("all"); setSort("margin"); setHideBought(false); }} style={{
                padding: "10px 18px", borderRadius: 12, border: "1px solid var(--border)", background: "var(--chip-bg)",
                color: "var(--accent-dark)", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)",
                display: "inline-flex", alignItems: "center", gap: 6,
              }}>
                <AppIcon name="x" size={14} stroke="var(--accent-dark)" /> Limpar filtros
              </button>
            )}
            <button onClick={onGoToInterests} style={{
              padding: "10px 18px", borderRadius: 12, border: "none", background: "var(--accent)",
              color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)",
              display: "inline-flex", alignItems: "center", gap: 6,
            }}>
              <AppIcon name="star" size={14} stroke="#fff" /> Editar interesses
            </button>
          </div>
        </div>
      )}


      {selectedProduct && (
        <ProductDetailModal
          opp={selectedProduct}
          bought={boughtIds.includes(selectedProduct.id)}
          onToggleBought={onToggleBought}
          onClose={() => setSelectedProduct(null)}
          freightCap={profile.freightCap}
          profile={profile}
          onDismissProduct={onDismissProduct}
        />
      )}

      {/* FAB — Tendências de Preços */}
      {!showTrends && (
        <button
          onClick={() => setShowTrends(true)}
          style={{
            position: "fixed", bottom: 80, right: 20, zIndex: 90,
            display: "flex", alignItems: "center", gap: 8,
            padding: "12px 18px", borderRadius: 999,
            background: "var(--accent)", color: "#fff",
            border: "none", cursor: "pointer",
            fontSize: 13, fontWeight: 700, fontFamily: "var(--font-body)",
            boxShadow: "0 6px 24px color-mix(in srgb, var(--accent) 45%, transparent), 0 2px 8px rgba(0,0,0,0.15)",
            animation: "fadeIn 0.3s ease",
          }}
        >
          <AppIcon name="trend" size={16} stroke="#fff" />
          Tendências
        </button>
      )}

      {/* Bottom sheet overlay — Tendências de Preços */}
      {showTrends && (
        <div
          onClick={() => setShowTrends(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 9998,
            background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)",
            display: "flex", flexDirection: "column", justifyContent: "flex-end",
            animation: "fadeIn 0.15s ease",
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: "var(--card)", borderRadius: "24px 24px 0 0",
              border: "1px solid var(--border)", borderBottom: "none",
              maxHeight: "85vh", overflowY: "auto",
              boxShadow: "0 -8px 40px rgba(0,0,0,0.2)",
              animation: "slideUp 0.25s ease",
            }}
          >
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: "10px 0 4px",
            }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: "var(--border)" }} />
            </div>
            <div style={{ padding: "0 4px 16px" }}>
              <SearchHistoryPanel expanded={historyExpanded} onToggle={() => setHistoryExpanded(v => !v)} interests={interests} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InterestsPage({ profile, onProfileChange, interests, onInterestsChange, maxInterestTerms, planLabel }) {
  const setInterests = (next) => onInterestsChange(typeof next === "function" ? next(interests) : next);
  const [newTerm, setNewTerm] = useState("");
  const [hoveredInterest, setHoveredInterest] = useState(null);
  const maxFree = maxInterestTerms ?? 5;
  const suggestedTerms = ["Air Fryer", "Parafusadeira", "Smart TV", "Notebook Gamer", "iPhone"];
  const normalizedNewTerm = newTerm.trim();
  const hasDuplicate = interests.some(item => item.term.toLowerCase() === normalizedNewTerm.toLowerCase());
  const canAdd = !!normalizedNewTerm && interests.length < maxFree && !hasDuplicate;
  const add = () => {
    if (!canAdd) return;
    setInterests([...interests, { id: Date.now(), term: normalizedNewTerm, active: true }]);
    setNewTerm("");
  };
  const toggle = (id) => setInterests(interests.map(i => i.id === id ? { ...i, active: !i.active } : i));
  const remove = (id) => setInterests(interests.filter(i => i.id !== id));
  const addSuggestion = (term) => {
    if (interests.length >= maxFree || interests.some(item => item.term.toLowerCase() === term.toLowerCase())) return;
    setInterests([...interests, { id: Date.now(), term, active: true }]);
  };
  const activeCount = interests.filter(item => item.active).length;
  const utilization = Math.round((interests.length / maxFree) * 100);
  const limitReached = interests.length >= maxFree;
  const coverageColor = utilization >= 90 ? "var(--danger)" : utilization >= 70 ? "var(--warning)" : "var(--info)";
  const orderedInterests = [...interests].sort((a, b) => Number(b.active) - Number(a.active));

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ background: "var(--card)", borderRadius: 20, padding: 20, border: "1px solid var(--border)", boxShadow: "var(--card-shadow)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>Seus interesses</div>
            <div style={{ fontSize: 13, color: "var(--text-3)" }}>Produtos e categorias que o scanner vai priorizar.</div>
          </div>
          <Badge variant="accent">Plano {planLabel || "FREE"}</Badge>
        </div>

        <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 12, lineHeight: 1.45 }}>
          Termos como <strong>Ferramentas</strong> ou <strong>Games</strong> também buscam por <strong>categoria</strong> do catálogo, não só pelo nome do produto.
        </div>

        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", marginBottom: 16 }}>
          <div style={{ background: "color-mix(in srgb, var(--success) 13%, var(--card))", border: "1px solid color-mix(in srgb, var(--success) 30%, var(--border))", borderRadius: 12, padding: "10px 12px" }}>
            <div style={{ fontSize: 11, color: "var(--text-2)", marginBottom: 3 }}>Ativos</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "var(--success)", fontFamily: "var(--font-mono)" }}>{activeCount}</div>
          </div>
          <div style={{ background: `color-mix(in srgb, ${limitReached ? "var(--warning)" : "var(--accent)"} 13%, var(--card))`, border: `1px solid color-mix(in srgb, ${limitReached ? "var(--warning)" : "var(--accent)"} 30%, var(--border))`, borderRadius: 12, padding: "10px 12px" }}>
            <div style={{ fontSize: 11, color: "var(--text-2)", marginBottom: 3 }}>Limite atual</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: limitReached ? "var(--warning)" : "var(--accent)", fontFamily: "var(--font-mono)" }}>{interests.length}/{maxFree}</div>
          </div>
          <div style={{ background: `color-mix(in srgb, ${coverageColor} 13%, var(--card))`, border: `1px solid color-mix(in srgb, ${coverageColor} 30%, var(--border))`, borderRadius: 12, padding: "10px 12px" }}>
            <div style={{ fontSize: 11, color: "var(--text-2)", marginBottom: 3 }}>Uso do limite</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: coverageColor, fontFamily: "var(--font-mono)" }}>{utilization}%</div>
            <div style={{ fontSize: 10, color: "var(--text-3)", marginTop: 4, lineHeight: 1.35 }}>Quanto do teto de termos do plano já está preenchido.</div>
          </div>
        </div>

        <div style={{ background: "var(--margin-block-bg)", border: "1px solid var(--border)", borderRadius: 14, padding: 12, marginBottom: 14 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input
              value={newTerm}
              onChange={e => setNewTerm(e.target.value)}
              onKeyDown={e => e.key === "Enter" && add()}
              placeholder="Ex: Parafusadeira, PlayStation 5..."
              style={{ flex: "1 1 280px", minWidth: 220, padding: "12px 14px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--input-bg)", color: "var(--text-1)", fontSize: 14, fontFamily: "var(--font-body)", outline: "none" }}
            />
            <button
              onClick={add}
              disabled={!canAdd}
              style={{ padding: "12px 16px", borderRadius: 10, border: "none", background: canAdd ? "var(--accent)" : "var(--nav-active)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: canAdd ? "pointer" : "not-allowed", fontFamily: "var(--font-body)", display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <AppIcon name="plus" size={14} stroke="#fff" /> Adicionar
            </button>
          </div>
          {hasDuplicate && <div style={{ marginTop: 8, fontSize: 12, color: "var(--warning)" }}>Esse termo já está na sua lista.</div>}
          {interests.length >= maxFree && <div style={{ marginTop: 8, fontSize: 12, color: "var(--accent)", display: "inline-flex", alignItems: "center", gap: 5 }}>Limite do plano {planLabel || "FREE"} atingido. <AppIcon name="arrowUpRight" size={12} stroke="var(--accent)" /> Upgrade para liberar mais termos.</div>}
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>Sugestões populares</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {suggestedTerms.map(term => (
              <Chip
                key={term}
                label={term}
                icon="plus"
                active={interests.some(item => item.term.toLowerCase() === term.toLowerCase())}
                onClick={() => addSuggestion(term)}
              />
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text-3)", marginBottom: 6 }}>
            <span>{interests.length}/{maxFree} termos usados</span>
            <span>{maxFree - interests.length} vagas livres</span>
          </div>
          <div style={{ height: 4, background: "var(--margin-bar-bg)", borderRadius: 999 }}>
            <div style={{ height: "100%", borderRadius: 999, width: `${(interests.length / maxFree) * 100}%`, background: interests.length >= maxFree ? "var(--danger)" : "var(--accent)", transition: "width 0.3s" }} />
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {orderedInterests.map((item, index) => (
            <div
              key={item.id}
              onMouseEnter={() => setHoveredInterest(item.id)}
              onMouseLeave={() => setHoveredInterest(null)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "11px 12px", borderRadius: 12, background: "var(--chip-bg)", border: "1px solid var(--border)",
                opacity: item.active ? 1 : 0.55,
                boxShadow: hoveredInterest === item.id ? "var(--card-shadow)" : "none",
                transform: hoveredInterest === item.id ? "translateY(-1px)" : "translateY(0)",
                transition: "transform 0.18s ease, box-shadow 0.18s ease, opacity 0.2s ease",
                animation: `cardIn 0.35s cubic-bezier(.2,.8,.3,1) ${index * 55}ms both`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 28, height: 28, borderRadius: 8, background: "var(--margin-block-bg)", border: "1px solid var(--border)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                  <AppIcon name="tag" size={14} stroke="var(--accent-dark)" />
                </span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{item.term}</div>
                  <div style={{ fontSize: 11, color: item.active ? "var(--success)" : "var(--text-3)", fontWeight: 600 }}>{item.active ? "Monitorando" : "Pausado"}</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Toggle checked={item.active} onChange={() => toggle(item.id)} />
                <button onClick={() => remove(item.id)} style={{ width: 28, height: 28, borderRadius: 8, border: "1px solid var(--border)", background: "transparent", color: "var(--text-3)", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}><AppIcon name="x" size={14} stroke="var(--text-3)" /></button>
              </div>
            </div>
          ))}
          {orderedInterests.length === 0 && (
            <div style={{ textAlign: "center", padding: "18px 10px", borderRadius: 12, border: "1px dashed var(--border)", color: "var(--text-3)", fontSize: 12 }}>
              Você ainda não adicionou interesses.
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

function NotificationsPage({ profile, userInfo, interests, dismissedIds, boughtIds, onToggleBought, onGoToPlan, onOpenProfile, subscriptionPlan }) {
  const telegramConfigured = !!userInfo?.telegram?.trim();
  const whatsappEnabled = subscriptionPlan === "starter" || subscriptionPlan === "pro";
  const whatsappConfigured = whatsappEnabled && !!userInfo?.whatsapp?.trim();
  const [webPush, setWebPush] = useState(true);
  const [quiet, setQuiet] = useState(true);
  const [quietStart, setQuietStart] = useState("22:00");
  const [quietEnd, setQuietEnd] = useState("07:00");
  const [onlyPending, setOnlyPending] = useState(false);
  const recentTimes = ["12min", "45min", "1h", "2h", "3h", "4h"];
  const notifications = MOCK_OPPORTUNITIES
    .filter(isDomesticBrazilListing)
    .filter(o => !dismissedIds?.includes(o.id))
    .filter(o => opportunityMatchesInterests(o, interests))
    .filter(o => o.freightFree || o.freight <= profile.freightCap)
    .slice(0, 5)
    .map((offer, index) => {
      const discount = Math.round((1 - offer.price / offer.originalPrice) * 100);
      const freightInfo = offer.freightFree ? "Frete grátis" : `Frete R$ ${offer.freight.toFixed(2).replace(".", ",")}`;
      const bought = boughtIds.includes(offer.id);
      const bestCh = getBestChannel(offer, profile);
      const marginText = bestCh
        ? `Melhor margem: ${bestCh.netMargin}% via ${bestCh.channel}`
        : `Margem ${offer.margin}%`;
      return {
        id: offer.id,
        time: recentTimes[index] || `${index + 1}h`,
        name: offer.name,
        price: offer.price,
        discount,
        marketplace: offer.marketplace,
        margin: bestCh ? bestCh.netMargin : offer.margin,
        bestChannel: bestCh?.channel ?? null,
        freightInfo,
        quality: offer.quality,
        text: `${offer.name} por R$ ${offer.price.toFixed(2).replace(".", ",")} (-${discount}%) • ${offer.marketplace} • ${marginText} • ${freightInfo}`,
        unread: index < 2 && !bought,
        bought,
        buyUrl: offer.buyUrl,
      };
    });
  const visibleNotifications = onlyPending ? notifications.filter(n => !n.bought) : notifications;
  const unreadCount = notifications.filter(n => n.unread).length;
  const freeUsage = Math.min(notifications.length, 5);
  const usagePct = Math.round((freeUsage / 5) * 100);
  const limitReached = freeUsage >= 5;
  const coverageColor = usagePct >= 90 ? "var(--danger)" : usagePct >= 70 ? "var(--warning)" : "var(--info)";

  return (
    <div>
      {/* Stats strip */}
      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(3, 1fr)", marginBottom: 16 }}>
        {[
          { label: "Novos", value: unreadCount, icon: "bell", color: "var(--accent)", sub: "nao lidos" },
          { label: "Limite diario", value: `${freeUsage}/5`, icon: "zap", color: limitReached ? "var(--warning)" : "var(--success)", sub: limitReached ? "esgotado" : "disponivel" },
          { label: "Uso do limite", value: `${usagePct}%`, icon: "activity", color: coverageColor, sub: "alertas hoje" },
        ].map(s => (
          <div key={s.label} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16, padding: "14px 16px", boxShadow: "var(--card-shadow)", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: s.color, borderRadius: "16px 16px 0 0" }} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{s.label}</span>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: `color-mix(in srgb, ${s.color} 12%, transparent)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <AppIcon name={s.icon} size={14} stroke={s.color} />
              </div>
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.color, fontFamily: "var(--font-mono)", lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 10, color: "var(--text-3)", marginTop: 4 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Channels card */}
      <div style={{ background: "var(--card)", borderRadius: 20, border: "1px solid var(--border)", overflow: "hidden", boxShadow: "var(--card-shadow)", marginBottom: 16 }}>
        <div style={{ background: "color-mix(in srgb, var(--accent-light) 8%, var(--card))", borderBottom: "1px solid var(--border)", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: "color-mix(in srgb, var(--accent-light) 16%, transparent)", border: "1px solid color-mix(in srgb, var(--accent-light) 30%, transparent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <AppIcon name="radio" size={16} stroke="var(--accent-light)" />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)" }}>Canais de alerta</div>
              <div style={{ fontSize: 11, color: "var(--text-3)" }}>Escolha como receber notificacoes</div>
            </div>
          </div>
          <Badge variant="success"><AppIcon name="check" size={10} stroke="var(--success)" /> {(webPush ? 1 : 0) + (telegramConfigured ? 1 : 0) + (whatsappConfigured ? 1 : 0)} ativos</Badge>
        </div>
        <div style={{ padding: "8px 16px" }}>
          <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 12, lineHeight: 1.45 }}>
            O Telegram segue o que está em <strong>Meu perfil</strong> (só mostra ativo com @ preenchido). Aqui você ajusta preferências locais do protótipo.
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, padding: "12px 0" }}>
            <div style={{
              padding: "14px 10px", borderRadius: 14,
              border: telegramConfigured ? "1px solid color-mix(in srgb, #229ED9 40%, var(--border))" : "1px solid var(--border)",
              background: telegramConfigured ? "color-mix(in srgb, #229ED9 8%, var(--card))" : "var(--margin-block-bg)",
              textAlign: "center", fontFamily: "var(--font-body)", position: "relative",
            }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "color-mix(in srgb, #229ED9 14%, transparent)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px" }}>
                <AppIcon name="send" size={18} stroke={telegramConfigured ? "#229ED9" : "var(--text-3)"} />
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: telegramConfigured ? "var(--text-1)" : "var(--text-3)" }}>Telegram</div>
              <div style={{ fontSize: 10, fontWeight: 600, color: telegramConfigured ? "#229ED9" : "var(--text-3)", marginTop: 4 }}>
                {telegramConfigured ? "Ativo (perfil)" : "Não configurado"}
              </div>
              {!telegramConfigured && (
                <button type="button" onClick={onOpenProfile} style={{ marginTop: 8, fontSize: 10, fontWeight: 700, border: "none", background: "none", color: "var(--accent)", cursor: "pointer", textDecoration: "underline" }}>Abrir perfil</button>
              )}
            </div>
            <div style={{
              padding: "14px 10px", borderRadius: 14, textAlign: "center", position: "relative",
              border: whatsappConfigured ? "1px solid color-mix(in srgb, #25D366 40%, var(--border))" : "1px solid var(--border)",
              background: whatsappConfigured ? "color-mix(in srgb, #25D366 8%, var(--card))" : "var(--margin-block-bg)",
              opacity: whatsappEnabled ? 1 : 0.65,
            }}>
              {!whatsappEnabled && (
                <span style={{ position: "absolute", top: 8, right: 8 }}><Badge variant="pro" style={{ fontSize: 8, padding: "1px 5px" }}>PRO</Badge></span>
              )}
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "color-mix(in srgb, #25D366 14%, transparent)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px" }}>
                <AppIcon name="message" size={18} stroke={whatsappConfigured ? "#25D366" : "var(--text-3)"} />
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: whatsappConfigured ? "var(--text-1)" : "var(--text-3)" }}>WhatsApp</div>
              <div style={{ fontSize: 10, fontWeight: 600, color: whatsappConfigured ? "#25D366" : "var(--text-3)", marginTop: 4 }}>
                {whatsappConfigured ? "Ativo (perfil)" : whatsappEnabled ? "Não configurado" : "Plano pago"}
              </div>
              {whatsappEnabled && !whatsappConfigured && (
                <button type="button" onClick={onOpenProfile} style={{ marginTop: 8, fontSize: 10, fontWeight: 700, border: "none", background: "none", color: "var(--accent)", cursor: "pointer", textDecoration: "underline" }}>Abrir perfil</button>
              )}
              {!whatsappEnabled && (
                <button type="button" onClick={onGoToPlan} style={{ marginTop: 8, fontSize: 10, fontWeight: 700, border: "none", background: "none", color: "var(--warning)", cursor: "pointer", textDecoration: "underline" }}>Ver planos</button>
              )}
            </div>
            <button type="button" onClick={() => setWebPush(v => !v)} style={{
              padding: "14px 10px", borderRadius: 14, cursor: "pointer",
              border: webPush ? "1px solid color-mix(in srgb, var(--accent-light) 40%, var(--border))" : "1px solid var(--border)",
              background: webPush ? "color-mix(in srgb, var(--accent-light) 8%, var(--card))" : "var(--margin-block-bg)",
              textAlign: "center", fontFamily: "var(--font-body)",
            }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "color-mix(in srgb, var(--accent-light) 14%, transparent)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px" }}>
                <AppIcon name="monitor" size={18} stroke={webPush ? "var(--accent-light)" : "var(--text-3)"} />
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: webPush ? "var(--text-1)" : "var(--text-3)" }}>Web App</div>
              <div style={{ fontSize: 10, fontWeight: 600, color: webPush ? "var(--accent-light)" : "var(--text-3)", marginTop: 4 }}>{webPush ? "Ativo" : "Inativo"}</div>
            </button>
          </div>

          <div style={{ borderTop: "1px solid var(--border)", padding: "12px 4px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: "color-mix(in srgb, var(--info) 12%, transparent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <AppIcon name="moon" size={16} stroke="var(--info)" />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>Modo silêncio</div>
                  <div style={{ fontSize: 11, color: "var(--text-3)" }}>{quietStart} — {quietEnd} • Sem push</div>
                </div>
              </div>
              <Toggle checked={quiet} onChange={() => setQuiet(!quiet)} />
            </div>

            {quiet && (
              <div style={{ marginTop: 12, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>De</label>
                  <select
                    value={quietStart}
                    onChange={e => setQuietStart(e.target.value)}
                    style={{
                      padding: "7px 10px", borderRadius: 10, border: "1px solid var(--border)",
                      background: "var(--card)", color: "var(--text-1)", fontSize: 13, fontWeight: 600,
                      fontFamily: "var(--font-mono)", cursor: "pointer", outline: "none",
                    }}
                  >
                    {Array.from({ length: 24 }, (_, h) => {
                      const t = `${String(h).padStart(2, "0")}:00`;
                      return <option key={t} value={t}>{t}</option>;
                    })}
                  </select>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Até</label>
                  <select
                    value={quietEnd}
                    onChange={e => setQuietEnd(e.target.value)}
                    style={{
                      padding: "7px 10px", borderRadius: 10, border: "1px solid var(--border)",
                      background: "var(--card)", color: "var(--text-1)", fontSize: 13, fontWeight: 600,
                      fontFamily: "var(--font-mono)", cursor: "pointer", outline: "none",
                    }}
                  >
                    {Array.from({ length: 24 }, (_, h) => {
                      const t = `${String(h).padStart(2, "0")}:00`;
                      return <option key={t} value={t}>{t}</option>;
                    })}
                  </select>
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {[["22:00", "07:00"], ["23:00", "08:00"], ["00:00", "06:00"]].map(([s, e]) => (
                    <button
                      key={`${s}-${e}`}
                      onClick={() => { setQuietStart(s); setQuietEnd(e); }}
                      style={{
                        padding: "5px 10px", borderRadius: 8, cursor: "pointer", fontSize: 11, fontWeight: 600,
                        fontFamily: "var(--font-mono)",
                        border: quietStart === s && quietEnd === e
                          ? "1px solid color-mix(in srgb, var(--info) 50%, var(--border))"
                          : "1px solid var(--border)",
                        background: quietStart === s && quietEnd === e
                          ? "color-mix(in srgb, var(--info) 12%, var(--card))"
                          : "var(--card)",
                        color: quietStart === s && quietEnd === e ? "var(--info)" : "var(--text-3)",
                      }}
                    >{s}–{e}</button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent alerts card */}
      <div style={{ background: "var(--card)", borderRadius: 20, border: "1px solid var(--border)", overflow: "hidden", boxShadow: "var(--card-shadow)" }}>
        <div style={{ background: "color-mix(in srgb, var(--info) 6%, var(--card))", borderBottom: "1px solid var(--border)", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: "color-mix(in srgb, var(--info) 16%, transparent)", border: "1px solid color-mix(in srgb, var(--info) 30%, transparent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <AppIcon name="inbox" size={16} stroke="var(--info)" />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)" }}>Alertas recentes</div>
              <div style={{ fontSize: 11, color: "var(--text-3)" }}>Ofertas que atendem seus filtros</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Badge variant="accent">{visibleNotifications.filter(n => n.unread).length} novos</Badge>
          </div>
        </div>

        <div style={{ padding: "16px 20px" }}>
          {/* Usage bar + filter row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-3)", marginBottom: 4 }}>
                <span>Alertas hoje: <strong style={{ color: "var(--text-1)" }}>{freeUsage}/5</strong></span>
                <span>Frete ate R$ {profile.freightCap}</span>
              </div>
              <div style={{ height: 4, background: "var(--margin-bar-bg)", borderRadius: 999 }}>
                <div style={{ height: "100%", borderRadius: 999, width: `${usagePct}%`, background: limitReached ? "var(--warning)" : "var(--accent)", transition: "width 0.3s" }} />
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--margin-block-bg)", border: "1px solid var(--border)", borderRadius: 8, padding: "6px 10px", cursor: "pointer" }} onClick={() => setOnlyPending(!onlyPending)}>
              <span style={{ width: 14, height: 14, borderRadius: 4, border: onlyPending ? "none" : "1.5px solid var(--text-3)", background: onlyPending ? "var(--accent)" : "transparent", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                {onlyPending && <AppIcon name="check" size={10} stroke="#fff" />}
              </span>
              <span style={{ fontSize: 11, color: "var(--text-2)", fontWeight: 600, whiteSpace: "nowrap" }}>Nao compradas</span>
            </div>
          </div>

          {/* Notification list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {visibleNotifications.map((n, idx) => {
            const mp = marketplaceConfig[n.marketplace];
            const q = qualityConfig[n.quality];
            return (
            <div key={n.id} style={{
              padding: "12px 14px", borderRadius: 14, display: "flex", gap: 12, alignItems: "center",
              background: n.unread ? "color-mix(in srgb, var(--accent) 5%, var(--card))" : "var(--margin-block-bg)",
              border: n.unread ? "1px solid color-mix(in srgb, var(--accent) 18%, var(--border))" : "1px solid var(--border)",
              animation: `cardIn 0.3s cubic-bezier(.2,.8,.3,1) ${idx * 50}ms both`,
            }}>
              <div style={{ position: "relative", flexShrink: 0 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: `${mp?.color || "var(--accent)"}18`, border: `1px solid ${mp?.color || "var(--accent)"}30`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                  {mp?.logo ? <img src={mp.logo} alt={n.marketplace} style={{ width: 22, height: 22, objectFit: "contain" }} /> : <AppIcon name="store" size={18} />}
                </div>
                {n.unread && <span style={{ position: "absolute", top: -2, right: -2, width: 9, height: 9, borderRadius: "50%", background: "var(--accent)", border: "2px solid var(--card)" }} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.name}</span>
                  <span style={{ fontSize: 10, color: "var(--text-3)", flexShrink: 0 }}>ha {n.time}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 15, fontWeight: 800, color: "var(--text-1)", fontFamily: "var(--font-mono)" }}>R$ {n.price.toFixed(2).replace(".", ",")}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "var(--accent)", background: "color-mix(in srgb, var(--accent) 10%, transparent)", padding: "2px 7px", borderRadius: 6 }}>-{n.discount}%</span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--success)", fontWeight: 700, background: "color-mix(in srgb, var(--success) 10%, transparent)", padding: "2px 7px", borderRadius: 6 }}>
                    {n.margin}%
                    {n.bestChannel && (
                      <>
                        <span style={{ color: "var(--text-3)", fontWeight: 400 }}>via</span>
                        {marketplaceConfig[n.bestChannel]?.logo && (
                          <span style={{ width: 12, height: 12, borderRadius: 3, background: "#fff", border: "1px solid var(--border)", display: "inline-flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                            <img src={marketplaceConfig[n.bestChannel].logo} alt={n.bestChannel} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          </span>
                        )}
                        <span>{n.bestChannel.split(" ")[0]}</span>
                      </>
                    )}
                  </span>
                  <span style={{ fontSize: 10, color: "var(--text-3)" }}>{n.freightInfo}</span>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                <a href={n.buyUrl} target="_blank" rel="noreferrer" style={{
                  width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
                  background: "color-mix(in srgb, var(--accent) 10%, transparent)", border: "1px solid color-mix(in srgb, var(--accent) 22%, transparent)",
                  textDecoration: "none",
                }}><AppIcon name="arrowUpRight" size={15} stroke="var(--accent-dark)" /></a>
                <button
                  onClick={() => onToggleBought(n.id)}
                  aria-label={n.bought ? "Desmarcar comprada" : "Marcar comprada"}
                  style={{
                    width: 36, height: 36, borderRadius: 10,
                    border: n.bought ? "1px solid color-mix(in srgb, var(--success) 45%, var(--border))" : "1px solid var(--border)",
                    background: n.bought ? "color-mix(in srgb, var(--success) 12%, transparent)" : "transparent",
                    color: n.bought ? "var(--success)" : "var(--text-3)",
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  <AppIcon name={n.bought ? "check" : "bag"} size={15} stroke={n.bought ? "var(--success)" : "var(--text-3)"} />
                </button>
              </div>
            </div>
            );
          })}
          </div>
          {visibleNotifications.length === 0 && (
            <div style={{ textAlign: "center", padding: "24px 10px", borderRadius: 14, border: "1px dashed var(--border)", color: "var(--text-3)", fontSize: 12, marginTop: 4 }}>
              <AppIcon name="inbox" size={20} stroke="var(--text-3)" />
              <div style={{ marginTop: 6 }}>Sem alertas pendentes neste filtro.</div>
            </div>
          )}
        </div>
      </div>

      {/* Upsell banner — only for free plan */}
      {!whatsappEnabled && (
        <div onClick={onGoToPlan} style={{
          background: "linear-gradient(135deg, color-mix(in srgb, var(--warning) 8%, var(--card)), color-mix(in srgb, var(--accent-light) 5%, var(--card)))",
          borderRadius: 18, padding: "18px 20px", marginTop: 20, cursor: "pointer",
          border: "1px solid color-mix(in srgb, var(--warning) 20%, var(--border))",
          display: "flex", alignItems: "center", gap: 16,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 14, flexShrink: 0,
            background: "color-mix(in srgb, var(--warning) 14%, transparent)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <AppIcon name="bell" size={22} stroke="var(--warning)" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)", marginBottom: 3 }}>
              Receba alertas no WhatsApp com delay de 2 min
            </div>
            <div style={{ fontSize: 12, color: "var(--text-3)" }}>
              Seja o primeiro a saber. Faça upgrade e nunca perca uma oferta.
            </div>
          </div>
          <AppIcon name="chevron-right" size={18} stroke="var(--warning)" />
        </div>
      )}
    </div>
  );
}

function ProfilePage({ userInfo, onUserInfoChange, profile, onProfileChange }) {
  const update = (field, value) => onUserInfoChange({ ...userInfo, [field]: value });

  const inputStyle = {
    width: "100%", padding: "12px 14px", borderRadius: 12,
    border: "1px solid var(--border)", background: "var(--input-bg)", color: "var(--text-1)",
    fontSize: 14, fontFamily: "var(--font-body)", boxSizing: "border-box", outline: "none",
    transition: "border-color 0.2s",
  };
  const labelStyle = {
    fontSize: 11, fontWeight: 700, color: "var(--text-3)", display: "block", marginBottom: 6,
    textTransform: "uppercase", letterSpacing: "0.06em",
  };

  const UF_LIST = [
    "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
    "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
  ];

  const CITIES_BY_STATE = {
    AC: ["Rio Branco","Cruzeiro do Sul","Sena Madureira","Tarauacá"],
    AL: ["Maceió","Arapiraca","Palmeira dos Índios","Rio Largo"],
    AP: ["Macapá","Santana","Laranjal do Jari","Oiapoque"],
    AM: ["Manaus","Parintins","Itacoatiara","Manacapuru","Tefé"],
    BA: ["Salvador","Feira de Santana","Vitória da Conquista","Camaçari","Ilhéus","Itabuna","Lauro de Freitas"],
    CE: ["Fortaleza","Caucaia","Juazeiro do Norte","Maracanaú","Sobral"],
    DF: ["Brasília","Taguatinga","Ceilândia","Samambaia","Gama"],
    ES: ["Vitória","Vila Velha","Serra","Cariacica","Linhares","Cachoeiro de Itapemirim"],
    GO: ["Goiânia","Aparecida de Goiânia","Anápolis","Rio Verde","Luziânia"],
    MA: ["São Luís","Imperatriz","Timon","Caxias","Codó"],
    MT: ["Cuiabá","Várzea Grande","Rondonópolis","Sinop","Tangará da Serra"],
    MS: ["Campo Grande","Dourados","Três Lagoas","Corumbá","Ponta Porã"],
    MG: ["Belo Horizonte","Uberlândia","Contagem","Juiz de Fora","Betim","Montes Claros","Ribeirão das Neves","Uberaba"],
    PA: ["Belém","Ananindeua","Santarém","Marabá","Parauapebas"],
    PB: ["João Pessoa","Campina Grande","Santa Rita","Patos","Bayeux"],
    PR: ["Curitiba","Londrina","Maringá","Ponta Grossa","Cascavel","São José dos Pinhais","Foz do Iguaçu"],
    PE: ["Recife","Jaboatão dos Guararapes","Olinda","Caruaru","Petrolina","Paulista"],
    PI: ["Teresina","Parnaíba","Picos","Piripiri","Floriano"],
    RJ: ["Rio de Janeiro","São Gonçalo","Duque de Caxias","Nova Iguaçu","Niterói","Belford Roxo","Petrópolis","Volta Redonda"],
    RN: ["Natal","Mossoró","Parnamirim","São Gonçalo do Amarante","Macaíba"],
    RS: ["Porto Alegre","Caxias do Sul","Pelotas","Canoas","Santa Maria","Gravataí","Novo Hamburgo"],
    RO: ["Porto Velho","Ji-Paraná","Ariquemes","Vilhena","Cacoal"],
    RR: ["Boa Vista","Rorainópolis","Caracaraí","Alto Alegre"],
    SC: ["Florianópolis","Joinville","Blumenau","São José","Chapecó","Criciúma","Itajaí","Palhoça","Lages","Balneário Camboriú"],
    SP: ["São Paulo","Guarulhos","Campinas","São Bernardo do Campo","Santo André","Osasco","São José dos Campos","Ribeirão Preto","Sorocaba","Santos"],
    SE: ["Aracaju","Nossa Senhora do Socorro","Lagarto","Itabaiana"],
    TO: ["Palmas","Araguaína","Gurupi","Porto Nacional"],
  };

  const NEIGHBORHOODS_BY_CITY = {
    "São Paulo": ["Centro","Pinheiros","Vila Mariana","Moema","Itaim Bibi","Jardins","Liberdade","Brooklin","Tatuapé","Santana","Lapa","Butantã"],
    "Rio de Janeiro": ["Centro","Copacabana","Botafogo","Ipanema","Leblon","Barra da Tijuca","Tijuca","Méier","Maracanã","Lapa"],
    "Belo Horizonte": ["Centro","Savassi","Funcionários","Lourdes","Pampulha","Buritis","Santa Efigênia","Mangabeiras"],
    "Curitiba": ["Centro","Batel","Água Verde","Bigorrilho","Santa Felicidade","Juvevê","Mercês","Portão","Rebouças"],
    "Porto Alegre": ["Centro Histórico","Moinhos de Vento","Bom Fim","Petrópolis","Menino Deus","Cidade Baixa","Floresta","Auxiliadora"],
    "Salvador": ["Centro","Barra","Pituba","Itaigara","Caminho das Árvores","Ondina","Rio Vermelho","Brotas"],
    "Fortaleza": ["Centro","Aldeota","Meireles","Mucuripe","Fátima","Benfica","Dionísio Torres","Varjota"],
    "Recife": ["Centro","Boa Viagem","Casa Forte","Espinheiro","Graças","Derby","Aflitos","Madalena"],
    "Brasília": ["Asa Sul","Asa Norte","Lago Sul","Lago Norte","Sudoeste","Noroeste","Cruzeiro"],
    "Manaus": ["Centro","Adrianópolis","Vieiralves","Ponta Negra","Flores","Aleixo","Dom Pedro"],
    "Florianópolis": ["Centro","Trindade","Agronômica","Itacorubi","Coqueiros","Lagoa da Conceição","Ingleses","Campeche","Canasvieiras"],
    "Joinville": ["Centro","Glória","Anita Garibaldi","Bucarein","Saguaçu","Iririú","Bom Retiro","Costa e Silva"],
    "Blumenau": ["Centro","Victor Konder","Velha","Ponta Aguda","Garcia","Vila Nova","Itoupava Norte"],
    "Palhoça": ["Centro","Pedra Branca","Caminho Novo","Passa Vinte","Aririu","Brejaru","Ponte do Imaruim"],
    "São José": ["Centro","Barreiros","Campinas","Kobrasol","Forquilhinhas","Fazenda Santo Antônio","Praia Comprida"],
    "Campinas": ["Centro","Cambuí","Barão Geraldo","Taquaral","Sousas","Nova Campinas","Guanabara"],
    "Guarulhos": ["Centro","Macedo","Vila Galvão","Gopoúva","Torres Tibagy","Jardim Maia"],
    "Goiânia": ["Centro","Setor Bueno","Setor Marista","Jardim Goiás","Setor Oeste","Setor Sul","Setor Central"],
    "Londrina": ["Centro","Gleba Palhano","Jardim Higienópolis","Vila Brasil","Bela Suíça"],
    "Maringá": ["Centro","Zona 7","Zona 5","Jardim Aclimação","Vila Esperança","Parque Industrial"],
  };

  const selectedState = userInfo.addressState || "";
  const citiesForState = CITIES_BY_STATE[selectedState] || [];
  const neighborhoodsForCity = NEIGHBORHOODS_BY_CITY[userInfo.city] || [];

  const handleStateChange = (value) => {
    onUserInfoChange({ ...userInfo, addressState: value, city: "", neighborhood: "" });
  };
  const handleCityChange = (value) => {
    onUserInfoChange({ ...userInfo, city: value, neighborhood: "" });
  };

  const sections = [
    {
      title: "Informações pessoais",
      subtitle: "Seus dados básicos de identificação",
      icon: "user",
      fields: [
        { key: "name", label: "Nome completo", type: "text", placeholder: "Ex: Carlos Silva", icon: "user" },
        { key: "email", label: "E-mail", type: "email", placeholder: "Ex: carlos@email.com", icon: "mail" },
        { key: "phone", label: "Telefone", type: "tel", placeholder: "Ex: (48) 99999-0000", icon: "phone" },
      ],
    },
    {
      title: "Endereço",
      subtitle: "Usado para cálculo de frete e filtros regionais",
      icon: "map-pin",
      fields: [
        { key: "cep", label: "CEP", type: "text", placeholder: "Ex: 88137-084", icon: "map-pin",
          hint: "Formato: 00000-000", half: true },
        { key: "addressState", label: "Estado", type: "select", icon: "map", options: UF_LIST, half: true,
          customChange: handleStateChange },
        { key: "city", label: "Cidade", type: "select", icon: "home",
          options: citiesForState, placeholder: selectedState ? "Selecione a cidade" : "Selecione o estado primeiro",
          disabled: !selectedState, half: true, customChange: handleCityChange },
        { key: "neighborhood", label: "Bairro", type: "select", icon: "home",
          options: neighborhoodsForCity, placeholder: userInfo.city ? "Selecione o bairro" : "Selecione a cidade primeiro",
          disabled: !userInfo.city, allowCustom: true, half: true },
        { key: "street", label: "Rua / Logradouro", type: "text", placeholder: "Ex: Rua das Flores, 123", icon: "map" },
        { key: "complement", label: "Complemento", type: "text", placeholder: "Ex: Apto 301, Bloco B", icon: "edit",
          hint: "Opcional" },
      ],
    },
    {
      title: "Canais de alerta",
      subtitle: "Onde você quer receber as notificações de oportunidades",
      icon: "bell",
      fields: [
        { key: "whatsapp", label: "Número WhatsApp", type: "tel", placeholder: "Ex: +55 48 99999-0000", icon: "message-circle",
          hint: "Incluir código do país (+55) e DDD" },
        { key: "telegram", label: "Usuário Telegram", type: "text", placeholder: "Ex: @carlossilva", icon: "send",
          hint: "Seu @username do Telegram, sem espaços" },
      ],
    },
  ];

  const initials = userInfo.name
    ? userInfo.name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase()
    : "?";

  const gravatarUrl = useGravatar(userInfo.email, 128);
  const [gravatarLoaded, setGravatarLoaded] = useState(false);
  const [gravatarError, setGravatarError] = useState(false);

  useEffect(() => {
    if (!gravatarUrl) { setGravatarLoaded(false); setGravatarError(false); return; }
    setGravatarLoaded(false); setGravatarError(false);
    const img = new Image();
    img.onload = () => setGravatarLoaded(true);
    img.onerror = () => setGravatarError(true);
    img.src = gravatarUrl;
  }, [gravatarUrl]);

  const hasGravatar = gravatarUrl && gravatarLoaded && !gravatarError;

  const completeness = ["name", "email", "phone", "cep", "addressState", "city", "street", "whatsapp", "telegram"].filter(k => userInfo[k]?.trim()).length;
  const total = 9;
  const pct = Math.round((completeness / total) * 100);

  return (
    <div>
      {/* Profile header card */}
      <div style={{
        background: "linear-gradient(145deg, color-mix(in srgb, var(--accent-light) 8%, var(--card)), color-mix(in srgb, var(--accent) 4%, var(--card)))",
        borderRadius: 24, padding: "28px 24px", marginBottom: 24,
        border: "1px solid color-mix(in srgb, var(--accent-light) 15%, var(--border))",
        display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap",
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: 20, flexShrink: 0, overflow: "hidden",
          background: "linear-gradient(135deg, var(--accent-light), var(--accent))",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: "0.04em",
          boxShadow: "0 4px 16px color-mix(in srgb, var(--accent-light) 30%, transparent)",
          position: "relative",
        }}>
          {hasGravatar
            ? <img src={gravatarUrl} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            : initials}
        </div>
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-1)", marginBottom: 4 }}>
            {userInfo.name || "Configure seu perfil"}
          </div>
          <div style={{ fontSize: 13, color: "var(--text-3)", marginBottom: 10 }}>
            {userInfo.email || "Adicione suas informações para começar"}
          </div>
          {/* Completeness bar */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              flex: 1, height: 6, borderRadius: 3, background: "var(--margin-block-bg)", overflow: "hidden", maxWidth: 180,
            }}>
              <div style={{
                height: "100%", borderRadius: 3, transition: "width 0.4s ease",
                width: `${pct}%`,
                background: pct === 100
                  ? "var(--success)"
                  : pct >= 60 ? "var(--accent-light)" : "var(--warning)",
              }} />
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: pct === 100 ? "var(--success)" : "var(--text-3)" }}>
              {completeness}/{total} {pct === 100 ? "Completo" : ""}
            </span>
          </div>
          {/* Gravatar status */}
          <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6 }}>
            {hasGravatar ? (
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600,
                color: "var(--accent-light)", background: "color-mix(in srgb, var(--accent-light) 8%, transparent)",
                border: "1px solid color-mix(in srgb, var(--accent-light) 18%, transparent)",
                borderRadius: 6, padding: "3px 8px",
              }}>
                <AppIcon name="check-circle" size={10} stroke="var(--accent-light)" /> Gravatar conectado
              </span>
            ) : userInfo.email?.trim().includes("@") ? (
              <a href="https://gravatar.com" target="_blank" rel="noopener noreferrer" style={{
                display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600,
                color: "var(--text-3)", background: "var(--margin-block-bg)",
                border: "1px solid var(--border)", borderRadius: 6, padding: "3px 8px",
                textDecoration: "none", cursor: "pointer",
              }}>
                <AppIcon name="image" size={10} stroke="var(--text-3)" /> Criar avatar no Gravatar
              </a>
            ) : null}
          </div>
        </div>
      </div>

      {profile && onProfileChange && (
        <div style={{ background: "var(--card)", borderRadius: 20, padding: "20px 20px 16px", border: "1px solid var(--border)", boxShadow: "var(--card-shadow)", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "color-mix(in srgb, var(--accent-light) 14%, transparent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <AppIcon name="trending-up" size={18} stroke="var(--accent-light)" />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)" }}>Canais de revenda</div>
              <div style={{ fontSize: 12, color: "var(--text-3)" }}>Define onde a margem estimada é calculada.</div>
            </div>
          </div>
          <ResaleChannelsForm
            value={{ ...DEFAULT_RESALE_CHANNELS, ...(profile.resaleChannels || {}) }}
            onChange={(next) => onProfileChange({ resaleChannels: next })}
            compact
          />
        </div>
      )}

      {/* Sections */}
      {sections.map((section, si) => {
        const sectionColors = [
          { bg: "var(--accent-light)", mix: "color-mix(in srgb, var(--accent-light) 12%, transparent)" },
          { bg: "var(--accent)", mix: "color-mix(in srgb, var(--accent) 12%, transparent)" },
          { bg: "var(--success)", mix: "color-mix(in srgb, var(--success) 12%, transparent)" },
        ];
        const sc = sectionColors[si] || sectionColors[0];

        const renderField = (f) => {
          const onFieldChange = f.customChange || ((val) => update(f.key, val));
          const isDisabled = f.disabled;
          return (
          <div key={f.key} style={{ flex: f.half ? "1 1 calc(50% - 8px)" : "1 1 100%", minWidth: f.half ? 120 : undefined, opacity: isDisabled ? 0.55 : 1 }}>
            <label style={labelStyle}>{f.label}</label>
            <div style={{ position: "relative" }}>
              <span style={{
                position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
                display: "inline-flex", alignItems: "center", pointerEvents: "none",
                color: userInfo[f.key]?.trim() ? "var(--accent-light)" : "var(--text-3)", opacity: userInfo[f.key]?.trim() ? 1 : 0.5,
              }}>
                <AppIcon name={f.icon} size={14} />
              </span>
              {f.type === "select" ? (
                <>
                  <select
                    value={userInfo[f.key] || ""}
                    onChange={e => onFieldChange(e.target.value)}
                    disabled={isDisabled}
                    style={{
                      ...inputStyle, paddingLeft: 38, cursor: isDisabled ? "not-allowed" : "pointer",
                      WebkitAppearance: "none", MozAppearance: "none", appearance: "none",
                      paddingRight: 36,
                    }}
                  >
                    <option value="">{f.placeholder || "Selecione..."}</option>
                    {(f.options || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                  {f.allowCustom && !isDisabled && (
                    <input
                      type="text"
                      value={userInfo[f.key] && !(f.options || []).includes(userInfo[f.key]) ? userInfo[f.key] : ""}
                      onChange={e => update(f.key, e.target.value)}
                      placeholder="Ou digite manualmente..."
                      style={{ ...inputStyle, paddingLeft: 38, marginTop: 6, fontSize: 12 }}
                    />
                  )}
                </>
              ) : (
                <input
                  type={f.type}
                  value={userInfo[f.key] || ""}
                  onChange={e => update(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  style={{ ...inputStyle, paddingLeft: 38 }}
                />
              )}
              {f.type === "select" && (
                <span style={{
                  position: "absolute", right: 14, top: f.allowCustom ? 20 : "50%", transform: f.allowCustom ? "none" : "translateY(-50%)",
                  display: "inline-flex", alignItems: "center", pointerEvents: "none", color: "var(--text-3)",
                }}>
                  <AppIcon name="chevron-down" size={14} />
                </span>
              )}
            </div>
            {f.hint && (
              <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 5, display: "flex", alignItems: "center", gap: 4 }}>
                <AppIcon name="info" size={10} stroke="var(--text-3)" /> {f.hint}
              </div>
            )}
          </div>
          );
        };

        return (
        <div key={si} style={{
          background: "var(--card)", borderRadius: 20, padding: "24px 22px", marginBottom: 20,
          border: "1px solid var(--border)", boxShadow: "var(--card-shadow)",
        }}>
          {/* Section header */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 12, flexShrink: 0,
              background: sc.mix,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <AppIcon name={section.icon} size={18} stroke={sc.bg} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-1)" }}>{section.title}</div>
              <div style={{ fontSize: 12, color: "var(--text-3)" }}>{section.subtitle}</div>
            </div>
          </div>

          {/* Fields */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
            {section.fields.map(renderField)}
          </div>
        </div>
        );
      })}

      {/* Region & Freight */}
      {profile && onProfileChange && (
        <div style={{ background: "var(--card)", borderRadius: 20, border: "1px solid var(--border)", overflow: "hidden", boxShadow: "var(--card-shadow)", marginBottom: 20 }}>
          <div style={{ background: "color-mix(in srgb, var(--accent-light) 8%, var(--card))", borderBottom: "1px solid var(--border)", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "color-mix(in srgb, var(--accent-light) 16%, transparent)", border: "1px solid color-mix(in srgb, var(--accent-light) 30%, transparent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <AppIcon name="globe" size={18} stroke="var(--accent-light)" />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)" }}>Região e frete</div>
                <div style={{ fontSize: 11, color: "var(--text-3)" }}>Otimize filtros de frete e localização</div>
              </div>
            </div>
          </div>
          <div style={{ padding: 20 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
              <div style={{ background: "var(--margin-block-bg)", border: "1px solid var(--border)", borderRadius: 14, padding: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                  <AppIcon name="map" size={14} stroke="var(--accent-light)" />
                  <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Estado</span>
                </div>
                <select
                  value={profile.state}
                  onChange={e => onProfileChange({ state: e.target.value })}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--card)", color: "var(--text-1)", fontSize: 14, fontWeight: 600, fontFamily: "var(--font-body)", boxSizing: "border-box", outline: "none", cursor: "pointer" }}
                >
                  {["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"].map(uf => (
                    <option key={uf} value={uf}>{uf}</option>
                  ))}
                </select>
              </div>
              <div style={{ background: "var(--margin-block-bg)", border: "1px solid var(--border)", borderRadius: 14, padding: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                  <AppIcon name="pin" size={14} stroke="var(--accent-light)" />
                  <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Cidade</span>
                </div>
                <input
                  value={profile.city}
                  onChange={e => onProfileChange({ city: e.target.value })}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--card)", color: "var(--text-1)", fontSize: 14, fontFamily: "var(--font-body)", boxSizing: "border-box", outline: "none" }}
                />
              </div>
            </div>
            <div style={{ background: "var(--margin-block-bg)", border: "1px solid var(--border)", borderRadius: 14, padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <AppIcon name="truck" size={15} stroke="var(--info)" />
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>Teto de frete</span>
                </div>
                <span style={{ fontSize: 22, fontWeight: 800, color: "var(--info)", fontFamily: "var(--font-mono)" }}>R$ {profile.freightCap}</span>
              </div>
              <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                {[15, 25, 30, 50, 80].map(val => (
                  <button key={val} onClick={() => onProfileChange({ freightCap: val })} style={{
                    flex: 1, padding: "8px 4px", borderRadius: 8, cursor: "pointer",
                    border: profile.freightCap === val ? "1px solid color-mix(in srgb, var(--info) 50%, transparent)" : "1px solid var(--border)",
                    background: profile.freightCap === val ? "color-mix(in srgb, var(--info) 14%, var(--card))" : "var(--card)",
                    color: profile.freightCap === val ? "var(--info)" : "var(--text-2)",
                    fontSize: 12, fontWeight: 700, fontFamily: "var(--font-mono)",
                  }}>R$ {val}</button>
                ))}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--text-3)" }}>
                <span>Oportunidades com frete acima desse valor não geram push.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status card */}
      <div style={{
        background: "var(--card)", borderRadius: 16, padding: "16px 20px",
        border: "1px solid var(--border)",
        display: "flex", alignItems: "center", gap: 14,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: userInfo.whatsapp?.trim() || userInfo.telegram?.trim()
            ? "color-mix(in srgb, var(--success) 12%, transparent)"
            : "color-mix(in srgb, var(--danger) 10%, transparent)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <AppIcon name={userInfo.whatsapp?.trim() || userInfo.telegram?.trim() ? "check-circle" : "alert-circle"} size={18}
            stroke={userInfo.whatsapp?.trim() || userInfo.telegram?.trim() ? "var(--success)" : "var(--danger)"} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>
            {userInfo.whatsapp?.trim() || userInfo.telegram?.trim()
              ? "Alertas configurados"
              : "Nenhum canal de alerta configurado"}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-3)" }}>
            {userInfo.whatsapp?.trim() || userInfo.telegram?.trim()
              ? `Recebendo via ${[userInfo.whatsapp?.trim() && "WhatsApp", userInfo.telegram?.trim() && "Telegram"].filter(Boolean).join(" e ")}`
              : "Preencha pelo menos um canal para receber oportunidades"}
          </div>
        </div>
      </div>
    </div>
  );
}

function PlanPage({ subscriptionPlan, onSelectPlan }) {
  const tier = subscriptionPlan || "free";
  const plans = useMemo(() => [
    {
      name: "FREE", price: "0", period: "", subtitle: "Validação e aquisição",
      current: tier === "free", accent: "#7B42C9",
      features: [
        { text: "5 termos de interesse", included: true },
        { text: "3 marketplaces", included: true },
        { text: "5 alertas por dia", included: true },
        { text: "Alerta via Telegram + Web", included: true },
        { text: "Scan a cada 2h", included: true, warn: true },
        { text: "Histórico 7 dias", included: true, warn: true },
        { text: "WhatsApp", included: false },
        { text: "Tendências", included: false },
        { text: "Score de momento", included: false },
      ],
    },
    {
      name: "STARTER", price: "49", period: "/mês", subtitle: "Para o revendedor ativo",
      current: tier === "starter", accent: "#D4A017", recommended: true,
      savings: "Economize até R$ 2.400/mês",
      features: [
        { text: "20 produtos monitorados", included: true },
        { text: "Todos os marketplaces", included: true },
        { text: "Alerta via WhatsApp + Telegram", included: true },
        { text: "Delay de 5 min", included: true, highlight: true },
        { text: "Histórico 30 dias", included: true },
        { text: "Score básico de oportunidade", included: true, highlight: true },
        { text: "Tendências de mercado", included: false },
        { text: "Sazonalidade", included: false },
        { text: "Sugestão de volume", included: false },
      ],
    },
    {
      name: "PRO", price: "149", period: "/mês", subtitle: "Comprar com estratégia",
      current: tier === "pro", popular: true, accent: "#2E8B57",
      savings: "ROI médio de 12x o valor",
      features: [
        { text: "Ilimitado produtos", included: true, highlight: true },
        { text: "Todos os marketplaces", included: true },
        { text: "WhatsApp + Telegram", included: true },
        { text: "Delay < 2 min", included: true, highlight: true },
        { text: "Histórico 90 dias", included: true },
        { text: "Tendências de mercado", included: true, highlight: true },
        { text: "Sazonalidade detectada", included: true, highlight: true },
        { text: "Score de momento", included: true, highlight: true },
        { text: "Sugestão de volume de compra", included: true, highlight: true },
      ],
    },
  ], [tier]);

  const testimonials = [
    { name: "Rafael M.", role: "Revendedor SP", text: "Com o PRO encontrei um PS5 abaixo do custo. Faturei R$ 1.800 em um dia.", plan: "PRO" },
    { name: "Camila S.", role: "Lojista SC", text: "Upgrade pro Starter e já paguei o plano na primeira semana.", plan: "STARTER" },
    { name: "André L.", role: "Revendedor PR", text: "O delay de 2 min me dá vantagem sobre quem ainda usa o FREE.", plan: "PRO" },
  ];

  return (
    <div>
      {/* Hero section */}
      <div style={{
        textAlign: "center", marginBottom: 32, padding: "32px 20px",
        background: "linear-gradient(145deg, color-mix(in srgb, var(--warning) 6%, var(--card)), color-mix(in srgb, var(--accent-light) 4%, var(--card)))",
        borderRadius: 24, border: "1px solid color-mix(in srgb, var(--warning) 15%, var(--border))",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", top: -60, right: -60, width: 160, height: 160, borderRadius: "50%",
          background: "color-mix(in srgb, var(--warning) 6%, transparent)", pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: -40, left: -40, width: 120, height: 120, borderRadius: "50%",
          background: "color-mix(in srgb, var(--accent-light) 6%, transparent)", pointerEvents: "none",
        }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 12,
            fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "var(--warning)",
            background: "color-mix(in srgb, var(--warning) 10%, var(--card))", border: "1px solid color-mix(in srgb, var(--warning) 20%, var(--border))",
            borderRadius: 999, padding: "5px 14px",
          }}>
            <AppIcon name="zap" size={12} stroke="var(--warning)" /> DESBLOQUEIE SEU POTENCIAL
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, fontFamily: "var(--font-display)", marginBottom: 8, lineHeight: 1.2 }}>
            Pare de perder oportunidades.<br />
            <span style={{ color: "var(--warning)" }}>Evolua seu plano.</span>
          </div>
          <div style={{ fontSize: 14, color: "var(--text-3)", maxWidth: 460, margin: "0 auto", lineHeight: 1.6 }}>
            Enquanto você espera, outros revendedores já estão comprando. Um delay menor e mais marketplaces fazem toda a diferença.
          </div>
        </div>
      </div>

      {/* Urgency stats */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 28,
      }}>
        {[
          { icon: "clock", value: "2h", label: "Frequência de scan", color: "var(--danger)", sub: "vs 30 min no PRO" },
          { icon: "eye", value: "5", label: "Termos monitorados", color: "var(--warning)", sub: "vs ilimitado no PRO" },
          { icon: "trending-up", value: "R$ 0", label: "Tendências", color: "var(--text-3)", sub: "Disponível no STARTER+" },
        ].map((s, i) => (
          <div key={i} style={{
            background: "var(--card)", borderRadius: 16, padding: "16px 14px", textAlign: "center",
            border: "1px solid var(--border)", position: "relative", overflow: "hidden",
          }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: s.color, opacity: 0.6 }} />
            <AppIcon name={s.icon} size={18} stroke={s.color} />
            <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "var(--font-mono)", color: s.color, margin: "6px 0 2px", letterSpacing: "-0.02em" }}>{s.value}</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-2)", marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 10, color: "var(--accent-light)", fontWeight: 600 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Social proof */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center", gap: 20, marginBottom: 28, flexWrap: "wrap",
      }}>
        <div style={{
          fontSize: 12, color: "var(--text-3)", display: "inline-flex", alignItems: "center", gap: 6,
          background: "color-mix(in srgb, var(--success) 10%, var(--card))", border: "1px solid color-mix(in srgb, var(--success) 25%, var(--border))",
          borderRadius: 999, padding: "6px 14px",
        }}>
          <AppIcon name="check" size={12} stroke="var(--success)" /> <strong style={{ color: "var(--success)" }}>347 revendedores</strong> já usam o Avisus
        </div>
        <div style={{
          fontSize: 12, color: "var(--text-3)", display: "inline-flex", alignItems: "center", gap: 6,
          background: "color-mix(in srgb, var(--warning) 10%, var(--card))", border: "1px solid color-mix(in srgb, var(--warning) 25%, var(--border))",
          borderRadius: 999, padding: "6px 14px",
        }}>
          <AppIcon name="trending-up" size={12} stroke="var(--warning)" /> <strong style={{ color: "var(--warning)" }}>82%</strong> migram em 30 dias
        </div>
      </div>

      {/* Plan cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16, alignItems: "start", marginBottom: 36 }}>
        {plans.map(plan => (
          <div key={plan.name} style={{
            background: plan.popular
              ? `linear-gradient(165deg, color-mix(in srgb, ${plan.accent} 6%, var(--card)), color-mix(in srgb, var(--warning) 3%, var(--card)))`
              : plan.current ? "var(--card)" : `color-mix(in srgb, ${plan.accent} 3%, var(--card))`,
            borderRadius: 20, padding: 0, overflow: "hidden",
            border: plan.popular ? `2px solid ${plan.accent}` : plan.recommended ? `2px solid ${plan.accent}` : "1px solid var(--border)",
            position: "relative", display: "flex", flexDirection: "column",
            transform: plan.popular ? "scale(1.04)" : "scale(1)",
            boxShadow: plan.popular
              ? `0 12px 40px color-mix(in srgb, ${plan.accent} 22%, transparent), 0 0 0 1px color-mix(in srgb, ${plan.accent} 10%, transparent)`
              : "var(--card-shadow)",
            zIndex: plan.popular ? 2 : 1,
            opacity: plan.current ? 0.75 : 1,
          }}>
            {plan.popular && (
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, height: "100%",
                background: `linear-gradient(180deg, color-mix(in srgb, ${plan.accent} 4%, transparent) 0%, transparent 40%)`,
                pointerEvents: "none", zIndex: 0,
              }} />
            )}

            {/* Top accent bar */}
            <div style={{ height: plan.popular ? 5 : plan.recommended ? 4 : 3, background: plan.popular ? `linear-gradient(90deg, ${plan.accent}, var(--warning))` : plan.accent, position: "relative", zIndex: 1 }} />

            <div style={{ padding: "24px 24px 28px", flex: 1, display: "flex", flexDirection: "column", position: "relative", zIndex: 1 }}>
              {/* Header */}
              <div style={{ marginBottom: 16 }}>
                {plan.popular && (
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: 5,
                    fontSize: 10, fontWeight: 800, letterSpacing: "0.1em",
                    color: "#fff", background: plan.accent,
                    padding: "5px 12px", borderRadius: 6, marginBottom: 10,
                    boxShadow: `0 2px 8px color-mix(in srgb, ${plan.accent} 30%, transparent)`,
                  }}><AppIcon name="star" size={11} stroke="#B7DB47" /> MAIS POPULAR</div>
                )}
                {plan.recommended && !plan.popular && (
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: 5,
                    fontSize: 10, fontWeight: 800, letterSpacing: "0.1em",
                    color: plan.accent, background: `color-mix(in srgb, ${plan.accent} 12%, transparent)`,
                    border: `1px solid color-mix(in srgb, ${plan.accent} 25%, transparent)`,
                    padding: "4px 10px", borderRadius: 6, marginBottom: 10,
                  }}><AppIcon name="arrowUpRight" size={11} stroke={plan.accent} /> RECOMENDADO</div>
                )}
                {plan.current && (
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: 5,
                    fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
                    color: "var(--text-3)", background: "var(--margin-block-bg)", border: "1px solid var(--border)",
                    padding: "4px 10px", borderRadius: 6, marginBottom: 10,
                  }}>SEU PLANO ATUAL</div>
                )}
                <div style={{
                  fontSize: 14, fontWeight: 800, letterSpacing: "0.08em",
                  color: plan.current ? "var(--text-3)" : plan.popular ? plan.accent : plan.accent,
                }}>{plan.name}</div>
              </div>

              {/* Price */}
              <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: "var(--text-3)", fontWeight: 600 }}>R$</span>
                <span style={{
                  fontSize: 44, fontWeight: 800, fontFamily: "var(--font-mono)",
                  color: plan.current ? "var(--text-3)" : plan.popular ? plan.accent : "var(--text-1)",
                  lineHeight: 1, letterSpacing: "-0.03em",
                }}>{plan.price}</span>
                {plan.period && <span style={{ fontSize: 14, color: "var(--text-3)", fontWeight: 500 }}>{plan.period}</span>}
              </div>
              <div style={{ fontSize: 13, color: "var(--text-3)", marginBottom: plan.savings ? 8 : 24 }}>{plan.subtitle}</div>

              {plan.savings && (
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 5, marginBottom: 20,
                  fontSize: 11, fontWeight: 700, color: "var(--success)",
                  background: "color-mix(in srgb, var(--success) 10%, transparent)", border: "1px solid color-mix(in srgb, var(--success) 20%, transparent)",
                  borderRadius: 8, padding: "5px 10px", alignSelf: "flex-start",
                }}>
                  <AppIcon name="trending-up" size={11} stroke="var(--success)" /> {plan.savings}
                </div>
              )}

              {/* Features */}
              <div style={{ display: "flex", flexDirection: "column", gap: 11, flex: 1 }}>
                {plan.features.map((f, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 10, fontSize: 13,
                    padding: f.highlight ? "4px 8px" : "0",
                    background: f.highlight ? "color-mix(in srgb, var(--success) 6%, transparent)" : "transparent",
                    borderRadius: f.highlight ? 8 : 0,
                    marginLeft: f.highlight ? -8 : 0, marginRight: f.highlight ? -8 : 0,
                  }}>
                    {f.included ? (
                      <span style={{
                        color: f.warn ? "var(--warning)" : plan.current ? "var(--text-3)" : plan.accent,
                        width: 18, textAlign: "center", display: "inline-flex", alignItems: "center", justifyContent: "center",
                      }}>
                        {f.warn ? <AppIcon name="alert-triangle" size={13} stroke="var(--warning)" /> : <AppIcon name="check" size={14} stroke={plan.current ? "var(--text-3)" : plan.accent} />}
                      </span>
                    ) : (
                      <span style={{
                        color: "var(--text-3)", width: 18, textAlign: "center", opacity: 0.4, display: "inline-flex", alignItems: "center", justifyContent: "center",
                      }}><AppIcon name="x" size={13} stroke="var(--text-3)" /></span>
                    )}
                    <span style={{
                      color: f.included ? f.warn ? "var(--warning)" : "var(--text-1)" : "var(--text-3)",
                      fontWeight: f.included ? (f.highlight ? 700 : 500) : 400,
                      opacity: f.included ? 1 : 0.45,
                    }}>{f.text} {f.highlight && <span style={{ fontSize: 9, color: "var(--success)", fontWeight: 800 }}>NEW</span>}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              {plan.current ? (
                <div style={{
                  width: "100%", padding: "13px 0", borderRadius: 12, marginTop: 28, textAlign: "center",
                  border: "1px dashed var(--border)", color: "var(--text-3)", fontSize: 13, fontWeight: 600,
                }}>Seu plano atual</div>
              ) : (
                <button
                  type="button"
                  onClick={() => onSelectPlan?.(plan.name === "FREE" ? "free" : plan.name === "STARTER" ? "starter" : "pro")}
                  style={{
                    width: "100%", padding: "14px 0", borderRadius: 14, marginTop: 28, border: "none",
                    background: plan.popular
                      ? `linear-gradient(135deg, ${plan.accent}, color-mix(in srgb, ${plan.accent} 80%, var(--warning)))`
                      : plan.accent,
                    color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)",
                    boxShadow: plan.popular ? `0 6px 24px color-mix(in srgb, ${plan.accent} 35%, transparent)` : `0 4px 16px color-mix(in srgb, ${plan.accent} 20%, transparent)`,
                    transition: "transform 0.15s, box-shadow 0.15s", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    letterSpacing: "0.02em",
                  }}
                >
                  {plan.popular ? <><AppIcon name="zap" size={16} stroke="#B7DB47" /> Começar agora</> : <><AppIcon name="arrowUpRight" size={15} stroke="#fff" /> Fazer upgrade</>}
                </button>
              )}

              {!plan.current && (
                <div style={{ fontSize: 11, color: "var(--text-3)", textAlign: "center", marginTop: 10 }}>
                  Cancele a qualquer momento • Sem fidelidade
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Testimonials */}
      <div style={{ marginBottom: 32 }}>
        <div style={{
          fontSize: 16, fontWeight: 700, fontFamily: "var(--font-display)", marginBottom: 14, textAlign: "center",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}>
          <AppIcon name="message-circle" size={18} stroke="var(--warning)" /> O que dizem nossos clientes
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
          {testimonials.map((t, i) => (
            <div key={i} style={{
              background: "var(--card)", borderRadius: 16, padding: "18px 16px",
              border: "1px solid var(--border)", position: "relative",
            }}>
              <div style={{ fontSize: 24, color: "var(--warning)", opacity: 0.3, fontFamily: "serif", lineHeight: 1, marginBottom: 4 }}>"</div>
              <div style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.5, marginBottom: 12, fontStyle: "italic" }}>{t.text}</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-1)" }}>{t.name}</div>
                  <div style={{ fontSize: 11, color: "var(--text-3)" }}>{t.role}</div>
                </div>
                <span style={{
                  fontSize: 9, fontWeight: 800, letterSpacing: "0.08em", padding: "3px 8px", borderRadius: 6,
                  background: t.plan === "PRO" ? "color-mix(in srgb, #1B2E63 10%, transparent)" : "color-mix(in srgb, #7B42C9 10%, transparent)",
                  color: t.plan === "PRO" ? "#1B2E63" : "#7B42C9", border: `1px solid ${t.plan === "PRO" ? "color-mix(in srgb, #1B2E63 20%, transparent)" : "color-mix(in srgb, #7B42C9 20%, transparent)"}`,
                }}>{t.plan}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ / Trust */}
      <div style={{
        background: "var(--card)", borderRadius: 16, padding: "20px 24px",
        border: "1px solid var(--border)", textAlign: "center",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 24, flexWrap: "wrap" }}>
          {[
            { icon: "shield", text: "Pagamento seguro" },
            { icon: "refresh-cw", text: "7 dias de garantia" },
            { icon: "credit-card", text: "Cartão ou Pix" },
            { icon: "x-circle", text: "Cancele quando quiser" },
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-3)", fontWeight: 500 }}>
              <AppIcon name={item.icon} size={14} stroke="var(--accent-light)" /> {item.text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Login ─────────────────────────────────────────

// ─── Onboarding ───────────────────────────────────

/** Códigos IBGE dos estados (UF) — usados em /localidades/estados/{id}/municipios */
const IBGE_UF_TO_ESTADO_ID = {
  RO: 11, AC: 12, AM: 13, RR: 14, PA: 15, AP: 16, TO: 17, MA: 21, PI: 22, CE: 23, RN: 24, PB: 25, PE: 26, AL: 27, SE: 28, BA: 29,
  MG: 31, ES: 32, RJ: 33, SP: 35, PR: 41, SC: 42, RS: 43, MS: 50, MT: 51, GO: 52, DF: 53,
};

function OnboardingPage({ profile, onComplete }) {
  const [step, setStep] = useState(1);
  const TOTAL_STEPS = 3;

  // Step 1 — Interesses
  const suggestedTerms = ["Air Fryer", "Parafusadeira", "PlayStation 5", "iPhone", "Smart TV", "Notebook Gamer", "Tênis Nike", "Fone JBL"];
  const [selectedTerms, setSelectedTerms] = useState([]);
  const [customTerm, setCustomTerm] = useState("");
  const toggleTerm = (t) => setSelectedTerms(prev => prev.includes(t) ? prev.filter(x => x !== t) : prev.length < 5 ? [...prev, t] : prev);
  const addCustom = () => {
    const v = customTerm.trim();
    if (!v || selectedTerms.includes(v) || selectedTerms.length >= 5) return;
    setSelectedTerms(prev => [...prev, v]);
    setCustomTerm("");
  };

  // Step 2 — Região
  const UF_LIST = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];
  const [state, setState] = useState(profile.state || "SC");
  const [city, setCity] = useState(profile.city || "");
  const [freightCap, setFreightCap] = useState(profile.freightCap || 30);
  const [resaleChannels, setResaleChannels] = useState(() => ({ ...DEFAULT_RESALE_CHANNELS, ...(profile.resaleChannels || {}) }));
  const [cityOptions, setCityOptions] = useState([]);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [citiesError, setCitiesError] = useState(null);

  useEffect(() => {
    const estadoId = IBGE_UF_TO_ESTADO_ID[state];
    if (!estadoId) {
      setCityOptions([]);
      setCitiesError("UF desconhecida");
      return;
    }
    let cancelled = false;
    setCitiesLoading(true);
    setCitiesError(null);
    fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${estadoId}/municipios`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (cancelled) return;
        const sorted = [...data].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
        setCityOptions(sorted);
        setCity(prev => (prev && sorted.some(m => m.nome === prev) ? prev : ""));
      })
      .catch(() => {
        if (!cancelled) {
          setCityOptions([]);
          setCitiesError("Não foi possível carregar as cidades. Verifique a conexão.");
          setCity("");
        }
      })
      .finally(() => {
        if (!cancelled) setCitiesLoading(false);
      });
    return () => { cancelled = true; };
  }, [state]);

  // Step 3 — Canais
  const [telegramUsername, setTelegramUsername] = useState("");
  const [webEnabled, setWebEnabled] = useState(true);

  const canAdvance1 = selectedTerms.length > 0;
  const resaleValid = Object.values(resaleChannels).some(Boolean);
  const canAdvance2 = state && city.trim() && resaleValid;

  const handleComplete = () => {
    onComplete({
      interests: selectedTerms.map((term, i) => ({ id: i + 1, term, active: true })),
      region: { state, city: city.trim(), freightCap: Number(freightCap) || 30, resaleChannels },
      channels: { telegram: !!telegramUsername, web: webEnabled, telegramUsername },
    });
  };

  const stepTitles = ["Seus interesses", "Sua região", "Canal de alertas"];
  const stepSubtitles = [
    "Escolha o que você quer monitorar (até 5)",
    "Localização, frete e canais onde você revende",
    "Por onde você quer receber os alertas",
  ];

  const inputStyle = {
    width: "100%", padding: "12px 14px", borderRadius: 12,
    border: "1px solid var(--border)", background: "var(--input-bg)", color: "var(--text-1)",
    fontSize: 14, fontFamily: "var(--font-body)", boxSizing: "border-box", outline: "none",
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px", fontFamily: "var(--font-body)" }}>
      <div style={{ width: "100%", maxWidth: 480, animation: "fadeIn 0.35s ease" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <img src="/assets/logo-light-new.png" alt="Avisus" style={{ height: 180, objectFit: "contain" }} onError={e => { e.target.style.display = "none"; }} />
        </div>

        {/* Step indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 28, padding: "0 4px" }}>
          {Array.from({ length: TOTAL_STEPS }, (_, i) => {
            const n = i + 1;
            const done = n < step;
            const active = n === step;
            return (
              <div key={n} style={{ display: "flex", alignItems: "center", flex: n < TOTAL_STEPS ? 1 : "none" }}>
                <div style={{
                  width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                  background: done ? "var(--success)" : active ? "var(--accent)" : "var(--margin-block-bg)",
                  border: done ? "none" : active ? "none" : "1px solid var(--border)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 800,
                  color: done || active ? "#fff" : "var(--text-3)",
                  transition: "all 0.3s",
                }}>
                  {done ? <AppIcon name="check" size={14} stroke="#fff" /> : n}
                </div>
                {n < TOTAL_STEPS && (
                  <div style={{ flex: 1, height: 2, background: done ? "var(--success)" : "var(--margin-bar-bg)", margin: "0 4px", borderRadius: 1, transition: "background 0.3s" }} />
                )}
              </div>
            );
          })}
        </div>

        {/* Card */}
        <div style={{ background: "var(--card)", borderRadius: 24, padding: "28px 24px", border: "1px solid var(--border)", boxShadow: "var(--card-shadow)" }}>
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--accent-light)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Passo {step} de {TOTAL_STEPS}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text-1)", marginBottom: 6, fontFamily: "var(--font-display)" }}>{stepTitles[step - 1]}</div>
            <div style={{ fontSize: 13, color: "var(--text-3)" }}>{stepSubtitles[step - 1]}</div>
          </div>

          {/* ── Step 1 ── */}
          {step === 1 && (
            <div>
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                <input
                  value={customTerm}
                  onChange={e => setCustomTerm(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addCustom()}
                  placeholder="Ex: Parafusadeira, PlayStation 5..."
                  style={{ ...inputStyle, flex: 1 }}
                />
                <button
                  onClick={addCustom}
                  disabled={!customTerm.trim() || selectedTerms.length >= 5}
                  style={{ padding: "12px 16px", borderRadius: 12, border: "none", background: "var(--accent)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)", flexShrink: 0, opacity: (!customTerm.trim() || selectedTerms.length >= 5) ? 0.5 : 1 }}
                >
                  <AppIcon name="plus" size={14} stroke="#fff" />
                </button>
              </div>
              <div style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Sugestões populares</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
                {suggestedTerms.map(t => {
                  const active = selectedTerms.includes(t);
                  return (
                    <button key={t} onClick={() => toggleTerm(t)} style={{
                      padding: "8px 14px", borderRadius: 10, fontSize: 13, fontWeight: 600,
                      cursor: selectedTerms.length >= 5 && !active ? "not-allowed" : "pointer",
                      border: active ? "1px solid var(--accent)" : "1px solid var(--border)",
                      background: active ? "color-mix(in srgb, var(--accent) 10%, transparent)" : "var(--margin-block-bg)",
                      color: active ? "var(--accent)" : "var(--text-2)",
                      fontFamily: "var(--font-body)", opacity: selectedTerms.length >= 5 && !active ? 0.45 : 1,
                      display: "inline-flex", alignItems: "center", gap: 5,
                    }}>
                      {active && <AppIcon name="check" size={12} stroke="var(--accent)" />}
                      {t}
                    </button>
                  );
                })}
              </div>
              {selectedTerms.length > 0 && (
                <div style={{ padding: "10px 12px", borderRadius: 10, background: "color-mix(in srgb, var(--success) 8%, var(--card))", border: "1px solid color-mix(in srgb, var(--success) 22%, var(--border))", fontSize: 12, color: "var(--success)", marginBottom: 8 }}>
                  {selectedTerms.length}/5 selecionados: {selectedTerms.join(", ")}
                </div>
              )}
            </div>
          )}

          {/* ── Step 2 ── */}
          {step === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>Estado</label>
                <select value={state} onChange={e => setState(e.target.value)} style={{ ...inputStyle }}>
                  {UF_LIST.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>Cidade</label>
                <select
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  style={inputStyle}
                  disabled={citiesLoading || !!citiesError || cityOptions.length === 0}
                >
                  <option value="">
                    {citiesLoading ? "Carregando cidades…" : citiesError ? "Erro ao carregar" : "Selecione a cidade"}
                  </option>
                  {cityOptions.map(m => (
                    <option key={m.id} value={m.nome}>{m.nome}</option>
                  ))}
                </select>
                {citiesError && (
                  <div style={{ fontSize: 11, color: "var(--danger)", marginTop: 6 }}>{citiesError}</div>
                )}
                {!citiesError && !citiesLoading && cityOptions.length > 0 && (
                  <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 5 }}>{cityOptions.length} municípios do IBGE para {state}.</div>
                )}
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>Teto de frete (R$)</label>
                <input type="number" min={0} value={freightCap} onChange={e => setFreightCap(e.target.value)} placeholder="Ex: 30" style={inputStyle} />
                <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 5 }}>Oportunidades com frete acima desse valor não geram notificação push.</div>
              </div>

              <div style={{ marginTop: 4, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Canais de revenda</div>
                <div style={{ fontSize: 12, color: "var(--text-2)", marginBottom: 12, lineHeight: 1.5 }}>
                  Marque onde você costuma revender. A melhor margem e o detalhe por canal usam só esses marketplaces.
                </div>
                <ResaleChannelsForm value={resaleChannels} onChange={setResaleChannels} compact />
              </div>
            </div>
          )}

          {/* ── Step 3 ── */}
          {step === 3 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ padding: "14px 16px", borderRadius: 14, border: webEnabled ? "1px solid color-mix(in srgb, var(--accent-light) 40%, var(--border))" : "1px solid var(--border)", background: webEnabled ? "color-mix(in srgb, var(--accent-light) 6%, var(--card))" : "var(--margin-block-bg)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "color-mix(in srgb, var(--accent-light) 14%, transparent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <AppIcon name="monitor" size={18} stroke="var(--accent-light)" />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)" }}>Web App</div>
                    <div style={{ fontSize: 11, color: "var(--text-3)" }}>Notificações no navegador</div>
                  </div>
                </div>
                <Toggle checked={webEnabled} onChange={() => setWebEnabled(v => !v)} />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>Telegram (opcional)</label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-3)", pointerEvents: "none" }}>
                    <AppIcon name="send" size={16} />
                  </span>
                  <input
                    value={telegramUsername}
                    onChange={e => setTelegramUsername(e.target.value)}
                    placeholder="@seu_username"
                    style={{ ...inputStyle, paddingLeft: 42 }}
                  />
                </div>
                <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 5 }}>Enviaremos alertas em tempo real via bot do Telegram.</div>
              </div>

              <div style={{ padding: "12px 14px", borderRadius: 12, background: "color-mix(in srgb, var(--warning) 6%, var(--card))", border: "1px solid color-mix(in srgb, var(--warning) 18%, var(--border))", fontSize: 12, color: "var(--text-2)", display: "flex", alignItems: "flex-start", gap: 8 }}>
                <AppIcon name="bell" size={14} stroke="var(--warning)" />
                WhatsApp disponível nos planos STARTER e PRO com delay de 5 min ou menos.
              </div>
            </div>
          )}

          {/* Navigation */}
          <div style={{ display: "flex", gap: 10, marginTop: 28 }}>
            {step > 1 && (
              <button onClick={() => setStep(s => s - 1)} style={{ padding: "13px 20px", borderRadius: 14, border: "1px solid var(--border)", background: "transparent", color: "var(--text-2)", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body)" }}>
                Voltar
              </button>
            )}
            {step < TOTAL_STEPS ? (
              <button
                onClick={() => setStep(s => s + 1)}
                disabled={step === 1 ? !canAdvance1 : step === 2 ? !canAdvance2 : false}
                style={{
                  flex: 1, padding: "13px 20px", borderRadius: 14, border: "none",
                  background: (step === 1 ? !canAdvance1 : step === 2 ? !canAdvance2 : false) ? "var(--margin-bar-bg)" : "var(--accent)",
                  color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                }}
              >
                Próximo <AppIcon name="chevron-right" size={14} stroke="#fff" />
              </button>
            ) : (
              <button
                onClick={handleComplete}
                style={{ flex: 1, padding: "13px 20px", borderRadius: 14, border: "none", background: "var(--accent)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
              >
                Começar a monitorar <AppIcon name="arrowUpRight" size={14} stroke="#fff" />
              </button>
            )}
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: 16, fontSize: 12, color: "var(--text-3)" }}>
          Você pode ajustar tudo isso depois nas configurações.
        </div>
      </div>
    </div>
  );
}

function LoginPage({ onLogin }) {
  const [mode, setMode] = useState("login"); // login | register | forgot
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => { setLoading(false); onLogin({ email, name: name || email.split("@")[0] }); }, 1200);
  };

  const inputStyle = {
    width: "100%", padding: "14px 14px 14px 44px", borderRadius: 14,
    border: "1px solid var(--border)", background: "var(--input-bg)", color: "var(--text-1)",
    fontSize: 15, fontFamily: "var(--font-body)", boxSizing: "border-box", outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
  };

  const socialBtnStyle = {
    flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
    padding: "12px 0", borderRadius: 14, border: "1px solid var(--border)",
    background: "var(--card)", color: "var(--text-1)", fontSize: 13, fontWeight: 600,
    cursor: "pointer", fontFamily: "var(--font-body)", transition: "all 0.15s",
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700;800&display=swap');
        :root {
          --font-display: 'Montserrat', sans-serif;
          --font-body: 'Montserrat', sans-serif;
          --font-mono: 'JetBrains Mono', 'Menlo', monospace;
          --brand-navy: #1B2E63; --brand-navy-deep: #14254F;
          --brand-teal: #1D8F95; --brand-lime: #B7DB47; --brand-purple: #7B42C9;
          --accent: var(--brand-navy); --accent-light: var(--brand-teal);
          --success: var(--brand-lime); --warning: var(--brand-purple);
          --bg: #F4F7FB; --card: #FFFFFF; --border: #CCD5E3;
          --text-1: #152243; --text-2: #3A4B70; --text-3: #6C7A97;
          --input-bg: #FFFFFF;
          --select-option-bg: #FFFFFF;
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes floatOrb { 0%, 100% { transform: translate(0, 0) scale(1); } 33% { transform: translate(30px, -20px) scale(1.1); } 66% { transform: translate(-20px, 15px) scale(0.95); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        input:focus { border-color: var(--brand-teal) !important; box-shadow: 0 0 0 3px color-mix(in srgb, var(--brand-teal) 12%, transparent) !important; }
      `}</style>
      <div style={{
        height: "100vh", display: "flex", fontFamily: "var(--font-body)",
        background: "var(--bg)", color: "var(--text-1)", position: "relative", overflow: "hidden",
      }}>
        {/* Background orbs */}
        <div style={{
          position: "absolute", width: 400, height: 400, borderRadius: "50%", top: -120, right: -100,
          background: "radial-gradient(circle, color-mix(in srgb, var(--brand-teal) 12%, transparent), transparent 70%)",
          animation: "floatOrb 12s ease-in-out infinite", pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", width: 300, height: 300, borderRadius: "50%", bottom: -80, left: -60,
          background: "radial-gradient(circle, color-mix(in srgb, var(--brand-purple) 10%, transparent), transparent 70%)",
          animation: "floatOrb 15s ease-in-out infinite 2s", pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", width: 200, height: 200, borderRadius: "50%", top: "40%", left: "30%",
          background: "radial-gradient(circle, color-mix(in srgb, var(--brand-lime) 6%, transparent), transparent 70%)",
          animation: "floatOrb 18s ease-in-out infinite 4s", pointerEvents: "none",
        }} />

        {/* Left panel - branding (desktop only) */}
        <div className="login-brand" style={{
          flex: "0 0 45%", display: "flex", flexDirection: "column", justifyContent: "center",
          padding: "40px 48px", position: "relative", zIndex: 1, overflow: "hidden",
          background: "linear-gradient(160deg, var(--brand-navy) 0%, var(--brand-navy-deep) 60%, color-mix(in srgb, var(--brand-teal) 20%, var(--brand-navy-deep)) 100%)",
        }}>
          <img src="/assets/logo-dark-new.png" alt="Avisus" style={{ height: "clamp(80px, 15vh, 200px)", width: "auto", objectFit: "contain", marginBottom: "clamp(16px, 3vh, 36px)" }} />
          <h1 style={{
            fontFamily: "var(--font-display)", fontSize: "clamp(22px, 3vw, 34px)", fontWeight: 800, lineHeight: 1.2,
            color: "#fff", marginBottom: 12, letterSpacing: "-0.02em",
          }}>
            Encontre as melhores<br />oportunidades de<br />
            <span style={{ color: "var(--brand-lime)" }}>revenda</span> do Brasil.
          </h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.65)", lineHeight: 1.6, maxWidth: 380, marginBottom: "clamp(16px, 2.5vh, 36px)" }}>
            Monitoramento inteligente de preços, alertas em tempo real e análise de margem para revendedores.
          </p>

          {/* Stats */}
          <div style={{ display: "flex", gap: 32 }}>
            {[
              { value: "1.200+", label: "Produtos" },
              { value: "347", label: "Revendedores" },
              { value: "R$ 2M+", label: "Em ofertas/mês" },
            ].map((s, i) => (
              <div key={i}>
                <div style={{ fontSize: 24, fontWeight: 800, fontFamily: "var(--font-mono)", color: "var(--brand-lime)", letterSpacing: "-0.02em" }}>{s.value}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Testimonial */}
          <div style={{
            marginTop: "clamp(16px, 3vh, 40px)", padding: "16px 20px", borderRadius: 16,
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
            backdropFilter: "blur(8px)",
          }}>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", lineHeight: 1.6, fontStyle: "italic", marginBottom: 12 }}>
              "Com o Avisus encontrei um PS5 abaixo do custo e faturei R$ 1.800 em um dia."
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%",
                background: "linear-gradient(135deg, var(--brand-teal), var(--brand-lime))",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 700, color: "#fff",
              }}>RM</div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>Rafael M.</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>Revendedor PRO · São Paulo</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right panel - form */}
        <div style={{
          flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
          padding: "24px 24px", position: "relative", zIndex: 1, overflowY: "auto",
        }}>
          <div style={{
            width: "100%", maxWidth: 420, animation: "fadeIn 0.4s ease",
          }} key={mode}>
            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              {/* Mobile logo */}
              <img src="/assets/logo-light-new.png" alt="Avisus" className="login-mobile-logo" style={{ height: 44, width: "auto", objectFit: "contain", marginBottom: 20, display: "none" }} />
              <h2 style={{
                fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 800, marginBottom: 6, letterSpacing: "-0.02em",
              }}>
                {mode === "login" ? "Bem-vindo de volta" : mode === "register" ? "Crie sua conta" : "Recuperar senha"}
              </h2>
              <p style={{ fontSize: 14, color: "var(--text-3)" }}>
                {mode === "login" ? "Entre para acessar suas oportunidades" : mode === "register" ? "Comece grátis e encontre ofertas incríveis" : "Enviaremos um link de recuperação"}
              </p>
            </div>

            {mode !== "forgot" && (
              <>
                {/* Social login */}
                <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
                  <button style={socialBtnStyle}>
                    <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                    Google
                  </button>
                  <button style={socialBtnStyle}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--text-1)"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
                    GitHub
                  </button>
                </div>

                {/* Divider */}
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
                  <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                  <span style={{ fontSize: 12, color: "var(--text-3)", fontWeight: 500 }}>ou continue com e-mail</span>
                  <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                </div>
              </>
            )}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {mode === "register" && (
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", display: "inline-flex", color: name ? "var(--brand-teal)" : "var(--text-3)", opacity: name ? 1 : 0.5, pointerEvents: "none" }}>
                    <AppIcon name="user" size={16} />
                  </span>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome completo" required style={inputStyle} />
                </div>
              )}
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", display: "inline-flex", color: email ? "var(--brand-teal)" : "var(--text-3)", opacity: email ? 1 : 0.5, pointerEvents: "none" }}>
                  <AppIcon name="mail" size={16} />
                </span>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Seu e-mail" required style={inputStyle} />
              </div>
              {mode !== "forgot" && (
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", display: "inline-flex", color: password ? "var(--brand-teal)" : "var(--text-3)", opacity: password ? 1 : 0.5, pointerEvents: "none" }}>
                    <AppIcon name="lock" size={16} />
                  </span>
                  <input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Sua senha" required style={{ ...inputStyle, paddingRight: 48 }} />
                  <button type="button" onClick={() => setShowPw(!showPw)} style={{
                    position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer", padding: 4, display: "inline-flex", color: "var(--text-3)",
                  }}>
                    <AppIcon name={showPw ? "eye-off" : "eye"} size={16} />
                  </button>
                </div>
              )}

              {mode === "login" && (
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button type="button" onClick={() => setMode("forgot")} style={{
                    background: "none", border: "none", color: "var(--brand-teal)", fontSize: 13,
                    fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body)",
                  }}>Esqueci minha senha</button>
                </div>
              )}

              <button type="submit" disabled={loading} style={{
                width: "100%", padding: "15px 0", borderRadius: 14, border: "none",
                background: loading
                  ? "var(--text-3)"
                  : "linear-gradient(135deg, var(--brand-navy), color-mix(in srgb, var(--brand-navy) 80%, var(--brand-teal)))",
                color: "#fff", fontSize: 15, fontWeight: 700, cursor: loading ? "wait" : "pointer",
                fontFamily: "var(--font-body)", letterSpacing: "0.02em",
                boxShadow: loading ? "none" : "0 6px 24px color-mix(in srgb, var(--brand-navy) 30%, transparent)",
                transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}>
                {loading ? (
                  <span style={{ width: 20, height: 20, border: "2.5px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
                ) : (
                  <>
                    {mode === "login" ? "Entrar" : mode === "register" ? "Criar conta grátis" : "Enviar link"}
                    <AppIcon name={mode === "forgot" ? "send" : "arrowUpRight"} size={16} stroke="#fff" />
                  </>
                )}
              </button>
            </form>

            {/* Toggle mode */}
            <div style={{ textAlign: "center", marginTop: 24, fontSize: 14, color: "var(--text-3)" }}>
              {mode === "login" ? (
                <>Não tem conta? <button onClick={() => setMode("register")} style={{ background: "none", border: "none", color: "var(--brand-teal)", fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 14 }}>Crie agora grátis</button></>
              ) : mode === "register" ? (
                <>Já tem conta? <button onClick={() => setMode("login")} style={{ background: "none", border: "none", color: "var(--brand-teal)", fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 14 }}>Faça login</button></>
              ) : (
                <button onClick={() => setMode("login")} style={{ background: "none", border: "none", color: "var(--brand-teal)", fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 14, display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <AppIcon name="arrow-left" size={14} stroke="var(--brand-teal)" /> Voltar ao login
                </button>
              )}
            </div>

            {/* Trust badges */}
            {mode !== "forgot" && (
              <div style={{
                marginTop: 32, display: "flex", justifyContent: "center", gap: 20, flexWrap: "wrap",
              }}>
                {[
                  { icon: "shield", text: "Dados seguros" },
                  { icon: "zap", text: "Acesso instantâneo" },
                  { icon: "x-circle", text: "Cancele quando quiser" },
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--text-3)", fontWeight: 500 }}>
                    <AppIcon name={item.icon} size={12} stroke="var(--brand-teal)" /> {item.text}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Responsive CSS for login */}
        <style>{`
          @media (max-width: 900px) {
            .login-brand { display: none !important; }
            .login-mobile-logo { display: block !important; }
          }
        `}</style>
      </div>
    </>
  );
}

// ─── App ──────────────────────────────────────────

const NAV = [
  { id: "dashboard", label: "Oportunidades", icon: "grid" },
  { id: "interests", label: "Interesses", icon: "star" },
  { id: "notifications", label: "Alertas", icon: "bell" },
  { id: "plan", label: "Upgrade", icon: "crown" },
  { id: "profile", label: "Perfil", icon: "user" },
];

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(false);
  const [page, setPage] = useState("dashboard");
  const [theme, setTheme] = useState("light");
  const [profile, setProfile] = useState({
    state: "SC",
    city: "Palhoça",
    freightCap: 30,
    resaleChannels: { ...DEFAULT_RESALE_CHANNELS },
    resaleMarginMode: "average",
    resaleFeePct: { ...DEFAULT_RESALE_FEE_PCT },
  });
  const [userInfo, setUserInfo] = useState({ name: "", email: "", phone: "", cep: "", addressState: "", city: "", neighborhood: "", street: "", complement: "", whatsapp: "", telegram: "" });
  const [boughtIds, setBoughtIds] = useState([]);
  const toggleBought = (id) => setBoughtIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  const [interests, setInterests] = useState(() => cloneDefaultInterests());
  const [dismissedIds, setDismissedIds] = useState([]);
  const [subscriptionPlan, setSubscriptionPlan] = useState("free");
  const [toast, setToast] = useState("");
  useEffect(() => {
    if (!toast) return undefined;
    const id = setTimeout(() => setToast(""), 3600);
    return () => clearTimeout(id);
  }, [toast]);
  const maxInterestTerms = subscriptionPlan === "free" ? 5 : 99;
  const planLabel = subscriptionPlan === "free" ? "FREE" : subscriptionPlan === "starter" ? "STARTER" : "PRO";
  const handleSelectPlan = (key) => {
    setSubscriptionPlan(key);
    const nm = { free: "Free", starter: "Starter", pro: "Pro" };
    setToast(`Protótipo: plano ${nm[key] || key} ativado (sem cobrança).`);
    setPage("dashboard");
  };
  const goToPlan = () => setPage("plan");
  const headerGravatarUrl = useGravatar(userInfo.email, 64);
  const [headerGravatarOk, setHeaderGravatarOk] = useState(false);
  useEffect(() => {
    if (!headerGravatarUrl) { setHeaderGravatarOk(false); return; }
    setHeaderGravatarOk(false);
    const img = new Image();
    img.onload = () => setHeaderGravatarOk(true);
    img.onerror = () => setHeaderGravatarOk(false);
    img.src = headerGravatarUrl;
  }, [headerGravatarUrl]);

  const handleLogin = ({ email, name }) => {
    setUserInfo(prev => ({ ...prev, email, name }));
    setIsLoggedIn(true);
  };

  const handleOnboardingComplete = ({ interests: onboardInterests, region, channels }) => {
    const { resaleChannels: rc, ...restRegion } = region;
    setProfile(prev => ({ ...prev, ...restRegion, ...(rc ? { resaleChannels: rc } : {}) }));
    if (onboardInterests?.length) setInterests(onboardInterests);
    if (channels.telegramUsername) {
      setUserInfo(prev => ({ ...prev, telegram: channels.telegramUsername }));
    }
    setHasOnboarded(true);
    setShowWelcomeBanner(true);
  };

  if (!isLoggedIn) return <LoginPage onLogin={handleLogin} />;
  if (!hasOnboarded) return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700;800&display=swap');
        :root {
          --font-display: 'Montserrat', sans-serif; --font-body: 'Montserrat', sans-serif;
          --font-mono: 'JetBrains Mono', 'Menlo', monospace;
          --brand-navy: #1B2E63; --brand-navy-deep: #14254F;
          --brand-teal: #1D8F95; --brand-lime: #89A832; --brand-purple: #7B42C9;
          --accent: var(--brand-navy); --accent-light: var(--brand-teal);
          --accent-dark: var(--brand-navy-deep); --success: var(--brand-lime);
          --warning: var(--brand-purple); --danger: #D94B64; --info: var(--brand-teal);
          --bg: #F4F7FB; --card: #FFFFFF; --border: #CCD5E3;
          --text-1: #152243; --text-2: #3A4B70; --text-3: #6C7A97;
          --input-bg: #FFFFFF; --chip-bg: #FFFFFF; --chip-border: #CCD5E3;
          --margin-block-bg: #F3F6FB; --margin-bar-bg: #DDE6F3;
          --card-shadow: 0 4px 14px rgba(20,37,79,0.08);
          --toggle-off: #D1D1D1; --select-option-bg: #FFFFFF;
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes cardIn { from { opacity: 0; transform: translateY(24px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
        input:focus, select:focus { border-color: var(--brand-teal) !important; outline: none; }
        select option { background: var(--select-option-bg); color: var(--text-1); }
      `}</style>
      <OnboardingPage profile={profile} onComplete={handleOnboardingComplete} />
    </>
  );
  const patchProfile = (patch) => setProfile(p => ({ ...p, ...patch }));
  const pages = {
    dashboard: (
      <DashboardPage
        profile={profile}
        boughtIds={boughtIds}
        onToggleBought={toggleBought}
        onGoToPlan={goToPlan}
        onGoToInterests={() => setPage("interests")}
        onGoToProfile={() => setPage("profile")}
        showWelcomeBanner={showWelcomeBanner}
        onDismissWelcome={() => setShowWelcomeBanner(false)}
        interests={interests}
        dismissedIds={dismissedIds}
        onDismissProduct={(id) => setDismissedIds(prev => [...new Set([...prev, id])])}
        maxInterestTerms={maxInterestTerms}
        planLabel={planLabel}
        subscriptionPlan={subscriptionPlan}
      />
    ),
    margem: <MargemRevendaPage profile={profile} onProfileChange={patchProfile} />,
    interests: (
      <InterestsPage
        profile={profile}
        onProfileChange={setProfile}
        interests={interests}
        onInterestsChange={setInterests}
        maxInterestTerms={maxInterestTerms}
        planLabel={planLabel}
      />
    ),
    notifications: (
      <NotificationsPage
        profile={profile}
        userInfo={userInfo}
        interests={interests}
        dismissedIds={dismissedIds}
        boughtIds={boughtIds}
        onToggleBought={toggleBought}
        onGoToPlan={goToPlan}
        onOpenProfile={() => setPage("profile")}
        subscriptionPlan={subscriptionPlan}
      />
    ),
    plan: <PlanPage subscriptionPlan={subscriptionPlan} onSelectPlan={handleSelectPlan} />,
    profile: <ProfilePage userInfo={userInfo} onUserInfoChange={setUserInfo} profile={profile} onProfileChange={patchProfile} />,
  };
  const titles = { dashboard: "Oportunidades", margem: "Margem por canal", interests: "Interesses", notifications: "Alertas", plan: "Upgrade", profile: "Meu Perfil" };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700;800&display=swap');
        :root {
          --font-display: 'Montserrat', sans-serif;
          --font-body: 'Montserrat', sans-serif;
          --font-mono: 'JetBrains Mono', 'Menlo', monospace;
          --brand-navy: #1B2E63;
          --brand-navy-deep: #14254F;
          --brand-teal: #1D8F95;
          --brand-lime: #89A832;
          --brand-purple: #7B42C9;
          --accent: var(--brand-navy);
          --accent-light: var(--brand-teal);
          --accent-dark: var(--brand-navy-deep);
          --success: var(--brand-lime);
          --warning: var(--brand-purple);
          --danger: #D94B64;
          --info: var(--brand-teal);
          --bg: #F4F7FB;
          --bg-gradient: linear-gradient(155deg, #f8fbff 0%, #eef5ff 46%, #edf8f8 74%, #f4efff 100%);
          --card: #FFFFFF;
          --border: #CCD5E3;
          --text-1: #152243;
          --text-2: #3A4B70;
          --text-3: #6C7A97;
          --glass: rgba(244,247,251,0.92);
          --glass-strong: rgba(255,255,255,0.98);
          --input-bg: #FFFFFF;
          --chip-bg: #FFFFFF;
          --chip-border: #CCD5E3;
          --nav-active: color-mix(in srgb, var(--accent) 12%, transparent);
          --toggle-off: #D1D1D1;
          --badge-default-bg: #EEF3FA;
          --badge-default-color: #51617F;
          --badge-default-border: #D3DBE8;
          --margin-block-bg: #F3F6FB;
          --margin-bar-bg: #DDE6F3;
          --scrollbar-color: #A4B2CC;
          --select-option-bg: #FFFFFF;
          --glow-color: color-mix(in srgb, var(--brand-purple) 20%, transparent);
          --card-shadow: 0 4px 14px rgba(20,37,79,0.08);
          --card-shadow-hover: 0 16px 36px rgba(20,37,79,0.14), 0 0 0 1px color-mix(in srgb, var(--accent) 16%, transparent);
        }
        [data-theme="dark"] {
          --brand-lime: #B7DB47;
          --accent-dark: #C8D7FF;
          --bg: #0C142A;
          --bg-gradient: linear-gradient(160deg, #0c142a 0%, #121c3c 56%, #13293e 100%);
          --card: #111D34;
          --border: rgba(107,130,174,0.34);
          --text-1: #E0E8FA;
          --text-2: #C2CFEA;
          --text-3: #90A3C7;
          --glass: rgba(12,20,42,0.9);
          --glass-strong: rgba(12,20,42,0.96);
          --input-bg: rgba(12,20,42,0.72);
          --chip-bg: rgba(12,20,42,0.82);
          --chip-border: rgba(112,135,176,0.36);
          --nav-active: color-mix(in srgb, var(--accent-light) 22%, transparent);
          --toggle-off: #475569;
          --badge-default-bg: rgba(111,132,170,0.2);
          --badge-default-color: #CEDAEE;
          --badge-default-border: rgba(112,134,171,0.42);
          --margin-block-bg: rgba(12,20,42,0.62);
          --margin-bar-bg: rgba(112,134,171,0.34);
          --scrollbar-color: rgba(124,145,186,0.5);
          --select-option-bg: #0B1327;
          --glow-color: color-mix(in srgb, var(--brand-purple) 24%, transparent);
          --card-shadow: 0 4px 18px rgba(2,6,23,0.5);
          --card-shadow-hover: 0 18px 40px rgba(2,6,23,0.58), 0 0 0 1px color-mix(in srgb, var(--accent-light) 28%, transparent);
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body, header, nav, .stat-card, .card, button, input, select, a, span, div { transition: background-color 0.25s, border-color 0.25s, color 0.25s, box-shadow 0.25s; }
        @keyframes cardIn { from { opacity: 0; transform: translateY(24px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes skeletonPulse { 0%, 100% { opacity: 0.95; } 50% { opacity: 0.72; } }
        @keyframes skeletonShimmer { 0% { transform: translateX(0); } 100% { transform: translateX(340%); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(100%); } to { opacity: 1; transform: translateY(0); } }
        input:focus, select:focus { border-color: var(--accent) !important; outline: none; }
        select option { background: var(--select-option-bg); color: var(--text-1); }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: var(--scrollbar-color); border-radius: 3px; }
        
        @keyframes subtlePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.15); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .header-nav { display: flex; gap: 2; }
        .bottom-nav { position: fixed; bottom: 0; left: 0; right: 0; z-index: 100; }
        @media (max-width: 768px) {
          .header-nav { display: none !important; }
          .header-actions .badge-plan { display: none !important; }
          .header-profile-label { display: none !important; }
        }
        @media (min-width: 769px) {
          .bottom-nav { display: none !important; }
        }
      `}</style>
      <div data-theme={theme} style={{ minHeight: "100vh", backgroundColor: "var(--bg)", color: "var(--text-1)", fontFamily: "var(--font-body)", transition: "background 0.3s, color 0.3s" }}>
        <header style={{
          background: "var(--glass)", backdropFilter: "blur(20px) saturate(180%)",
          borderBottom: "1px solid var(--border)", padding: "0 20px", height: 56,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          position: "sticky", top: 0, zIndex: 100,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={() => setPage("dashboard")}>
              <img src={theme === "dark" ? "/assets/logo-dark-new.png" : "/assets/logo-light-new.png"} alt="Avisus" style={{ height: "clamp(74px, 11.9vw, 95px)", width: "auto", objectFit: "contain", display: "block" }} />
            </div>
            <nav className="header-nav">
              {NAV.filter(item => item.id !== "profile").map(item => {
                const isPlan = item.id === "plan";
                const isActive = page === item.id;
                return (
                <button key={item.id} onClick={() => setPage(item.id)} style={{
                  padding: isPlan ? "7px 16px" : "7px 14px", borderRadius: 10,
                  border: isPlan && !isActive ? "1px solid color-mix(in srgb, var(--warning) 30%, var(--border))" : "none",
                  background: isActive ? "var(--nav-active)" : isPlan ? "color-mix(in srgb, var(--warning) 8%, transparent)" : "transparent",
                  color: isActive ? "var(--accent-light)" : isPlan ? "var(--warning)" : "var(--text-3)",
                  fontSize: 13, fontWeight: isActive || isPlan ? 700 : 500, cursor: "pointer",
                  fontFamily: "var(--font-body)", display: "flex", alignItems: "center", gap: 5, transition: "all 0.15s",
                }}>
                  <span style={{ display: "inline-flex", alignItems: "center" }}><AppIcon name={item.icon} size={14} /></span>{item.label}
                  {item.id === "notifications" && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)" }} />}
                  {isPlan && !isActive && <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--warning)", animation: "subtlePulse 2s ease-in-out infinite" }} />}
                </button>
                );
              })}
            </nav>
          </div>
          <div className="header-actions" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} style={{
              width: 36, height: 36, borderRadius: "50%", border: "1px solid var(--border)",
              background: theme === "dark" ? "color-mix(in srgb, var(--accent-light) 15%, var(--card))" : "var(--card)",
              color: theme === "dark" ? "var(--brand-lime)" : "var(--accent)",
              fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "var(--card-shadow)",
            }} aria-label="Alternar tema" title={theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}>
              {theme === "dark" ? <AppIcon name="sun" size={16} stroke="var(--brand-lime)" /> : <AppIcon name="moon" size={16} stroke="var(--accent)" />}
            </button>
            {(() => {
              const hpc = subscriptionPlan === "pro" ? "#2E8B57" : subscriptionPlan === "starter" ? "#D4A017" : "#7B42C9";
              return (
              <span className="badge-plan" onClick={() => setPage("plan")} style={{ cursor: "pointer", position: "relative" }}>
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 8,
                  background: `color-mix(in srgb, ${hpc} 12%, var(--card))`, border: `1px solid color-mix(in srgb, ${hpc} 30%, var(--border))`,
                  fontSize: 11, fontWeight: 800, color: hpc, letterSpacing: "0.06em",
                  animation: page !== "plan" ? "subtlePulse 3s ease-in-out infinite" : "none",
                }}>{planLabel} <AppIcon name="arrowUpRight" size={10} stroke={hpc} /></span>
              </span>
              );
            })()}
            <div onClick={() => setPage("profile")} title="Meu Perfil" style={{
              display: "flex", alignItems: "center", gap: 7, cursor: "pointer",
              padding: "4px 10px 4px 4px", borderRadius: 20,
              background: page === "profile" ? "var(--nav-active)" : "transparent",
              transition: "all 0.2s",
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%", overflow: "hidden", flexShrink: 0,
                background: headerGravatarOk ? "none"
                  : page === "profile"
                    ? "linear-gradient(135deg, var(--accent-light), var(--accent))"
                    : "linear-gradient(135deg, color-mix(in srgb, var(--accent-light) 32%, transparent), color-mix(in srgb, var(--warning) 24%, transparent))",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 700,
                color: page === "profile" ? "#fff" : "var(--accent-dark)",
                border: page === "profile" ? "2px solid var(--accent-light)" : "1px solid var(--border)",
              }}>
                {headerGravatarOk
                  ? <img src={headerGravatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  : userInfo.name ? userInfo.name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase() : <AppIcon name="user" size={15} />}
              </div>
              <span className="header-profile-label" style={{
                fontSize: 13, fontWeight: page === "profile" ? 700 : 500,
                color: page === "profile" ? "var(--accent-light)" : "var(--text-3)",
              }}>Perfil</span>
            </div>
            <button onClick={() => { setIsLoggedIn(false); setPage("dashboard"); }} title="Sair" style={{
              width: 34, height: 34, borderRadius: "50%", border: "1px solid var(--border)",
              background: "var(--card)", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--text-3)", transition: "all 0.15s",
            }}>
              <AppIcon name="log-out" size={15} stroke="var(--text-3)" />
            </button>
          </div>
        </header>
        <main style={{ padding: "20px 24px 90px", maxWidth: 1080, width: "100%", margin: "0 auto", position: "relative", zIndex: 1, animation: "fadeIn 0.35s ease" }} key={page}>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(24px, 5vw, 32px)", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 20 }}>{titles[page]}</h1>
          {pages[page]}
        </main>
        <nav className="bottom-nav" style={{ background: "var(--glass-strong)", backdropFilter: "blur(20px)", borderTop: "1px solid var(--border)", display: "flex", padding: "6px 0 max(10px, env(safe-area-inset-bottom))" }}>
          {NAV.map(item => {
            const isActive = page === item.id;
            const isPlan = item.id === "plan";
            return (
              <button key={item.id} onClick={() => setPage(item.id)} style={{
                flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                background: "none", border: "none", cursor: "pointer",
                color: isActive ? "var(--accent)" : isPlan ? "var(--warning)" : "var(--text-3)",
                fontFamily: "var(--font-body)", position: "relative", paddingTop: 8,
              }}>
                {isActive && <span style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 24, height: 3, borderRadius: "0 0 3px 3px", background: isActive && isPlan ? "var(--warning)" : "var(--accent)" }} />}
                <span style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center", width: 32, height: 28, borderRadius: 8,
                  background: isActive
                    ? isPlan ? "color-mix(in srgb, var(--warning) 14%, transparent)" : "color-mix(in srgb, var(--accent) 12%, transparent)"
                    : isPlan ? "color-mix(in srgb, var(--warning) 6%, transparent)" : "transparent",
                }}><AppIcon name={item.icon} size={18} /></span>
                <span style={{ fontSize: 10, fontWeight: isActive || isPlan ? 700 : 500 }}>{item.label}</span>
                {item.id === "notifications" && <span style={{ position: "absolute", top: 6, right: "calc(50% - 16px)", width: 6, height: 6, borderRadius: "50%", background: "var(--danger)" }} />}
                {isPlan && !isActive && <span style={{ position: "absolute", top: 6, right: "calc(50% - 16px)", width: 6, height: 6, borderRadius: "50%", background: "var(--warning)", animation: "subtlePulse 2s ease-in-out infinite" }} />}
              </button>
            );
          })}
        </nav>
        {toast ? (
          <div
            role="status"
            style={{
              position: "fixed", bottom: 88, left: "50%", transform: "translateX(-50%)", zIndex: 10001,
              maxWidth: "min(420px, calc(100vw - 32px))", padding: "12px 18px", borderRadius: 14,
              background: "var(--card)", border: "1px solid var(--border)", boxShadow: "0 12px 40px rgba(0,0,0,0.18)",
              fontSize: 13, fontWeight: 600, color: "var(--text-1)", textAlign: "center",
            }}
          >
            {toast}
          </div>
        ) : null}
      </div>
    </>
  );
}
