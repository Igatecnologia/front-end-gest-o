import {
  Card,
  Col,
  Input,
  Row,
  Select,
  Skeleton,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  ShoppingCartOutlined,
  ToolOutlined,
  FileTextOutlined,
} from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PageHeaderCard } from '../components/PageHeaderCard'
import { MetricCard } from '../components/MetricCard'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { getPedidos, getOrdensProducao, getFaturamentos } from '../services/erpService'
import { queryKeys } from '../query/queryKeys'
import type {
  Pedido,
  ItemPedido,
  OrdemProducao,
  Faturamento,
  StatusOperacional,
  FormaPagamento,
} from '../types/models'

/* ── Helpers ── */

function formatBRL(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const statusColor: Record<string, string> = {
  Pendente: 'default',
  'Em Produção': 'processing',
  Concluído: 'green',
  Faturado: 'blue',
  Cancelado: 'red',
  Emitida: 'green',
}

/* ══════════════════════════════════════════════════════════════
   Tab 1 — Pedidos
   ══════════════════════════════════════════════════════════════ */

function PedidosTab() {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)
  const [status, setStatus] = useState<'all' | StatusOperacional>('all')
  const [pagamento, setPagamento] = useState<'all' | FormaPagamento>('all')

  const { data: pedidos, isLoading } = useQuery({
    queryKey: queryKeys.pedidos(),
    queryFn: getPedidos,
  })

  const filtered = useMemo(() => {
    if (!pedidos) return []
    const q = debouncedSearch.toLowerCase()
    return pedidos.filter((p) => {
      const textMatch = !q || p.cliente.toLowerCase().includes(q) || p.id.toLowerCase().includes(q)
      const statusMatch = status === 'all' || p.status === status
      const pagMatch = pagamento === 'all' || p.formaPagamento === pagamento
      return textMatch && statusMatch && pagMatch
    })
  }, [pedidos, debouncedSearch, status, pagamento])

  const metrics = useMemo(() => {
    const total = filtered.length
    const valor = filtered.reduce((s, p) => s + p.totalValor, 0)
    const m3 = filtered.reduce((s, p) => s + p.totalM3, 0)
    const pecas = filtered.reduce((s, p) => s + p.totalPecas, 0)
    return { total, valor, m3, pecas }
  }, [filtered])

  const expandedRowRender = (record: Pedido) => {
    const itemCols: ColumnsType<ItemPedido> = [
      { title: 'Produto', dataIndex: 'produto', key: 'produto' },
      { title: 'Qtde', dataIndex: 'quantidade', key: 'quantidade', align: 'right' },
      {
        title: 'Vol. Unit. m\u00B3',
        dataIndex: 'volumeM3Unitario',
        key: 'volumeM3Unitario',
        align: 'right',
        render: (v: number) => v.toFixed(3),
      },
      {
        title: 'Vol. Total m\u00B3',
        dataIndex: 'volumeM3Total',
        key: 'volumeM3Total',
        align: 'right',
        render: (v: number) => v.toFixed(3),
      },
      {
        title: 'Pre\u00E7o Unit.',
        dataIndex: 'precoUnitario',
        key: 'precoUnitario',
        align: 'right',
        render: (v: number) => formatBRL(v),
      },
      {
        title: 'Pre\u00E7o Total',
        dataIndex: 'precoTotal',
        key: 'precoTotal',
        align: 'right',
        render: (v: number) => formatBRL(v),
      },
    ]
    return (
      <Table
        rowKey="fichaTecnicaId"
        columns={itemCols}
        dataSource={record.itens}
        pagination={false}
        size="small"
      />
    )
  }

  const columns: ColumnsType<Pedido> = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 100 },
    {
      title: 'Data',
      dataIndex: 'data',
      key: 'data',
      width: 120,
      render: (v: string) => dayjs(v).format('DD/MM/YYYY'),
      sorter: (a, b) => dayjs(a.data).valueOf() - dayjs(b.data).valueOf(),
    },
    { title: 'Cliente', dataIndex: 'cliente', key: 'cliente', ellipsis: true },
    { title: 'Pe\u00E7as', dataIndex: 'totalPecas', key: 'totalPecas', align: 'right', width: 80 },
    {
      title: 'Volume m\u00B3',
      dataIndex: 'totalM3',
      key: 'totalM3',
      align: 'right',
      width: 110,
      render: (v: number) => v.toFixed(3),
      sorter: (a, b) => a.totalM3 - b.totalM3,
    },
    {
      title: 'Valor Total',
      dataIndex: 'totalValor',
      key: 'totalValor',
      align: 'right',
      width: 140,
      render: (v: number) => formatBRL(v),
      sorter: (a, b) => a.totalValor - b.totalValor,
    },
    {
      title: 'Pagamento',
      dataIndex: 'formaPagamento',
      key: 'formaPagamento',
      width: 110,
      render: (v: FormaPagamento) => <Tag>{v}</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (v: StatusOperacional) => <Tag color={statusColor[v] ?? 'default'}>{v}</Tag>,
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
      <Card className="app-card no-hover" variant="borderless" title="Filtros de Pedidos">
        <div className="filter-bar">
          <div className="filter-item">
            <span>Busca</span>
            <Input.Search
              allowClear
              placeholder="Cliente ou ID"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="filter-item">
            <span>Status</span>
            <Select
              value={status}
              style={{ width: 180 }}
              onChange={setStatus}
              options={[
                { value: 'all', label: 'Todos' },
                { value: 'Pendente', label: 'Pendente' },
                { value: 'Em Produ\u00E7\u00E3o', label: 'Em Produ\u00E7\u00E3o' },
                { value: 'Conclu\u00EDdo', label: 'Conclu\u00EDdo' },
                { value: 'Faturado', label: 'Faturado' },
              ]}
            />
          </div>
          <div className="filter-item">
            <span>Forma de Pagamento</span>
            <Select
              value={pagamento}
              style={{ width: 180 }}
              onChange={setPagamento}
              options={[
                { value: 'all', label: 'Todas' },
                { value: 'Dinheiro', label: 'Dinheiro' },
                { value: 'PIX', label: 'PIX' },
                { value: 'Cart\u00E3o', label: 'Cart\u00E3o' },
                { value: 'Boleto', label: 'Boleto' },
                { value: 'Prazo', label: 'Prazo' },
              ]}
            />
          </div>
        </div>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <MetricCard title="Total Pedidos" value={metrics.total} />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <MetricCard title="Valor Total" value={formatBRL(metrics.valor)} />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <MetricCard title="Total m\u00B3" value={`${metrics.m3.toFixed(3)} m\u00B3`} />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <MetricCard title="Total Pe\u00E7as" value={metrics.pecas} />
        </Col>
      </Row>

      <Card className="app-card quantum-table" variant="borderless" title="Pedidos">
        <Table
          rowKey="id"
          columns={columns}
          dataSource={filtered}
          expandable={{ expandedRowRender }}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          aria-label="Tabela de pedidos"
        />
      </Card>
    </Space>
  )
}

/* ══════════════════════════════════════════════════════════════
   Tab 2 — Ordens de Produ\u00E7\u00E3o
   ══════════════════════════════════════════════════════════════ */

function OrdensProducaoTab() {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)
  const [status, setStatus] = useState<'all' | StatusOperacional>('all')

  const { data: ops, isLoading } = useQuery({
    queryKey: queryKeys.ordensProducao(),
    queryFn: getOrdensProducao,
  })

  const filtered = useMemo(() => {
    if (!ops) return []
    const q = debouncedSearch.toLowerCase()
    return ops.filter((op) => {
      const textMatch =
        !q ||
        op.id.toLowerCase().includes(q) ||
        op.produtos.some((p) => p.toLowerCase().includes(q))
      const statusMatch = status === 'all' || op.status === status
      return textMatch && statusMatch
    })
  }, [ops, debouncedSearch, status])

  const metrics = useMemo(() => {
    const total = filtered.length
    const emProducao = filtered.filter((op) => op.status === 'Em Produ\u00E7\u00E3o').length
    const m3 = filtered.reduce((s, op) => s + op.totalM3, 0)
    const consumo = filtered.reduce((s, op) => s + op.consumoEstimadoM3, 0)
    return { total, emProducao, m3, consumo }
  }, [filtered])

  const columns: ColumnsType<OrdemProducao> = [
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
      title: 'Pedidos',
      dataIndex: 'pedidoIds',
      key: 'pedidoIds',
      width: 140,
      render: (ids: string[]) => ids.join(', '),
    },
    {
      title: 'Produtos',
      dataIndex: 'produtos',
      key: 'produtos',
      ellipsis: true,
      render: (prods: string[]) => prods.join(', '),
    },
    { title: 'Pe\u00E7as', dataIndex: 'totalPecas', key: 'totalPecas', align: 'right', width: 80 },
    {
      title: 'm\u00B3 Pedido',
      dataIndex: 'totalM3',
      key: 'totalM3',
      align: 'right',
      width: 110,
      render: (v: number) => v.toFixed(3),
    },
    {
      title: 'm\u00B3 Consumo',
      dataIndex: 'consumoEstimadoM3',
      key: 'consumoEstimadoM3',
      align: 'right',
      width: 120,
      render: (v: number) => v.toFixed(3),
    },
    {
      title: 'Lotes',
      dataIndex: 'loteIds',
      key: 'loteIds',
      width: 120,
      render: (ids: string[]) => (ids.length > 0 ? ids.join(', ') : '\u2014'),
    },
    {
      title: 'Prevista',
      dataIndex: 'dataPrevista',
      key: 'dataPrevista',
      width: 120,
      render: (v: string) => dayjs(v).format('DD/MM/YYYY'),
    },
    {
      title: 'Conclus\u00E3o',
      dataIndex: 'dataConclusao',
      key: 'dataConclusao',
      width: 120,
      render: (v: string | null) => (v ? dayjs(v).format('DD/MM/YYYY') : '\u2014'),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (v: StatusOperacional) => <Tag color={statusColor[v] ?? 'default'}>{v}</Tag>,
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
      <Card className="app-card no-hover" variant="borderless" title="Filtros de Ordens de Produ\u00E7\u00E3o">
        <div className="filter-bar">
          <div className="filter-item">
            <span>Busca</span>
            <Input.Search
              allowClear
              placeholder="ID ou produto"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="filter-item">
            <span>Status</span>
            <Select
              value={status}
              style={{ width: 180 }}
              onChange={setStatus}
              options={[
                { value: 'all', label: 'Todos' },
                { value: 'Pendente', label: 'Pendente' },
                { value: 'Em Produ\u00E7\u00E3o', label: 'Em Produ\u00E7\u00E3o' },
                { value: 'Conclu\u00EDdo', label: 'Conclu\u00EDdo' },
              ]}
            />
          </div>
        </div>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <MetricCard title="Total OPs" value={metrics.total} />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <MetricCard title="Em Produ\u00E7\u00E3o" value={metrics.emProducao} />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <MetricCard title="Total m\u00B3" value={`${metrics.m3.toFixed(3)} m\u00B3`} />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <MetricCard title="Consumo Est. m\u00B3" value={`${metrics.consumo.toFixed(3)} m\u00B3`} />
        </Col>
      </Row>

      <Card className="app-card quantum-table" variant="borderless" title="Ordens de Produ\u00E7\u00E3o">
        <Table
          rowKey="id"
          columns={columns}
          dataSource={filtered}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          scroll={{ x: 1200 }}
          aria-label="Tabela de ordens de produ\u00E7\u00E3o"
        />
      </Card>
    </Space>
  )
}

/* ══════════════════════════════════════════════════════════════
   Tab 3 — Faturamento
   ══════════════════════════════════════════════════════════════ */

function FaturamentoTab() {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)
  const [status, setStatus] = useState<'all' | Faturamento['status']>('all')

  const { data: faturamentos, isLoading } = useQuery({
    queryKey: queryKeys.faturamentos(),
    queryFn: getFaturamentos,
  })

  const filtered = useMemo(() => {
    if (!faturamentos) return []
    const q = debouncedSearch.toLowerCase()
    return faturamentos.filter((f) => {
      const textMatch =
        !q ||
        f.cliente.toLowerCase().includes(q) ||
        f.numeroNF.toLowerCase().includes(q) ||
        f.pedidoId.toLowerCase().includes(q)
      const statusMatch = status === 'all' || f.status === status
      return textMatch && statusMatch
    })
  }, [faturamentos, debouncedSearch, status])

  const metrics = useMemo(() => {
    const emitidas = filtered.filter((f) => f.status === 'Emitida')
    const totalFaturado = emitidas.reduce((s, f) => s + f.valorTotal, 0)
    const impostos = filtered.reduce((s, f) => s + f.valorImpostos, 0)
    const frete = filtered.reduce((s, f) => s + f.valorFrete, 0)
    const nfsEmitidas = emitidas.length
    return { totalFaturado, impostos, frete, nfsEmitidas }
  }, [filtered])

  const columns: ColumnsType<Faturamento> = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 90 },
    {
      title: 'Data',
      dataIndex: 'data',
      key: 'data',
      width: 120,
      render: (v: string) => dayjs(v).format('DD/MM/YYYY'),
      sorter: (a, b) => dayjs(a.data).valueOf() - dayjs(b.data).valueOf(),
    },
    { title: 'Pedido', dataIndex: 'pedidoId', key: 'pedidoId', width: 100 },
    { title: 'Cliente', dataIndex: 'cliente', key: 'cliente', ellipsis: true },
    {
      title: 'NF',
      dataIndex: 'numeroNF',
      key: 'numeroNF',
      width: 120,
      render: (v: string) => v || '\u2014',
    },
    {
      title: 'Produtos',
      dataIndex: 'valorProdutos',
      key: 'valorProdutos',
      align: 'right',
      width: 130,
      render: (v: number) => formatBRL(v),
    },
    {
      title: 'Frete',
      dataIndex: 'valorFrete',
      key: 'valorFrete',
      align: 'right',
      width: 110,
      render: (v: number) => formatBRL(v),
    },
    {
      title: 'Impostos',
      dataIndex: 'valorImpostos',
      key: 'valorImpostos',
      align: 'right',
      width: 120,
      render: (v: number) => formatBRL(v),
    },
    {
      title: 'Total',
      dataIndex: 'valorTotal',
      key: 'valorTotal',
      align: 'right',
      width: 140,
      render: (v: number) => <Typography.Text strong>{formatBRL(v)}</Typography.Text>,
      sorter: (a, b) => a.valorTotal - b.valorTotal,
    },
    {
      title: 'Pagamento',
      dataIndex: 'formaPagamento',
      key: 'formaPagamento',
      width: 110,
      render: (v: FormaPagamento) => <Tag>{v}</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (v: Faturamento['status']) => <Tag color={statusColor[v] ?? 'default'}>{v}</Tag>,
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
      <Card className="app-card no-hover" variant="borderless" title="Filtros de Faturamento">
        <div className="filter-bar">
          <div className="filter-item">
            <span>Busca</span>
            <Input.Search
              allowClear
              placeholder="Cliente, NF ou pedido"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="filter-item">
            <span>Status</span>
            <Select
              value={status}
              style={{ width: 180 }}
              onChange={setStatus}
              options={[
                { value: 'all', label: 'Todos' },
                { value: 'Emitida', label: 'Emitida' },
                { value: 'Cancelada', label: 'Cancelada' },
                { value: 'Pendente', label: 'Pendente' },
              ]}
            />
          </div>
        </div>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <MetricCard title="Total Faturado" value={formatBRL(metrics.totalFaturado)} />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <MetricCard title="Impostos" value={formatBRL(metrics.impostos)} />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <MetricCard title="Frete" value={formatBRL(metrics.frete)} />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <MetricCard title="NFs Emitidas" value={metrics.nfsEmitidas} />
        </Col>
      </Row>

      <Card className="app-card quantum-table" variant="borderless" title="Faturamento">
        <Table
          rowKey="id"
          columns={columns}
          dataSource={filtered}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          scroll={{ x: 1200 }}
          aria-label="Tabela de faturamento"
        />
      </Card>
    </Space>
  )
}

/* ══════════════════════════════════════════════════════════════
   P\u00E1gina principal — Comercial
   ══════════════════════════════════════════════════════════════ */

export function ComercialPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') ?? 'pedidos'

  const handleTabChange = (key: string) => {
    setSearchParams({ tab: key }, { replace: true })
  }

  const tabItems = [
    {
      key: 'pedidos',
      label: (
        <span>
          <ShoppingCartOutlined /> Pedidos
        </span>
      ),
      children: <PedidosTab />,
    },
    {
      key: 'ordens-producao',
      label: (
        <span>
          <ToolOutlined /> Ordens de Produ\u00E7\u00E3o
        </span>
      ),
      children: <OrdensProducaoTab />,
    },
    {
      key: 'faturamento',
      label: (
        <span>
          <FileTextOutlined /> Faturamento
        </span>
      ),
      children: <FaturamentoTab />,
    },
  ]

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <PageHeaderCard
        title="Comercial"
        subtitle="Gest\u00E3o de pedidos, ordens de produ\u00E7\u00E3o e faturamento."
      />

      <Card className="app-card no-hover" variant="borderless" style={{ padding: 0 }}>
        <Tabs
          className="finance-tabs"
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
