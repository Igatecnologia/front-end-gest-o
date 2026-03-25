import {
  Alert,
  Card,
  Col,
  DatePicker,
  Input,
  Row,
  Select,
  Skeleton,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { Suspense, lazy, useMemo, useState } from 'react'
import { SGBR_ANALITICO_STALE_MS, SGBR_BI_ACTIVE } from '../api/apiEnv'
import { PageHeaderCard } from '../components/PageHeaderCard'
import { DatePresetRange } from '../components/DatePresetRange'
import { MetricCard } from '../components/MetricCard'
import { getFinanceOverview } from '../services/financeService'
import { queryKeys } from '../query/queryKeys'
import type { FinanceEntry } from '../mocks/finance'
import { pctDelta, shiftRange } from '../utils/dateRange'
import { financeRangeDefault } from '../utils/vendasAnaliticoAggregates'

const FinanceFlowChart = lazy(() =>
  import('./charts/FinanceFlowChart').then((m) => ({ default: m.FinanceFlowChart })),
)

function formatBRL(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function amountTag(amount: number) {
  const positive = amount >= 0
  return <Tag color={positive ? 'green' : 'red'}>{formatBRL(amount)}</Tag>
}

type FinanceTableRow = FinanceEntry & { runningBalance: number }

export function FinancePage() {
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
    queryKey: SGBR_BI_ACTIVE
      ? queryKeys.finance({ dtDe: effectiveFinanceRange[0], dtAte: effectiveFinanceRange[1] })
      : queryKeys.finance(),
    queryFn: () =>
      SGBR_BI_ACTIVE
        ? getFinanceOverview({ dtDe: effectiveFinanceRange[0], dtAte: effectiveFinanceRange[1] })
        : getFinanceOverview(),
    staleTime: SGBR_BI_ACTIVE ? SGBR_ANALITICO_STALE_MS : undefined,
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
        if (SGBR_BI_ACTIVE) {
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
    if (SGBR_BI_ACTIVE) return null
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

  const tableRows = useMemo<FinanceTableRow[]>(() => {
    const asc = filteredEntries.slice().reverse()
    const withAscBalance = asc.reduce<FinanceTableRow[]>((acc, row, idx) => {
      const prev = idx === 0 ? 0 : acc[idx - 1].runningBalance
      acc.push({ ...row, runningBalance: prev + row.amount })
      return acc
    }, [])
    return withAscBalance.reverse()
  }, [filteredEntries])

  const columns: ColumnsType<FinanceTableRow> = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 100 },
    {
      title: 'Data',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      render: (v: string) => dayjs(v).format('DD/MM/YYYY'),
      sorter: (a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf(),
    },
    { title: 'Categoria', dataIndex: 'category', key: 'category', width: 140 },
    { title: 'Descrição', dataIndex: 'description', key: 'description' },
    {
      title: 'Valor',
      dataIndex: 'amount',
      key: 'amount',
      align: 'right',
      render: (v: number) => amountTag(v),
      sorter: (a, b) => a.amount - b.amount,
    },
    {
      title: 'Saldo acumulado',
      dataIndex: 'runningBalance',
      key: 'runningBalance',
      align: 'right',
      render: (v: number) => (
        <Typography.Text strong type={v >= 0 ? 'success' : 'danger'}>
          {formatBRL(v)}
        </Typography.Text>
      ),
    },
  ]

  return (
    <Space orientation="vertical" size={16} style={{ width: '100%' }}>
      {(financeQuery.isLoading || financeQuery.isFetching) && (
        <Card className="app-card" variant="borderless">
          <Skeleton active paragraph={{ rows: 10 }} />
        </Card>
      )}
      <PageHeaderCard
        title="Financeiro"
        subtitle={
          SGBR_BI_ACTIVE
            ? `Somente campos retornados por vendas/analitico (${effectiveFinanceRange[0]} a ${effectiveFinanceRange[1]}). Receita = soma de total; custo = soma de precocustoitem × qtdevendida; lucro = receita − custo.`
            : 'Controle completo por período com detalhamento de receitas, custos, impostos e saldo.'
        }
      />

      {SGBR_BI_ACTIVE ? (
        <Alert
          type="info"
          showIcon
          title="Sem dados além da API analítica"
          description={
            <>
              Não há contas a pagar/receber nem categorias contábeis nesta resposta. Os cartões usam todas as linhas do
              JSON; a tabela mostra no máximo 40 linhas para leitura. Não há comparativo com período anterior (a API não
              devolve dois recortes de uma vez).
            </>
          }
        />
      ) : null}

      <Card
        className="app-card"
        variant="borderless"
        title={SGBR_BI_ACTIVE ? 'Período da consulta na API e busca na tabela' : 'Filtros financeiros'}
      >
        <Space wrap style={{ width: '100%' }}>
          <Input.Search
            allowClear
            style={{ width: 300 }}
            placeholder={
              SGBR_BI_ACTIVE ? 'Buscar na amostra (descrição / id)' : 'Buscar por ID ou descrição'
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {!SGBR_BI_ACTIVE ? (
            <>
              <Select
                value={category}
                style={{ width: 220 }}
                onChange={setCategory}
                options={[
                  { value: 'all', label: 'Todas as categorias' },
                  { value: 'Receita', label: 'Receita' },
                  { value: 'Custo Fixo', label: 'Custo Fixo' },
                  { value: 'Custo Variável', label: 'Custo Variável' },
                  { value: 'Imposto', label: 'Imposto' },
                ]}
              />
              <Select
                value={flowType}
                style={{ width: 210 }}
                onChange={setFlowType}
                options={[
                  { value: 'all', label: 'Entradas e saídas' },
                  { value: 'inflow', label: 'Somente entradas' },
                  { value: 'outflow', label: 'Somente saídas' },
                ]}
              />
            </>
          ) : null}
          <DatePicker.RangePicker
            value={[dayjs(effectiveFinanceRange[0]), dayjs(effectiveFinanceRange[1])]}
            onChange={(vals) => {
              if (!vals || !vals[0] || !vals[1]) {
                setRange(null)
                return
              }
              setRange([vals[0].format('YYYY-MM-DD'), vals[1].format('YYYY-MM-DD')])
            }}
          />
          <DatePresetRange
            storageKey="date-preset:finance"
            mode="finance"
            onApply={(start, end) => {
              setRange([start, end])
            }}
          />
        </Space>
      </Card>

      {SGBR_BI_ACTIVE && data ? (
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <MetricCard title="Receita (Σ total)" value={formatBRL(data.receita)} />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <MetricCard
              title="Custo ref. (Σ precocustoitem × qtdevendida)"
              value={formatBRL(data.custos)}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <MetricCard title="Lucro (receita − custo ref.)" value={formatBRL(data.lucro)} />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <MetricCard title="Margem ((lucro/receita)×100)" value={`${data.margemPct.toFixed(1)}%`} />
          </Col>
        </Row>
      ) : (
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <MetricCard
              title="Receitas no período"
              value={formatBRL(summary.receitas)}
              previousValue={
                previousSummary ? formatBRL(previousSummary.receitas) : undefined
              }
              deltaPct={
                previousSummary ? pctDelta(summary.receitas, previousSummary.receitas) : undefined
              }
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <MetricCard
              title="Despesas no período"
              value={formatBRL(summary.despesas)}
              previousValue={
                previousSummary ? formatBRL(previousSummary.despesas) : undefined
              }
              deltaPct={
                previousSummary ? pctDelta(summary.despesas, previousSummary.despesas) : undefined
              }
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <MetricCard
              title="Saldo no período"
              value={formatBRL(summary.saldo)}
              previousValue={previousSummary ? formatBRL(previousSummary.saldo) : undefined}
              deltaPct={previousSummary ? pctDelta(summary.saldo, previousSummary.saldo) : undefined}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <MetricCard
              title="Margem no período"
              value={`${summary.margem.toFixed(1)}%`}
              previousValue={
                previousSummary ? `${previousSummary.margem.toFixed(1)}%` : undefined
              }
              deltaPct={previousSummary ? summary.margem - previousSummary.margem : undefined}
            />
          </Col>
        </Row>
      )}

      {SGBR_BI_ACTIVE && data ? (
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <MetricCard title="Linhas retornadas pela API" value={String(data.linhasCount ?? 0)} />
          </Col>
          <Col xs={24} md={12}>
            <MetricCard
              title="Ticket médio (receita ÷ linhas)"
              value={formatBRL(
                data.linhasCount && data.linhasCount > 0 ? data.receita / data.linhasCount : 0,
              )}
            />
          </Col>
        </Row>
      ) : (
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <MetricCard title="Impostos" value={formatBRL(summary.impostos)} />
          </Col>
          <Col xs={24} md={8}>
            <MetricCard title="Custos fixos" value={formatBRL(summary.fixos)} />
          </Col>
          <Col xs={24} md={8}>
            <MetricCard title="Ticket médio de receita" value={formatBRL(summary.ticketMedioReceita)} />
          </Col>
        </Row>
      )}

      <Card
        className="app-card"
        variant="borderless"
        title={
          SGBR_BI_ACTIVE
            ? 'Fluxo mensal (receita e custo ref. agregados por mês das linhas da API)'
            : 'Fluxo financeiro mensal'
        }
      >
        <Suspense fallback={<Skeleton active paragraph={{ rows: 6 }} />}>
          <FinanceFlowChart data={data?.monthlyFlow ?? []} />
        </Suspense>
      </Card>

      <Card
        className="app-card quantum-table"
        variant="borderless"
        title={
          SGBR_BI_ACTIVE
            ? 'Amostra: até 40 linhas mais recentes (campo total da API)'
            : 'Lançamentos financeiros detalhados'
        }
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={tableRows}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          aria-label="Tabela de lançamentos financeiros"
        />
      </Card>

      <Typography.Text type="secondary">
        {SGBR_BI_ACTIVE
          ? 'Valores monetários vêm dos campos da resposta vendas/analitico; nada aqui substitui o módulo financeiro do ERP.'
          : 'Visão por datas e centro de custos para análise operacional, tática e executiva do financeiro.'}
      </Typography.Text>
    </Space>
  )
}
