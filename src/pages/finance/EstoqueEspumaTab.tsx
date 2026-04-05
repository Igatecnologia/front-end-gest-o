import { Button, Card, Col, Dropdown, Input, Row, Select, Space, Table, Tag, Typography } from 'antd'
import { DownloadOutlined, FileExcelOutlined, FilePdfOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { Suspense, lazy, useMemo, useState } from 'react'
import { Skeleton } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { MetricCard } from '../../components/MetricCard'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import type { EstoqueEspuma } from '../../types/models'
import { getEstoqueEspuma } from '../../services/financeReportsService'
import { queryKeys } from '../../query/queryKeys'
import { exportExcel, exportPdf, estoqueEspumaCols } from '../../utils/financeExport'

const EstoqueStatusChart = lazy(() =>
  import('../charts/EstoqueStatusChart').then((m) => ({ default: m.EstoqueStatusChart })),
)

function formatBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const statusColor: Record<EstoqueEspuma['status'], string> = { Normal: 'green', Baixo: 'orange', 'Crítico': 'red' }

export function EstoqueEspumaTab() {
  const [search, setSearch] = useState('')
  const [tipoFilter, setTipoFilter] = useState<'all' | EstoqueEspuma['tipo']>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | EstoqueEspuma['status']>('all')

  const debouncedSearch = useDebouncedValue(search)
  const { data: rows = [], isLoading } = useQuery({ queryKey: queryKeys.estoqueEspuma(), queryFn: getEstoqueEspuma })

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase()
    return rows.filter((r) => {
      const text = !q || r.produto.toLowerCase().includes(q) || r.id.toLowerCase().includes(q)
      const tipo = tipoFilter === 'all' || r.tipo === tipoFilter
      const st = statusFilter === 'all' || r.status === statusFilter
      return text && tipo && st
    })
  }, [debouncedSearch, rows, tipoFilter, statusFilter])

  const totals = useMemo(() => {
    const custoTotal = filtered.reduce((s, r) => s + r.custoTotal, 0)
    const totalEspuma = filtered.filter((r) => r.tipo === 'Espuma').reduce((s, r) => s + r.custoTotal, 0)
    const totalAglom = filtered.filter((r) => r.tipo === 'Aglomerado').reduce((s, r) => s + r.custoTotal, 0)
    const criticos = filtered.filter((r) => r.status === 'Crítico').length
    const baixos = filtered.filter((r) => r.status === 'Baixo').length
    const normais = filtered.filter((r) => r.status === 'Normal').length
    return { custoTotal, totalEspuma, totalAglom, criticos, baixos, normais }
  }, [filtered])

  const chartData = useMemo(() => [
    { status: 'Normal', count: totals.normais },
    { status: 'Baixo', count: totals.baixos },
    { status: 'Crítico', count: totals.criticos },
  ], [totals])

  const columns: ColumnsType<EstoqueEspuma> = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 90 },
    { title: 'Produto', dataIndex: 'produto', key: 'produto', ellipsis: true },
    { title: 'Tipo', dataIndex: 'tipo', key: 'tipo', width: 120, render: (v: string) => <Tag color={v === 'Espuma' ? 'purple' : 'cyan'}>{v}</Tag> },
    { title: 'Densidade', dataIndex: 'densidade', key: 'densidade', width: 100, align: 'center' },
    { title: 'Unidade', dataIndex: 'unidade', key: 'unidade', width: 80, align: 'center' },
    { title: 'Qtde Atual', dataIndex: 'qtdeAtual', key: 'qtdeAtual', width: 110, align: 'right', render: (v: number) => v.toLocaleString('pt-BR'), sorter: (a, b) => a.qtdeAtual - b.qtdeAtual },
    { title: 'Qtde Mínima', dataIndex: 'qtdeMinima', key: 'qtdeMinima', width: 110, align: 'right', render: (v: number) => v.toLocaleString('pt-BR') },
    { title: 'Custo Unit.', dataIndex: 'custoUnitario', key: 'custoUnitario', width: 120, align: 'right', render: (v: number) => formatBRL(v) },
    { title: 'Custo Total', dataIndex: 'custoTotal', key: 'custoTotal', width: 130, align: 'right', render: (v: number) => <Typography.Text strong>{formatBRL(v)}</Typography.Text>, sorter: (a, b) => a.custoTotal - b.custoTotal },
    { title: 'Última Entrada', dataIndex: 'ultimaEntrada', key: 'ultimaEntrada', width: 130, render: (v: string) => dayjs(v).format('DD/MM/YYYY') },
    { title: 'Status', dataIndex: 'status', key: 'status', width: 100, render: (v: EstoqueEspuma['status']) => <Tag color={statusColor[v]}>{v}</Tag> },
  ]

  if (isLoading) return <Card className="app-card" variant="borderless"><Skeleton active paragraph={{ rows: 10 }} /></Card>

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}><MetricCard title="Custo Total Estoque" value={formatBRL(totals.custoTotal)} hero /></Col>
        <Col xs={24} sm={12} lg={6}><MetricCard title="Estoque Espuma" value={formatBRL(totals.totalEspuma)} /></Col>
        <Col xs={24} sm={12} lg={6}><MetricCard title="Estoque Aglomerado" value={formatBRL(totals.totalAglom)} /></Col>
        <Col xs={24} sm={12} lg={6}><MetricCard title="Alertas" value={`${totals.criticos} Crit. / ${totals.baixos} Baixos`} /></Col>
      </Row>

      <Card className="app-card no-hover" variant="borderless" title="Itens por Status de Estoque">
        <Suspense fallback={<Skeleton active paragraph={{ rows: 4 }} />}>
          <EstoqueStatusChart data={chartData} label="Estoque espuma e aglomerados por status" />
        </Suspense>
      </Card>

      <Card className="app-card no-hover" variant="borderless" title="Filtros"
        extra={
          <Dropdown menu={{ items: [
            { key: 'excel', icon: <FileExcelOutlined />, label: 'Excel', onClick: () => exportExcel(filtered, estoqueEspumaCols, 'Espuma e Aglom.', 'estoque_espuma') },
            { key: 'pdf', icon: <FilePdfOutlined />, label: 'PDF', onClick: () => exportPdf(filtered, estoqueEspumaCols, 'Relatório — Estoque de Espuma e Aglomerados', 'estoque_espuma') },
          ] }}>
            <Button icon={<DownloadOutlined />}>Exportar</Button>
          </Dropdown>
        }
      >
        <div className="filter-bar">
          <div className="filter-item"><span>Busca</span><Input.Search allowClear placeholder="Produto ou ID" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
          <div className="filter-item"><span>Tipo</span><Select value={tipoFilter} style={{ width: 180 }} onChange={setTipoFilter} options={[{ value: 'all', label: 'Todos' }, { value: 'Espuma', label: 'Espuma' }, { value: 'Aglomerado', label: 'Aglomerado' }]} /></div>
          <div className="filter-item"><span>Status</span><Select value={statusFilter} style={{ width: 180 }} onChange={setStatusFilter} options={[{ value: 'all', label: 'Todos' }, { value: 'Normal', label: 'Normal' }, { value: 'Baixo', label: 'Baixo' }, { value: 'Crítico', label: 'Crítico' }]} /></div>
        </div>
      </Card>

      <Card className="app-card quantum-table" variant="borderless" title="Estoque de Espuma e Aglomerados">
        <Table rowKey="id" columns={columns} dataSource={filtered} pagination={{ pageSize: 10, showSizeChanger: true }} scroll={{ x: 1200 }} aria-label="Tabela de estoque" />
      </Card>
    </Space>
  )
}
