import { Card, Col, Row, Space, Typography } from 'antd'
import dayjs from 'dayjs'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Funnel,
  FunnelChart,
  LabelList,
  Line,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts'
import type { DashboardMock } from '../../mocks/dashboard'

function formatBRL(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function monthLabelToMonthNumber(label: string) {
  const map: Record<string, number> = {
    Jan: 1,
    Fev: 2,
    Mar: 3,
    Abr: 4,
    Mai: 5,
    Jun: 6,
    Jul: 7,
    Ago: 8,
    Set: 9,
    Out: 10,
    Nov: 11,
    Dez: 12,
  }
  return map[label] ?? null
}

const STATUS_COLORS = {
  pago: '#52c41a',
  pendente: '#faad14',
  cancelado: '#ff4d4f',
} as const

export function DashboardInsightsCharts({ data }: { data: DashboardMock }) {
  const revenueAccumulated = data.revenue.reduce<
    Array<(typeof data.revenue)[number] & { accumulated: number }>
  >((acc, r) => {
    const previous = acc[acc.length - 1]?.accumulated ?? 0
    acc.push({ ...r, accumulated: previous + r.value })
    return acc
  }, [])

  const salesCombined = data.sales.map((point, idx, arr) => {
    const prev = arr[idx - 1]?.value ?? point.value
    return { ...point, variation: point.value - prev }
  })

  const donutData = [
    { key: 'pago', label: 'Pago', value: data.latest.filter((x) => x.status === 'pago').length },
    { key: 'pendente', label: 'Pendente', value: data.latest.filter((x) => x.status === 'pendente').length },
    { key: 'cancelado', label: 'Cancelado', value: data.latest.filter((x) => x.status === 'cancelado').length },
  ] as const

  const scatterData = data.latest.map((row) => ({
    x: dayjs(row.data).date(),
    y: row.total,
    z: row.status === 'pago' ? 240 : row.status === 'pendente' ? 180 : 140,
  }))

  const radarData = [
    { metric: 'Conversão', value: 82 },
    { metric: 'Eficiência', value: 74 },
    { metric: 'Retenção', value: 66 },
    { metric: 'NPS', value: 61 },
    { metric: 'Engajamento', value: 78 },
  ]

  const sales = data.sales.reduce((sum, item) => sum + item.value, 0)
  const funnelData = [
    { stage: 'Visitantes', value: 3000 },
    { stage: 'Leads', value: 1650 },
    { stage: 'Qualificados', value: 920 },
    { stage: 'Propostas', value: 430 },
    { stage: 'Vendas', value: sales },
  ]

  const waterfallData = data.revenue.reduce<
    Array<{ month: string; base: number; deltaAbs: number; delta: number }>
  >((acc, item, idx, arr) => {
    const prev = idx === 0 ? arr[0].value : arr[idx - 1].value
    const delta = idx === 0 ? item.value : item.value - prev
    const running = acc.reduce((sum, row) => sum + row.delta, 0)
    const start = running
    const end = running + delta
    acc.push({ month: item.month, base: Math.min(start, end), deltaAbs: Math.abs(delta), delta })
    return acc
  }, [])

  const heatmapRows = (() => {
    const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex']
    const hours = [9, 12, 15, 18]
    const max = Math.max(...data.heatmap.map((h) => h.value), 1)
    return days.map((day) => ({
      day,
      cells: hours.map((hour) => {
        const point = data.heatmap.find((h) => h.day === day && h.hour === hour)
        const value = point?.value ?? 0
        return { hour, value, intensity: value / max }
      }),
    }))
  })()

  const revenueByYear = (() => {
    const now = dayjs()
    const grouped = new Map<string, number>()
    data.revenue.forEach((item) => {
      const monthNum = monthLabelToMonthNumber(item.month)
      if (!monthNum) return
      const year = monthNum > now.month() + 1 ? now.year() - 1 : now.year()
      const key = String(year)
      grouped.set(key, (grouped.get(key) ?? 0) + item.value)
    })
    return Array.from(grouped.entries()).map(([year, value]) => ({ year, value }))
  })()

  return (
    <>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card title="Tendência acumulada (Área)" role="region" aria-label="Gráfico de área">
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueAccumulated}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(v) => [formatBRL(Number(v)), 'Acumulado']} />
                  <Area type="monotone" dataKey="accumulated" stroke="#7a86ff" fill="rgba(122,134,255,0.28)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Combinado (linha + barra)" role="region" aria-label="Gráfico combinado">
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={salesCombined}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="rgba(0, 212, 212, 0.38)" />
                  <Line type="monotone" dataKey="variation" stroke="#faad14" dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Pizza / Donut" role="region" aria-label="Gráfico donut">
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip />
                  <Pie data={donutData} dataKey="value" nameKey="label" innerRadius={62} outerRadius={98}>
                    {donutData.map((entry) => (
                      <Cell key={entry.key} fill={STATUS_COLORS[entry.key]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card title="Heatmap (dia/hora)" role="region" aria-label="Heatmap dia hora">
            <Space direction="vertical" style={{ width: '100%' }} size={8}>
              {heatmapRows.map((row) => (
                <div key={row.day} style={{ display: 'grid', gridTemplateColumns: '40px repeat(4, 1fr)', gap: 8 }}>
                  <Typography.Text type="secondary">{row.day}</Typography.Text>
                  {row.cells.map((cell) => (
                    <div
                      key={`${row.day}-${cell.hour}`}
                      style={{
                        height: 28,
                        borderRadius: 8,
                        background: `color-mix(in srgb, var(--qc-primary) ${Math.max(14, Math.round(cell.intensity * 85))}%, transparent)`,
                        display: 'grid',
                        placeItems: 'center',
                        fontSize: 12,
                      }}
                    >
                      {cell.value}
                    </div>
                  ))}
                </div>
              ))}
            </Space>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Scatter (correlação)" role="region" aria-label="Scatter de correlação">
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="x" />
                  <YAxis dataKey="y" />
                  <ZAxis dataKey="z" range={[90, 380]} />
                  <Tooltip />
                  <Scatter data={scatterData} fill="rgba(122, 134, 255, 0.72)" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Radar (performance)" role="region" aria-label="Radar de performance">
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="metric" />
                  <PolarRadiusAxis domain={[0, 100]} />
                  <Tooltip formatter={(v) => [`${v}%`, 'Score']} />
                  <Radar dataKey="value" stroke="#faad14" fill="#faad14" fillOpacity={0.28} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card title="Funnel (conversão)" role="region" aria-label="Funil de conversão">
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <FunnelChart>
                  <Tooltip />
                  <Funnel dataKey="value" data={funnelData} fill="rgba(0, 212, 212, 0.6)">
                    <LabelList position="right" dataKey="stage" />
                  </Funnel>
                </FunnelChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Waterfall (ganhos/perdas)" role="region" aria-label="Waterfall ganhos perdas">
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={waterfallData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="base" stackId="wf" fill="transparent" />
                  <Bar dataKey="deltaAbs" stackId="wf">
                    {waterfallData.map((entry) => (
                      <Cell key={entry.month} fill={entry.delta >= 0 ? 'rgba(82,196,26,0.75)' : 'rgba(255,77,79,0.8)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Comparativo anual" role="region" aria-label="Comparativo anual">
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueByYear}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip formatter={(v) => [formatBRL(Number(v)), 'Faturamento anual']} />
                  <Bar dataKey="value" fill="rgba(122, 134, 255, 0.7)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>
    </>
  )
}
