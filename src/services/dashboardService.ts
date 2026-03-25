import type { DashboardMock } from '../mocks/dashboard'
import { SGBR_BI_ACTIVE } from '../api/apiEnv'
import { getValidated } from '../api/validatedHttp'
import { dashboardResponseSchema } from '../api/schemas'
import { http } from './http'
import { getVendasAnalitico } from './vendasAnaliticoService'
import {
  buildDashboardFromVendasRows,
  dashboardRangeFromPeriod,
  type DashboardPeriod,
} from '../utils/vendasAnaliticoAggregates'

type GetDashboardOptions = {
  delayMs?: number
  failRate?: number
  /** Recorte enviado à API SGBR `vendas/analitico` (padrão 30 dias). */
  period?: DashboardPeriod
}

export async function getDashboardData(options: GetDashboardOptions = {}): Promise<DashboardMock> {
  const { delayMs = 700, failRate = 0, period = '30d' } = options
  if (failRate > 0 && Math.random() < failRate) {
    throw new Error('Falha ao carregar dados do dashboard.')
  }
  if (SGBR_BI_ACTIVE) {
    const { dtDe, dtAte } = dashboardRangeFromPeriod(period)
    const rows = await getVendasAnalitico({ dtDe, dtAte })
    return buildDashboardFromVendasRows(rows)
  }
  return getValidated(http, '/dashboard', dashboardResponseSchema, {
    params: { delayMs },
  })
}
