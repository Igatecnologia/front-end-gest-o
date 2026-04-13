import { Card, Col, Input, Row, Select, Space, Table, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { Suspense, lazy, useMemo, useState } from 'react'
import { Skeleton } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { MetricCard } from '../../components/MetricCard'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import type { EstoqueProdutoFinal } from '../../types/models'
import { getEstoqueProdutoFinal } from '../../services/financeReportsService'
import { queryKeys } from '../../query/queryKeys'

const EstoqueStatusChart = lazy(() =>
  import('../charts/EstoqueStatusChart').then((m) => ({ default: m.EstoqueStatusChart })),
)

function formatBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const statusColor: Record<EstoqueProdutoFinal['status'], string> = { Normal: 'green', Baixo: 'orange', Crítico: 'red' }

export function EstoqueProdutoFinalTab() {
  const [search, setSearch] = useState('')
  const [tipoFilter, setTipoFilter] = useState<'all' | EstoqueProdutoFinal['tipo']>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | EstoqueProdutoFinal['status']>('all')

  const debouncedSearch = useDebouncedValue(search)
  const { data: rows = [], isLoading } = useQuery({ queryKey: queryKeys.estoqueProdutoFinal(), queryFn: getEstoqueProdutoFinal })

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase()
    return rows.filter((r) => {
      const text = !q || r.produto.toLowerCase().includes(q) || r.id.toLowerCase().includes(q) || r.dimensoes.toLowerCase().includes(q)
      const tipo = tipoFilter === 'all' || r.tipo === tipoFilter
      const st = statusFilter === 'all' || r.status === statusFilter
      return text && tipo && st
    })
  }, [debouncedSearch, rows, tipoFilter, statusFilter])

  const totals = useMemo(() => {
    const custoTotal = filtered.reduce((s, r) => s + r.custoTotal, 0)
    const valorVenda = filtered.reduce((s, r) => s + r.precoVenda * r.qtdeAtual, 0)
    const criticos = filtered.filter((r) => r.status === 'Crítico').length
    const baixos = filtered.filter((r) => r.status === 'Baixo').length
    const normais = filtered.filter((r) => r.status === 'Normal').length
    return { custoTotal, valorVenda, criticos, baixos, normais }
  }, [filtered])

  const chartData = useMemo(() => [
    { status: 'Normal', count: totals.normais },
    { status: 'Baixo', count: totals.baixos },
    { status: 'Crítico', count: totals.criticos },
  ], [totals])

  const columns: ColumnsType<EstoqueProdutoFinal> = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 90 },
    { title: 'Produto', dataIndex: 'produto', key: 'produto', ellipsis: true },
    { title: 'Tipo', dataIndex: 'tipo', key: 'tipo', width: 120, render: (v: string) => <Tag color={v === 'Espuma' ? 'purple' : 'cyan'}>{v}</Tag> },
    { title: 'Densidade', dataIndex: 'densidade', key: 'densidade', width: 100, align: 'center' },
    { title: 'Dimensões', dataIndex: 'dimensoes', key: 'dimensoes', width: 140 },
    { title: 'Unidade', dataIndex: 'unidade', key: 'unidade', width: 80, align: 'center' },
    { title: 'Qtde Atual', dataIndex: 'qtdeAtual', key: 'qtdeAtual', width: 110, align: 'right', render: (v: number) => v.toLocaleString('pt-BR'), sorter: (a, b) => a.qtdeAtual - b.qtdeAtual },
    { title: 'Qtde Mínima', dataIndex: 'qtdeMinima', key: 'qtdeMinima', width: 110, align: 'right', render: (v: number) => v.toLocaleString('pt-BR') },
    { title: 'Custo Unit.', dataIndex: 'custoUnitario', key: 'custoUnitario', width: 120, align: 'right', render: (v: number) => formatBRL(v) },
    { title: 'Preço Venda', dataIndex: 'precoVenda', key: 'precoVenda', width: 120, align: 'right', render: (v: number) => formatBRL(v) },
    { title: 'Custo Total', dataIndex: 'custoTotal', key: 'custoTotal', width: 130, align: 'right', render: (v: number) => <Typography.Text strong>{formatBRL(v)}</Typography.Text>, sorter: (a, b) => a.custoTotal - b.custoTotal },
    { title: 'Última Entrada', dataIndex: 'ultimaEntrada', key: 'ultimaEntrada', width: 130, render: (v: string) => dayjs(v).format('DD/MM/YYYY') },
    { title: 'Status', dataIndex: 'status', key: 'status', width: 100, render: (v: EstoqueProdutoFinal['status']) => <Tag color={statusColor[v]}>{v}</Tag> },
  ]

  if (isLoading) return <Card className="app-card" variant="borderless"><Skeleton active paragraph={{ rows: 10 }} /></Card>

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}><MetricCard title="Custo Total Estoque" value={formatBRL(totals.custoTotal)} hero /></Col>
        <Col xs={24} sm={12} lg={6}><MetricCard title="Valor de Venda" value={formatBRL(totals.valorVenda)} /></Col>
        <Col xs={24} sm={12} lg={6}><MetricCard title="Itens Críticos" value={String(totals.criticos)} /></Col>
        <Col xs={24} sm={12} lg={6}><MetricCard title="Itens Baixos" value={String(totals.baixos)} /></Col>
      </Row>

      <Card className="app-card no-hover" variant="borderless" title="Itens por Status de Estoque">
        <Suspense fallback={<Skeleton active paragraph={{ rows: 4 }} />}>
          <EstoqueStatusChart data={chartData} label="Estoque produto final por status" />
        </Suspense>
      </Card>

      <Card className="app-card no-hover" variant="borderless" title="Filtros">
        <div className="filter-bar">
          <div className="filter-item"><span>Busca</span><Input.Search allowClear placeholder="Produto, dimensões ou ID" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
          <div className="filter-item"><span>Tipo</span><Select value={tipoFilter} style={{ width: 180 }} onChange={setTipoFilter} options={[{ value: 'all', label: 'Todos' }, { value: 'Espuma', label: 'Espuma' }, { value: 'Aglomerado', label: 'Aglomerado' }]} /></div>
          <div className="filter-item"><span>Status</span><Select value={statusFilter} style={{ width: 180 }} onChange={setStatusFilter} options={[{ value: 'all', label: 'Todos' }, { value: 'Normal', label: 'Normal' }, { value: 'Baixo', label: 'Baixo' }, { value: 'Crítico', label: 'Crítico' }]} /></div>
        </div>
      </Card>

      <Card className="app-card quantum-table" variant="borderless" title="Estoque de Produto Final">
        <Table rowKey="id" columns={columns} dataSource={filtered} pagination={{ pageSize: 10, showSizeChanger: true }} scroll={{ x: 1400 }} aria-label="Tabela de estoque de produto final" />
      </Card>
    </Space>
  )
}
