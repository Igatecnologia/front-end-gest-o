import type { DashboardData } from '../types/models'
import type { FinanceOverview } from '../types/models'
import type { ReportItem } from '../types/models'
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
export function buildDashboardFromVendasRows(rows: VendaAnaliticaRow[]): DashboardData {
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

    heatmap.set(hKey, (heatmap.get(hKey) ?? 0) + r.total)
  }

  const salesSorted = [...byDayStart.entries()].sort((a, b) => a[0] - b[0])
  const sales: DashboardData['sales'] = salesSorted.map(([ts, v]) => ({
    date: formatTsBrDayMonth(ts),
    value: Math.round(v.qtd),
  }))

  const revenueSorted = [...byMonthYear.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  const revenue: DashboardData['revenue'] = revenueSorted.map(([ym, v]) => {
    const [, mm] = ym.split('-')
    const mi = Math.max(0, Number(mm) - 1)
    const month = PT_MONTHS[mi] ?? 'Jan'
    return { month, value: Math.round(v.valor * 100) / 100 }
  })

  const heatmapOut: DashboardData['heatmap'] = []
  for (const [hKey, value] of heatmap) {
    const [day, h] = hKey.split('|')
    heatmapOut.push({ day, hour: Number(h), value })
  }

  const latestSorted = [...rows].sort(
    (a, b) => parseVendaDate(b.data).valueOf() - parseVendaDate(a.data).valueOf(),
  )
  const latest: DashboardData['latest'] = latestSorted.slice(0, 120).map((r, i) => ({
    id: `vd-${String(r.codcliente)}-${String(r.codprod)}-${i}-${parseVendaDate(r.data).valueOf()}`,
    cliente: String(r.nomecliente),
    total: Math.round(r.total * 100) / 100,
    status: mapPedidoStatus(String(r.statuspedido)),
    data: parseVendaDate(r.data).format('YYYY-MM-DD'),
  }))

  const dailyVals = salesSorted.map(([, v]) => v.valor)
  const trendVendas = trendFromSeries(salesSorted.map(([, v]) => v.qtd))
  const trendFat = trendFromSeries(dailyVals.length ? dailyVals : [faturamento])

  const kpis: DashboardData['kpis'] = [
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
  const custoTotal = rows.reduce((s, r) => s + r.precocustoitem * r.qtdevendida, 0)
  const lucro = receita - custoTotal
  const ticket = receita / rows.length
  const qtdTotal = rows.reduce((s, r) => s + r.qtdevendida, 0)

  const byProd = new Map<string, { total: number; qtd: number; custo: number }>()
  const byCli = new Map<string, { total: number; count: number }>()
  const byMonth = new Map<string, { total: number; count: number }>()

  for (const r of rows) {
    const pk = String(r.decprod).slice(0, 60)
    const cur = byProd.get(pk) ?? { total: 0, qtd: 0, custo: 0 }
    cur.total += r.total
    cur.qtd += r.qtdevendida
    cur.custo += r.precocustoitem * r.qtdevendida
    byProd.set(pk, cur)

    const ck = String(r.nomecliente).slice(0, 40)
    const cc = byCli.get(ck) ?? { total: 0, count: 0 }
    cc.total += r.total
    cc.count++
    byCli.set(ck, cc)

    const d = parseVendaDate(r.data)
    const mk = `${d.year()}-${String(d.month() + 1).padStart(2, '0')}`
    const mc = byMonth.get(mk) ?? { total: 0, count: 0 }
    mc.total += r.total
    mc.count++
    byMonth.set(mk, mc)
  }

  const uniqCli = byCli.size
  const uniqProd = byProd.size
  const at = isoNowDate()

  const items: ReportItem[] = []

  // ── KPIs gerais ──
  items.push(
    { id: 'receita-total', nome: 'Receita total no periodo', categoria: 'Financeiro', tipo: 'Financeiro', valorPrincipal: Math.round(receita * 100) / 100, valorSecundario: rows.length, segmento: 'Enterprise', atualizadoEm: at },
    { id: 'lucro-bruto', nome: 'Lucro bruto estimado', categoria: 'Financeiro', tipo: 'Financeiro', valorPrincipal: Math.round(lucro * 100) / 100, valorSecundario: Math.round(custoTotal * 100) / 100, segmento: 'Enterprise', atualizadoEm: at },
    { id: 'margem', nome: 'Margem bruta', categoria: 'Financeiro', tipo: 'Performance', valorPrincipal: receita > 0 ? Math.round((lucro / receita) * 10000) / 100 : 0, valorSecundario: 0, segmento: 'Enterprise', atualizadoEm: at },
    { id: 'ticket-medio', nome: 'Ticket medio por venda', categoria: 'Vendas', tipo: 'Performance', valorPrincipal: Math.round(ticket * 100) / 100, valorSecundario: uniqCli, segmento: 'MidMarket', atualizadoEm: at },
    { id: 'qtd-total', nome: 'Quantidade total vendida', categoria: 'Vendas', tipo: 'Tendência', valorPrincipal: qtdTotal, valorSecundario: rows.length, segmento: 'Enterprise', atualizadoEm: at },
    { id: 'clientes-unicos', nome: 'Clientes unicos atendidos', categoria: 'Vendas', tipo: 'Segmentação', valorPrincipal: uniqCli, valorSecundario: 0, segmento: 'Enterprise', atualizadoEm: at },
    { id: 'produtos-unicos', nome: 'Produtos diferentes vendidos', categoria: 'Vendas', tipo: 'Segmentação', valorPrincipal: uniqProd, valorSecundario: 0, segmento: 'Enterprise', atualizadoEm: at },
  )

  // ── Top produtos (ate 10) ──
  const topProds = [...byProd.entries()].sort((a, b) => b[1].total - a[1].total).slice(0, 10)
  topProds.forEach(([nome, data], i) => {
    const margem = data.total > 0 ? ((data.total - data.custo) / data.total) * 100 : 0
    items.push({
      id: `prod-${i + 1}`,
      nome: `${nome}`,
      categoria: 'Vendas',
      tipo: 'TopN',
      valorPrincipal: Math.round(data.total * 100) / 100,
      valorSecundario: data.qtd,
      segmento: margem >= 50 ? 'Enterprise' : margem >= 30 ? 'MidMarket' : 'SMB',
      atualizadoEm: at,
    })
  })

  // ── Top clientes (ate 10) ──
  const topClis = [...byCli.entries()].sort((a, b) => b[1].total - a[1].total).slice(0, 10)
  topClis.forEach(([nome, data], i) => {
    items.push({
      id: `cli-${i + 1}`,
      nome: `${nome}`,
      categoria: 'Usuários',
      tipo: 'TopN',
      valorPrincipal: Math.round(data.total * 100) / 100,
      valorSecundario: data.count,
      segmento: data.total >= 10000 ? 'Enterprise' : data.total >= 3000 ? 'MidMarket' : 'SMB',
      atualizadoEm: at,
    })
  })

  // ── Faturamento por mes ──
  const months = [...byMonth.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  months.forEach(([mk, data]) => {
    const [y, m] = mk.split('-')
    const label = `${PT_MONTHS[Number(m) - 1] ?? m}/${y}`
    items.push({
      id: `mes-${mk}`,
      nome: `Faturamento ${label}`,
      categoria: 'Financeiro',
      tipo: 'Tendência',
      valorPrincipal: Math.round(data.total * 100) / 100,
      valorSecundario: data.count,
      segmento: 'Enterprise',
      atualizadoEm: at,
    })
  })

  return items
}
