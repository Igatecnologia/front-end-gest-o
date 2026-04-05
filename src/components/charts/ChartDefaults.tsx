/**
 * Configuracoes padrao para graficos Recharts.
 * Importar e usar em todos os graficos para consistencia visual.
 */
import { formatBRL, formatCompact } from '../../utils/formatters'

export { CHART_COLORS } from '../../theme/colors'

/** Tooltip escuro profissional — usar em todos os graficos */
export function ChartTooltip({
  active,
  payload,
  label,
  format = 'currency',
}: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
  format?: 'currency' | 'integer' | 'compact'
}) {
  if (!active || !payload?.length) return null

  const fmt = (v: number) => {
    if (format === 'currency') return formatBRL(v)
    if (format === 'compact') return formatCompact(v)
    return v.toLocaleString('pt-BR')
  }

  return (
    <div
      style={{
        background: '#0F172A',
        border: 'none',
        borderRadius: 8,
        padding: '10px 14px',
        boxShadow: '0 4px 16px rgb(0 0 0 / 0.25)',
        maxWidth: 280,
      }}
    >
      {label && (
        <p
          style={{
            color: '#94A3B8',
            fontSize: 11,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            margin: '0 0 6px',
          }}
        >
          {label}
        </p>
      )}
      {payload.map((entry, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: entry.color,
              flexShrink: 0,
            }}
          />
          <span style={{ color: '#94A3B8', fontSize: 12 }}>{entry.name}</span>
          <span
            style={{
              color: '#F8FAFC',
              fontSize: 13,
              fontWeight: 600,
              fontVariantNumeric: 'tabular-nums',
              marginLeft: 'auto',
            }}
          >
            {fmt(entry.value)}
          </span>
        </div>
      ))}
    </div>
  )
}

/** CartesianGrid — so linhas horizontais, sem ruido */
export const gridProps = {
  strokeDasharray: '3 3',
  stroke: '#E2E8F0',
  vertical: false,
} as const

/** XAxis limpo */
export const xAxisProps = {
  tick: { fontSize: 12, fill: '#94A3B8', fontWeight: 500 },
  axisLine: false,
  tickLine: false,
} as const

/** YAxis limpo */
export const yAxisProps = {
  tick: { fontSize: 12, fill: '#94A3B8' },
  axisLine: false,
  tickLine: false,
  width: 72,
} as const
