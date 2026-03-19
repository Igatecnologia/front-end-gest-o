export type AuditAction =
  | 'login'
  | 'logout'
  | 'users.create'
  | 'users.update'
  | 'users.delete'
  | 'reports.export'
  | 'pii.reveal'

export type AuditDiff = {
  before: Record<string, unknown>
  after: Record<string, unknown>
}

export type AuditLog = {
  id: string
  at: string // ISO datetime
  actor: string
  action: AuditAction
  target?: string
  piiMasked?: boolean
  sensitiveAccessLogged?: boolean
  diff?: AuditDiff
  meta?: Record<string, unknown>
}

export const auditMock: AuditLog[] = [
  {
    id: 'AUD-1001',
    at: '2026-03-19T10:12:04Z',
    actor: 'admin@admin.com',
    action: 'login',
  },
  {
    id: 'AUD-1002',
    at: '2026-03-19T10:20:11Z',
    actor: 'admin@admin.com',
    action: 'users.create',
    target: 'usr_004',
    diff: {
      before: {},
      after: { role: 'viewer', status: 'active' },
    },
  },
  {
    id: 'AUD-1003',
    at: '2026-03-19T10:30:48Z',
    actor: 'manager@admin.com',
    action: 'reports.export',
    target: 'relatorios.csv',
  },
  {
    id: 'AUD-1004',
    at: '2026-03-19T10:45:15Z',
    actor: 'admin@admin.com',
    action: 'users.update',
    target: 'maria@empresa.com',
    piiMasked: true,
    sensitiveAccessLogged: true,
    diff: {
      before: { status: 'inactive' },
      after: { status: 'active' },
    },
  },
  {
    id: 'AUD-1005',
    at: '2026-03-19T11:02:00Z',
    actor: 'manager@admin.com',
    action: 'pii.reveal',
    target: 'usr_002',
    sensitiveAccessLogged: true,
    meta: { reason: 'Análise de suporte N2' },
  },
]

