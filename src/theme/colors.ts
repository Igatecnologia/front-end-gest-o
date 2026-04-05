/**
 * Paleta IGA — sistema de cores para BI executivo.
 * Usar CHART_COLORS para graficos Recharts e deltaColor() para indicadores.
 */
export const colors = {
  series: [
    '#3B82F6', // azul — principal
    '#10B981', // esmeralda — positivo
    '#F59E0B', // ambar — destaque
    '#8B5CF6', // violeta
    '#F43F5E', // rosa-red — negativo
    '#06B6D4', // ciano
    '#84CC16', // lima
    '#FB923C', // laranja
  ],

  status: {
    positive: '#10B981',
    negative: '#F43F5E',
    neutral: '#94A3B8',
    warning: '#F59E0B',
    info: '#3B82F6',
  },
} as const

export const CHART_COLORS = colors.series

export function deltaColor(value: number): string {
  if (value > 0) return colors.status.positive
  if (value < 0) return colors.status.negative
  return colors.status.neutral
}
