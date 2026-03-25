import type { FinanceOverview } from '../mocks/finance'
import { SGBR_BI_ACTIVE } from '../api/apiEnv'
import { getValidated } from '../api/validatedHttp'
import { financeOverviewSchema } from '../api/schemas'
import { http } from './http'
import { getVendasAnalitico } from './vendasAnaliticoService'
import { buildFinanceFromVendasRows, financeRangeDefault } from '../utils/vendasAnaliticoAggregates'

type GetFinanceOverviewOpts = {
  /** Só SGBR: mesmo intervalo enviado a `GET /sgbrbi/vendas/analitico`. */
  dtDe?: string
  dtAte?: string
}

export async function getFinanceOverview(opts?: GetFinanceOverviewOpts): Promise<FinanceOverview> {
  if (SGBR_BI_ACTIVE) {
    const { dtDe, dtAte } =
      opts?.dtDe && opts?.dtAte ? { dtDe: opts.dtDe, dtAte: opts.dtAte } : financeRangeDefault()
    const rows = await getVendasAnalitico({ dtDe, dtAte })
    return buildFinanceFromVendasRows(rows)
  }
  return getValidated(http, '/finance', financeOverviewSchema)
}
