export const queryKeys = {
  dashboard: (params: { period: string; pollMs?: string }) => ['dashboard', params] as const,
  finance: () => ['finance'] as const,
  reports: (params: {
    q?: string
    cat?: string
    type?: string
    logic?: string
    startDate?: string
    endDate?: string
    page?: number
    pageSize?: number
    sortBy?: string
    sortOrder?: string
  }) => ['reports', params] as const,
  reportSchedules: () => ['reportSchedules'] as const,
  audit: (params: { q?: string; action?: string }) => ['audit', params] as const,
  users: (params: { q?: string; role?: string; status?: string }) =>
    ['users', params] as const,
} as const

