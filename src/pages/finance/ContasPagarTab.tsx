import { Button, Card, Col, Dropdown, Input, Row, Select, Space, Table, Tag, Typography } from 'antd'
import { DownloadOutlined, FileExcelOutlined, FilePdfOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { Suspense, lazy, useMemo, useState } from 'react'
import { Skeleton } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { MetricCard } from '../../components/MetricCard'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import type { ContaPagar } from '../../types/models'
import { getContasPagar } from '../../services/financeReportsService'
import { queryKeys } from '../../query/queryKeys'
import { exportExcel, exportPdf, contasPagarCols } from '../../utils/financeExport'

const ContasStatusChart = lazy(() =>
  import('../charts/ContasStatusChart').then((m) => ({ default: m.ContasStatusChart })),
)

function formatBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const statusColor: Record<ContaPagar['status'], string> = { Pago: 'green', 'A vencer': 'blue', Vencido: 'red' }

export function ContasPagarTab() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | ContaPagar['status']>('all')
  const [catFilter, setCatFilter] = useState<'all' | ContaPagar['categoria']>('all')

  const debouncedSearch = useDebouncedValue(search)
  const { data: rows = [], isLoading } = useQuery({ queryKey: queryKeys.contasPagar(), queryFn: getContasPagar })

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase()
    return rows
      .filter((r) => {
        const text = !q || r.fornecedor.toLowerCase().includes(q) || r.descricao.toLowerCase().includes(q) || r.id.toLowerCase().includes(q)
        const st = statusFilter === 'all' || r.status === statusFilter
        const cat = catFilter === 'all' || r.categoria === catFilter
        return text && st && cat
      })
      .sort((a, b) => dayjs(a.dataVencimento).valueOf() - dayjs(b.dataVencimento).valueOf())
  }, [debouncedSearch, rows, statusFilter, catFilter])

  const totals = useMemo(() => {
    const total = filtered.reduce((s, r) => s + r.valor, 0)
    const pago = filtered.filter((r) => r.status === 'Pago').reduce((s, r) => s + r.valor, 0)
    const aVencer = filtered.filter((r) => r.status === 'A vencer').reduce((s, r) => s + r.valor, 0)
    const vencido = filtered.filter((r) => r.status === 'Vencido').reduce((s, r) => s + r.valor, 0)
    return { total, pago, aVencer, vencido }
  }, [filtered])

  const chartData = useMemo(() => [
    { status: 'Pago', valor: totals.pago },
    { status: 'A vencer', valor: totals.aVencer },
    { status: 'Vencido', valor: totals.vencido },
  ].filter((d) => d.valor > 0), [totals])

  const columns: ColumnsType<ContaPagar> = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 90 },
    { title: 'Fornecedor', dataIndex: 'fornecedor', key: 'fornecedor', ellipsis: true },
    { title: 'Descrição', dataIndex: 'descricao', key: 'descricao', ellipsis: true },
    { title: 'Categoria', dataIndex: 'categoria', key: 'categoria', width: 130, render: (v: string) => <Tag>{v}</Tag> },
    { title: 'Valor', dataIndex: 'valor', key: 'valor', align: 'right', width: 130, render: (v: number) => <Typography.Text strong>{formatBRL(v)}</Typography.Text>, sorter: (a, b) => a.valor - b.valor },
    { title: 'Vencimento', dataIndex: 'dataVencimento', key: 'dataVencimento', width: 120, render: (v: string) => dayjs(v).format('DD/MM/YYYY'), sorter: (a, b) => dayjs(a.dataVencimento).valueOf() - dayjs(b.dataVencimento).valueOf() },
    { title: 'Pagamento', dataIndex: 'dataPagamento', key: 'dataPagamento', width: 120, render: (v: string | null) => (v ? dayjs(v).format('DD/MM/YYYY') : '—') },
    { title: 'Status', dataIndex: 'status', key: 'status', width: 110, render: (v: ContaPagar['status']) => <Tag color={statusColor[v]}>{v}</Tag> },
  ]

  if (isLoading) return <Card className="app-card" variant="borderless"><Skeleton active paragraph={{ rows: 10 }} /></Card>

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}><MetricCard title="Total a Pagar" value={formatBRL(totals.total)} hero /></Col>
        <Col xs={24} sm={12} lg={6}><MetricCard title="Pago" value={formatBRL(totals.pago)} /></Col>
        <Col xs={24} sm={12} lg={6}><MetricCard title="A Vencer" value={formatBRL(totals.aVencer)} /></Col>
        <Col xs={24} sm={12} lg={6}><MetricCard title="Vencido" value={formatBRL(totals.vencido)} /></Col>
      </Row>

      <Card className="app-card no-hover" variant="borderless" title="Distribuição por Status">
        <Suspense fallback={<Skeleton active paragraph={{ rows: 4 }} />}>
          <ContasStatusChart data={chartData} label="Contas a pagar por status" color="rgba(26, 122, 181, 0.75)" />
        </Suspense>
      </Card>

      <Card className="app-card no-hover" variant="borderless" title="Filtros"
        extra={
          <Dropdown menu={{ items: [
            { key: 'excel', icon: <FileExcelOutlined />, label: 'Excel', onClick: () => exportExcel(filtered, contasPagarCols, 'Contas a Pagar', 'contas_pagar') },
            { key: 'pdf', icon: <FilePdfOutlined />, label: 'PDF', onClick: () => exportPdf(filtered, contasPagarCols, 'Relatório — Contas a Pagar', 'contas_pagar') },
          ] }}>
            <Button icon={<DownloadOutlined />}>Exportar</Button>
          </Dropdown>
        }
      >
        <div className="filter-bar">
          <div className="filter-item"><span>Busca</span><Input.Search allowClear placeholder="Fornecedor, descrição ou ID" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
          <div className="filter-item"><span>Status</span><Select value={statusFilter} style={{ width: 180 }} onChange={setStatusFilter} options={[{ value: 'all', label: 'Todos' }, { value: 'Pago', label: 'Pago' }, { value: 'A vencer', label: 'A vencer' }, { value: 'Vencido', label: 'Vencido' }]} /></div>
          <div className="filter-item"><span>Categoria</span><Select value={catFilter} style={{ width: 180 }} onChange={setCatFilter} options={[{ value: 'all', label: 'Todas' }, { value: 'Matéria Prima', label: 'Matéria Prima' }, { value: 'Energia', label: 'Energia' }, { value: 'Folha', label: 'Folha' }, { value: 'Impostos', label: 'Impostos' }, { value: 'Frete', label: 'Frete' }, { value: 'Outros', label: 'Outros' }]} /></div>
        </div>
      </Card>

      <Card className="app-card quantum-table" variant="borderless" title="Contas a Pagar">
        <Table rowKey="id" columns={columns} dataSource={filtered} pagination={{ pageSize: 10, showSizeChanger: true }} scroll={{ x: 900 }} aria-label="Tabela de contas a pagar" />
      </Card>
    </Space>
  )
}
