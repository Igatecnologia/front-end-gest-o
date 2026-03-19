import { ArrowDownOutlined, ArrowUpOutlined, MinusOutlined } from '@ant-design/icons'
import { Card, Space, Tag, Typography } from 'antd'

export function MetricCard({
  title,
  value,
  previousValue,
  deltaPct,
}: {
  title: string
  value: string | number
  previousValue?: string | number
  deltaPct?: number
}) {
  const trend =
    typeof deltaPct !== 'number' ? null : deltaPct > 0 ? 'up' : deltaPct < 0 ? 'down' : 'flat'
  const trendColor = trend === 'up' ? 'green' : trend === 'down' ? 'red' : 'default'

  return (
    <Card className="app-card" bordered={false}>
      <Space direction="vertical" size={4} style={{ width: '100%' }}>
        <Typography.Text type="secondary">{title}</Typography.Text>
        <Typography.Title level={4} style={{ margin: 0 }}>
          {value}
        </Typography.Title>
        {previousValue !== undefined ? (
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            Período anterior: {previousValue}
          </Typography.Text>
        ) : null}
        {typeof deltaPct === 'number' ? (
          <Tag color={trendColor}>
            {trend === 'up' ? <ArrowUpOutlined /> : trend === 'down' ? <ArrowDownOutlined /> : <MinusOutlined />}{' '}
            {deltaPct > 0 ? '+' : ''}
            {deltaPct.toFixed(1)}%
          </Tag>
        ) : null}
      </Space>
    </Card>
  )
}
