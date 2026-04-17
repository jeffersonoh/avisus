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

export function RegionSelector({
  uf,
  city,
  disabled = false,
  onUfChange,
  onCityChange,
}: RegionSelectorProps) {
  const { cities, isLoadingCities, cityError } = useIBGE(uf);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <label className="space-y-1.5">
        <span className="text-sm font-medium text-text-2">UF</span>
        <select
          value={uf}
          onChange={(event) => onUfChange(event.target.value)}
          disabled={disabled}
          className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm text-text-1 outline-none ring-accent-light/35 transition focus:ring-2 disabled:cursor-not-allowed disabled:opacity-70"
        >
          <option value="">Selecione</option>
          {BRAZIL_UFS.map((state) => (
            <option key={state} value={state}>
              {state}
            </option>
          ))}
        </select>
      </label>

      <label className="space-y-1.5">
        <span className="text-sm font-medium text-text-2">Cidade</span>
        <select
          value={city}
          onChange={(event) => onCityChange(event.target.value)}
          disabled={disabled || uf.trim().length === 0 || isLoadingCities}
          className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm text-text-1 outline-none ring-accent-light/35 transition focus:ring-2 disabled:cursor-not-allowed disabled:opacity-70"
        >
          <option value="">{isLoadingCities ? "Carregando cidades..." : "Selecione"}</option>
          {cities.map((cityOption) => (
            <option key={cityOption} value={cityOption}>
              {cityOption}
            </option>
          ))}
        </select>
      </label>

      {cityError ? (
        <p className="sm:col-span-2 text-sm text-danger">
          Não foi possível carregar as cidades do IBGE. Tente novamente em instantes.
        </p>
      ) : null}
    </div>
  );
}
