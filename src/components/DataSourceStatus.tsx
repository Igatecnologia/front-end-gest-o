import { Badge, Tooltip, Typography } from 'antd'

type DataSourceStatusProps = {
  status: 'connected' | 'error' | 'pending' | 'disabled'
  lastCheckedAt?: string | null
  lastError?: string | null
  compact?: boolean
}

const STATUS_MAP: Record<string, { badge: 'success' | 'error' | 'processing' | 'default'; label: string }> = {
  connected: { badge: 'success', label: 'Conectado' },
  error: { badge: 'error', label: 'Erro' },
  pending: { badge: 'processing', label: 'Pendente' },
  disabled: { badge: 'default', label: 'Desativado' },
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'agora'
  if (mins < 60) return `${mins}min atrás`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h atrás`
  return new Date(iso).toLocaleDateString('pt-BR')
}

export function DataSourceStatus({ status, lastCheckedAt, lastError, compact }: DataSourceStatusProps) {
  const st = STATUS_MAP[status] ?? STATUS_MAP.pending

  const badge = <Badge status={st.badge} text={compact ? undefined : st.label} />

  if (status === 'error' && lastError) {
    return (
      <Tooltip title={lastError}>
        <span style={{ cursor: 'help' }}>
          {badge}
          {!compact && lastCheckedAt && (
            <Typography.Text type="secondary" style={{ fontSize: 11, marginLeft: 8 }}>
              {formatRelativeTime(lastCheckedAt)}
            </Typography.Text>
          )}
        </span>
      </Tooltip>
    )
  }

  return (
    <span>
      {badge}
      {!compact && lastCheckedAt && (
        <Typography.Text type="secondary" style={{ fontSize: 11, marginLeft: 8 }}>
          {formatRelativeTime(lastCheckedAt)}
        </Typography.Text>
      )}
    </span>
  )
}
