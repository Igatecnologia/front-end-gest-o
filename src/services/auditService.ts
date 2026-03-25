import { type AuditAction, type AuditLog } from '../mocks/audit'
import { SGBR_BI_ACTIVE } from '../api/apiEnv'
import { http } from './http'
import { getValidated } from '../api/validatedHttp'
import { auditResponseSchema } from '../api/schemas'

type ListAuditParams = {
  q?: string
  action?: AuditAction | 'all'
}

export async function listAuditLogs(params: ListAuditParams = {}) {
  if (SGBR_BI_ACTIVE) return []
  return getValidated(http, '/audit', auditResponseSchema, {
    params: { q: params.q, action: params.action },
  })
}

export type { AuditLog, AuditAction }

