"use client";

import { BRAZIL_UFS } from "@/lib/ibge";

import { useIBGE } from "./hooks";

type RegionSelectorProps = {
  uf: string;
  city: string;
  disabled?: boolean;
  onUfChange: (nextUf: string) => void;
  onCityChange: (nextCity: string) => void;
};

const labelStyle = {
  fontSize: 11, fontWeight: 700, color: "var(--text-3)" as string, display: "block", marginBottom: 6,
  textTransform: "uppercase" as const, letterSpacing: "0.06em",
};

const selectStyle = {
  width: "100%", padding: "12px 14px", borderRadius: 12,
  border: "1px solid var(--border)", background: "var(--margin-block-bg)", color: "var(--text-1)",
  fontSize: 14, fontFamily: "var(--font-body)", boxSizing: "border-box" as const,
  outline: "none", fontWeight: 600,
};

export function RegionSelector({
  uf,
  city,
  disabled = false,
  onUfChange,
  onCityChange,
}: RegionSelectorProps) {
  const { cities, isLoadingCities, cityError } = useIBGE(uf);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
      <div>
        <label style={labelStyle}>Estado (UF)</label>
        <select
          value={uf}
          onChange={(e) => onUfChange(e.target.value)}
          disabled={disabled}
          style={{ ...selectStyle, cursor: disabled ? "not-allowed" : "pointer" }}
        >
          <option value="">Selecione</option>
          {BRAZIL_UFS.map((state) => (
            <option key={state} value={state}>{state}</option>
          ))}
        </select>
      </div>

      <div>
        <label style={labelStyle}>Cidade</label>
        <select
          value={city}
          onChange={(e) => onCityChange(e.target.value)}
          disabled={disabled || uf.trim().length === 0 || isLoadingCities}
          style={{ ...selectStyle, cursor: disabled || isLoadingCities ? "not-allowed" : "pointer" }}
        >
          <option value="">{isLoadingCities ? "Carregando..." : "Selecione"}</option>
          {cities.map((cityOption) => (
            <option key={cityOption} value={cityOption}>{cityOption}</option>
          ))}
        </select>
        {!isLoadingCities && cities.length > 0 && (
          <div style={{ fontSize: 10, color: "var(--text-3)", marginTop: 4 }}>
            {cities.length} municípios (IBGE)
          </div>
        )}
      </div>

      {cityError && (
        <div style={{ gridColumn: "1 / -1", fontSize: 12, color: "var(--danger)", marginTop: 4 }}>
          Não foi possível carregar as cidades. Tente novamente.
        </div>
      )}
    </div>
  );
}
