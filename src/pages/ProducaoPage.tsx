import {
  Card,
  Col,
  Input,
  Progress,
  Row,
  Select,
  Skeleton,
  Space,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Typography,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { ExperimentOutlined, HistoryOutlined, ShoppingCartOutlined, WarningOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { MetricCard } from '../components/MetricCard'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { queryKeys } from '../query/queryKeys'
import { getLotesProducao, getComprasMateriaPrima } from '../services/erpService'
import type { LoteProducao, CompraMateriaPrima } from '../types/models'
import { PageHeaderCard } from '../components/PageHeaderCard'

function formatBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

/* ═══════════════════════════════════════════════════════
   Tab 1 — Lotes de Produção
   ═══════════════════════════════════════════════════════ */

const statusLoteColor: Record<string, string> = {
  Pendente: 'default',
  'Em Produção': 'processing',
  Concluído: 'green',
  Cancelado: 'red',
}

function rendimentoColor(pct: number) {
  if (pct < 92) return '#f5222d'
  if (pct < 96) return '#fa8c16'
  return '#52c41a'
}

function LotesProducaoTab() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [tipoFilter, setTipoFilter] = useState<string>('all')

  const debouncedSearch = useDebouncedValue(search)

  const { data: rows = [], isLoading } = useQuery({
    queryKey: queryKeys.lotesProducao(),
    queryFn: getLotesProducao,
  })

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase()
    return rows.filter((r) => {
      const text =
        !q || r.id.toLowerCase().includes(q) || r.operador.toLowerCase().includes(q)
      const st = statusFilter === 'all' || r.status === statusFilter
      const tp = tipoFilter === 'all' || r.tipo === tipoFilter
      return text && st && tp
    })
  }, [rows, debouncedSearch, statusFilter, tipoFilter])

  const metrics = useMemo(() => {
    const total = filtered.length
    const volumeTotal = filtered.reduce((s, r) => s + r.volumeTotalM3, 0)
    const custoMedioM3 =
      filtered.length > 0
        ? filtered.reduce((s, r) => s + r.custoPorM3, 0) / filtered.length
        : 0
    const concluidos = filtered.filter((r) => r.status === 'Concluído')
    const rendimentoMedio =
      concluidos.length > 0
        ? concluidos.reduce((s, r) => s + r.rendimentoPct, 0) / concluidos.length
        : 0
    return { total, volumeTotal, custoMedioM3, rendimentoMedio }
  }, [filtered])

  const columns: ColumnsType<LoteProducao> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 100,
      render: (v: string, record) =>
        record.volumeTotalM3 === 0 ? (
          <Space>
            <Tooltip title="Volume zerado — não é possível concluir este lote">
              <WarningOutlined style={{ color: '#faad14' }} />
            </Tooltip>
            {v}
          </Space>
        ) : (
          v
        ),
    },
    {
      title: 'Data',
      dataIndex: 'data',
      key: 'data',
      width: 120,
      render: (v: string) => dayjs(v).format('DD/MM/YYYY'),
      sorter: (a, b) => dayjs(a.data).valueOf() - dayjs(b.data).valueOf(),
    },
    {
      title: 'Tipo',
      dataIndex: 'tipo',
      key: 'tipo',
      width: 120,
      render: (v: string) => <Tag>{v}</Tag>,
    },
    {
      title: 'Densidade',
      dataIndex: 'densidade',
      key: 'densidade',
      width: 100,
    },
    {
      title: 'Volume m\u00B3',
      dataIndex: 'volumeTotalM3',
      key: 'volumeTotalM3',
      width: 120,
      align: 'right',
      render: (v: number) => v.toFixed(2),
      sorter: (a, b) => a.volumeTotalM3 - b.volumeTotalM3,
    },
    {
      title: 'Custo Total',
      dataIndex: 'custoTotalLote',
      key: 'custoTotalLote',
      width: 140,
      align: 'right',
      render: (v: number) => formatBRL(v),
      sorter: (a, b) => a.custoTotalLote - b.custoTotalLote,
    },
    {
      title: 'Custo/m\u00B3',
      dataIndex: 'custoPorM3',
      key: 'custoPorM3',
      width: 130,
      align: 'right',
      render: (v: number) => formatBRL(v),
    },
    {
      title: 'Rendimento',
      dataIndex: 'rendimentoPct',
      key: 'rendimentoPct',
      width: 150,
      render: (v: number) => (
        <Progress
          percent={Number(v.toFixed(1))}
          size="small"
          strokeColor={rendimentoColor(v)}
          format={(pct) => `${pct}%`}
        />
      ),
    },
    {
      title: 'Operador',
      dataIndex: 'operador',
      key: 'operador',
      ellipsis: true,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (v: string) => <Tag color={statusLoteColor[v] ?? 'default'}>{v}</Tag>,
    },
  ]

  if (isLoading) {
    return (
      <Card className="app-card" variant="borderless">
        <Skeleton active paragraph={{ rows: 10 }} />
      </Card>
    )
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <MetricCard title="Total Lotes" value={String(metrics.total)} />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <MetricCard title="Volume Total" value={`${metrics.volumeTotal.toFixed(2)} m\u00B3`} />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <MetricCard title="Custo M\u00E9dio/m\u00B3" value={formatBRL(metrics.custoMedioM3)} />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <MetricCard title="Rendimento M\u00E9dio" value={`${metrics.rendimentoMedio.toFixed(1)}%`} />
        </Col>
      </Row>

      <Card className="app-card no-hover" variant="borderless" title="Filtros">
        <div className="filter-bar">
          <div className="filter-item">
            <span>Busca</span>
            <Input.Search
              allowClear
              placeholder="ID ou operador"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="filter-item">
            <span>Status</span>
            <Select
              value={statusFilter}
              style={{ width: 180 }}
              onChange={setStatusFilter}
              options={[
                { value: 'all', label: 'Todos' },
                { value: 'Pendente', label: 'Pendente' },
                { value: 'Em Produção', label: 'Em Produção' },
                { value: 'Concluído', label: 'Concluído' },
              ]}
            />
          </div>
          <div className="filter-item">
            <span>Tipo</span>
            <Select
              value={tipoFilter}
              style={{ width: 180 }}
              onChange={setTipoFilter}
              options={[
                { value: 'all', label: 'Todos' },
                { value: 'Espuma', label: 'Espuma' },
                { value: 'Aglomerado', label: 'Aglomerado' },
              ]}
            />
          </div>
        </div>
      </Card>

      <Card className="app-card quantum-table" variant="borderless" title="Lotes de Produ\u00E7\u00E3o">
        <Table
          rowKey="id"
          columns={columns}
          dataSource={filtered}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          scroll={{ x: 1300 }}
          aria-label="Tabela de lotes de produ\u00E7\u00E3o"
        />
      </Card>
    </Space>
  )
}

/* ═══════════════════════════════════════════════════════
   Tab 2 — Compras de Matéria-Prima
   ═══════════════════════════════════════════════════════ */

const statusCompraColor: Record<string, string> = {
  Recebido: 'green',
  Pendente: 'default',
  Cancelado: 'red',
}

const classificacaoColor: Record<string, string> = {
  Produção: 'blue',
  'Despesa Operacional': 'orange',
}

function ComprasMateriaPrimaTab() {
  const [search, setSearch] = useState('')
  const [classificacaoFilter, setClassificacaoFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const debouncedSearch = useDebouncedValue(search)

  const { data: rows = [], isLoading } = useQuery({
    queryKey: queryKeys.comprasMateriaPrima(),
    queryFn: getComprasMateriaPrima,
  })

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase()
    return rows.filter((r) => {
      const text =
        !q ||
        r.fornecedor.toLowerCase().includes(q) ||
        r.material.toLowerCase().includes(q) ||
        r.notaFiscal.toLowerCase().includes(q)
      const cl = classificacaoFilter === 'all' || r.classificacao === classificacaoFilter
      const st = statusFilter === 'all' || r.status === statusFilter
      return text && cl && st
    })
  }, [rows, debouncedSearch, classificacaoFilter, statusFilter])

  const metrics = useMemo(() => {
    const totalCompras = filtered.reduce((s, r) => s + r.custoTotal, 0)
    const producao = filtered
      .filter((r) => r.classificacao === 'Produção')
      .reduce((s, r) => s + r.custoTotal, 0)
    const despesa = filtered
      .filter((r) => r.classificacao === 'Despesa Operacional')
      .reduce((s, r) => s + r.custoTotal, 0)
    const itens = filtered.length
    return { totalCompras, producao, despesa, itens }
  }, [filtered])

  const columns: ColumnsType<CompraMateriaPrima> = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 100 },
    {
      title: 'Data',
      dataIndex: 'data',
      key: 'data',
      width: 120,
      render: (v: string) => dayjs(v).format('DD/MM/YYYY'),
      sorter: (a, b) => dayjs(a.data).valueOf() - dayjs(b.data).valueOf(),
    },
    {
      title: 'Fornecedor',
      dataIndex: 'fornecedor',
      key: 'fornecedor',
      ellipsis: true,
    },
    {
      title: 'Material',
      dataIndex: 'material',
      key: 'material',
    },
    {
      title: 'Qtde',
      dataIndex: 'quantidade',
      key: 'quantidade',
      width: 120,
      align: 'right',
      render: (_: number, record) =>
        `${record.quantidade.toLocaleString('pt-BR')} ${record.unidade}`,
    },
    {
      title: 'Custo Unit.',
      dataIndex: 'custoUnitario',
      key: 'custoUnitario',
      width: 130,
      align: 'right',
      render: (v: number) => formatBRL(v),
    },
    {
      title: 'Custo Total',
      dataIndex: 'custoTotal',
      key: 'custoTotal',
      width: 140,
      align: 'right',
      render: (v: number) => (
        <Typography.Text strong>{formatBRL(v)}</Typography.Text>
      ),
      sorter: (a, b) => a.custoTotal - b.custoTotal,
    },
    {
      title: 'Classifica\u00E7\u00E3o',
      dataIndex: 'classificacao',
      key: 'classificacao',
      width: 180,
      render: (v: string) => (
        <Tag color={classificacaoColor[v] ?? 'default'}>{v}</Tag>
      ),
    },
    {
      title: 'NF',
      dataIndex: 'notaFiscal',
      key: 'notaFiscal',
      width: 120,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (v: string) => (
        <Tag color={statusCompraColor[v] ?? 'default'}>{v}</Tag>
      ),
    },
  ]

  if (isLoading) {
    return (
      <Card className="app-card" variant="borderless">
        <Skeleton active paragraph={{ rows: 10 }} />
      </Card>
    )
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <MetricCard title="Total Compras" value={formatBRL(metrics.totalCompras)} hero />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <MetricCard title="Produ\u00E7\u00E3o" value={formatBRL(metrics.producao)} />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <MetricCard title="Despesa Operacional" value={formatBRL(metrics.despesa)} />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <MetricCard title="Itens" value={String(metrics.itens)} />
        </Col>
      </Row>

      <Card className="app-card no-hover" variant="borderless" title="Filtros">
        <div className="filter-bar">
          <div className="filter-item">
            <span>Busca</span>
            <Input.Search
              allowClear
              placeholder="Fornecedor, material ou NF"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="filter-item">
            <span>Classifica\u00E7\u00E3o</span>
            <Select
              value={classificacaoFilter}
              style={{ width: 220 }}
              onChange={setClassificacaoFilter}
              options={[
                { value: 'all', label: 'Todas' },
                { value: 'Produção', label: 'Produ\u00E7\u00E3o' },
                { value: 'Despesa Operacional', label: 'Despesa Operacional' },
              ]}
            />
          </div>
          <div className="filter-item">
            <span>Status</span>
            <Select
              value={statusFilter}
              style={{ width: 180 }}
              onChange={setStatusFilter}
              options={[
                { value: 'all', label: 'Todos' },
                { value: 'Recebido', label: 'Recebido' },
                { value: 'Pendente', label: 'Pendente' },
                { value: 'Cancelado', label: 'Cancelado' },
              ]}
            />
          </div>
        </div>
      </Card>

      <Card className="app-card quantum-table" variant="borderless" title="Compras de Mat\u00E9ria-Prima">
        <Table
          rowKey="id"
          columns={columns}
          dataSource={filtered}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          scroll={{ x: 1400 }}
          aria-label="Tabela de compras de mat\u00E9ria-prima"
        />
      </Card>
    </Space>
  )
}

/* ═══════════════════════════════════════════════════════
   Tab 3 — Histórico de Produção
   ═══════════════════════════════════════════════════════ */

function HistoricoProducaoTab() {
  const [search, setSearch] = useState('')
  const [tipoFilter, setTipoFilter] = useState<string>('all')

  const debouncedSearch = useDebouncedValue(search)

  const { data: rows = [], isLoading } = useQuery({
    queryKey: queryKeys.lotesProducao(),
    queryFn: getLotesProducao,
  })

  /* Apenas lotes concluídos, ordenados do mais recente ao mais antigo */
  const historico = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase()
    return rows
      .filter((r) => r.status === 'Concluído')
      .filter((r) => {
        const text = !q || r.id.toLowerCase().includes(q) || r.operador.toLowerCase().includes(q)
        const tp = tipoFilter === 'all' || r.tipo === tipoFilter
        return text && tp
      })
      .sort((a, b) => dayjs(b.data).valueOf() - dayjs(a.data).valueOf())
  }, [rows, debouncedSearch, tipoFilter])

  const metrics = useMemo(() => {
    const total = historico.length
    const volumeTotal = historico.reduce((s, r) => s + r.volumeTotalM3, 0)
    const custoTotal = historico.reduce((s, r) => s + r.custoTotalLote, 0)
    const custoMedioM3 = total > 0 ? historico.reduce((s, r) => s + r.custoPorM3, 0) / total : 0
    const rendimentoMedio = total > 0 ? historico.reduce((s, r) => s + r.rendimentoPct, 0) / total : 0

    /* Agrupamento por mês */
    const byMonth = new Map<string, { lotes: number; volume: number; custo: number }>()
    for (const r of historico) {
      const m = dayjs(r.data).format('YYYY-MM')
      const cur = byMonth.get(m) ?? { lotes: 0, volume: 0, custo: 0 }
      cur.lotes++
      cur.volume += r.volumeTotalM3
      cur.custo += r.custoTotalLote
      byMonth.set(m, cur)
    }

    return { total, volumeTotal, custoTotal, custoMedioM3, rendimentoMedio, byMonth }
  }, [historico])

  const columns: ColumnsType<LoteProducao> = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 100 },
    {
      title: 'Data', dataIndex: 'data', key: 'data', width: 120,
      render: (v: string) => dayjs(v).format('DD/MM/YYYY'),
      sorter: (a, b) => dayjs(a.data).valueOf() - dayjs(b.data).valueOf(),
      defaultSortOrder: 'descend',
    },
    { title: 'Tipo', dataIndex: 'tipo', key: 'tipo', width: 120, render: (v: string) => <Tag>{v}</Tag> },
    { title: 'Densidade', dataIndex: 'densidade', key: 'densidade', width: 100 },
    { title: 'Volume m³', dataIndex: 'volumeTotalM3', key: 'volume', width: 120, align: 'right', render: (v: number) => v.toFixed(2) },
    { title: 'Custo Total', dataIndex: 'custoTotalLote', key: 'custoTotal', width: 140, align: 'right', render: (v: number) => formatBRL(v) },
    { title: 'Custo/m³', dataIndex: 'custoPorM3', key: 'custoM3', width: 130, align: 'right', render: (v: number) => formatBRL(v) },
    {
      title: 'Rendimento', dataIndex: 'rendimentoPct', key: 'rendimento', width: 150,
      render: (v: number) => (
        <Progress
          percent={Number(v.toFixed(1))}
          size="small"
          strokeColor={v < 92 ? '#f5222d' : v < 96 ? '#fa8c16' : '#52c41a'}
          format={(pct) => `${pct}%`}
        />
      ),
    },
    { title: 'Operador', dataIndex: 'operador', key: 'operador', ellipsis: true },
    { title: 'Observações', dataIndex: 'observacoes', key: 'obs', ellipsis: true },
  ]

  if (isLoading) {
    return <Card className="app-card" variant="borderless"><Skeleton active paragraph={{ rows: 10 }} /></Card>
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <MetricCard title="Lotes Concluídos" value={String(metrics.total)} />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <MetricCard title="Volume Total" value={`${metrics.volumeTotal.toFixed(2)} m³`} />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <MetricCard title="Custo Médio/m³" value={formatBRL(metrics.custoMedioM3)} />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <MetricCard title="Rendimento Médio" value={`${metrics.rendimentoMedio.toFixed(1)}%`} />
        </Col>
      </Row>

      <Card className="app-card no-hover" variant="borderless" title="Filtros">
        <div className="filter-bar">
          <div className="filter-item">
            <span>Busca</span>
            <Input.Search allowClear placeholder="ID ou operador" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="filter-item">
            <span>Tipo</span>
            <Select value={tipoFilter} style={{ width: 180 }} onChange={setTipoFilter} options={[
              { value: 'all', label: 'Todos' },
              { value: 'Espuma', label: 'Espuma' },
              { value: 'Aglomerado', label: 'Aglomerado' },
            ]} />
          </div>
        </div>
      </Card>

      <Card className="app-card quantum-table" variant="borderless" title="Histórico de Produção — Lotes Concluídos">
        <Table
          rowKey="id"
          columns={columns}
          dataSource={historico}
          pagination={{ pageSize: 15, showSizeChanger: true }}
          scroll={{ x: 1300 }}
          aria-label="Tabela de histórico de produção"
        />
      </Card>
    </Space>
  )
}

/* ═══════════════════════════════════════════════════════
   Página Principal — Produção
   ═══════════════════════════════════════════════════════ */

export function ProducaoPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') ?? 'lotes'

  const handleTabChange = (key: string) => {
    setSearchParams({ tab: key }, { replace: true })
  }

  const tabItems = [
    {
      key: 'lotes',
      label: (
        <span>
          <ExperimentOutlined /> Lotes de Produção
        </span>
      ),
      children: <LotesProducaoTab />,
    },
    {
      key: 'compras',
      label: (
        <span>
          <ShoppingCartOutlined /> Compras de Matéria-Prima
        </span>
      ),
      children: <ComprasMateriaPrimaTab />,
    },
    {
      key: 'historico',
      label: (
        <span>
          <HistoryOutlined /> Histórico de Produção
        </span>
      ),
      children: <HistoricoProducaoTab />,
    },
  ]

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <PageHeaderCard
        title="Produção"
        subtitle="Gerenciamento de lotes de produção, compras de matéria-prima e histórico."
      />

      <Card className="app-card no-hover" variant="borderless" style={{ padding: 0 }}>
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          type="card"
          size="large"
          items={tabItems}
        />
      </Card>
    </Space>
  )
}
