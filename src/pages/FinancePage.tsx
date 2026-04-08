import {
  Card,
  Col,
  DatePicker,
  Input,
  Row,
  Select,
  Skeleton,
  Space,
  Tabs,
  Typography,
} from 'antd'
import {
  SwapOutlined,
  CreditCardOutlined,
  DollarOutlined,
  FundOutlined,
} from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { Suspense, lazy, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ANALITICO_STALE_MS } from '../api/apiEnv'
import { hasAnySources } from '../services/dataSourceService'
import { PageHeaderCard } from '../components/PageHeaderCard'

import { MetricCard } from '../components/MetricCard'
import { getFinanceOverview } from '../services/financeService'
import { queryKeys } from '../query/queryKeys'
import type { FinanceEntry } from '../types/models'
import { pctDelta, shiftRange } from '../utils/dateRange'
import { financeRangeDefault } from '../utils/vendasAnaliticoAggregates'

const FinanceFlowChart = lazy(() =>
  import('./charts/FinanceFlowChart').then((m) => ({ default: m.FinanceFlowChart })),
)

/* ── Lazy-load das abas de relatórios ── */
const ConciliacaoTab = lazy(() =>
  import('./finance/ConciliacaoTab').then((m) => ({ default: m.ConciliacaoTab })),
)
const ContasPagarTab = lazy(() =>
  import('./finance/ContasPagarTab').then((m) => ({ default: m.ContasPagarTab })),
)
const ContasReceberTab = lazy(() =>
  import('./finance/ContasReceberTab').then((m) => ({ default: m.ContasReceberTab })),
)

function formatBRL(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const tabFallback = <Skeleton active paragraph={{ rows: 8 }} style={{ padding: 24 }} />

function VisaoGeralTab() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<'all' | FinanceEntry['category']>('all')
  const [flowType, setFlowType] = useState<'all' | 'inflow' | 'outflow'>('all')
  const [range, setRange] = useState<[string, string] | null>(null)

  const defaultFinanceRange = useMemo(() => financeRangeDefault(), [])
  const effectiveFinanceRange: [string, string] = range ?? [
    defaultFinanceRange.dtDe,
    defaultFinanceRange.dtAte,
  ]

  const financeQuery = useQuery({
    queryKey: hasAnySources()
      ? queryKeys.finance({ dtDe: effectiveFinanceRange[0], dtAte: effectiveFinanceRange[1] })
      : queryKeys.finance(),
    queryFn: () =>
      hasAnySources()
        ? getFinanceOverview({ dtDe: effectiveFinanceRange[0], dtAte: effectiveFinanceRange[1] })
        : getFinanceOverview(),
    staleTime: hasAnySources() ? ANALITICO_STALE_MS : undefined,
  })

  const data = financeQuery.data
  const entries = useMemo(() => data?.entries ?? [], [data?.entries])

  const filteredEntries = useMemo(() => {
    const query = search.trim().toLowerCase()
    const [start, end] = range ?? ['', '']
    return entries
      .filter((e) => {
        const textMatch =
          !query || e.id.toLowerCase().includes(query) || e.description.toLowerCase().includes(query)
        if (hasAnySources()) {
          return textMatch
        }
        const catMatch = category === 'all' || e.category === category
        const flowMatch =
          flowType === 'all' || (flowType === 'inflow' ? e.amount >= 0 : e.amount < 0)
        const dateMatch =
          (!start || dayjs(e.date).isSame(start, 'day') || dayjs(e.date).isAfter(start, 'day')) &&
          (!end || dayjs(e.date).isSame(end, 'day') || dayjs(e.date).isBefore(end, 'day'))
        return textMatch && catMatch && flowMatch && dateMatch
      })
      .slice()
      .sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf())
  }, [entries, search, category, flowType, range])

  const summary = useMemo(() => {
    const receitas = filteredEntries
      .filter((x) => x.amount >= 0)
      .reduce((acc, x) => acc + x.amount, 0)
    const despesas = Math.abs(
      filteredEntries.filter((x) => x.amount < 0).reduce((acc, x) => acc + x.amount, 0),
    )
    const impostos = Math.abs(
      filteredEntries
        .filter((x) => x.category === 'Imposto')
        .reduce((acc, x) => acc + x.amount, 0),
    )
    const fixos = Math.abs(
      filteredEntries
        .filter((x) => x.category === 'Custo Fixo')
        .reduce((acc, x) => acc + x.amount, 0),
    )
    const variaveis = Math.abs(
      filteredEntries
        .filter((x) => x.category === 'Custo Variável')
        .reduce((acc, x) => acc + x.amount, 0),
    )
    const saldo = receitas - despesas
    const margem = receitas > 0 ? (saldo / receitas) * 100 : 0
    const ticketMedioReceita = filteredEntries.filter((x) => x.amount >= 0).length
      ? receitas / filteredEntries.filter((x) => x.amount >= 0).length
      : 0
    return { receitas, despesas, saldo, margem, ticketMedioReceita, impostos, fixos, variaveis }
  }, [filteredEntries])
  const previousSummary = useMemo(() => {
    if (hasAnySources()) return null
    const shifted = shiftRange(range?.[0], range?.[1])
    if (!shifted) return null
    const prev = entries.filter((e) => {
      const d = dayjs(e.date)
      return (
        d.isSame(shifted.prevStart, 'day') ||
        d.isSame(shifted.prevEnd, 'day') ||
        (d.isAfter(shifted.prevStart, 'day') && d.isBefore(shifted.prevEnd, 'day'))
      )
    })
    const receitas = prev.filter((x) => x.amount >= 0).reduce((acc, x) => acc + x.amount, 0)
    const despesas = Math.abs(prev.filter((x) => x.amount < 0).reduce((acc, x) => acc + x.amount, 0))
    const saldo = receitas - despesas
    const margem = receitas > 0 ? (saldo / receitas) * 100 : 0
    return { receitas, despesas, saldo, margem }
  }, [entries, range])

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {(financeQuery.isLoading || financeQuery.isFetching) && (
        <Card className="app-card" variant="borderless">
          <Skeleton active paragraph={{ rows: 10 }} />
        </Card>
      )}

      <Card className="app-card no-hover" variant="borderless" title="Filtros">
        <div className="filter-bar">
          <div className="filter-item">
            <span>Buscar</span>
            <Input.Search
              allowClear
              placeholder="Descrição ou ID"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {!hasAnySources() ? (
            <>
              <div className="filter-item">
                <span>Categoria</span>
                <Select
                  value={category}
                  style={{ width: 200 }}
                  onChange={setCategory}
                  options={[
                    { value: 'all', label: 'Todas' },
                    { value: 'Receita', label: 'Receita' },
                    { value: 'Custo Fixo', label: 'Custo Fixo' },
                    { value: 'Custo Variável', label: 'Custo Variável' },
                    { value: 'Imposto', label: 'Imposto' },
                  ]}
                />
              </div>
              <div className="filter-item">
                <span>Fluxo</span>
                <Select
                  value={flowType}
                  style={{ width: 190 }}
                  onChange={setFlowType}
                  options={[
                    { value: 'all', label: 'Entradas e saídas' },
                    { value: 'inflow', label: 'Somente entradas' },
                    { value: 'outflow', label: 'Somente saídas' },
                  ]}
                />
              </div>
            </>
          ) : null}
          <div className="filter-item">
            <span>Período</span>
            <DatePicker.RangePicker
              format="DD/MM/YYYY"
              placeholder={['Data inicial', 'Data final']}
              value={[dayjs(effectiveFinanceRange[0]), dayjs(effectiveFinanceRange[1])]}
              onChange={(vals) => {
                if (!vals || !vals[0] || !vals[1]) {
                  setRange(null)
                  return
                }
                setRange([vals[0].format('YYYY-MM-DD'), vals[1].format('YYYY-MM-DD')])
              }}
            />
          </div>
        </div>
      </Card>

      <Row gutter={[12, 12]}>
        <Col xs={12} sm={6}>
          <MetricCard
            title="Receita"
            value={formatBRL(data?.receita ?? summary.receitas)}
            accentColor="#10B981"
            previousValue={previousSummary ? formatBRL(previousSummary.receitas) : undefined}
            deltaPct={previousSummary ? pctDelta(summary.receitas, previousSummary.receitas) : undefined}
          />
        </Col>
        <Col xs={12} sm={6}>
          <MetricCard
            title="Custos"
            value={formatBRL(data?.custos ?? summary.despesas)}
            accentColor="#F43F5E"
            previousValue={previousSummary ? formatBRL(previousSummary.despesas) : undefined}
            deltaPct={previousSummary ? pctDelta(summary.despesas, previousSummary.despesas) : undefined}
          />
        </Col>
        <Col xs={12} sm={6}>
          <MetricCard
            title="Lucro"
            value={formatBRL(data?.lucro ?? summary.saldo)}
            accentColor={(data?.lucro ?? summary.saldo) >= 0 ? '#10B981' : '#F43F5E'}
            previousValue={previousSummary ? formatBRL(previousSummary.saldo) : undefined}
            deltaPct={previousSummary ? pctDelta(summary.saldo, previousSummary.saldo) : undefined}
          />
        </Col>
        <Col xs={12} sm={6}>
          <MetricCard
            title="Margem"
            value={`${(data?.margemPct ?? summary.margem).toFixed(1)}%`}
            accentColor="#3B82F6"
            previousValue={previousSummary ? `${previousSummary.margem.toFixed(1)}%` : undefined}
            deltaPct={previousSummary ? summary.margem - previousSummary.margem : undefined}
          />
        </Col>
      </Row>

      {data?.linhasCount != null && (
        <Row gutter={[12, 12]}>
          <Col xs={12} sm={8}>
            <MetricCard title="Registros" value={String(data.linhasCount)} />
          </Col>
          <Col xs={12} sm={8}>
            <MetricCard
              title="Ticket medio"
              value={formatBRL(data.linhasCount > 0 ? data.receita / data.linhasCount : 0)}
            />
          </Col>
          <Col xs={24} sm={8}>
            <MetricCard title="Custo medio" value={formatBRL(data.linhasCount > 0 ? data.custos / data.linhasCount : 0)} />
          </Col>
        </Row>
      )}

      <Card className="app-card no-hover" variant="borderless" title="Fluxo mensal">
        <Suspense fallback={<Skeleton active paragraph={{ rows: 6 }} />}>
          <FinanceFlowChart data={data?.monthlyFlow ?? []} />
        </Suspense>
      </Card>

    </Space>
  )
}

export function FinancePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') ?? 'visao-geral'

  const handleTabChange = (key: string) => {
    setSearchParams({ tab: key }, { replace: true })
  }

  const tabItems = [
    {
      key: 'visao-geral',
      label: 'Visão Geral',
      icon: <FundOutlined />,
      children: (
        <Suspense fallback={tabFallback}>
          <VisaoGeralTab />
        </Suspense>
      ),
    },
    {
      key: 'conciliacao',
      label: 'Conciliação',
      icon: <SwapOutlined />,
      children: (
        <Suspense fallback={tabFallback}>
          <ConciliacaoTab />
        </Suspense>
      ),
    },
    {
      key: 'contas-pagar',
      label: 'Contas a Pagar',
      icon: <CreditCardOutlined />,
      children: (
        <Suspense fallback={tabFallback}>
          <ContasPagarTab />
        </Suspense>
      ),
    },
    {
      key: 'contas-receber',
      label: 'Contas a Receber',
      icon: <DollarOutlined />,
      children: (
        <Suspense fallback={tabFallback}>
          <ContasReceberTab />
        </Suspense>
      ),
    },
  ]

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <PageHeaderCard
        title="Financeiro"
        subtitle="Controle financeiro completo: visão geral, conciliação e contas."
      />

      <Card className="app-card no-hover" variant="borderless" style={{ padding: 0 }}>
        <Tabs
          className="finance-tabs"
          activeKey={activeTab}
          onChange={handleTabChange}
          type="card"
          size="large"
          items={tabItems.map((item) => ({
            ...item,
            label: (
              <span>
                {item.icon} {item.label}
              </span>
            ),
          }))}
        />
      </Card>
    </Space>
  )
}
