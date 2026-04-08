import { Card, Skeleton, Space, Tabs } from 'antd'
import { InboxOutlined, BuildOutlined, ShoppingCartOutlined } from '@ant-design/icons'
import { Suspense, lazy } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PageHeaderCard } from '../components/PageHeaderCard'

const EstoqueMateriaPrimaTab = lazy(() =>
  import('./finance/EstoqueMateriaPrimaTab').then((m) => ({ default: m.EstoqueMateriaPrimaTab })),
)
const EstoqueEspumaTab = lazy(() =>
  import('./finance/EstoqueEspumaTab').then((m) => ({ default: m.EstoqueEspumaTab })),
)
const VendasEspumaTab = lazy(() =>
  import('./finance/VendasEspumaTab').then((m) => ({ default: m.VendasEspumaTab })),
)

const tabFallback = <Skeleton active paragraph={{ rows: 8 }} style={{ padding: 24 }} />

export function EstoquePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') ?? 'estoque-materia-prima'

  const handleTabChange = (key: string) => {
    setSearchParams({ tab: key }, { replace: true })
  }

  const tabItems = [
    {
      key: 'estoque-materia-prima',
      label: (
        <span>
          <InboxOutlined /> Estoque Mat. Prima
        </span>
      ),
      children: (
        <Suspense fallback={tabFallback}>
          <EstoqueMateriaPrimaTab />
        </Suspense>
      ),
    },
    {
      key: 'estoque-espuma',
      label: (
        <span>
          <BuildOutlined /> Estoque Espuma/Aglom.
        </span>
      ),
      children: (
        <Suspense fallback={tabFallback}>
          <EstoqueEspumaTab />
        </Suspense>
      ),
    },
    {
      key: 'vendas-espuma',
      label: (
        <span>
          <ShoppingCartOutlined /> Vendas Espuma/Aglom.
        </span>
      ),
      children: (
        <Suspense fallback={tabFallback}>
          <VendasEspumaTab />
        </Suspense>
      ),
    },
  ]

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <PageHeaderCard
        title="Estoque"
        subtitle="Controle de estoque de matéria-prima, espuma, aglomerado e vendas."
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
