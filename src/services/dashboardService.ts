import type { DashboardMock } from '../mocks/dashboard'
import { http } from './http'
import { getValidated } from '../api/validatedHttp'
import { dashboardResponseSchema } from '../api/schemas'

type GetDashboardOptions = {
  delayMs?: number
  failRate?: number // 0..1
}

export async function getDashboardData(
  options: GetDashboardOptions = {},
): Promise<DashboardMock> {
  const { delayMs = 700, failRate = 0 } = options
  if (failRate > 0 && Math.random() < failRate) {
    throw new Error('Falha ao carregar dados do dashboard.')
  }
  return getValidated(http, '/dashboard', dashboardResponseSchema, {
    params: { delayMs },
  })
}

