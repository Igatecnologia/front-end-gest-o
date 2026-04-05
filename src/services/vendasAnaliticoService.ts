import { getValidated } from '../api/validatedHttp'
import { vendasAnaliticoResponseSchema } from '../api/schemas'
import { http } from './http'

/** Converte `YYYY-MM-DD` para `YYYY.MM.DD` */
export function toSgbrBiDateParam(isoDay: string): string {
  return isoDay.replaceAll('-', '.')
}

/**
 * Busca dados de vendas via backend proxy.
 * O backend le a config da fonte e chama a API do cliente.
 */
export async function getVendasAnalitico(params: { dtDe: string; dtAte: string }) {
  return getValidated(http, '/api/proxy/data', vendasAnaliticoResponseSchema, {
    params: {
      dt_de: toSgbrBiDateParam(params.dtDe),
      dt_ate: toSgbrBiDateParam(params.dtAte),
    },
  })
}
