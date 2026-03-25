import { Card, Col, Row, Space, Typography } from 'antd'
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
  LabelList,
  Legend,
  Line,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  Scatter,
  ScatterChart,
  Funnel,
  FunnelChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts'
import { SGBR_BI_ACTIVE } from '../../api/apiEnv'
import type { DashboardMock } from '../../mocks/dashboard'
import { coerceTooltipNumber, coerceTooltipNumberOr } from '../../utils/rechartsTooltip'

function formatBRL(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatBRLAxis(n: number) {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} M`
  if (Math.abs(n) >= 1000) return `${(n / 1000).toFixed(0)} k`
  return String(Math.round(n))
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

/** Gráficos de negócio reais +, fora da API SGBR, exemplos didáticos claramente marcados. */
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
    { key: 'pago', label: 'Faturado / OK', value: data.latest.filter((x) => x.status === 'pago').length },
    { key: 'pendente', label: 'Pendente', value: data.latest.filter((x) => x.status === 'pendente').length },
    { key: 'cancelado', label: 'Cancelado', value: data.latest.filter((x) => x.status === 'cancelado').length },
  ] as const

  const scatterData = data.latest.map((row) => ({
    x: dayjs(row.data).date(),
    y: row.total,
    z: row.status === 'pago' ? 240 : row.status === 'pendente' ? 180 : 140,
    cliente: row.cliente.slice(0, 24),
  }))

  const radarDemo = [
    { metric: 'Metas internas', value: 72 },
    { metric: 'Prazo médio', value: 65 },
    { metric: 'Satisfação (NPS)', value: 58 },
    { metric: 'Retrabalho', value: 45 },
    { metric: 'Capacidade', value: 80 },
  ]

  const sales = data.sales.reduce((sum, item) => sum + item.value, 0)
  const funnelDemo = [
    { stage: 'Contatos (ex.)', value: Math.max(sales * 4, 100) },
    { stage: 'Orçamentos (ex.)', value: Math.max(sales * 2, 80) },
    { stage: 'Pedidos fechados', value: sales },
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
    return { days, hours, rows: days.map((day) => ({
      day,
      cells: hours.map((hour) => {
        const point = data.heatmap.find((h) => h.day === day && h.hour === hour)
        const value = point?.value ?? 0
        return { hour, value, intensity: value / max }
      }),
    })) }
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
    <Space orientation="vertical" size={16} style={{ width: '100%' }}>
      <AlertIntro />

      <Typography.Title level={5} style={{ margin: 0 }}>
        Dados das suas vendas (período selecionado)
      </Typography.Title>
      <Typography.Text type="secondary">
        Valores abaixo vêm das mesmas linhas de venda usadas no dashboard: faturamento, quantidades e status dos pedidos
        recentes.
      </Typography.Text>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card variant="borderless" className="app-card">
            <Typography.Title level={5} style={{ marginTop: 0 }}>
              Faturamento que acumula ao longo dos meses
            </Typography.Title>
            <Typography.Paragraph type="secondary" style={{ marginBottom: 12, fontSize: 13 }}>
              Cada ponto é o total vendido naquele mês; a linha mostra quanto já somou desde o primeiro mês do recorte.
            </Typography.Paragraph>
            <ChartShell>
              <AreaChart data={revenueAccumulated} margin={{ left: 8, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} label={{ value: 'Mês', position: 'insideBottom', offset: -4 }} />
                <YAxis tickFormatter={formatBRLAxis} width={48} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(v) => {
                    const n = coerceTooltipNumber(v)
                    return [(n !== undefined ? formatBRL(n) : ''), 'Acumulado']
                  }}
                  labelFormatter={(l) => `Mês: ${l}`}
                />
                <Area type="monotone" dataKey="accumulated" name="Faturamento acumulado" stroke="#1677ff" fill="rgba(22,119,255,0.2)" />
              </AreaChart>
            </ChartShell>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card variant="borderless" className="app-card">
            <Typography.Title level={5} style={{ marginTop: 0 }}>
              Movimento diário: quantidade e ritmo
            </Typography.Title>
            <Typography.Paragraph type="secondary" style={{ marginBottom: 12, fontSize: 13 }}>
              Barras = quantidade vendida naquele dia. Linha laranja = diferença em relação ao dia anterior (sobe ou desce).
            </Typography.Paragraph>
            <ChartShell>
              <ComposedChart data={salesCombined} margin={{ left: 8, right: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} label={{ value: 'Dia', position: 'insideBottom', offset: -4 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} label={{ value: 'Qtd.', angle: -90, position: 'insideLeft' }} />
                <Tooltip
                  formatter={(v, name) => {
                    const num = coerceTooltipNumberOr(v, 0)
                    const nameStr = String(name ?? '')
                    const isQty = nameStr === 'Quantidade no dia' || nameStr === 'value'
                    if (isQty) return [`${num} unid.`, 'Quantidade no dia']
                    return [`${num >= 0 ? '+' : ''}${num} unid.`, 'Variação vs dia anterior']
                  }}
                  labelFormatter={(l) => `Data: ${l}`}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar yAxisId="left" dataKey="value" name="Quantidade no dia" fill="rgba(22, 119, 255, 0.55)" radius={[4, 4, 0, 0]} />
                <Line yAxisId="left" type="monotone" dataKey="variation" name="Variação vs dia anterior" stroke="#fa8c16" dot={false} strokeWidth={2} />
              </ComposedChart>
            </ChartShell>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card variant="borderless" className="app-card">
            <Typography.Title level={5} style={{ marginTop: 0 }}>
              Pedidos recentes por situação
            </Typography.Title>
            <Typography.Paragraph type="secondary" style={{ marginBottom: 12, fontSize: 13 }}>
              Fatias = quantidade de linhas nos últimos lançamentos exibidos no resumo (não é o estoque inteiro do ERP).
            </Typography.Paragraph>
            <ChartShell>
              <PieChart>
                <Tooltip formatter={(v) => [`${coerceTooltipNumberOr(v, 0)} pedido(s)`, 'Quantidade']} />
                <Pie data={donutData} dataKey="value" nameKey="label" innerRadius={58} outerRadius={92} paddingAngle={2}>
                  {donutData.map((entry) => (
                    <Cell key={entry.key} fill={STATUS_COLORS[entry.key]} />
                  ))}
                </Pie>
                <Legend />
              </PieChart>
            </ChartShell>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={10}>
          <Card variant="borderless" className="app-card">
            <Typography.Title level={5} style={{ marginTop: 0 }}>
              Em que dias da semana e horários há mais movimento
            </Typography.Title>
            <Typography.Paragraph type="secondary" style={{ marginBottom: 8, fontSize: 13 }}>
              Número dentro do quadrado = quantidade vendida somada naquele dia da semana e faixa de horário (horário do
              registro na API).
            </Typography.Paragraph>
            <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 10 }}>
              Colunas: {heatmapRows.hours.map((h) => `${h}h`).join(' · ')}
            </Typography.Text>
            <Space orientation="vertical" style={{ width: '100%' }} size={8}>
              {heatmapRows.rows.map((row) => (
                <div key={row.day} style={{ display: 'grid', gridTemplateColumns: '36px repeat(4, 1fr)', gap: 8 }}>
                  <Typography.Text type="secondary">{row.day}</Typography.Text>
                  {row.cells.map((cell) => (
                    <div
                      key={`${row.day}-${cell.hour}`}
                      title={`${row.day} ${cell.hour}h — ${cell.value} unid.`}
                      style={{
                        height: 32,
                        borderRadius: 8,
                        background: `color-mix(in srgb, var(--qc-primary) ${Math.max(14, Math.round(cell.intensity * 85))}%, transparent)`,
                        display: 'grid',
                        placeItems: 'center',
                        fontSize: 12,
                        fontWeight: 500,
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
        <Col xs={24} lg={14}>
          <Card variant="borderless" className="app-card">
            <Typography.Title level={5} style={{ marginTop: 0 }}>
              Valor de cada pedido vs dia do mês
            </Typography.Title>
            <Typography.Paragraph type="secondary" style={{ marginBottom: 12, fontSize: 13 }}>
              Cada bolinha é um lançamento: horizontal = dia do mês em que ocorreu, vertical = valor total (R$). Passe o
              mouse para ver o cliente.
            </Typography.Paragraph>
            <ChartShell>
              <ScatterChart margin={{ left: 8, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" dataKey="x" name="Dia do mês" tick={{ fontSize: 11 }} domain={[0, 31]} label={{ value: 'Dia do mês (1–31)', position: 'insideBottom', offset: -4 }} />
                <YAxis type="number" dataKey="y" name="Valor" tickFormatter={formatBRLAxis} width={56} tick={{ fontSize: 11 }} label={{ value: 'Valor (R$)', angle: -90, position: 'insideLeft' }} />
                <ZAxis dataKey="z" range={[70, 320]} />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  formatter={(v) => {
                    const n = coerceTooltipNumberOr(v, 0)
                    return [formatBRL(n), 'Valor do pedido']
                  }}
                  labelFormatter={(label, payload) => {
                    const row = payload?.[0]?.payload as { cliente?: string; x?: number } | undefined
                    return row ? `Dia ${row.x} — ${row.cliente ?? ''}` : String(label)
                  }}
                />
                <Scatter data={scatterData} fill="rgba(22, 119, 255, 0.65)" name="Lançamentos" />
              </ScatterChart>
            </ChartShell>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card variant="borderless" className="app-card">
            <Typography.Title level={5} style={{ marginTop: 0 }}>
              Quanto o faturamento mudou de um mês para o outro
            </Typography.Title>
            <Typography.Paragraph type="secondary" style={{ marginBottom: 12, fontSize: 13 }}>
              Barras verdes = mês vendeu mais que o anterior; vermelhas = vendeu menos. Útil para ver tendência rápida.
            </Typography.Paragraph>
            <ChartShell>
              <BarChart data={waterfallData} margin={{ left: 8, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={formatBRLAxis} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(v) => {
                    const n = coerceTooltipNumber(v)
                    return [(n !== undefined ? formatBRL(n) : ''), '']
                  }}
                />
                <Bar dataKey="base" stackId="wf" fill="transparent" />
                <Bar dataKey="deltaAbs" stackId="wf">
                  {waterfallData.map((entry) => (
                    <Cell key={entry.month} fill={entry.delta >= 0 ? 'rgba(82,196,26,0.8)' : 'rgba(255,77,79,0.85)'} />
                  ))}
                </Bar>
              </BarChart>
            </ChartShell>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card variant="borderless" className="app-card">
            <Typography.Title level={5} style={{ marginTop: 0 }}>
              Faturamento agrupado por ano (quando há mais de um ano no recorte)
            </Typography.Title>
            <Typography.Paragraph type="secondary" style={{ marginBottom: 12, fontSize: 13 }}>
              Soma de tudo que entrou em cada ano civil, calculada a partir dos meses disponíveis na base.
            </Typography.Paragraph>
            <ChartShell>
              <BarChart data={revenueByYear} margin={{ left: 8, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" tick={{ fontSize: 11 }} label={{ value: 'Ano', position: 'insideBottom', offset: -4 }} />
                <YAxis tickFormatter={formatBRLAxis} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(v) => {
                    const n = coerceTooltipNumber(v)
                    return [(n !== undefined ? formatBRL(n) : ''), 'Faturamento']
                  }}
                />
                <Bar dataKey="value" name="Total no ano" fill="rgba(114, 46, 209, 0.75)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ChartShell>
          </Card>
        </Col>
      </Row>

      {!SGBR_BI_ACTIVE ? (
        <>
          <Typography.Title level={5} style={{ margin: '8px 0 0' }}>
            Exemplos didáticos (não usam a sua API)
          </Typography.Title>
          <Typography.Text type="secondary">
            Com o modo demonstração (sem SGBR), estes dois gráficos são apenas ilustração de telas de metas e funil —
            não refletem dados reais do servidor.
          </Typography.Text>
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card variant="borderless" className="app-card">
                <Typography.Title level={5} style={{ marginTop: 0 }}>
                  Indicadores de exemplo (radar)
                </Typography.Title>
                <ChartShell>
                  <RadarChart data={radarDemo}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11 }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v) => [`${coerceTooltipNumberOr(v, 0)} (escala demo)`, '']} />
                    <Radar dataKey="value" stroke="#fa8c16" fill="#fa8c16" fillOpacity={0.25} name="Demo" />
                  </RadarChart>
                </ChartShell>
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card variant="borderless" className="app-card">
                <Typography.Title level={5} style={{ marginTop: 0 }}>
                  Funil de exemplo (números simulados)
                </Typography.Title>
                <ChartShell>
                  <FunnelChart>
                    <Tooltip
                      formatter={(v) => [`${Math.round(coerceTooltipNumberOr(v, 0))}`, 'Quantidade (ex.)']}
                    />
                    <Funnel dataKey="value" data={funnelDemo} fill="rgba(19, 194, 194, 0.65)">
                      <LabelList position="right" dataKey="stage" fill="#333" fontSize={11} />
                    </Funnel>
                  </FunnelChart>
                </ChartShell>
              </Card>
            </Col>
          </Row>
        </>
      ) : null}
    </Space>
  )
}

function AlertIntro() {
  return (
    <Card size="small" variant="borderless" style={{ background: 'rgba(22, 119, 255, 0.06)' }}>
      <Typography.Paragraph style={{ margin: 0, fontSize: 14 }}>
        <strong>Como ler esta tela:</strong> tudo na seção &quot;Dados das suas vendas&quot; é calculado a partir dos
        mesmos registros de venda do período escolhido acima (quantidade, faturamento, status e horários). Use os
        textos em cinza em cada bloco para saber exatamente o que o gráfico mede.
      </Typography.Paragraph>
    </Card>
  )
}
