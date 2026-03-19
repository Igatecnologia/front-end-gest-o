export type Kpi = {
  key: 'vendas' | 'usuarios' | 'faturamento'
  label: string
  value: number
  previousValue: number
  deltaPct: number
  trend: number[]
}

export type SalesPoint = { date: string; value: number }
export type RevenuePoint = { month: string; value: number }
export type HeatmapPoint = { day: string; hour: number; value: number }

export type DashboardMock = {
  kpis: Kpi[]
  sales: SalesPoint[]
  revenue: RevenuePoint[]
  heatmap: HeatmapPoint[]
  latest: Array<{
    id: string
    cliente: string
    total: number
    status: 'pago' | 'pendente' | 'cancelado'
    data: string
  }>
}

export const dashboardMock: DashboardMock = {
  kpis: [
    {
      key: 'vendas',
      label: 'Vendas',
      value: 1284,
      previousValue: 1142,
      deltaPct: 12.4,
      trend: [22, 24, 26, 25, 31, 29, 33, 35],
    },
    {
      key: 'usuarios',
      label: 'Usuários',
      value: 842,
      previousValue: 801,
      deltaPct: 5.1,
      trend: [710, 728, 735, 742, 780, 793, 812, 842],
    },
    {
      key: 'faturamento',
      label: 'Faturamento',
      value: 186540,
      previousValue: 171610,
      deltaPct: 8.7,
      trend: [151200, 156300, 160100, 165900, 171000, 174200, 180300, 186540],
    },
  ],
  sales: [
    { date: '01/03', value: 32 },
    { date: '03/03', value: 48 },
    { date: '05/03', value: 40 },
    { date: '07/03', value: 66 },
    { date: '09/03', value: 52 },
    { date: '11/03', value: 71 },
    { date: '13/03', value: 58 },
    { date: '15/03', value: 77 },
  ],
  revenue: [
    { month: 'Out', value: 124000 },
    { month: 'Nov', value: 131500 },
    { month: 'Dez', value: 145200 },
    { month: 'Jan', value: 152900 },
    { month: 'Fev', value: 163400 },
    { month: 'Mar', value: 186540 },
  ],
  heatmap: [
    { day: 'Seg', hour: 9, value: 8 },
    { day: 'Seg', hour: 12, value: 12 },
    { day: 'Seg', hour: 15, value: 10 },
    { day: 'Seg', hour: 18, value: 7 },
    { day: 'Ter', hour: 9, value: 6 },
    { day: 'Ter', hour: 12, value: 14 },
    { day: 'Ter', hour: 15, value: 11 },
    { day: 'Ter', hour: 18, value: 9 },
    { day: 'Qua', hour: 9, value: 10 },
    { day: 'Qua', hour: 12, value: 16 },
    { day: 'Qua', hour: 15, value: 13 },
    { day: 'Qua', hour: 18, value: 8 },
    { day: 'Qui', hour: 9, value: 7 },
    { day: 'Qui', hour: 12, value: 11 },
    { day: 'Qui', hour: 15, value: 12 },
    { day: 'Qui', hour: 18, value: 6 },
    { day: 'Sex', hour: 9, value: 9 },
    { day: 'Sex', hour: 12, value: 15 },
    { day: 'Sex', hour: 15, value: 14 },
    { day: 'Sex', hour: 18, value: 10 },
  ],
  latest: [
    { id: 'PED-1042', cliente: 'Loja Aurora', total: 1240.9, status: 'pago', data: '2026-03-17' },
    { id: 'PED-1041', cliente: 'Alpha Market', total: 389.0, status: 'pendente', data: '2026-03-16' },
    { id: 'PED-1040', cliente: 'Comercial Rio', total: 920.5, status: 'pago', data: '2026-03-16' },
    { id: 'PED-1039', cliente: 'Studio Lumen', total: 215.0, status: 'cancelado', data: '2026-03-15' },
    { id: 'PED-1038', cliente: 'Delta Foods', total: 1449.99, status: 'pago', data: '2026-03-15' },
  ],
}

