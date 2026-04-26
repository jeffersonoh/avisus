const IBGE_BASE_URL = "https://servicodados.ibge.gov.br/api/v1/localidades";

export const BRAZIL_UFS = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
] as const;

type IbgeCityResponse = {
  nome: string;
};

export function isValidUf(value: string): boolean {
  return BRAZIL_UFS.includes(value as (typeof BRAZIL_UFS)[number]);
}

export async function fetchIbgeCitiesByUf(uf: string): Promise<string[]> {
  const normalizedUf = uf.trim().toUpperCase();
  if (!isValidUf(normalizedUf)) {
    return [];
  }

  const response = await fetch(`${IBGE_BASE_URL}/estados/${normalizedUf}/municipios`);
  if (!response.ok) {
    throw new Error("Falha ao buscar cidades no IBGE.");
  }

  const data = (await response.json()) as IbgeCityResponse[];
  return data.map((city) => city.nome).sort((a, b) => a.localeCompare(b, "pt-BR"));
}
