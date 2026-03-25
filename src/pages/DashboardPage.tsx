import { ReloadOutlined } from '@ant-design/icons'
import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Empty,
  Row,
  Segmented,
  Select,
  Skeleton,
  Space,
  Statistic,
  Tag,
  Typography,
} from 'antd'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Bar, BarChart, CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis } from 'recharts'

function formatBRLAxisShort(n: number) {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (Math.abs(n) >= 1000) return `${(n / 1000).toFixed(0)}k`
  return String(Math.round(n))
}
import { ChartShell } from '../components/ChartShell'
import { PageHeaderCard } from '../components/PageHeaderCard'
import { DatePresetRange } from '../components/DatePresetRange'
import { DevErrorDetail } from '../components/DevErrorDetail'
import { SGBR_ANALITICO_STALE_MS, SGBR_BI_ACTIVE } from '../api/apiEnv'
import { getDashboardData } from '../services/dashboardService'
import { queryKeys } from '../query/queryKeys'
import { getErrorMessage } from '../api/httpError'
import { useRealtimeHeartbeat } from '../hooks/useRealtimeHeartbeat'
import { coerceTooltipNumber, coerceTooltipNumberOr } from '../utils/rechartsTooltip'

function formatBRL(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function deltaColor(deltaPct: number) {
  if (deltaPct > 0) return 'green'
  if (deltaPct < 0) return 'red'
  return 'default'
}

const SGBR_PERMS_INFO_KEY = 'iga-dismiss-sgbr-permissions-info'

export function DashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [sgbrInfoVisible, setSgbrInfoVisible] = useState(
    () => typeof window !== 'undefined' && localStorage.getItem(SGBR_PERMS_INFO_KEY) !== '1',
  )
  const period = (searchParams.get('p') ?? '30d') as '7d' | '30d' | '90d'
  const startDate = searchParams.get('start') ?? ''
  const endDate = searchParams.get('end') ?? ''
  const pollMs = Number(searchParams.get('pollMs') ?? 0)
  const realtimeEnabled = pollMs > 0
  const { lastPulseAt, transport } = useRealtimeHeartbeat(realtimeEnabled, pollMs || 5_000)

  const dashboardQuery = useQuery({
    queryKey: queryKeys.dashboard({ period, pollMs: String(pollMs) }),
    queryFn: () => getDashboardData({ delayMs: 700, period }),
    refetchInterval: realtimeEnabled ? pollMs : false,
    staleTime: SGBR_BI_ACTIVE ? SGBR_ANALITICO_STALE_MS : 15_000,
  })

  const revenueTotal = useMemo(
    () => (dashboardQuery.data?.revenue ?? []).reduce((sum, r) => sum + r.value, 0),
    [dashboardQuery.data],
  )
  const filteredSales = useMemo(() => {
    const points = dashboardQuery.data?.sales ?? []
    if (!startDate && !endDate) return points
    const year = dayjs().year()
    const toTs = (label: string) => {
      const [day, month] = label.split('/').map(Number)
      return dayjs(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`).valueOf()
    }
    return points.filter((p) => {
      const ts = toTs(p.date)
      const matchStart = !startDate || ts >= dayjs(startDate).startOf('day').valueOf()
      const matchEnd = !endDate || ts <= dayjs(endDate).endOf('day').valueOf()
      return matchStart && matchEnd
    })
  }, [dashboardQuery.data?.sales, startDate, endDate])
  const insights = useMemo(() => {
    const data = dashboardQuery.data
    if (!data) return { anomalies: [] as string[], suggestions: [] as string[] }
    const anomalies: string[] = []
    const suggestions: string[] = []
    const vendas = data.kpis.find((x) => x.key === 'vendas')
    const usuarios = data.kpis.find((x) => x.key === 'usuarios')
    const faturamento = data.kpis.find((x) => x.key === 'faturamento')
    if (vendas && vendas.deltaPct < -5) anomalies.push('Queda relevante em vendas no período atual.')
    if (usuarios && usuarios.deltaPct < 0) anomalies.push('Base de usuários com retração.')
    if (faturamento && faturamento.deltaPct > 12) {
      suggestions.push('Aplicar filtro de receita e abrir Relatórios para identificar segmentos de alta.')
    }
    if (data.sales.length > 2) {
      const last = data.sales[data.sales.length - 1]?.value ?? 0
      const prev = data.sales[data.sales.length - 2]?.value ?? 0
      if (last > prev * 1.2) suggestions.push('Pico de vendas detectado. Compare com período 90d.')
    }
    return { anomalies, suggestions }
  }, [dashboardQuery.data])

  const header = (
    <PageHeaderCard
      title="Dashboard executivo"
      subtitle={
        SGBR_BI_ACTIVE
          ? 'Indicadores calculados a partir de vendas analítico (API SGBR BI), conforme o período acima.'
          : 'Visão rápida dos principais indicadores.'
      }
      extra={
        <Button icon={<ReloadOutlined />} onClick={() => dashboardQuery.refetch()}>
          Atualizar
        </Button>
      }
    />
  )

  if (dashboardQuery.isLoading || dashboardQuery.isFetching) {
    return (
      <Space orientation="vertical" size={16} style={{ width: '100%' }}>
        {header}
        <Row gutter={[16, 16]}>
          {[1, 2, 3].map((k) => (
            <Col key={k} xs={24} sm={12} lg={8}>
              <Card>
                <Skeleton active paragraph={{ rows: 1 }} />
              </Card>
            </Col>
          ))}
        </Row>
        <Card>
          <Skeleton active paragraph={{ rows: 8 }} />
        </Card>
      </Space>
    )
  }

  if (dashboardQuery.isError) {
    return (
      <Card
        title="Dashboard"
        extra={<Button onClick={() => dashboardQuery.refetch()}>Tentar novamente</Button>}
      >
        <Alert
          type="error"
          showIcon
          title="Não foi possível carregar"
          description={
            <>
              {getErrorMessage(dashboardQuery.error, 'Falha ao carregar dados do dashboard.')}
              <DevErrorDetail error={dashboardQuery.error} />
            </>
          }
        />
      </Card>
    )
  }

  const data = dashboardQuery.data
  if (!data) return null

  if (!data.kpis.length && !data.sales.length) {
    return (
      <Card className="app-card" variant="borderless">
        <div style={{ marginBottom: 16 }}>{header}</div>
        <Empty description="Sem dados para exibir no momento." />
      </Card>
    )
  }

  return (
    <Space orientation="vertical" size={16} style={{ width: '100%' }}>
      {header}

      {SGBR_BI_ACTIVE && sgbrInfoVisible ? (
        <Alert
          type="info"
          showIcon
          closable
          title="Permissões neste módulo (SGBR BI)"
          description="Com o login da API SGBR, este aplicativo aplica um perfil administrativo fixo no menu e nas ações. Papéis diferentes no ERP ainda não são refletidos aqui; fale com a TI se precisar restringir por usuário."
          onClose={() => {
            localStorage.setItem(SGBR_PERMS_INFO_KEY, '1')
            setSgbrInfoVisible(false)
          }}
        />
      ) : null}

      <Card className="app-card" variant="borderless" title="Período">
        <Space wrap>
          <Segmented
            aria-label="Selecionar período do dashboard"
            value={period}
            onChange={(v) => {
              const next = v as typeof period
              setSearchParams((prev) => {
                const p = new URLSearchParams(prev)
                p.set('p', next)
                return p
              })
            }}
            options={[
              { label: '7 dias', value: '7d' },
              { label: '30 dias', value: '30d' },
              { label: '90 dias', value: '90d' },
            ]}
          />
          <Select
            style={{ width: 240 }}
            value={String(pollMs)}
            options={[
              { value: '0', label: 'Tempo real: desativado' },
              { value: '5000', label: 'Tempo real: 5s (polling)' },
              { value: '10000', label: 'Tempo real: 10s (polling)' },
              { value: '30000', label: 'Tempo real: 30s (polling)' },
            ]}
            onChange={(next) => {
              setSearchParams((prev) => {
                const p = new URLSearchParams(prev)
                p.set('pollMs', next)
                return p
              })
            }}
          />
          <Tag color={realtimeEnabled ? 'green' : 'default'}>
            {realtimeEnabled ? `Canal ativo (${transport.toUpperCase()})` : 'Canal em pausa'}
          </Tag>
          <DatePicker.RangePicker
            onChange={(vals) => {
              setSearchParams((prev) => {
                const p = new URLSearchParams(prev)
                const [from, to] = vals ?? []
                if (from) p.set('start', from.format('YYYY-MM-DD'))
                else p.delete('start')
                if (to) p.set('end', to.format('YYYY-MM-DD'))
                else p.delete('end')
                return p
              })
            }}
          />
          <DatePresetRange
            storageKey="date-preset:dashboard"
            onApply={(from, to) => {
              setSearchParams((prev) => {
                const p = new URLSearchParams(prev)
                p.set('start', from)
                p.set('end', to)
                return p
              })
            }}
          />
        </Space>
      </Card>

      <Row gutter={[16, 16]}>
        {data.kpis.map((kpi) => (
          <Col key={kpi.key} xs={24} sm={12} lg={8}>
            <Card className="app-card" variant="borderless">
              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Statistic
                  title={kpi.label}
                  value={kpi.key === 'faturamento' ? formatBRL(kpi.value) : kpi.value}
                />
                <Tag color={kpi.deltaPct === 0 ? 'default' : deltaColor(kpi.deltaPct)}>
                  {kpi.deltaPct === 0
                    ? SGBR_BI_ACTIVE
                      ? 'Sem comparativo na API'
                      : 'Período único'
                    : `${kpi.deltaPct > 0 ? '+' : ''}${kpi.deltaPct.toFixed(1)}%`}
                </Tag>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card variant="borderless" className="app-card">
            <Typography.Title level={5} style={{ marginTop: 0 }}>
              Quantidade vendida por dia
            </Typography.Title>
            <Typography.Paragraph type="secondary" style={{ marginBottom: 12, fontSize: 13 }}>
              Cada ponto é a soma das <strong>unidades</strong> vendidas naquele dia (mesmo critério da API analítica).
              Eixo horizontal: dia/mês do recorte.
            </Typography.Paragraph>
            <ChartShell>
              <LineChart data={filteredSales} margin={{ left: 8, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} label={{ value: 'Dia', position: 'insideBottom', offset: -4 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} label={{ value: 'Unidades', angle: -90, position: 'insideLeft' }} />
                <Tooltip
                  formatter={(v) => [`${coerceTooltipNumberOr(v, 0)} unidades`, 'Total no dia']}
                  labelFormatter={(l) => `Data: ${l}`}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  name="Quantidade"
                  stroke="#1677ff"
                  strokeWidth={2}
                  dot={{ fill: '#1677ff', r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ChartShell>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card variant="borderless" className="app-card">
            <Typography.Title level={5} style={{ marginTop: 0 }}>
              Faturamento por mês
            </Typography.Title>
            <Typography.Paragraph type="secondary" style={{ marginBottom: 12, fontSize: 13 }}>
              Total em <strong>reais (R$)</strong> faturado em cada mês do período selecionado acima.
            </Typography.Paragraph>
            <ChartShell>
              <BarChart data={data.revenue} margin={{ left: 8, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} label={{ value: 'Mês', position: 'insideBottom', offset: -4 }} />
                <YAxis tickFormatter={formatBRLAxisShort} width={52} tick={{ fontSize: 11 }} label={{ value: 'R$', angle: -90, position: 'insideLeft' }} />
                <Tooltip
                  formatter={(v) => {
                    const n = coerceTooltipNumber(v)
                    return [(n !== undefined ? formatBRL(n) : ''), 'Faturamento']
                  }}
                  labelFormatter={(l) => `Mês: ${l}`}
                />
                <Bar dataKey="value" name="Faturamento" fill="rgba(22, 119, 255, 0.65)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ChartShell>
          </Card>
        </Col>
      </Row>

      <Card className="app-card" variant="borderless">
        <Space orientation="vertical" size={6}>
          <Typography.Title level={5} style={{ margin: 0 }}>
            Navegação por contexto
          </Typography.Title>
          <Typography.Text type="secondary">
            Para evitar poluição visual, os dados foram separados em telas específicas.
          </Typography.Text>
          <Space wrap>
            <Button type="primary" aria-label="Abrir página de análises BI">
              <Link to="/dashboard/analises">Abrir Análises BI</Link>
            </Button>
            <Button aria-label="Abrir página de dados detalhados">
              <Link to="/dashboard/dados">Abrir Dados detalhados</Link>
            </Button>
          </Space>
          <Typography.Text type="secondary">
            Faturamento acumulado no período: <strong>{formatBRL(revenueTotal)}</strong>
          </Typography.Text>
          <Typography.Text type="secondary">
            Pontos de vendas analisados no recorte atual: <strong>{filteredSales.length}</strong>
          </Typography.Text>
          <Typography.Text type="secondary">
            Última atualização de dados: {dayjs(dashboardQuery.dataUpdatedAt).format('DD/MM/YYYY HH:mm:ss')}
          </Typography.Text>
          {lastPulseAt ? (
            <Typography.Text type="secondary">
              Sinal de tempo real recebido: {dayjs(lastPulseAt).format('DD/MM/YYYY HH:mm:ss')}
            </Typography.Text>
          ) : null}
        </Space>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card className="app-card" variant="borderless" title="Insights automáticos">
            {!insights.suggestions.length ? (
              <Typography.Text type="secondary">Sem sugestões automáticas no momento.</Typography.Text>
            ) : (
              <ul style={{ margin: 0, paddingInlineStart: 20 }}>
                {insights.suggestions.map((item, i) => (
                  <li key={`s-${i}`}>
                    <Typography.Text>{item}</Typography.Text>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card className="app-card" variant="borderless" title="Anomalias detectadas">
            {!insights.anomalies.length ? (
              <Typography.Text type="secondary">Nenhuma anomalia relevante detectada.</Typography.Text>
            ) : (
              <ul style={{ margin: 0, paddingInlineStart: 20 }}>
                {insights.anomalies.map((item, i) => (
                  <li key={`a-${i}`}>
                    <Typography.Text>{item}</Typography.Text>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </Col>
      </Row>
    </Space>
  )
}
