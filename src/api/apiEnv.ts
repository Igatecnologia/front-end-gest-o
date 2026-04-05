/** URL base da API principal (backend proprio, se existir) */
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.toString().trim() || 'http://localhost:3000'

/** Stale time para cache de dados analiticos (5 min) */
export const ANALITICO_STALE_MS = 1000 * 60 * 5

const stageRaw = import.meta.env.VITE_APP_STAGE?.toString().trim().toLowerCase() ?? ''

/** Badge no cabecalho para indicar ambiente */
export function getAppEnvBadge():
  | { label: string; color: 'blue' | 'orange' | 'processing' }
  | null {
  if (stageRaw === 'homolog' || stageRaw === 'staging' || stageRaw === 'hml') {
    return { label: 'HOMOLOG', color: 'orange' }
  }
  if (import.meta.env.DEV) {
    return { label: 'DEV', color: 'blue' }
  }
  if (stageRaw === 'development' || stageRaw === 'dev') {
    return { label: 'DEV', color: 'processing' }
  }
  return null
}
