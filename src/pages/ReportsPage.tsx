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
import { Bar, BarChart, CartesianGrid, Tooltip as RechartsTooltip, XAxis, YAxis } from 'recharts'
import * as XLSX from 'xlsx'
import { ChartShell } from '../components/ChartShell'
import { DevErrorDetail } from '../components/DevErrorDetail'
import { SGBR_ANALITICO_STALE_MS, SGBR_BI_ACTIVE } from '../api/apiEnv'
import { PageHeaderCard } from '../components/PageHeaderCard'
import { DatePresetRange } from '../components/DatePresetRange'
import { MetricCard } from '../components/MetricCard'
import { useAuth } from '../auth/AuthContext'
import { hasPermission } from '../auth/permissions'
import { getErrorMessage } from '../api/httpError'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { useSavedViews } from '../hooks/useSavedViews'
import type { ReportItem } from '../mocks/reports'
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
  const reportsStaleMs = SGBR_BI_ACTIVE ? SGBR_ANALITICO_STALE_MS : 30_000

  const makeExportBasename = () => {
    const tail = `${startDate || 'ini'}_${endDate || 'fim'}_${dayjs().format('YYYY-MM-DD_HHmm')}`
    return SGBR_BI_ACTIVE ? `relatorios_sgbr_${tail}` : `relatorios_${tail}`
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
      { title: 'ID', dataIndex: 'id', key: 'id', width: 120 },
      { title: 'Nome', dataIndex: 'nome', key: 'nome', sorter: true },
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
        title: 'Principal',
        dataIndex: 'valorPrincipal',
        key: 'valorPrincipal',
        width: 130,
        align: 'right',
        render: (v: number) => v.toLocaleString('pt-BR'),
      },
      {
        title: 'Secundário',
        dataIndex: 'valorSecundario',
        key: 'valorSecundario',
        width: 130,
        align: 'right',
        render: (v: number) => v.toLocaleString('pt-BR'),
      },
      {
        title: 'Segmento',
        dataIndex: 'segmento',
        key: 'segmento',
        width: 120,
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

  function downloadPdf(rows: ReportItem[]) {
    const doc = new jsPDF({ orientation: 'landscape' })
    doc.text('Relatório Executivo', 14, 12)
    autoTable(doc, {
      startY: 18,
      head: [[
        'ID',
        'Nome',
        'Categoria',
        'Tipo',
        'Principal',
        'Secundário',
        'Segmento',
        'Atualizado em',
      ]],
      body: rows.map((r) => [
        r.id,
        r.nome,
        r.categoria,
        r.tipo,
        String(r.valorPrincipal),
        String(r.valorSecundario),
        r.segmento,
        dayjs(r.atualizadoEm).format('DD/MM/YYYY'),
      ]),
    })
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
        title="Relatórios"
        subtitle={
          SGBR_BI_ACTIVE
            ? 'Indicadores sintéticos (receita, ticket, tops) calculados sobre vendas analítico no intervalo dos filtros.'
            : 'Relatórios empresariais com filtros avançados, exportações e agendamento.'
        }
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
            <Button icon={<ScheduleOutlined />} onClick={() => setScheduleOpen(true)}>
              Agendar
            </Button>
            <Button
              onClick={() => {
                const name = window.prompt('Nome da view:')
                if (!name) return
                saved.create(name, searchParams)
              }}
            >
              Salvar view
            </Button>
            <Button icon={<CalendarOutlined />} onClick={saveCurrentUserFilter}>
              Salvar filtro usuário
            </Button>
          </Space>
        }
      />

      <Card className="app-card" variant="borderless" title="Filtros e ações rápidas">
        <Space wrap>
          <Select
            style={{ width: 220 }}
            placeholder="Views…"
            options={saved.views.map((v) => ({ value: v.id, label: v.name }))}
            onChange={(id) => {
              const view = saved.views.find((v) => v.id === id)
              if (!view) return
              setSearchParams(new URLSearchParams(view.params))
            }}
          />
          <Input.Search
            allowClear
            style={{ width: 280 }}
            placeholder="Buscar por ID ou nome"
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
          <Select
            style={{ width: 220 }}
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
              { value: 'all', label: 'Todas as categorias' },
              { value: 'Vendas', label: 'Vendas' },
              { value: 'Usuários', label: 'Usuários' },
              { value: 'Financeiro', label: 'Financeiro' },
            ]}
          />
          <Select
            style={{ width: 220 }}
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
              ...REPORT_TYPE_OPTIONS.map((x) => ({
                value: x,
                label: x === 'TopN' ? 'Top N' : x,
              })),
            ]}
          />
          <DatePicker.RangePicker
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
          <DatePresetRange
            storageKey="date-preset:reports"
            onApply={(start, end) => {
              setSearchParams((prev) => {
                const p = new URLSearchParams(prev)
                p.set('start', start)
                p.set('end', end)
                return setPageToFirst(p)
              })
            }}
          />
          <Select
            style={{ width: 170 }}
            value={logic}
            onChange={(next) => {
              setSearchParams((prev) => {
                const p = new URLSearchParams(prev)
                p.set('logic', next)
                return setPageToFirst(p)
              })
            }}
            options={[
              { value: 'and', label: 'Combinação AND' },
              { value: 'or', label: 'Combinação OR' },
            ]}
          />
          <Button
            icon={<FileImageOutlined />}
            disabled={!rows.length}
            onClick={exportChartAsPng}
          >
            PNG
          </Button>
          <Button disabled={!rows.length} onClick={exportChartAsSvg}>
            SVG
          </Button>
          <Button
            onClick={() => {
              void navigator.clipboard?.writeText(window.location.href)
            }}
          >
            Copiar link
          </Button>
        </Space>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <MetricCard
            title="Registros no período"
            value={total}
            previousValue={shifted ? previousMetrics.count : undefined}
            deltaPct={shifted ? pctDelta(total, previousMetrics.count) : undefined}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <MetricCard
            title="Volume principal"
            value={reportMetrics.totalPrincipal.toLocaleString('pt-BR')}
            previousValue={
              shifted ? previousMetrics.totalPrincipal.toLocaleString('pt-BR') : undefined
            }
            deltaPct={
              shifted
                ? pctDelta(reportMetrics.totalPrincipal, previousMetrics.totalPrincipal)
                : undefined
            }
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <MetricCard
            title="Média principal"
            value={reportMetrics.avgPrincipal.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
            previousValue={
              shifted
                ? previousMetrics.avgPrincipal.toLocaleString('pt-BR', {
                    maximumFractionDigits: 2,
                  })
                : undefined
            }
            deltaPct={
              shifted ? pctDelta(reportMetrics.avgPrincipal, previousMetrics.avgPrincipal) : undefined
            }
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <MetricCard
            title="Última atualização"
            value={reportMetrics.latestDate ? dayjs(reportMetrics.latestDate).format('DD/MM/YYYY') : '-'}
            previousValue={
              shifted && previousMetrics.latestDate
                ? dayjs(previousMetrics.latestDate).format('DD/MM/YYYY')
                : undefined
            }
          />
        </Col>
      </Row>

      {!!saved.views.length && (
        <Card className="app-card" variant="borderless" title="Gerenciar views salvas">
          <Space orientation="vertical" style={{ width: '100%' }} size={8}>
            {saved.views.map((v) => (
              <Space
                key={v.id}
                style={{ width: '100%', justifyContent: 'space-between' }}
                wrap
              >
                <div>
                  <strong>{v.name}</strong>
                  <div style={{ opacity: 0.7, fontSize: 12 }}>
                    {dayjs(v.createdAt).format('DD/MM/YYYY HH:mm')}
                  </div>
                </div>
                <Space>
                  <Button
                    onClick={() => {
                      setSearchParams(new URLSearchParams(v.params))
                    }}
                  >
                    Aplicar
                  </Button>
                  <Button danger onClick={() => saved.remove(v.id)}>
                    Excluir
                  </Button>
                </Space>
              </Space>
            ))}
          </Space>
        </Card>
      )}

      {!!userFilters.length && (
        <Card className="app-card" variant="borderless" title="Filtros salvos por usuário">
          <Space orientation="vertical" style={{ width: '100%' }} size={8}>
            {userFilters.map((f) => (
              <Space key={f.id} style={{ width: '100%', justifyContent: 'space-between' }} wrap>
                <div>
                  <strong>{f.name}</strong>
                  <div style={{ opacity: 0.7, fontSize: 12 }}>
                    {dayjs(f.createdAt).format('DD/MM/YYYY HH:mm')}
                  </div>
                </div>
                <Space>
                  <Button onClick={() => setSearchParams(new URLSearchParams(f.params))}>
                    Aplicar
                  </Button>
                  <Popconfirm
                    title="Excluir filtro salvo?"
                    okText="Excluir"
                    cancelText="Cancelar"
                    onConfirm={() => {
                      deleteUserSavedFilter(f.id)
                      setFiltersVersion((x) => x + 1)
                    }}
                  >
                    <Button danger>Excluir</Button>
                  </Popconfirm>
                </Space>
              </Space>
            ))}
          </Space>
        </Card>
      )}

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
        <Card className="app-card quantum-table" variant="borderless" title="Lista de relatórios">
          <div ref={chartRef} style={{ width: '100%', height: 260, marginBottom: 16 }}>
            <Typography.Title level={5} style={{ marginTop: 0 }}>
              Resumo visual por tipo
            </Typography.Title>
            <ChartShell height={210}>
              <BarChart data={byType}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="tipo" />
                <YAxis allowDecimals={false} />
                <RechartsTooltip />
                <Bar dataKey="total" fill="rgba(79, 70, 229, 0.75)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ChartShell>
          </div>
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
            }}
          />
        </Card>
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

