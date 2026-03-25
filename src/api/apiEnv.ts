export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.toString().trim() || 'http://localhost:3000'

/** `false` por padrão: o app fala só com HTTP real (`VITE_API_BASE_URL`). Use `true` para MSW (ex.: testes e2e). */
export const USE_MOCKS =
  String(import.meta.env.VITE_USE_MOCKS ?? 'false').toLowerCase() === 'true'

const rawSgbrUrl = import.meta.env.VITE_SGBR_BI_BASE_URL?.toString().trim() ?? ''

const invalidProxyInProd = !import.meta.env.DEV && rawSgbrUrl.toLowerCase() === 'proxy'
const effectiveSgbrUrl = invalidProxyInProd ? '' : rawSgbrUrl

/**
 * `VITE_SGBR_BI_BASE_URL=proxy` só em **dev**: axios usa base vazia e o Vite encaminha `/sgbrbi` → servidor real (sem CORS).
 * Fora disso use URL absoluta, ex.: `http://108.181.223.103:3007` (o servidor precisa liberar CORS).
 */
export const SGBR_BI_DEV_PROXY =
  import.meta.env.DEV && effectiveSgbrUrl.toLowerCase() === 'proxy'

/** Base do axios para `/sgbrbi/*` (string vazia = mesma origem, com proxy no Vite em dev). */
export const SGBR_BI_HTTP_BASE = SGBR_BI_DEV_PROXY ? '' : effectiveSgbrUrl

/** Integração SGBR BI ligada (URL absoluta ou `proxy` em dev). */
export const SGBR_BI_ACTIVE =
  SGBR_BI_DEV_PROXY || (SGBR_BI_HTTP_BASE.length > 0 && SGBR_BI_HTTP_BASE.toLowerCase() !== 'proxy')

/** @deprecated Preferir `SGBR_BI_HTTP_BASE` / `SGBR_BI_ACTIVE`. */
export const SGBR_BI_BASE_URL = SGBR_BI_HTTP_BASE

const authEnvRaw = import.meta.env.VITE_AUTH_BACKEND?.toString().trim().toLowerCase()

/**
 * `sgbrbi` quando SGBR está ativo (padrão). Forçar: `VITE_AUTH_BACKEND=mock` ou `sgbrbi`.
 */
export const AUTH_BACKEND: 'mock' | 'sgbrbi' =
  authEnvRaw === 'mock' || authEnvRaw === 'sgbrbi'
    ? authEnvRaw
    : SGBR_BI_ACTIVE
      ? 'sgbrbi'
      : 'mock'

export const IS_SGBR_BI_AUTH = AUTH_BACKEND === 'sgbrbi' && SGBR_BI_ACTIVE

/** Várias telas reaproveitam `vendas/analitico`; evita refetch ao navegar entre dashboard, BI e dados. */
export const SGBR_ANALITICO_STALE_MS = 1000 * 60 * 5

const stageRaw = import.meta.env.VITE_APP_STAGE?.toString().trim().toLowerCase() ?? ''

/** Badge no cabeçalho: homologação sempre; dev local quando `vite dev`; produção sem variável = sem badge. */
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
