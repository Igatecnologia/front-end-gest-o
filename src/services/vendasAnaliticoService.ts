import { getValidated } from '../api/validatedHttp'
import { vendasAnaliticoResponseSchema } from '../api/schemas'
import { sgbrBiHttp } from './sgbrBiHttp'

/** Converte `YYYY-MM-DD` para `YYYY.MM.DD` (formato esperado pela API). */
export function toSgbrBiDateParam(isoDay: string): string {
  return isoDay.replaceAll('-', '.')
}

export async function getVendasAnalitico(params: { dtDe: string; dtAte: string }) {
  if (!sgbrBiHttp) {
    throw new Error(
      'SGBR BI desativado: defina VITE_SGBR_BI_BASE_URL (ex.: proxy em dev ou URL absoluta em produção).',
    )
  }
  return getValidated(sgbrBiHttp, '/sgbrbi/vendas/analitico', vendasAnaliticoResponseSchema, {
    params: {
      dt_de: toSgbrBiDateParam(params.dtDe),
      dt_ate: toSgbrBiDateParam(params.dtAte),
    },
  })
}
