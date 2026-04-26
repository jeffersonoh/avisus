import { QueryClient } from "@tanstack/react-query";

export const STALE_TIME = {
  /** Oportunidades e perfil: 30 s — dados mudam com moderada frequência. */
  DEFAULT: 30_000,
  /** Cidades IBGE: 24 h — lista praticamente imutável. */
  IBGE: 24 * 60 * 60 * 1_000,
} as const;

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: STALE_TIME.DEFAULT,
        gcTime: 5 * 60 * 1_000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  });
}
