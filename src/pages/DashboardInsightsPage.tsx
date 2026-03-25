import { Card, DatePicker, Segmented, Skeleton, Space, Tag, Typography } from 'antd'
import dayjs from 'dayjs'
import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Suspense, lazy } from 'react'
import { PageHeaderCard } from '../components/PageHeaderCard'
import { DatePresetRange } from '../components/DatePresetRange'
import { SGBR_ANALITICO_STALE_MS, SGBR_BI_ACTIVE } from '../api/apiEnv'
import { getDashboardData } from '../services/dashboardService'
import { queryKeys } from '../query/queryKeys'
const DashboardInsightsCharts = lazy(() =>
  import('./charts/DashboardInsightsCharts').then((m) => ({
    default: m.DashboardInsightsCharts,
  })),
)

export function DashboardInsightsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const period = (searchParams.get('p') ?? '30d') as '7d' | '30d' | '90d'
  const start = searchParams.get('start') ?? ''
  const end = searchParams.get('end') ?? ''
  const dashboardQuery = useQuery({
    queryKey: queryKeys.dashboard({ period }),
    queryFn: () => getDashboardData({ delayMs: 700, period }),
    staleTime: SGBR_BI_ACTIVE ? SGBR_ANALITICO_STALE_MS : undefined,
  })

  const filteredData = useMemo(() => {
    const base = dashboardQuery.data
    if (!base) return null
    if (!start && !end) return base
    const latest = base.latest.filter((r) => {
      const matchStart = !start || dayjs(r.data).isSame(start, 'day') || dayjs(r.data).isAfter(start, 'day')
      const matchEnd = !end || dayjs(r.data).isSame(end, 'day') || dayjs(r.data).isBefore(end, 'day')
      return matchStart && matchEnd
    })
    return { ...base, latest }
  }, [dashboardQuery.data, start, end])
  if (!filteredData) return null

  return (
    <Space orientation="vertical" size={16} style={{ width: '100%' }}>
      <PageHeaderCard
        title="Análises BI"
        subtitle={
          SGBR_BI_ACTIVE
            ? 'Cada gráfico explica um recorte das suas vendas (leia o texto cinza embaixo do título). Altere o período para recarregar da API.'
            : 'Visualizações com recorte temporal; com API de demonstração há blocos extras claramente marcados como exemplo.'
        }
      />
      <Card size="small" variant="borderless" style={{ background: 'rgba(22, 119, 255, 0.06)' }}>
        <Typography.Paragraph style={{ margin: 0, fontSize: 14 }}>
          <strong>Dica:</strong> comece pelo resumo no topo (&quot;Como ler esta tela&quot;) e pelos três gráficos da
          primeira fileira — eles respondem: quanto faturou ao longo do tempo, como foi o volume diário e como estão os
          status dos pedidos recentes.
        </Typography.Paragraph>
      </Card>
      <Card className="app-card" variant="borderless" title="Controles da análise">
        <Space wrap>
          <Segmented
            value={period}
            options={[
              { label: '7 dias', value: '7d' },
              { label: '30 dias', value: '30d' },
              { label: '90 dias', value: '90d' },
            ]}
            onChange={(v) => {
              setSearchParams((prev) => {
                const p = new URLSearchParams(prev)
                p.set('p', String(v))
                return p
              })
            }}
          />
          <DatePicker.RangePicker
            onChange={(vals) => {
              setSearchParams((prev) => {
                const p = new URLSearchParams(prev)
                const [from, to] = vals ?? []
                if (from) p.set('start', from.format('YYYY-MM-DD'))
                else p.delete('start')
                if (to) p.set('end', to.format('YYYY-MM-DD'))
                else p.delete('end')
                return p
              })
            }}
          />
          <DatePresetRange
            storageKey="date-preset:dashboard-insights"
            onApply={(from, to) => {
              setSearchParams((prev) => {
                const p = new URLSearchParams(prev)
                p.set('start', from)
                p.set('end', to)
                return p
              })
            }}
          />
          <Tag color="blue">Registros no recorte: {filteredData.latest.length}</Tag>
        </Space>
      </Card>

      <Suspense
        fallback={
          <Card className="app-card" variant="borderless">
            <Skeleton active paragraph={{ rows: 10 }} />
          </Card>
        }
      >
        <DashboardInsightsCharts data={filteredData} />
      </Suspense>
    </Space>
  )
}
