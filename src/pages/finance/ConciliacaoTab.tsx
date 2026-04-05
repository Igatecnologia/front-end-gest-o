import { Button, Card, Col, Dropdown, Input, Row, Select, Space, Table, Tag, Typography } from 'antd'
import { DownloadOutlined, FileExcelOutlined, FilePdfOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { Suspense, lazy, useMemo, useState } from 'react'
import { Skeleton } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { MetricCard } from '../../components/MetricCard'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import type { ConciliacaoRow } from '../../types/models'
import { getConciliacao } from '../../services/financeReportsService'
import { queryKeys } from '../../query/queryKeys'
import { exportExcel, exportPdf, conciliacaoCols } from '../../utils/financeExport'

const ConciliacaoChart = lazy(() =>
  import('../charts/ConciliacaoChart').then((m) => ({ default: m.ConciliacaoChart })),
)

function formatBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const statusColor: Record<ConciliacaoRow['status'], string> = {
  Conciliado: 'green',
  Pendente: 'orange',
  Divergente: 'red',
}

export function ConciliacaoTab() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | ConciliacaoRow['status']>('all')

  const debouncedSearch = useDebouncedValue(search)

  const { data: rows = [], isLoading } = useQuery({
    queryKey: queryKeys.conciliacao(),
    queryFn: getConciliacao,
  })

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase()
    return rows
      .filter((r) => {
        const text = !q || r.cliente.toLowerCase().includes(q) || r.id.toLowerCase().includes(q)
        const st = statusFilter === 'all' || r.status === statusFilter
        return text && st
      })
      .sort((a, b) => dayjs(b.dataVenda).valueOf() - dayjs(a.dataVenda).valueOf())
  }, [debouncedSearch, rows, statusFilter])

  const totals = useMemo(() => {
    const totalVendas = filtered.reduce((s, r) => s + r.valorVenda, 0)
    const totalPago = filtered.reduce((s, r) => s + r.valorPago, 0)
    const conciliados = filtered.filter((r) => r.status === 'Conciliado').length
    const pendentes = filtered.filter((r) => r.status === 'Pendente').length
    const divergentes = filtered.filter((r) => r.status === 'Divergente').length
    const pctConciliado = filtered.length > 0 ? (conciliados / filtered.length) * 100 : 0
    return { totalVendas, totalPago, conciliados, pendentes, divergentes, pctConciliado }
  }, [filtered])

  const columns: ColumnsType<ConciliacaoRow> = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 100 },
    { title: 'Cliente', dataIndex: 'cliente', key: 'cliente', ellipsis: true },
    {
      title: 'Data Venda', dataIndex: 'dataVenda', key: 'dataVenda', width: 120,
      render: (v: string) => dayjs(v).format('DD/MM/YYYY'),
      sorter: (a, b) => dayjs(a.dataVenda).valueOf() - dayjs(b.dataVenda).valueOf(),
    },
    { title: 'Valor Venda', dataIndex: 'valorVenda', key: 'valorVenda', align: 'right', width: 140, render: (v: number) => formatBRL(v) },
    {
      title: 'Data Pagamento', dataIndex: 'dataPagamento', key: 'dataPagamento', width: 140,
      render: (v: string | null) => (v ? dayjs(v).format('DD/MM/YYYY') : <Tag color="orange">Sem pgto</Tag>),
    },
    { title: 'Valor Pago', dataIndex: 'valorPago', key: 'valorPago', align: 'right', width: 130, render: (v: number) => formatBRL(v) },
    {
      title: 'Diferença', dataIndex: 'diferenca', key: 'diferenca', align: 'right', width: 130,
      render: (v: number) => <Typography.Text type={v === 0 ? 'success' : 'danger'}>{formatBRL(v)}</Typography.Text>,
    },
    { title: 'Status', dataIndex: 'status', key: 'status', width: 120, render: (v: ConciliacaoRow['status']) => <Tag color={statusColor[v]}>{v}</Tag> },
  ]

  if (isLoading) return <Card className="app-card" variant="borderless"><Skeleton active paragraph={{ rows: 10 }} /></Card>

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <MetricCard title="Total Vendas" value={formatBRL(totals.totalVendas)} hero />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <MetricCard title="Total Pago" value={formatBRL(totals.totalPago)} />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <MetricCard title="% Conciliado" value={`${totals.pctConciliado.toFixed(1)}%`} />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <MetricCard title="Resumo" value={`${totals.conciliados} OK / ${totals.pendentes} Pend. / ${totals.divergentes} Div.`} />
        </Col>
      </Row>

      <Card className="app-card no-hover" variant="borderless" title="Status da Conciliação">
        <Suspense fallback={<Skeleton active paragraph={{ rows: 4 }} />}>
          <ConciliacaoChart conciliados={totals.conciliados} pendentes={totals.pendentes} divergentes={totals.divergentes} />
        </Suspense>
      </Card>

      <Card className="app-card no-hover" variant="borderless" title="Filtros"
        extra={
          <Dropdown menu={{ items: [
            { key: 'excel', icon: <FileExcelOutlined />, label: 'Excel', onClick: () => exportExcel(filtered, conciliacaoCols, 'Conciliação', 'conciliacao') },
            { key: 'pdf', icon: <FilePdfOutlined />, label: 'PDF', onClick: () => exportPdf(filtered, conciliacaoCols, 'Conciliação — Vendas × Pagamentos', 'conciliacao') },
          ] }}>
            <Button icon={<DownloadOutlined />}>Exportar</Button>
          </Dropdown>
        }
      >
        <div className="filter-bar">
          <div className="filter-item">
            <span>Busca</span>
            <Input.Search allowClear placeholder="Cliente ou ID" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="filter-item">
            <span>Status</span>
            <Select value={statusFilter} style={{ width: 200 }} onChange={setStatusFilter} options={[
              { value: 'all', label: 'Todos os status' },
              { value: 'Conciliado', label: 'Conciliado' },
              { value: 'Pendente', label: 'Pendente' },
              { value: 'Divergente', label: 'Divergente' },
            ]} />
          </div>
        </div>
      </Card>

      <Card className="app-card quantum-table" variant="borderless" title="Conciliação Vendas × Pagamentos">
        <Table rowKey="id" columns={columns} dataSource={filtered} pagination={{ pageSize: 10, showSizeChanger: true }} scroll={{ x: 900 }} aria-label="Tabela de conciliação" />
      </Card>
    </Space>
  )
}
