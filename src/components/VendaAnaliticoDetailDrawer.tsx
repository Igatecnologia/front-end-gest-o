import { Descriptions, Drawer, Tag, Typography } from 'antd'
import dayjs from 'dayjs'
import type { VendaAnaliticaRow } from '../api/schemas'

const KNOWN_KEYS = new Set<string>([
  'data',
  'codprod',
  'decprod',
  'qtdevendida',
  'und',
  'qtdeconvertidavd',
  'precocustoitem',
  'valorunit',
  'total',
  'codcliente',
  'nomecliente',
  'cepcliente',
  'totalprodutos',
  'statuspedido',
  'datafec',
])

function formatBRL(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function statusTagAnalitico(code: string) {
  const c = code.trim().toUpperCase()
  let hint = 'Código de situação enviado pelo ERP; consulte o manual se precisar.'
  let color: 'success' | 'warning' | 'error' | 'default' = 'default'
  if (c === 'F' || c === 'FE' || c === 'PG') {
    hint = 'Faturado / pago / fechado (concluído no sistema).'
    color = 'success'
  } else if (c === 'C' || c === 'X' || c === 'CAN') {
    hint = 'Cancelado.'
    color = 'error'
  } else if (c === 'P' || c === 'A' || c === 'AB') {
    hint = 'Pendente ou em aberto.'
    color = 'warning'
  }
  return (
    <Tag color={color} title={hint}>
      {code}
    </Tag>
  )
}

type Props = {
  open: boolean
  row: VendaAnaliticaRow | null
  onClose: () => void
}

export function VendaAnaliticoDetailDrawer({ open, row, onClose }: Props) {
  if (!row) return null

  const extras = Object.entries(row as Record<string, unknown>).filter(([k]) => !KNOWN_KEYS.has(k))

  return (
    <Drawer
      title="Detalhe da linha de venda"
      placement="right"
      width={560}
      onClose={onClose}
      open={open}
      destroyOnClose
    >
      <Typography.Paragraph type="secondary" style={{ marginTop: 0 }}>
        Valores conforme retornados pela API <Typography.Text code>vendas/analitico</Typography.Text>. Se o ERP enviar
        campos adicionais, eles aparecem em &quot;Outros campos&quot; no fim.
      </Typography.Paragraph>

      <Descriptions column={1} size="small" bordered styles={{ label: { width: 200 } }}>
        <Descriptions.Item label="Data do lançamento">
          {row.data ? dayjs(row.data).format('DD/MM/YYYY HH:mm:ss') : '—'}
        </Descriptions.Item>
        <Descriptions.Item label="Código do produto">{String(row.codprod)}</Descriptions.Item>
        <Descriptions.Item label="Descrição do produto">{row.decprod || '—'}</Descriptions.Item>
        <Descriptions.Item label="Quantidade vendida">
          {row.qtdevendida.toLocaleString('pt-BR')}
        </Descriptions.Item>
        <Descriptions.Item label="Unidade">{row.und || '—'}</Descriptions.Item>
        <Descriptions.Item label="Qtd. convertida (vd)">
          {row.qtdeconvertidavd?.toLocaleString('pt-BR') ?? '—'}
        </Descriptions.Item>
        <Descriptions.Item label="Preço de custo (item)">{formatBRL(row.precocustoitem)}</Descriptions.Item>
        <Descriptions.Item label="Valor unitário (venda)">{formatBRL(row.valorunit)}</Descriptions.Item>
        <Descriptions.Item label="Total da linha (R$)">
          <Typography.Text strong>{formatBRL(row.total)}</Typography.Text>
        </Descriptions.Item>
        <Descriptions.Item label="Código do cliente">{String(row.codcliente)}</Descriptions.Item>
        <Descriptions.Item label="Nome do cliente">{row.nomecliente || '—'}</Descriptions.Item>
        <Descriptions.Item label="CEP do cliente">
          {row.cepcliente != null && String(row.cepcliente).trim() !== ''
            ? String(row.cepcliente)
            : '—'}
        </Descriptions.Item>
        <Descriptions.Item label="Total produtos (campo do pedido)">
          {row.totalprodutos?.toLocaleString('pt-BR') ?? '—'}
        </Descriptions.Item>
        <Descriptions.Item label="Situação do pedido">{statusTagAnalitico(row.statuspedido)}</Descriptions.Item>
        <Descriptions.Item label="Data de fechamento">
          {row.datafec ? dayjs(row.datafec).format('DD/MM/YYYY HH:mm:ss') : '—'}
        </Descriptions.Item>
      </Descriptions>

      {extras.length > 0 ? (
        <div style={{ marginTop: 16 }}>
          <Typography.Title level={5}>Outros campos da API</Typography.Title>
          <pre
            style={{
              margin: 0,
              padding: 12,
              background: 'var(--ant-color-fill-quaternary, rgba(0,0,0,0.04))',
              borderRadius: 8,
              fontSize: 12,
              overflow: 'auto',
              maxHeight: 280,
            }}
          >
            {JSON.stringify(Object.fromEntries(extras), null, 2)}
          </pre>
        </div>
      ) : null}
    </Drawer>
  )
}
