import type { ReportItem } from '../mocks/reports'
import { http } from './http'
import { getValidated } from '../api/validatedHttp'
import { reportsPagedResponseSchema } from '../api/schemas'

type GetReportsOptions = {
  delayMs?: number
  failRate?: number // 0..1
  q?: string
  cat?: 'all' | ReportItem['categoria']
  type?: 'all' | ReportItem['tipo']
  logic?: 'and' | 'or'
  startDate?: string
  endDate?: string
  page?: number
  pageSize?: number
  sortBy?: 'atualizadoEm' | 'nome' | 'tipo'
  sortOrder?: 'asc' | 'desc'
}

export async function getReports(
  options: GetReportsOptions = {},
): Promise<{ items: ReportItem[]; total: number; page: number; pageSize: number }> {
  const { delayMs = 500, failRate = 0, ...params } = options
  if (failRate > 0 && Math.random() < failRate) {
    throw new Error('Falha ao carregar relatórios.')
  }
  return getValidated(http, '/reports', reportsPagedResponseSchema, {
    params: { delayMs, ...params },
  })
}

