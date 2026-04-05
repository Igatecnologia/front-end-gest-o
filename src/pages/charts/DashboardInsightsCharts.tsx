import React from 'react'
import { Card, Col, Row, Space, Tag, Tooltip as AntTooltip, Typography } from 'antd'
import { ChartShell } from '../../components/ChartShell'
import dayjs from 'dayjs'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { DashboardData } from '../../types/models'
import { gridProps, xAxisProps, yAxisProps, CHART_COLORS } from '../../components/charts/ChartDefaults'
import { formatBRL, formatCompact } from '../../utils/formatters'

const STATUS_COLORS = {
  pago: '#10B981',
  pendente: '#F59E0B',
  cancelado: '#F43F5E',
} as const

// ── Tooltip escuro reutilizavel ──
function DarkTooltip({ active, payload, label, isCurrency = true }: {
  active?: boolean; payload?: Array<{ name: string; value: number; color: string }>
  label?: string; isCurrency?: boolean
}) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#0F172A', borderRadius: 8, padding: '10px 14px', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}>
      {label && <p style={{ color: '#94A3B8', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 6px' }}>{label}</p>}
      {payload.filter(e => e.name !== 'base').map((entry, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: entry.color, flexShrink: 0 }} />
          <span style={{ color: '#94A3B8', fontSize: 12 }}>{entry.name}</span>
          <span style={{ color: '#F8FAFC', fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums', marginLeft: 'auto' }}>
            {isCurrency ? formatBRL(entry.value) : entry.value.toLocaleString('pt-BR')}
          </span>
        </div>
      ))}
    </div>
  )
}

export function DashboardInsightsCharts({ data }: { data: DashboardData }) {
  // ── Dados derivados ──
  const revenueAccumulated = data.revenue.reduce<Array<{ month: string; value: number; accumulated: number }>>((acc, r) => {
    const prev = acc[acc.length - 1]?.accumulated ?? 0
    acc.push({ ...r, accumulated: prev + r.value })
    return acc
  }, [])

  const salesCombined = data.sales.map((point, idx, arr) => {
    const prev = arr[idx - 1]?.value ?? point.value
    return { ...point, variation: point.value - prev }
  })

  const avgDaily = data.sales.length > 0 ? Math.round(data.sales.reduce((s, p) => s + p.value, 0) / data.sales.length) : 0

  // Top 5 clientes
  const topClientes = (() => {
    const map = new Map<string, number>()
    data.latest.forEach((r) => map.set(r.cliente?.slice(0, 28) || 'Sem nome', (map.get(r.cliente?.slice(0, 28) || 'Sem nome') ?? 0) + r.total))
    return Array.from(map.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5)
  })()

  // Faturamento por mes (barras)
  const revenueMonthly = data.revenue.map(r => ({ ...r }))

  // Waterfall
  const waterfallData = data.revenue.reduce<Array<{ month: string; base: number; deltaAbs: number; delta: number }>>((acc, item, idx, arr) => {
    const prev = idx === 0 ? arr[0].value : arr[idx - 1].value
    const delta = idx === 0 ? item.value : item.value - prev
    const running = acc.reduce((sum, row) => sum + row.delta, 0)
    acc.push({ month: item.month, base: Math.min(running, running + delta), deltaAbs: Math.abs(delta), delta })
    return acc
  }, [])

  // Status donut
  const statusData = [
    { name: 'Faturado', value: data.latest.filter(x => x.status === 'pago').length, color: STATUS_COLORS.pago },
    { name: 'Pendente', value: data.latest.filter(x => x.status === 'pendente').length, color: STATUS_COLORS.pendente },
    { name: 'Cancelado', value: data.latest.filter(x => x.status === 'cancelado').length, color: STATUS_COLORS.cancelado },
  ].filter(d => d.value > 0)

  // Vendas por dia da semana
  const byDayOfWeek = (() => {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']
    const map = new Map<string, { qty: number; revenue: number }>()
    days.forEach(d => map.set(d, { qty: 0, revenue: 0 }))
    data.latest.forEach(r => {
      const d = dayjs(r.data)
      const dayName = days[d.day()] ?? 'Sem'
      const cur = map.get(dayName) ?? { qty: 0, revenue: 0 }
      map.set(dayName, { qty: cur.qty + 1, revenue: cur.revenue + r.total })
    })
    return days.map(d => ({ day: d, qty: map.get(d)?.qty ?? 0, revenue: map.get(d)?.revenue ?? 0 }))
  })()

  // Heatmap — dinamico baseado nos dados reais
  const heatmapRows = (() => {
    if (!data.heatmap.length) return { days: [], hours: [], rows: [] }

    // Extrair apenas os dias e horas que existem nos dados
    const daySet = new Set(data.heatmap.map(h => h.day))
    const hourSet = new Set(data.heatmap.map(h => h.hour))
    const allDays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom']
    const days = allDays.filter(d => daySet.has(d))
    const hours = [...hourSet].sort((a, b) => a - b)
    const max = Math.max(...data.heatmap.map(h => h.value), 1)

    return {
      days,
      hours,
      rows: days.map(day => ({
        day,
        cells: hours.map(hour => {
          const point = data.heatmap.find(h => h.day === day && h.hour === hour)
          const value = point?.value ?? 0
          return { hour, value, intensity: value / max }
        }),
      })),
    }
  })()

  // Maiores vendas (top transacoes individuais)
  const topTransacoes = [...data.latest].sort((a, b) => b.total - a.total).slice(0, 8)

  // KPIs
  const totalFaturamento = data.revenue.reduce((s, r) => s + r.value, 0)
  const totalPedidos = data.latest.length
  const ticketMedio = totalPedidos > 0 ? totalFaturamento / totalPedidos : 0
  const clientesUnicos = new Set(data.latest.map(r => r.cliente)).size

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {/* ── KPIs ── */}
      <Row gutter={[12, 12]}>
        {[
          { label: 'Faturamento', value: formatCompact(totalFaturamento), color: CHART_COLORS[0] },
          { label: 'Pedidos', value: String(totalPedidos), color: CHART_COLORS[1] },
          { label: 'Ticket medio', value: formatCompact(ticketMedio), color: CHART_COLORS[2] },
          { label: 'Clientes', value: String(clientesUnicos), color: CHART_COLORS[3] },
        ].map((kpi) => (
          <Col xs={12} sm={6} key={kpi.label}>
            <div className="metric-card">
              <div className="metric-card__accent" style={{ background: kpi.color }} />
              <div className="metric-card__content">
                <span className="metric-card__title">{kpi.label}</span>
                <span className="metric-card__value">{kpi.value}</span>
              </div>
            </div>
          </Col>
        ))}
      </Row>

      {/* ── LINHA 1: Faturamento acumulado + Faturamento mensal ── */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card variant="borderless" className="app-card" title="Faturamento acumulado">
            <ChartShell>
              <AreaChart data={revenueAccumulated} margin={{ left: 0, right: 8 }}>
                <defs>
                  <linearGradient id="gradAccum" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS[0]} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={CHART_COLORS[0]} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="month" {...xAxisProps} />
                <YAxis tickFormatter={v => formatCompact(v).replace('R$ ', '')} {...yAxisProps} />
                <Tooltip content={<DarkTooltip />} />
                <Area type="monotone" dataKey="accumulated" name="Acumulado" stroke={CHART_COLORS[0]} strokeWidth={2.5} fill="url(#gradAccum)" dot={{ fill: CHART_COLORS[0], r: 3 }} activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }} />
                <Area type="monotone" dataKey="value" name="No mes" stroke={CHART_COLORS[5]} strokeWidth={1.5} fill="none" strokeDasharray="4 4" dot={false} />
              </AreaChart>
            </ChartShell>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card variant="borderless" className="app-card" title="Faturamento por mes">
            <ChartShell>
              <BarChart data={revenueMonthly} margin={{ left: 0, right: 8 }}>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="month" {...xAxisProps} />
                <YAxis tickFormatter={v => formatCompact(v).replace('R$ ', '')} {...yAxisProps} />
                <Tooltip content={<DarkTooltip />} />
                <Bar dataKey="value" name="Faturamento" radius={[6, 6, 0, 0]}>
                  {revenueMonthly.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[0]} fillOpacity={i === revenueMonthly.length - 1 ? 1 : 0.5} />
                  ))}
                </Bar>
              </BarChart>
            </ChartShell>
          </Card>
        </Col>
      </Row>

      {/* ── LINHA 2: Volume diario + Status dos pedidos ── */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card variant="borderless" className="app-card" title="Volume diario de vendas">
            <ChartShell>
              <ComposedChart data={salesCombined} margin={{ left: 0, right: 8 }}>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="date" {...xAxisProps} />
                <YAxis yAxisId="left" {...yAxisProps} allowDecimals={false} />
                <Tooltip content={<DarkTooltip isCurrency={false} />} />
                <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                <Bar yAxisId="left" dataKey="value" name="Quantidade" fill={CHART_COLORS[0]} fillOpacity={0.65} radius={[4, 4, 0, 0]} />
                <Line yAxisId="left" type="monotone" dataKey="variation" name="Variacao vs anterior" stroke={CHART_COLORS[2]} dot={false} strokeWidth={2} />
                <ReferenceLine yAxisId="left" y={avgDaily} stroke={CHART_COLORS[4]} strokeDasharray="4 4" />
              </ComposedChart>
            </ChartShell>
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card variant="borderless" className="app-card" title="Status dos pedidos">
            <ChartShell height={200}>
              <PieChart>
                <Tooltip content={<DarkTooltip isCurrency={false} />} />
                <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} strokeWidth={0}>
                  {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
              </PieChart>
            </ChartShell>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 8 }}>
              {statusData.map(s => (
                <div key={s.name} style={{ textAlign: 'center' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.color, margin: '0 auto 4px' }} />
                  <Typography.Text style={{ fontSize: 12, display: 'block' }}>{s.name}</Typography.Text>
                  <Typography.Text strong style={{ fontSize: 16, fontVariantNumeric: 'tabular-nums' }}>{s.value}</Typography.Text>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      {/* ── LINHA 3: Top clientes + Vendas por dia da semana ── */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card variant="borderless" className="app-card" title="Top 5 clientes">
            {topClientes.length === 0 ? (
              <Typography.Text type="secondary">Sem dados no periodo</Typography.Text>
            ) : (
              <ChartShell height={220}>
                <BarChart data={topClientes} layout="vertical" margin={{ left: 0, right: 24 }}>
                  <CartesianGrid {...gridProps} horizontal={false} vertical />
                  <XAxis type="number" {...xAxisProps} tickFormatter={v => formatCompact(v).replace('R$ ', '')} />
                  <YAxis type="category" dataKey="name" {...yAxisProps} width={130} tick={{ fontSize: 11 }} />
                  <Tooltip content={<DarkTooltip />} />
                  <Bar dataKey="value" name="Faturamento" radius={[0, 6, 6, 0]}>
                    {topClientes.map((_, i) => <Cell key={i} fill={CHART_COLORS[i]} fillOpacity={0.85} />)}
                  </Bar>
                </BarChart>
              </ChartShell>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card variant="borderless" className="app-card" title="Vendas por dia da semana">
            <ChartShell height={220}>
              <ComposedChart data={byDayOfWeek} margin={{ left: 0, right: 8 }}>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="day" {...xAxisProps} />
                <YAxis yAxisId="left" {...yAxisProps} allowDecimals={false} />
                <YAxis yAxisId="right" orientation="right" {...yAxisProps} tickFormatter={v => formatCompact(v).replace('R$ ', '')} />
                <Tooltip content={<DarkTooltip />} />
                <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                <Bar yAxisId="left" dataKey="qty" name="Qtd pedidos" fill={CHART_COLORS[1]} fillOpacity={0.7} radius={[4, 4, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="revenue" name="Faturamento" stroke={CHART_COLORS[0]} strokeWidth={2} dot={{ r: 4, fill: CHART_COLORS[0] }} />
              </ComposedChart>
            </ChartShell>
          </Card>
        </Col>
      </Row>

      {/* ── LINHA 4: Waterfall + Heatmap ── */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card variant="borderless" className="app-card" title="Variacao mensal do faturamento">
            <Space size={8} style={{ marginBottom: 8 }}>
              <Tag color="green">Crescimento</Tag>
              <Tag color="red">Queda</Tag>
            </Space>
            <ChartShell>
              <BarChart data={waterfallData} margin={{ left: 0, right: 8 }}>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="month" {...xAxisProps} />
                <YAxis tickFormatter={v => formatCompact(v).replace('R$ ', '')} {...yAxisProps} />
                <Tooltip content={<DarkTooltip />} />
                <Bar dataKey="base" stackId="wf" fill="transparent" name="base" />
                <Bar dataKey="deltaAbs" stackId="wf" name="Variacao">
                  {waterfallData.map(entry => <Cell key={entry.month} fill={entry.delta >= 0 ? STATUS_COLORS.pago : STATUS_COLORS.cancelado} fillOpacity={0.85} />)}
                </Bar>
              </BarChart>
            </ChartShell>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card variant="borderless" className="app-card" title="Mapa de calor: dia x horario">
            {heatmapRows.days.length === 0 ? (
              <Typography.Text type="secondary">Sem dados de horario no periodo</Typography.Text>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: `40px repeat(${heatmapRows.hours.length}, 1fr)`, gap: 5 }}>
                <div />
                {heatmapRows.hours.map(h => (
                  <Typography.Text key={h} type="secondary" style={{ fontSize: 11, textAlign: 'center', fontWeight: 600 }}>{h}h</Typography.Text>
                ))}
                {heatmapRows.rows.map(row => (
                  <React.Fragment key={row.day}>
                    <Typography.Text type="secondary" style={{ fontSize: 12, fontWeight: 500, lineHeight: '40px' }}>{row.day}</Typography.Text>
                    {row.cells.map(cell => (
                      <AntTooltip key={`${row.day}-${cell.hour}`} title={`${row.day} ${cell.hour}h — ${formatBRL(cell.value)}`}>
                        <div style={{
                          height: 40, borderRadius: 8,
                          background: cell.value === 0
                            ? 'var(--qc-border)'
                            : `color-mix(in srgb, ${CHART_COLORS[0]} ${Math.max(18, Math.round(cell.intensity * 92))}%, transparent)`,
                          display: 'grid', placeItems: 'center',
                          fontSize: 11, fontWeight: 700, fontVariantNumeric: 'tabular-nums',
                          color: cell.intensity > 0.5 ? '#fff' : 'var(--qc-text)',
                          cursor: 'default',
                        }}>
                          {cell.value ? formatCompact(cell.value).replace('R$ ', '') : '—'}
                        </div>
                      </AntTooltip>
                    ))}
                  </React.Fragment>
                ))}
              </div>
            )}
            <Typography.Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 8 }}>
              Valores em R$. Quanto mais escuro, maior o faturamento. Passe o mouse para ver o valor exato.
            </Typography.Text>
          </Card>
        </Col>
      </Row>

      {/* ── LINHA 5: Maiores transacoes ── */}
      <Card variant="borderless" className="app-card" title="Maiores transacoes do periodo">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {topTransacoes.map((row, i) => (
            <div key={row.id + i} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 16px', borderRadius: 10,
              background: 'var(--qc-canvas)', border: '1px solid var(--qc-border)',
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: CHART_COLORS[i % CHART_COLORS.length],
                display: 'grid', placeItems: 'center',
                color: '#fff', fontSize: 13, fontWeight: 700,
              }}>
                {i + 1}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Typography.Text ellipsis style={{ display: 'block', fontWeight: 500 }}>{row.cliente}</Typography.Text>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {dayjs(row.data).format('DD/MM/YYYY')}
                </Typography.Text>
              </div>
              <div style={{ textAlign: 'right' }}>
                <Typography.Text strong style={{ fontVariantNumeric: 'tabular-nums', fontSize: 15 }}>
                  {formatBRL(row.total)}
                </Typography.Text>
                <div>
                  <Tag color={row.status === 'pago' ? 'green' : row.status === 'pendente' ? 'gold' : 'red'} style={{ margin: 0, fontSize: 11 }}>
                    {row.status === 'pago' ? 'Pago' : row.status === 'pendente' ? 'Pendente' : 'Cancelado'}
                  </Tag>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </Space>
  )
}
