import {
  Alert,
  Card,
  Col,
  Empty,
  Input,
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
import {
  ShoppingCartOutlined,
  ToolOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
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
  TipoDocumentoFiscal,
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

const statusIcon: Record<string, React.ReactNode> = {
  Pendente: <ClockCircleOutlined />,
  'Em Produção': <ToolOutlined />,
  Concluído: <CheckCircleOutlined />,
  Faturado: <FileTextOutlined />,
  Cancelado: <WarningOutlined />,
}

const TIPO_DOC_META: Record<
  TipoDocumentoFiscal,
  { color: string; desc: string }
> = {
  'NF-e': {
    color: 'blue',
    desc: 'NF-e — mercadorias (modelo 55), documento fiscal eletrônico federal.',
  },
  'NFS-e': {
    color: 'geekblue',
    desc: 'NFS-e — nota fiscal de serviços eletrônica (prefeitura / ISS).',
  },
  'NFC-e': {
    color: 'cyan',
    desc: 'NFC-e — nota ao consumidor final (varejo / PDV).',
  },
  'CT-e': {
    color: 'purple',
    desc: 'CT-e — conhecimento de transporte eletrônico.',
  },
  Outro: {
    color: 'default',
    desc: 'Outro documento ou nota não classificada nos padrões acima.',
  },
}

const TIPO_DOC_ORDER: TipoDocumentoFiscal[] = ['NF-e', 'NFS-e', 'NFC-e', 'CT-e', 'Outro']

/* ══════════════════════════════════════════════════════════════
   Tab 1 — Pedidos de Clientes
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
    return pedidos
      .filter((p) => {
        const textMatch = !q || p.cliente.toLowerCase().includes(q) || p.id.toLowerCase().includes(q)
        const statusMatch = status === 'all' || p.status === status
        const pagMatch = pagamento === 'all' || p.formaPagamento === pagamento
        return textMatch && statusMatch && pagMatch
      })
      .sort((a, b) => dayjs(b.data).valueOf() - dayjs(a.data).valueOf())
  }, [pedidos, debouncedSearch, status, pagamento])

  const metrics = useMemo(() => {
    const total = filtered.length
    const valor = filtered.reduce((s, p) => s + p.totalValor, 0)
    const m3 = filtered.reduce((s, p) => s + p.totalM3, 0)
    const pecas = filtered.reduce((s, p) => s + p.totalPecas, 0)
    const pendentes = filtered.filter((p) => p.status === 'Pendente').length
    const faturados = filtered.filter((p) => p.status === 'Faturado').length
    return { total, valor, m3, pecas, pendentes, faturados }
  }, [filtered])

  const expandedRowRender = (record: Pedido) => {
    const itemCols: ColumnsType<ItemPedido> = [
      { title: 'Produto', dataIndex: 'produto', key: 'produto' },
      { title: 'Qtde', dataIndex: 'quantidade', key: 'quantidade', align: 'right', width: 80 },
      { title: 'Vol. Unit. (m³)', dataIndex: 'volumeM3Unitario', key: 'volUnit', align: 'right', width: 130, render: (v: number) => v.toFixed(3) },
      { title: 'Vol. Total (m³)', dataIndex: 'volumeM3Total', key: 'volTotal', align: 'right', width: 130, render: (v: number) => v.toFixed(3) },
      { title: 'Preço Unit.', dataIndex: 'precoUnitario', key: 'precoUnit', align: 'right', width: 130, render: (v: number) => formatBRL(v) },
      { title: 'Subtotal', dataIndex: 'precoTotal', key: 'precoTotal', align: 'right', width: 130, render: (v: number) => <Typography.Text strong>{formatBRL(v)}</Typography.Text> },
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
    { title: 'Nº Pedido', dataIndex: 'id', key: 'id', width: 110 },
    {
      title: 'Data', dataIndex: 'data', key: 'data', width: 110,
      render: (v: string) => dayjs(v).format('DD/MM/YYYY'),
      sorter: (a, b) => dayjs(a.data).valueOf() - dayjs(b.data).valueOf(),
      defaultSortOrder: 'descend',
    },
    { title: 'Cliente', dataIndex: 'cliente', key: 'cliente', ellipsis: true },
    {
      title: 'Itens', dataIndex: 'totalPecas', key: 'totalPecas', align: 'right', width: 80,
      render: (v: number) => v.toLocaleString('pt-BR'),
    },
    {
      title: 'Volume (m³)', dataIndex: 'totalM3', key: 'totalM3', align: 'right', width: 120,
      render: (v: number) => v.toFixed(3),
      sorter: (a, b) => a.totalM3 - b.totalM3,
    },
    {
      title: 'Valor', dataIndex: 'totalValor', key: 'totalValor', align: 'right', width: 140,
      render: (v: number) => <Typography.Text strong>{formatBRL(v)}</Typography.Text>,
      sorter: (a, b) => a.totalValor - b.totalValor,
    },
    {
      title: 'Pagamento', dataIndex: 'formaPagamento', key: 'formaPagamento', width: 110,
      render: (v: FormaPagamento) => <Tag>{v}</Tag>,
    },
    {
      title: 'Situação', dataIndex: 'status', key: 'status', width: 140,
      render: (v: StatusOperacional) => (
        <Tag color={statusColor[v] ?? 'default'} icon={statusIcon[v]}>
          {v}
        </Tag>
      ),
    },
  ]

  if (isLoading) {
    return <Card className="app-card" variant="borderless"><Skeleton active paragraph={{ rows: 10 }} /></Card>
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Row gutter={[12, 12]}>
        <Col xs={12} sm={6}><MetricCard title="Total de Pedidos" value={String(metrics.total)} accentColor="#3B82F6" /></Col>
        <Col xs={12} sm={6}><MetricCard title="Valor Total" value={formatBRL(metrics.valor)} accentColor="#10B981" /></Col>
        <Col xs={12} sm={6}><MetricCard title="Volume Total" value={`${metrics.m3.toFixed(2)} m³`} accentColor="#8B5CF6" /></Col>
        <Col xs={12} sm={6}><MetricCard title="Aguardando" value={String(metrics.pendentes)} subtitle={`${metrics.faturados} faturados`} accentColor="#F59E0B" /></Col>
      </Row>

      <Card className="app-card no-hover" variant="borderless" title="Filtros">
        <div className="filter-bar">
          <div className="filter-item" style={{ flex: '1 1 240px' }}>
            <span>Buscar</span>
            <Input.Search allowClear placeholder="Cliente ou nº do pedido..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="filter-item">
            <span>Situação</span>
            <Select value={status} style={{ width: 170 }} onChange={setStatus} options={[
              { value: 'all', label: 'Todas' },
              { value: 'Pendente', label: 'Pendente' },
              { value: 'Em Produção', label: 'Em Produção' },
              { value: 'Concluído', label: 'Concluído' },
              { value: 'Faturado', label: 'Faturado' },
            ]} />
          </div>
          <div className="filter-item">
            <span>Pagamento</span>
            <Select value={pagamento} style={{ width: 150 }} onChange={setPagamento} options={[
              { value: 'all', label: 'Todos' },
              { value: 'Dinheiro', label: 'Dinheiro' },
              { value: 'PIX', label: 'PIX' },
              { value: 'Cartão', label: 'Cartão' },
              { value: 'Boleto', label: 'Boleto' },
              { value: 'Prazo', label: 'Prazo' },
            ]} />
          </div>
        </div>
      </Card>

      <Card className="app-card quantum-table" variant="borderless" title={`Pedidos (${filtered.length})`}>
        {filtered.length === 0 ? (
          <Empty description="Nenhum pedido encontrado." />
        ) : (
          <Table
            rowKey="id"
            columns={columns}
            dataSource={filtered}
            expandable={{ expandedRowRender, rowExpandable: (r) => r.itens.length > 0 }}
            pagination={{ pageSize: 12, showSizeChanger: true }}
            scroll={{ x: 1000 }}
            aria-label="Tabela de pedidos de clientes"
          />
        )}
      </Card>
    </Space>
  )
}

/* ══════════════════════════════════════════════════════════════
   Tab 2 — Ordens de Produção
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
    return ops
      .filter((op) => {
        const textMatch = !q || op.id.toLowerCase().includes(q) || op.produtos.some((p) => p.toLowerCase().includes(q))
        const statusMatch = status === 'all' || op.status === status
        return textMatch && statusMatch
      })
      .sort((a, b) => dayjs(b.data).valueOf() - dayjs(a.data).valueOf())
  }, [ops, debouncedSearch, status])

  const metrics = useMemo(() => {
    const total = filtered.length
    const emProducao = filtered.filter((op) => op.status === 'Em Produção').length
    const pendentes = filtered.filter((op) => op.status === 'Pendente').length
    const m3 = filtered.reduce((s, op) => s + op.totalM3, 0)
    const consumo = filtered.reduce((s, op) => s + op.consumoEstimadoM3, 0)

    /* Verificar atrasadas */
    const atrasadas = filtered.filter((op) => {
      if (op.status === 'Concluído' || op.status === 'Faturado' || op.status === 'Cancelado') return false
      return dayjs(op.dataPrevista).isBefore(dayjs(), 'day')
    }).length

    return { total, emProducao, pendentes, m3, consumo, atrasadas }
  }, [filtered])

  const columns: ColumnsType<OrdemProducao> = [
    { title: 'Nº OP', dataIndex: 'id', key: 'id', width: 100 },
    {
      title: 'Abertura', dataIndex: 'data', key: 'data', width: 110,
      render: (v: string) => dayjs(v).format('DD/MM/YYYY'),
      sorter: (a, b) => dayjs(a.data).valueOf() - dayjs(b.data).valueOf(),
      defaultSortOrder: 'descend',
    },
    {
      title: 'Pedidos Vinculados', dataIndex: 'pedidoIds', key: 'pedidoIds', width: 150,
      render: (ids: string[]) => ids.length > 0 ? ids.map((id) => <Tag key={id} style={{ margin: 2 }}>{id}</Tag>) : '—',
    },
    {
      title: 'Produtos', dataIndex: 'produtos', key: 'produtos', ellipsis: true,
      render: (prods: string[]) => (
        <Tooltip title={prods.join(' · ')}>
          <span>{prods.slice(0, 2).join(', ')}{prods.length > 2 ? ` +${prods.length - 2}` : ''}</span>
        </Tooltip>
      ),
    },
    { title: 'Peças', dataIndex: 'totalPecas', key: 'totalPecas', align: 'right', width: 80 },
    { title: 'Vol. Pedido (m³)', dataIndex: 'totalM3', key: 'totalM3', align: 'right', width: 130, render: (v: number) => v.toFixed(3) },
    { title: 'Consumo Est. (m³)', dataIndex: 'consumoEstimadoM3', key: 'consumo', align: 'right', width: 140, render: (v: number) => v.toFixed(3) },
    {
      title: 'Lotes', dataIndex: 'loteIds', key: 'loteIds', width: 120,
      render: (ids: string[]) => ids.length > 0 ? ids.join(', ') : <Typography.Text type="secondary">—</Typography.Text>,
    },
    {
      title: 'Previsão', dataIndex: 'dataPrevista', key: 'dataPrevista', width: 110,
      render: (v: string, record) => {
        const isLate = record.status !== 'Concluído' && record.status !== 'Faturado' && record.status !== 'Cancelado' && dayjs(v).isBefore(dayjs(), 'day')
        return (
          <Typography.Text type={isLate ? 'danger' : undefined} strong={isLate}>
            {dayjs(v).format('DD/MM/YYYY')}
          </Typography.Text>
        )
      },
    },
    {
      title: 'Conclusão', dataIndex: 'dataConclusao', key: 'dataConclusao', width: 110,
      render: (v: string | null) => v ? dayjs(v).format('DD/MM/YYYY') : <Typography.Text type="secondary">—</Typography.Text>,
    },
    {
      title: 'Situação', dataIndex: 'status', key: 'status', width: 140,
      render: (v: StatusOperacional) => (
        <Tag color={statusColor[v] ?? 'default'} icon={statusIcon[v]}>
          {v}
        </Tag>
      ),
    },
  ]

  if (isLoading) {
    return <Card className="app-card" variant="borderless"><Skeleton active paragraph={{ rows: 10 }} /></Card>
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Row gutter={[12, 12]}>
        <Col xs={12} sm={6}><MetricCard title="Total de OPs" value={String(metrics.total)} accentColor="#3B82F6" /></Col>
        <Col xs={12} sm={6}><MetricCard title="Em Produção" value={String(metrics.emProducao)} subtitle={`${metrics.pendentes} aguardando`} accentColor="#8B5CF6" /></Col>
        <Col xs={12} sm={6}><MetricCard title="Volume Total (m³)" value={metrics.m3.toFixed(2)} subtitle={`Consumo est.: ${metrics.consumo.toFixed(2)} m³`} accentColor="#10B981" /></Col>
        <Col xs={12} sm={6}><MetricCard title="Atrasadas" value={String(metrics.atrasadas)} accentColor={metrics.atrasadas > 0 ? '#F43F5E' : '#10B981'} /></Col>
      </Row>

      <Card className="app-card no-hover" variant="borderless" title="Filtros">
        <div className="filter-bar">
          <div className="filter-item" style={{ flex: '1 1 240px' }}>
            <span>Buscar</span>
            <Input.Search allowClear placeholder="Nº da OP ou produto..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="filter-item">
            <span>Situação</span>
            <Select value={status} style={{ width: 170 }} onChange={setStatus} options={[
              { value: 'all', label: 'Todas' },
              { value: 'Pendente', label: 'Pendente' },
              { value: 'Em Produção', label: 'Em Produção' },
              { value: 'Concluído', label: 'Concluído' },
            ]} />
          </div>
        </div>
      </Card>

      <Card className="app-card quantum-table" variant="borderless" title={`Ordens de Produção (${filtered.length})`}>
        {filtered.length === 0 ? (
          <Empty description="Nenhuma ordem de produção encontrada." />
        ) : (
          <Table
            rowKey="id"
            columns={columns}
            dataSource={filtered}
            pagination={{ pageSize: 12, showSizeChanger: true }}
            scroll={{ x: 1400 }}
            aria-label="Tabela de ordens de produção"
          />
        )}
      </Card>
    </Space>
  )
}

/* ══════════════════════════════════════════════════════════════
   Tab 3 — Notas Fiscais / Faturamento
   ══════════════════════════════════════════════════════════════ */

function FaturamentoTab() {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)
  const [status, setStatus] = useState<'all' | Faturamento['status']>('all')
  const [tipoDoc, setTipoDoc] = useState<'all' | TipoDocumentoFiscal>('all')

  const { data: faturamentos, isLoading } = useQuery({
    queryKey: queryKeys.faturamentos(),
    queryFn: getFaturamentos,
  })

  const filtered = useMemo(() => {
    if (!faturamentos) return []
    const q = debouncedSearch.toLowerCase()
    return faturamentos
      .filter((f) => {
        const tipo = f.tipoDocumento ?? 'NF-e'
        const textMatch =
          !q ||
          f.cliente.toLowerCase().includes(q) ||
          f.numeroNF.toLowerCase().includes(q) ||
          f.pedidoId.toLowerCase().includes(q) ||
          tipo.toLowerCase().includes(q)
        const statusMatch = status === 'all' || f.status === status
        const tipoMatch = tipoDoc === 'all' || tipo === tipoDoc
        return textMatch && statusMatch && tipoMatch
      })
      .sort((a, b) => dayjs(b.data).valueOf() - dayjs(a.data).valueOf())
  }, [faturamentos, debouncedSearch, status, tipoDoc])

  const metrics = useMemo(() => {
    const emitidas = filtered.filter((f) => f.status === 'Emitida')
    const totalFaturado = emitidas.reduce((s, f) => s + f.valorTotal, 0)
    const totalProdutos = emitidas.reduce((s, f) => s + f.valorProdutos, 0)
    const totalImpostos = filtered.reduce((s, f) => s + f.valorImpostos, 0)
    const totalFrete = filtered.reduce((s, f) => s + f.valorFrete, 0)
    const nfsEmitidas = emitidas.length
    const pendentes = filtered.filter((f) => f.status === 'Pendente').length
    const emitidasByTipo = TIPO_DOC_ORDER.reduce(
      (acc, t) => {
        acc[t] = emitidas.filter((f) => (f.tipoDocumento ?? 'NF-e') === t).length
        return acc
      },
      {} as Record<TipoDocumentoFiscal, number>,
    )
    return {
      totalFaturado,
      totalProdutos,
      totalImpostos,
      totalFrete,
      nfsEmitidas,
      pendentes,
      emitidasByTipo,
    }
  }, [filtered])

  const resumoTiposEmitidas = useMemo(() => {
    const parts = TIPO_DOC_ORDER.filter((t) => metrics.emitidasByTipo[t] > 0).map(
      (t) => `${t}: ${metrics.emitidasByTipo[t]}`,
    )
    return parts.length ? parts.join(' · ') : undefined
  }, [metrics.emitidasByTipo])

  const columns: ColumnsType<Faturamento> = [
    {
      title: 'Documento',
      dataIndex: 'tipoDocumento',
      key: 'tipoDocumento',
      width: 108,
      render: (_: unknown, row: Faturamento) => {
        const t = row.tipoDocumento ?? 'NF-e'
        const meta = TIPO_DOC_META[t]
        return (
          <Tooltip title={meta.desc}>
            <Tag color={meta.color}>{t}</Tag>
          </Tooltip>
        )
      },
    },
    { title: 'Nº NF', dataIndex: 'numeroNF', key: 'numeroNF', width: 110, render: (v: string) => v || <Typography.Text type="secondary">—</Typography.Text> },
    {
      title: 'Emissão', dataIndex: 'data', key: 'data', width: 110,
      render: (v: string) => dayjs(v).format('DD/MM/YYYY'),
      sorter: (a, b) => dayjs(a.data).valueOf() - dayjs(b.data).valueOf(),
      defaultSortOrder: 'descend',
    },
    { title: 'Pedido', dataIndex: 'pedidoId', key: 'pedidoId', width: 100 },
    { title: 'Cliente', dataIndex: 'cliente', key: 'cliente', ellipsis: true },
    { title: 'Produtos', dataIndex: 'valorProdutos', key: 'valorProdutos', align: 'right', width: 130, render: (v: number) => formatBRL(v) },
    { title: 'Frete', dataIndex: 'valorFrete', key: 'valorFrete', align: 'right', width: 100, render: (v: number) => v > 0 ? formatBRL(v) : <Typography.Text type="secondary">—</Typography.Text> },
    { title: 'Impostos', dataIndex: 'valorImpostos', key: 'valorImpostos', align: 'right', width: 110, render: (v: number) => formatBRL(v) },
    {
      title: 'Total NF', dataIndex: 'valorTotal', key: 'valorTotal', align: 'right', width: 140,
      render: (v: number) => <Typography.Text strong>{formatBRL(v)}</Typography.Text>,
      sorter: (a, b) => a.valorTotal - b.valorTotal,
    },
    { title: 'Pagamento', dataIndex: 'formaPagamento', key: 'formaPagamento', width: 110, render: (v: FormaPagamento) => <Tag>{v}</Tag> },
    {
      title: 'Situação', dataIndex: 'status', key: 'status', width: 120,
      render: (v: Faturamento['status']) => {
        const color = v === 'Emitida' ? 'green' : v === 'Cancelada' ? 'red' : 'default'
        const icon = v === 'Emitida' ? <CheckCircleOutlined /> : v === 'Cancelada' ? <WarningOutlined /> : <ClockCircleOutlined />
        return <Tag color={color} icon={icon}>{v}</Tag>
      },
    },
  ]

  if (isLoading) {
    return <Card className="app-card" variant="borderless"><Skeleton active paragraph={{ rows: 10 }} /></Card>
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Row gutter={[12, 12]}>
        <Col xs={12} sm={6}><MetricCard title="Faturado" value={formatBRL(metrics.totalFaturado)} accentColor="#10B981" /></Col>
        <Col xs={12} sm={6}>
          <MetricCard
            title="Docs emitidos"
            value={String(metrics.nfsEmitidas)}
            subtitle={
              [metrics.pendentes > 0 ? `${metrics.pendentes} pendentes` : null, resumoTiposEmitidas]
                .filter(Boolean)
                .join(' · ') || undefined
            }
            accentColor="#3B82F6"
          />
        </Col>
        <Col xs={12} sm={6}><MetricCard title="Impostos" value={formatBRL(metrics.totalImpostos)} accentColor="#F59E0B" /></Col>
        <Col xs={12} sm={6}><MetricCard title="Frete" value={formatBRL(metrics.totalFrete)} accentColor="#8B5CF6" /></Col>
      </Row>

      <Alert
        type="info"
        showIcon
        message="Tipos de documento fiscal"
        description={
          <Space wrap size={[8, 8]}>
            {TIPO_DOC_ORDER.map((t) => (
              <Tooltip key={t} title={TIPO_DOC_META[t].desc}>
                <Tag color={TIPO_DOC_META[t].color}>{t}</Tag>
              </Tooltip>
            ))}
          </Space>
        }
        style={{ marginBottom: 0 }}
      />

      <Card className="app-card no-hover" variant="borderless" title="Filtros">
        <div className="filter-bar">
          <div className="filter-item" style={{ flex: '1 1 280px' }}>
            <span>Buscar</span>
            <Input.Search allowClear placeholder="Cliente, nº NF, pedido ou tipo (ex.: NFS-e)..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="filter-item">
            <span>Tipo fiscal</span>
            <Select
              value={tipoDoc}
              style={{ width: 160 }}
              onChange={setTipoDoc}
              options={[
                { value: 'all', label: 'Todos' },
                ...TIPO_DOC_ORDER.map((t) => ({ value: t, label: t })),
              ]}
            />
          </div>
          <div className="filter-item">
            <span>Situação</span>
            <Select value={status} style={{ width: 150 }} onChange={setStatus} options={[
              { value: 'all', label: 'Todas' },
              { value: 'Emitida', label: 'Emitida' },
              { value: 'Pendente', label: 'Pendente' },
              { value: 'Cancelada', label: 'Cancelada' },
            ]} />
          </div>
        </div>
      </Card>

      <Card className="app-card quantum-table" variant="borderless" title={`Notas fiscais (${filtered.length})`}>
        {filtered.length === 0 ? (
          <Empty description="Nenhuma nota fiscal encontrada." />
        ) : (
          <Table
            rowKey="id"
            columns={columns}
            dataSource={filtered}
            pagination={{ pageSize: 12, showSizeChanger: true }}
            scroll={{ x: 1320 }}
            aria-label="Tabela de notas fiscais"
          />
        )}
      </Card>
    </Space>
  )
}

/* ══════════════════════════════════════════════════════════════
   Página principal — Comercial
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
          <ToolOutlined /> Ordens de Produção
        </span>
      ),
      children: <OrdensProducaoTab />,
    },
    {
      key: 'notas-fiscais',
      label: (
        <Tooltip title="NF-e, NFS-e, NFC-e, CT-e e outros documentos fiscais">
          <span>
            <FileTextOutlined /> Notas fiscais
          </span>
        </Tooltip>
      ),
      children: <FaturamentoTab />,
    },
  ]

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <PageHeaderCard
        title="Comercial"
        subtitle="Gestão do ciclo comercial: pedidos de clientes, ordens de produção e faturamento."
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
