import {
  CalendarOutlined,
  DownloadOutlined,
  FileExcelOutlined,
  FileImageOutlined,
  FilePdfOutlined,
  ReloadOutlined,
  ScheduleOutlined,
} from '@ant-design/icons'
import {
  Alert,
  App,
  Button,
  Card,
  Col,
  DatePicker,
  Dropdown,
  Empty,
  Input,
  Modal,
  Popconfirm,
  Row,
  Select,
  Skeleton,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'
import dayjs from 'dayjs'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from 'recharts'
import { gridProps, xAxisProps, yAxisProps, CHART_COLORS } from '../components/charts/ChartDefaults'
import * as XLSX from 'xlsx'
import { ChartShell } from '../components/ChartShell'
import { DevErrorDetail } from '../components/DevErrorDetail'
import { ANALITICO_STALE_MS } from '../api/apiEnv'
import { hasAnySources } from '../services/dataSourceService'
import { PageHeaderCard } from '../components/PageHeaderCard'

import { MetricCard } from '../components/MetricCard'
import { useAuth } from '../auth/AuthContext'
import { hasPermission } from '../auth/permissions'
import { getErrorMessage } from '../api/httpError'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { useSavedViews } from '../hooks/useSavedViews'
import type { ReportItem } from '../types/models'
import { queryKeys } from '../query/queryKeys'
import {
  createReportSchedule,
  deleteReportSchedule,
  listReportSchedules,
  type ReportSchedule,
} from '../services/reportSchedulesService'
import { getReports } from '../services/reportsService'
import {
  createUserSavedFilter,
  deleteUserSavedFilter,
  listUserSavedFilters,
  type UserSavedFilter,
} from '../services/userFiltersService'
import { pctDelta, shiftRange } from '../utils/dateRange'

const REPORT_TYPE_OPTIONS: ReportItem['tipo'][] = [
  'Performance',
  'Financeiro',
  'Conversão',
  'Retenção',
  'Tendência',
  'TopN',
  'Sazonalidade',
  'Segmentação',
]

export function ReportsPage() {
  const { notification } = App.useApp()
  const { session } = useAuth()
  const canExport = hasPermission(session, 'reports:export')
  const [searchParams, setSearchParams] = useSearchParams()
  const saved = useSavedViews('reports')
  const queryClient = useQueryClient()
  const chartRef = useRef<HTMLDivElement | null>(null)
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [filtersVersion, setFiltersVersion] = useState(0)

  const q = searchParams.get('q') ?? ''
  const debouncedQ = useDebouncedValue(q, 350)
  const categoria = (searchParams.get('cat') ?? 'all') as 'all' | ReportItem['categoria']
  const tipo = (searchParams.get('type') ?? 'all') as 'all' | ReportItem['tipo']
  const logic = (searchParams.get('logic') ?? 'and') as 'and' | 'or'
  const startDate = searchParams.get('start') ?? ''
  const endDate = searchParams.get('end') ?? ''
  const page = Math.max(1, Number(searchParams.get('page') ?? 1))
  const pageSize = Math.max(1, Number(searchParams.get('pageSize') ?? 8))
  const sortBy = (searchParams.get('sortBy') ?? 'atualizadoEm') as 'atualizadoEm' | 'nome' | 'tipo'
  const sortOrder = (searchParams.get('sortOrder') ?? 'desc') as 'asc' | 'desc'
  const shifted = shiftRange(startDate, endDate)
  const reportsStaleMs = hasAnySources() ? ANALITICO_STALE_MS : 30_000

  const makeExportBasename = () => {
    const tail = `${startDate || 'ini'}_${endDate || 'fim'}_${dayjs().format('YYYY-MM-DD_HHmm')}`
    return hasAnySources() ? `relatorios_sgbr_${tail}` : `relatorios_${tail}`
  }

  const reportsQuery = useQuery({
    queryKey: queryKeys.reports({
      q: debouncedQ,
      cat: categoria,
      type: tipo,
      logic,
      startDate,
      endDate,
      page,
      pageSize,
      sortBy,
      sortOrder,
    }),
    queryFn: () =>
      getReports({
        delayMs: 500,
        q: debouncedQ,
        cat: categoria,
        type: tipo,
        logic,
        startDate,
        endDate,
        page,
        pageSize,
        sortBy,
        sortOrder,
      }),
    staleTime: reportsStaleMs,
  })

  const schedulesQuery = useQuery({
    queryKey: queryKeys.reportSchedules(),
    queryFn: async (): Promise<ReportSchedule[]> => listReportSchedules(),
  })
  const previousReportsQuery = useQuery({
    queryKey: queryKeys.reports({
      q: debouncedQ,
      cat: categoria,
      type: tipo,
      logic,
      startDate: shifted?.prevStart,
      endDate: shifted?.prevEnd,
      page: 1,
      pageSize,
      sortBy,
      sortOrder,
    }),
    queryFn: () =>
      getReports({
        delayMs: 350,
        q: debouncedQ,
        cat: categoria,
        type: tipo,
        logic,
        startDate: shifted?.prevStart,
        endDate: shifted?.prevEnd,
        page: 1,
        pageSize,
        sortBy,
        sortOrder,
      }),
    enabled: !!shifted,
    staleTime: reportsStaleMs,
  })

  const createScheduleMutation = useMutation({
    mutationFn: async (payload: Omit<ReportSchedule, 'id' | 'createdAt'>) =>
      createReportSchedule(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.reportSchedules() })
    },
  })

  const deleteScheduleMutation = useMutation({
    mutationFn: async (id: string) => deleteReportSchedule(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.reportSchedules() })
    },
  })

  void filtersVersion
  const userId = session?.user?.id ?? null
  const userFilters: UserSavedFilter[] = userId ? listUserSavedFilters(userId, 'reports') : []

  const rows = useMemo(() => reportsQuery.data?.items ?? [], [reportsQuery.data?.items])
  const total = reportsQuery.data?.total ?? 0

  useEffect(() => {
    if (reportsQuery.isError) {
      notification.error({
        title: 'Relatórios',
        description: getErrorMessage(reportsQuery.error, 'Falha ao carregar relatórios.'),
      })
    }
  }, [reportsQuery.isError, reportsQuery.error, notification])

  const columns: ColumnsType<ReportItem> = useMemo(
    () => [
      { title: 'Nome', dataIndex: 'nome', key: 'nome', sorter: true, ellipsis: true },
      {
        title: 'Categoria',
        dataIndex: 'categoria',
        key: 'categoria',
        width: 140,
        render: (v: ReportItem['categoria']) => (
          <Tag color={v === 'Vendas' ? 'blue' : v === 'Usuários' ? 'purple' : 'cyan'}>{v}</Tag>
        ),
      },
      {
        title: 'Tipo',
        dataIndex: 'tipo',
        key: 'tipo',
        width: 140,
        sorter: true,
      },
      {
        title: 'Valor',
        dataIndex: 'valorPrincipal',
        key: 'valorPrincipal',
        width: 140,
        align: 'right',
        render: (v: number) => (
          <Typography.Text strong style={{ fontVariantNumeric: 'tabular-nums' }}>
            {v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </Typography.Text>
        ),
      },
      {
        title: 'Qtd / Ref.',
        dataIndex: 'valorSecundario',
        key: 'valorSecundario',
        width: 100,
        align: 'right',
        render: (v: number) => (
          <Typography.Text type="secondary" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {v.toLocaleString('pt-BR')}
          </Typography.Text>
        ),
      },
      {
        title: 'Segmento',
        dataIndex: 'segmento',
        key: 'segmento',
        width: 110,
        render: (v: string) => (
          <Tag color={v === 'Enterprise' ? 'blue' : v === 'MidMarket' ? 'green' : 'default'}>{v}</Tag>
        ),
      },
      {
        title: 'Atualizado em',
        dataIndex: 'atualizadoEm',
        key: 'atualizadoEm',
        width: 140,
        sorter: true,
        render: (v: string) => dayjs(v).format('DD/MM/YYYY'),
      },
    ],
    [],
  )

  const byType = useMemo(
    () =>
      REPORT_TYPE_OPTIONS.map((t) => ({
        tipo: t,
        total: rows.filter((x) => x.tipo === t).length,
      })),
    [rows],
  )
  const reportMetrics = useMemo(() => {
    const totalPrincipal = rows.reduce((acc, r) => acc + r.valorPrincipal, 0)
    const avgPrincipal = rows.length ? totalPrincipal / rows.length : 0
    const latestDate = rows[0]?.atualizadoEm ?? null
    return { totalPrincipal, avgPrincipal, latestDate }
  }, [rows])
  const previousMetrics = useMemo(() => {
    const prevRows = previousReportsQuery.data?.items ?? []
    const totalPrincipal = prevRows.reduce((acc, r) => acc + r.valorPrincipal, 0)
    const avgPrincipal = prevRows.length ? totalPrincipal / prevRows.length : 0
    const latestDate = prevRows[0]?.atualizadoEm ?? null
    return { totalPrincipal, avgPrincipal, latestDate, count: prevRows.length }
  }, [previousReportsQuery.data?.items])

  function setPageToFirst(params: URLSearchParams) {
    params.set('page', '1')
    return params
  }

  function onTableChange(pagination: TablePaginationConfig, sorter: unknown) {
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev)
      p.set('page', String(pagination.current ?? 1))
      p.set('pageSize', String(pagination.pageSize ?? 8))
      if (sorter && typeof sorter === 'object' && !Array.isArray(sorter) && 'order' in sorter) {
        const x = sorter as { field?: unknown; order?: unknown }
        if (x.order) {
          p.set('sortBy', String(x.field ?? 'atualizadoEm'))
          p.set('sortOrder', x.order === 'ascend' ? 'asc' : 'desc')
        }
      }
      return p
    })
  }

  function downloadCsv(exportRows: ReportItem[]) {
    const header = [
      'id',
      'nome',
      'categoria',
      'tipo',
      'valorPrincipal',
      'valorSecundario',
      'segmento',
      'atualizadoEm',
    ]
    const escape = (v: string) => `"${v.replaceAll('"', '""')}"`
    const lines = [
      header.join(','),
      ...exportRows.map((r) =>
        [
          escape(r.id),
          escape(r.nome),
          escape(r.categoria),
          escape(r.tipo),
          escape(String(r.valorPrincipal)),
          escape(String(r.valorSecundario)),
          escape(r.segmento),
          escape(r.atualizadoEm),
        ].join(','),
      ),
    ].join('\n')

    const blob = new Blob([lines], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${makeExportBasename()}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  function downloadExcel(rows: ReportItem[]) {
    const sheet = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, sheet, 'Relatorios')
    XLSX.writeFile(wb, `${makeExportBasename()}.xlsx`)
  }

  function downloadPdf(exportRows: ReportItem[]) {
    const doc = new jsPDF({ orientation: 'landscape' })
    const pageW = doc.internal.pageSize.getWidth()

    // Cabecalho
    doc.setFillColor(15, 23, 42) // slate-900
    doc.rect(0, 0, pageW, 28, 'F')
    doc.setTextColor(248, 250, 252)
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text('IGA — Relatorio Executivo', 14, 14)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Gerado em ${dayjs().format('DD/MM/YYYY [as] HH:mm')}`, 14, 22)

    const periodo = startDate && endDate
      ? `${dayjs(startDate).format('DD/MM/YYYY')} a ${dayjs(endDate).format('DD/MM/YYYY')}`
      : 'Ultimos 90 dias'
    doc.text(`Periodo: ${periodo}`, pageW - 14, 22, { align: 'right' })

    // KPIs resumidos
    doc.setTextColor(15, 23, 42)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    const kpiY = 36
    const kpiW = (pageW - 28 - 30) / 4

    const kpis = [
      { label: 'REGISTROS', value: String(exportRows.length) },
      { label: 'FATURAMENTO', value: reportMetrics.totalPrincipal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) },
      { label: 'TICKET MEDIO', value: reportMetrics.avgPrincipal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 }) },
      { label: 'CATEGORIAS', value: [...new Set(exportRows.map(r => r.categoria))].join(', ') || '—' },
    ]

    kpis.forEach((kpi, i) => {
      const x = 14 + i * (kpiW + 10)
      doc.setFillColor(241, 245, 249)
      doc.roundedRect(x, kpiY - 4, kpiW, 16, 3, 3, 'F')
      doc.setFontSize(7)
      doc.setTextColor(100, 116, 139)
      doc.text(kpi.label, x + 6, kpiY + 2)
      doc.setFontSize(11)
      doc.setTextColor(15, 23, 42)
      doc.setFont('helvetica', 'bold')
      doc.text(kpi.value, x + 6, kpiY + 9)
      doc.setFont('helvetica', 'normal')
    })

    // Linha separadora
    doc.setDrawColor(226, 232, 240)
    doc.line(14, kpiY + 16, pageW - 14, kpiY + 16)

    // Tabela
    autoTable(doc, {
      startY: kpiY + 20,
      head: [['Nome', 'Categoria', 'Tipo', 'Valor (R$)', 'Ref. (R$)', 'Segmento', 'Data']],
      body: exportRows.map((r) => [
        r.nome,
        r.categoria,
        r.tipo,
        r.valorPrincipal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
        r.valorSecundario.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
        r.segmento,
        dayjs(r.atualizadoEm).format('DD/MM/YYYY'),
      ]),
      styles: {
        fontSize: 8,
        cellPadding: 4,
        lineColor: [226, 232, 240],
        lineWidth: 0.3,
      },
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [248, 250, 252],
        fontStyle: 'bold',
        fontSize: 8,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        3: { halign: 'right', fontStyle: 'bold' },
        4: { halign: 'right' },
      },
    })

    // Rodape
    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      const pageH = doc.internal.pageSize.getHeight()
      doc.setFontSize(7)
      doc.setTextColor(148, 163, 184)
      doc.text('IGA Gestao — Documento confidencial', 14, pageH - 6)
      doc.text(`Pagina ${i} de ${pageCount}`, pageW - 14, pageH - 6, { align: 'right' })
    }

    doc.save(`${makeExportBasename()}_executivo.pdf`)
  }

  async function exportChartAsPng() {
    if (!chartRef.current) return
    const canvas = await html2canvas(chartRef.current)
    const url = canvas.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = url
    a.download = `${makeExportBasename()}_grafico.png`
    a.click()
  }

  function exportChartAsSvg() {
    const svg = chartRef.current?.querySelector('svg')
    if (!svg) return
    const blob = new Blob([svg.outerHTML], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${makeExportBasename()}_grafico.svg`
    a.click()
    URL.revokeObjectURL(url)
  }

  function saveCurrentUserFilter() {
    if (!session?.user?.id) return
    const name = window.prompt('Nome do filtro salvo:')
    if (!name) return
    createUserSavedFilter({
      userId: session.user.id,
      page: 'reports',
      name,
      params: searchParams.toString(),
    })
    setFiltersVersion((x) => x + 1)
    notification.success({ title: 'Filtro salvo para o usuário.' })
  }

  return (
    <Space orientation="vertical" size={16} style={{ width: '100%' }}>
      <PageHeaderCard
        title="Relatorios"
        subtitle="Indicadores e dados do periodo selecionado."
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => reportsQuery.refetch()}>
              Atualizar
            </Button>
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'csv',
                    icon: <DownloadOutlined />,
                    label: 'Exportar CSV',
                    disabled: !canExport || !rows.length,
                    onClick: () => downloadCsv(rows),
                  },
                  {
                    key: 'xlsx',
                    icon: <FileExcelOutlined />,
                    label: 'Exportar Excel',
                    disabled: !canExport || !rows.length,
                    onClick: () => downloadExcel(rows),
                  },
                  {
                    key: 'pdf',
                    icon: <FilePdfOutlined />,
                    label: 'Exportar PDF',
                    disabled: !canExport || !rows.length,
                    onClick: () => downloadPdf(rows),
                  },
                ],
              }}
            >
              <Button icon={<DownloadOutlined />}>Exportar</Button>
            </Dropdown>
          </Space>
        }
      />

      <Card className="app-card no-hover" variant="borderless" title="Filtros">
        <Row gutter={[12, 12]}>
          <Col xs={24} md={8}>
            <Input.Search
              allowClear
              placeholder="Buscar por nome ou ID"
              value={q}
              onChange={(e) => {
                const next = e.target.value
                setSearchParams((prev) => {
                  const p = new URLSearchParams(prev)
                  if (next) p.set('q', next)
                  else p.delete('q')
                  return setPageToFirst(p)
                })
              }}
            />
          </Col>
          <Col xs={12} md={4}>
            <Select
              style={{ width: '100%' }}
              value={categoria}
              onChange={(next) => {
                setSearchParams((prev) => {
                  const p = new URLSearchParams(prev)
                  if (next === 'all') p.delete('cat')
                  else p.set('cat', next)
                  return setPageToFirst(p)
                })
              }}
              options={[
                { value: 'all', label: 'Todas categorias' },
                { value: 'Vendas', label: 'Vendas' },
                { value: 'Usuários', label: 'Usuarios' },
                { value: 'Financeiro', label: 'Financeiro' },
              ]}
            />
          </Col>
          <Col xs={12} md={4}>
            <Select
              style={{ width: '100%' }}
              value={tipo}
              onChange={(next) => {
                setSearchParams((prev) => {
                  const p = new URLSearchParams(prev)
                  if (next === 'all') p.delete('type')
                  else p.set('type', next)
                  return setPageToFirst(p)
                })
              }}
              options={[
                { value: 'all', label: 'Todos os tipos' },
                ...REPORT_TYPE_OPTIONS.map((x) => ({ value: x, label: x === 'TopN' ? 'Top N' : x })),
              ]}
            />
          </Col>
          <Col xs={24} md={8}>
            <DatePicker.RangePicker
              style={{ width: '100%' }}
              format="DD/MM/YYYY"
              placeholder={['Data inicial', 'Data final']}
              onChange={(vals) => {
                setSearchParams((prev) => {
                  const p = new URLSearchParams(prev)
                  const [start, end] = vals ?? []
                  if (start) p.set('start', start.format('YYYY-MM-DD'))
                  else p.delete('start')
                  if (end) p.set('end', end.format('YYYY-MM-DD'))
                  else p.delete('end')
                  return setPageToFirst(p)
                })
              }}
            />
          </Col>
        </Row>
      </Card>

      <Row gutter={[12, 12]}>
        <Col xs={12} sm={6}>
          <MetricCard
            title="Registros"
            value={total}
            accentColor={CHART_COLORS[0]}
            previousValue={shifted ? previousMetrics.count : undefined}
            deltaPct={shifted ? pctDelta(total, previousMetrics.count) : undefined}
          />
        </Col>
        <Col xs={12} sm={6}>
          <MetricCard
            title="Faturamento"
            value={reportMetrics.totalPrincipal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            accentColor={CHART_COLORS[1]}
            previousValue={shifted ? previousMetrics.totalPrincipal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : undefined}
            deltaPct={shifted ? pctDelta(reportMetrics.totalPrincipal, previousMetrics.totalPrincipal) : undefined}
          />
        </Col>
        <Col xs={12} sm={6}>
          <MetricCard
            title="Ticket medio"
            value={reportMetrics.avgPrincipal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 })}
            accentColor={CHART_COLORS[2]}
            previousValue={shifted ? previousMetrics.avgPrincipal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 }) : undefined}
            deltaPct={shifted ? pctDelta(reportMetrics.avgPrincipal, previousMetrics.avgPrincipal) : undefined}
          />
        </Col>
        <Col xs={12} sm={6}>
          <MetricCard
            title="Atualizado em"
            value={reportMetrics.latestDate ? dayjs(reportMetrics.latestDate).format('DD/MM/YYYY') : '—'}
            accentColor={CHART_COLORS[3]}
          />
        </Col>
      </Row>

      {(reportsQuery.isLoading || reportsQuery.isFetching) && (
        <Card>
          <Skeleton active paragraph={{ rows: 6 }} />
        </Card>
      )}

      {reportsQuery.isError && (
        <Card extra={<Button onClick={() => reportsQuery.refetch()}>Tentar novamente</Button>}>
          <Alert
            type="error"
            showIcon
            title="Não foi possível carregar"
            description={
              <>
                {getErrorMessage(reportsQuery.error, 'Falha ao carregar relatórios.')}
                <DevErrorDetail error={reportsQuery.error} />
              </>
            }
          />
        </Card>
      )}

      {!reportsQuery.isLoading && !rows.length && (
        <Card>
          <div style={{ padding: 32 }}>
            <Empty
              description="Sem relatórios disponíveis."
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </div>
        </Card>
      )}

      {!!rows.length && (
        <>
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card className="app-card" variant="borderless" title="Por tipo de relatorio">
                <ChartShell height={220}>
                  <BarChart data={byType.filter(t => t.total > 0)} layout="vertical" margin={{ left: 0, right: 16 }}>
                    <CartesianGrid {...gridProps} horizontal={false} vertical />
                    <XAxis type="number" {...xAxisProps} allowDecimals={false} />
                    <YAxis type="category" dataKey="tipo" {...yAxisProps} width={100} tick={{ fontSize: 11 }} />
                    <Bar dataKey="total" name="Quantidade" radius={[0, 6, 6, 0]}>
                      {byType.filter(t => t.total > 0).map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} fillOpacity={0.8} />
                      ))}
                    </Bar>
                  </BarChart>
                </ChartShell>
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card className="app-card" variant="borderless" title="Por categoria">
                <ChartShell height={220}>
                  <BarChart
                    data={['Vendas', 'Usuários', 'Financeiro'].map((cat, i) => ({
                      categoria: cat,
                      total: rows.filter(r => r.categoria === cat).length,
                      valor: rows.filter(r => r.categoria === cat).reduce((s, r) => s + r.valorPrincipal, 0),
                    })).filter(c => c.total > 0)}
                    margin={{ left: 0, right: 8 }}
                  >
                    <CartesianGrid {...gridProps} />
                    <XAxis dataKey="categoria" {...xAxisProps} />
                    <YAxis {...yAxisProps} allowDecimals={false} />
                    <Bar dataKey="total" name="Registros" radius={[6, 6, 0, 0]}>
                      {['Vendas', 'Usuários', 'Financeiro'].map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i]} fillOpacity={0.75} />
                      ))}
                    </Bar>
                  </BarChart>
                </ChartShell>
              </Card>
            </Col>
          </Row>

          <Card className="app-card quantum-table" variant="borderless" title="Detalhamento">
            <div ref={chartRef}>
              <Table
                rowKey="id"
                columns={columns}
                dataSource={rows}
                onChange={(pagination, _f, sorter) => onTableChange(pagination, sorter)}
                pagination={{
                  current: page,
                  pageSize,
                  total,
                  showSizeChanger: true,
                  showTotal: (t) => `${t} registros`,
                }}
                size="middle"
              />
            </div>
          </Card>
        </>
      )}

      <Modal
        open={scheduleOpen}
        onCancel={() => setScheduleOpen(false)}
        onOk={() => {
          if (!rows.length) return
          const top = rows[0]
          createScheduleMutation.mutate({
            reportId: top.id,
            reportName: top.nome,
            frequency: 'weekly',
            format: 'pdf',
            nextRunAt: dayjs().add(7, 'day').toISOString(),
          })
          setScheduleOpen(false)
          notification.success({ title: 'Agendamento simulado criado.' })
        }}
        title="Agendar relatório (simulado)"
        okText="Criar agendamento"
        cancelText="Cancelar"
      >
        <Typography.Paragraph>
          Será criado um agendamento semanal em PDF para o relatório selecionado no topo da lista.
        </Typography.Paragraph>
      </Modal>

      {!!(schedulesQuery.data?.length ?? 0) && (
        <Card className="app-card" variant="borderless" title="Agendamentos simulados">
          <Space orientation="vertical" style={{ width: '100%' }} size={8}>
            {(schedulesQuery.data ?? []).map((s) => (
              <Space key={s.id} style={{ width: '100%', justifyContent: 'space-between' }} wrap>
                <div>
                  <strong>{s.reportName}</strong>
                  <div style={{ opacity: 0.7, fontSize: 12 }}>
                    {s.frequency} · {s.format.toUpperCase()} · próxima execução{' '}
                    {dayjs(s.nextRunAt).format('DD/MM/YYYY')}
                  </div>
                </div>
                <Popconfirm
                  title="Remover agendamento?"
                  okText="Remover"
                  cancelText="Cancelar"
                  onConfirm={() => {
                    deleteScheduleMutation.mutate(s.id)
                  }}
                >
                  <Button danger>Remover</Button>
                </Popconfirm>
              </Space>
            ))}
          </Space>
        </Card>
      )}
    </Space>
  )
}

