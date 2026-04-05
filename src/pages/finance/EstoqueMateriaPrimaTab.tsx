import { Button, Card, Col, Dropdown, Input, Row, Select, Space, Table, Tag, Typography } from 'antd'
import { DownloadOutlined, FileExcelOutlined, FilePdfOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { Suspense, lazy, useMemo, useState } from 'react'
import { Skeleton } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { MetricCard } from '../../components/MetricCard'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import type { EstoqueMateriaPrima } from '../../types/models'
import { getEstoqueMateriaPrima } from '../../services/financeReportsService'
import { queryKeys } from '../../query/queryKeys'
import { exportExcel, exportPdf, estoqueMateriaPrimaCols } from '../../utils/financeExport'

const EstoqueStatusChart = lazy(() =>
  import('../charts/EstoqueStatusChart').then((m) => ({ default: m.EstoqueStatusChart })),
)

function formatBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const statusColor: Record<EstoqueMateriaPrima['status'], string> = { Normal: 'green', Baixo: 'orange', 'Crítico': 'red' }

export function EstoqueMateriaPrimaTab() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | EstoqueMateriaPrima['status']>('all')

  const debouncedSearch = useDebouncedValue(search)
  const { data: rows = [], isLoading } = useQuery({ queryKey: queryKeys.estoqueMateriaPrima(), queryFn: getEstoqueMateriaPrima })

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase()
    return rows.filter((r) => {
      const text = !q || r.material.toLowerCase().includes(q) || r.fornecedor.toLowerCase().includes(q) || r.id.toLowerCase().includes(q)
      const st = statusFilter === 'all' || r.status === statusFilter
      return text && st
    })
  }, [debouncedSearch, rows, statusFilter])

  const totals = useMemo(() => {
    const custoTotal = filtered.reduce((s, r) => s + r.custoTotal, 0)
    const itensTotal = filtered.length
    const criticos = filtered.filter((r) => r.status === 'Crítico').length
    const baixos = filtered.filter((r) => r.status === 'Baixo').length
    const normais = filtered.filter((r) => r.status === 'Normal').length
    return { custoTotal, itensTotal, criticos, baixos, normais }
  }, [filtered])

  const chartData = useMemo(() => [
    { status: 'Normal', count: totals.normais },
    { status: 'Baixo', count: totals.baixos },
    { status: 'Crítico', count: totals.criticos },
  ], [totals])

  const columns: ColumnsType<EstoqueMateriaPrima> = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 90 },
    { title: 'Material', dataIndex: 'material', key: 'material', ellipsis: true },
    { title: 'Unidade', dataIndex: 'unidade', key: 'unidade', width: 80, align: 'center' },
    { title: 'Qtde Atual', dataIndex: 'qtdeAtual', key: 'qtdeAtual', width: 110, align: 'right', render: (v: number) => v.toLocaleString('pt-BR'), sorter: (a, b) => a.qtdeAtual - b.qtdeAtual },
    { title: 'Qtde Mínima', dataIndex: 'qtdeMinima', key: 'qtdeMinima', width: 110, align: 'right', render: (v: number) => v.toLocaleString('pt-BR') },
    { title: 'Custo Unit.', dataIndex: 'custoUnitario', key: 'custoUnitario', width: 120, align: 'right', render: (v: number) => formatBRL(v) },
    { title: 'Custo Total', dataIndex: 'custoTotal', key: 'custoTotal', width: 130, align: 'right', render: (v: number) => <Typography.Text strong>{formatBRL(v)}</Typography.Text>, sorter: (a, b) => a.custoTotal - b.custoTotal },
    { title: 'Última Entrada', dataIndex: 'ultimaEntrada', key: 'ultimaEntrada', width: 130, render: (v: string) => dayjs(v).format('DD/MM/YYYY') },
    { title: 'Fornecedor', dataIndex: 'fornecedor', key: 'fornecedor', ellipsis: true },
    { title: 'Status', dataIndex: 'status', key: 'status', width: 100, render: (v: EstoqueMateriaPrima['status']) => <Tag color={statusColor[v]}>{v}</Tag> },
  ]

  if (isLoading) return <Card className="app-card" variant="borderless"><Skeleton active paragraph={{ rows: 10 }} /></Card>

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}><MetricCard title="Custo Total Estoque" value={formatBRL(totals.custoTotal)} hero /></Col>
        <Col xs={24} sm={12} lg={6}><MetricCard title="Itens em Estoque" value={String(totals.itensTotal)} /></Col>
        <Col xs={24} sm={12} lg={6}><MetricCard title="Itens Críticos" value={String(totals.criticos)} /></Col>
        <Col xs={24} sm={12} lg={6}><MetricCard title="Itens Baixos" value={String(totals.baixos)} /></Col>
      </Row>

      <Card className="app-card no-hover" variant="borderless" title="Itens por Status de Estoque">
        <Suspense fallback={<Skeleton active paragraph={{ rows: 4 }} />}>
          <EstoqueStatusChart data={chartData} label="Estoque matéria prima por status" />
        </Suspense>
      </Card>

      <Card className="app-card no-hover" variant="borderless" title="Filtros"
        extra={
          <Dropdown menu={{ items: [
            { key: 'excel', icon: <FileExcelOutlined />, label: 'Excel', onClick: () => exportExcel(filtered, estoqueMateriaPrimaCols, 'Matéria Prima', 'estoque_mp') },
            { key: 'pdf', icon: <FilePdfOutlined />, label: 'PDF', onClick: () => exportPdf(filtered, estoqueMateriaPrimaCols, 'Relatório — Estoque de Matéria Prima', 'estoque_mp') },
          ] }}>
            <Button icon={<DownloadOutlined />}>Exportar</Button>
          </Dropdown>
        }
      >
        <div className="filter-bar">
          <div className="filter-item"><span>Busca</span><Input.Search allowClear placeholder="Material, fornecedor ou ID" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
          <div className="filter-item"><span>Status</span><Select value={statusFilter} style={{ width: 180 }} onChange={setStatusFilter} options={[{ value: 'all', label: 'Todos' }, { value: 'Normal', label: 'Normal' }, { value: 'Baixo', label: 'Baixo' }, { value: 'Crítico', label: 'Crítico' }]} /></div>
        </div>
      </Card>

      <Card className="app-card quantum-table" variant="borderless" title="Estoque de Matéria Prima">
        <Table rowKey="id" columns={columns} dataSource={filtered} pagination={{ pageSize: 10, showSizeChanger: true }} scroll={{ x: 1100 }} aria-label="Tabela de estoque de matéria prima" />
      </Card>
    </Space>
  )
}
