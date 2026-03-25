import type { DashboardMock } from '../mocks/dashboard'
import type { FinanceOverview } from '../mocks/finance'
import type { ReportItem } from '../mocks/reports'
import type { VendaAnaliticaRow } from '../api/schemas'
import { formatTsBrDayMonth, nowBr, parseVendaDate } from './dayjsBr'

const PT_MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'] as const
const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'] as const

export type DashboardPeriod = '7d' | '30d' | '90d'

export function dashboardRangeFromPeriod(period: DashboardPeriod): { dtDe: string; dtAte: string } {
  const end = nowBr()
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90
  const start = end.subtract(days, 'day')
  return { dtDe: start.format('YYYY-MM-DD'), dtAte: end.format('YYYY-MM-DD') }
}

function mapPedidoStatus(statuspedido: string): 'pago' | 'pendente' | 'cancelado' {
  const c = statuspedido.trim().toUpperCase()
  if (c === 'C' || c === 'X' || c === 'CAN') return 'cancelado'
  if (c === 'F' || c === 'FE' || c === 'PG') return 'pago'
  return 'pendente'
}

function trendFromSeries(values: number[], take = 8): number[] {
  if (!values.length) return [0]
  const slice = values.slice(-take)
  return slice.length ? slice : [0]
}

/** Monta o objeto de dashboard consumido pelas páginas a partir das linhas da API SGBR. */
export function buildDashboardFromVendasRows(rows: VendaAnaliticaRow[]): DashboardMock {
  const faturamento = rows.reduce((s, r) => s + r.total, 0)
  const linhasVenda = rows.length
  const clientes = new Set(rows.map((r) => String(r.codcliente)))

  const byDayStart = new Map<number, { qtd: number; valor: number }>()
  const byMonthYear = new Map<string, { valor: number }>()
  const heatmap = new Map<string, number>()

  for (const r of rows) {
    const d = parseVendaDate(r.data)
    const dayStart = d.startOf('day').valueOf()
    const mKey = `${d.year()}-${String(d.month() + 1).padStart(2, '0')}`
    const wd = WEEKDAYS[d.day()] ?? 'Seg'
    const hour = d.hour()
    const hKey = `${wd}|${hour}`

    const curD = byDayStart.get(dayStart) ?? { qtd: 0, valor: 0 }
    curD.qtd += r.qtdevendida
    curD.valor += r.total
    byDayStart.set(dayStart, curD)

    const curM = byMonthYear.get(mKey) ?? { valor: 0 }
    curM.valor += r.total
    byMonthYear.set(mKey, curM)

    heatmap.set(hKey, (heatmap.get(hKey) ?? 0) + r.qtdevendida)
  }

  const salesSorted = [...byDayStart.entries()].sort((a, b) => a[0] - b[0])
  const sales: DashboardMock['sales'] = salesSorted.map(([ts, v]) => ({
    date: formatTsBrDayMonth(ts),
    value: Math.round(v.qtd),
  }))

  const revenueSorted = [...byMonthYear.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  const revenue: DashboardMock['revenue'] = revenueSorted.map(([ym, v]) => {
    const [, mm] = ym.split('-')
    const mi = Math.max(0, Number(mm) - 1)
    const month = PT_MONTHS[mi] ?? 'Jan'
    return { month, value: Math.round(v.valor * 100) / 100 }
  })

  const heatmapOut: DashboardMock['heatmap'] = []
  for (const [hKey, value] of heatmap) {
    const [day, h] = hKey.split('|')
    heatmapOut.push({ day, hour: Number(h), value })
  }

  const latestSorted = [...rows].sort(
    (a, b) => parseVendaDate(b.data).valueOf() - parseVendaDate(a.data).valueOf(),
  )
  const latest: DashboardMock['latest'] = latestSorted.slice(0, 120).map((r, i) => ({
    id: `vd-${String(r.codcliente)}-${String(r.codprod)}-${i}-${parseVendaDate(r.data).valueOf()}`,
    cliente: String(r.nomecliente),
    total: Math.round(r.total * 100) / 100,
    status: mapPedidoStatus(String(r.statuspedido)),
    data: parseVendaDate(r.data).format('YYYY-MM-DD'),
  }))

  const dailyVals = salesSorted.map(([, v]) => v.valor)
  const trendVendas = trendFromSeries(salesSorted.map(([, v]) => v.qtd))
  const trendFat = trendFromSeries(dailyVals.length ? dailyVals : [faturamento])

  const kpis: DashboardMock['kpis'] = [
    {
      key: 'vendas',
      label: 'Itens (linhas)',
      value: linhasVenda,
      previousValue: linhasVenda,
      deltaPct: 0,
      trend: trendVendas,
    },
    {
      key: 'usuarios',
      label: 'Clientes únicos',
      value: clientes.size,
      previousValue: clientes.size,
      deltaPct: 0,
      trend: trendFromSeries([clientes.size]),
    },
    {
      key: 'faturamento',
      label: 'Faturamento',
      value: Math.round(faturamento * 100) / 100,
      previousValue: Math.round(faturamento * 100) / 100,
      deltaPct: 0,
      trend: trendFat,
    },
  ]

  return { kpis, sales, revenue, heatmap: heatmapOut, latest }
}

export function financeRangeDefault(): { dtDe: string; dtAte: string } {
  const end = nowBr()
  const start = end.subtract(6, 'month')
  return { dtDe: start.format('YYYY-MM-DD'), dtAte: end.format('YYYY-MM-DD') }
}

/** Visão financeira derivada de custo x preço das linhas analíticas. */
export function buildFinanceFromVendasRows(rows: VendaAnaliticaRow[]): FinanceOverview {
  let receita = 0
  let custoCalculado = 0
  for (const r of rows) {
    receita += r.total
    custoCalculado += r.precocustoitem * r.qtdevendida
  }
  const lucro = receita - custoCalculado
  const margemPct = receita > 0 ? Math.round((lucro / receita) * 1000) / 10 : 0

  const byMonthY = new Map<string, { receita: number; custos: number }>()
  for (const r of rows) {
    const d = parseVendaDate(r.data)
    const mKey = `${d.year()}-${String(d.month() + 1).padStart(2, '0')}`
    const cur = byMonthY.get(mKey) ?? { receita: 0, custos: 0 }
    cur.receita += r.total
    cur.custos += r.precocustoitem * r.qtdevendida
    byMonthY.set(mKey, cur)
  }

  const monthlyFlow = [...byMonthY.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([ym, v]) => {
      const [, mm] = ym.split('-')
      const mi = Math.max(0, Number(mm) - 1)
      const month = PT_MONTHS[mi] ?? 'Jan'
      return {
        month,
        receita: Math.round(v.receita * 100) / 100,
        custos: Math.round(v.custos * 100) / 100,
        lucro: Math.round((v.receita - v.custos) * 100) / 100,
      }
    })

  const entries: FinanceOverview['entries'] = [...rows]
    .sort((a, b) => parseVendaDate(b.data).valueOf() - parseVendaDate(a.data).valueOf())
    .slice(0, 40)
    .map((r, i) => ({
      id: `fin-${i}-${r.codprod}-${parseVendaDate(r.data).valueOf()}`,
      date: parseVendaDate(r.data).format('YYYY-MM-DD'),
      category: 'Receita' as const,
      description: `${r.decprod.slice(0, 48)}${r.decprod.length > 48 ? '…' : ''}`,
      amount: Math.round(r.total * 100) / 100,
    }))

  return {
    receita: Math.round(receita * 100) / 100,
    custos: Math.round(custoCalculado * 100) / 100,
    lucro: Math.round(lucro * 100) / 100,
    margemPct,
    linhasCount: rows.length,
    monthlyFlow,
    entries,
  }
}

function isoNowDate() {
  return nowBr().format('YYYY-MM-DD')
}

/** Cartões de relatório sintéticos a partir dos agregados de vendas. */
export function buildReportItemsFromVendasRows(rows: VendaAnaliticaRow[]): ReportItem[] {
  if (!rows.length) return []

  const receita = rows.reduce((s, r) => s + r.total, 0)
  const ticket = receita / rows.length

  const byProd = new Map<string, number>()
  const byCli = new Map<string, number>()
  for (const r of rows) {
    const pk = String(r.decprod).slice(0, 80)
    byProd.set(pk, (byProd.get(pk) ?? 0) + r.total)
    const ck = String(r.nomecliente)
    byCli.set(ck, (byCli.get(ck) ?? 0) + r.total)
  }

  const topProd = [...byProd.entries()].sort((a, b) => b[1] - a[1])[0]
  const topCli = [...byCli.entries()].sort((a, b) => b[1] - a[1])[0]
  const uniqCli = byCli.size

  const at = isoNowDate()

  const items: ReportItem[] = [
    {
      id: 'sgbr-agg-receita',
      nome: 'Receita no período (SGBR)',
      categoria: 'Financeiro',
      tipo: 'Financeiro',
      valorPrincipal: Math.round(receita * 100) / 100,
      valorSecundario: rows.length,
      segmento: 'Enterprise',
      atualizadoEm: at,
    },
    {
      id: 'sgbr-agg-ticket',
      nome: 'Ticket médio por linha',
      categoria: 'Vendas',
      tipo: 'Performance',
      valorPrincipal: Math.round(ticket * 100) / 100,
      valorSecundario: uniqCli,
      segmento: 'MidMarket',
      atualizadoEm: at,
    },
    {
      id: 'sgbr-top-prod',
      nome: topProd ? `Top produto: ${topProd[0].slice(0, 40)}` : 'Top produto',
      categoria: 'Vendas',
      tipo: 'TopN',
      valorPrincipal: topProd ? Math.round(topProd[1] * 100) / 100 : 0,
      valorSecundario: byProd.size,
      segmento: 'Enterprise',
      atualizadoEm: at,
    },
    {
      id: 'sgbr-top-cli',
      nome: topCli ? `Top cliente: ${topCli[0].slice(0, 40)}` : 'Top cliente',
      categoria: 'Vendas',
      tipo: 'TopN',
      valorPrincipal: topCli ? Math.round(topCli[1] * 100) / 100 : 0,
      valorSecundario: uniqCli,
      segmento: 'Enterprise',
      atualizadoEm: at,
    },
    {
      id: 'sgbr-linhas',
      nome: 'Volume de linhas analíticas',
      categoria: 'Vendas',
      tipo: 'Tendência',
      valorPrincipal: rows.length,
      valorSecundario: uniqCli,
      segmento: 'SMB',
      atualizadoEm: at,
    },
  ]

  return items
}
