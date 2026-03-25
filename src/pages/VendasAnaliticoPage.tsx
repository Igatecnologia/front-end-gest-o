import { EyeOutlined, ReloadOutlined } from '@ant-design/icons'
import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Empty,
  Input,
  Row,
  Skeleton,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { DevErrorDetail } from '../components/DevErrorDetail'
import { VendaAnaliticoDetailDrawer } from '../components/VendaAnaliticoDetailDrawer'
import { SGBR_ANALITICO_STALE_MS, SGBR_BI_ACTIVE } from '../api/apiEnv'
import { getErrorMessage } from '../api/httpError'
import type { VendaAnaliticaRow } from '../api/schemas'
import { PageHeaderCard } from '../components/PageHeaderCard'
import { queryKeys } from '../query/queryKeys'
import { getVendasAnalitico } from '../services/vendasAnaliticoService'
import { nowBr } from '../utils/dayjsBr'

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

function defaultRange(): { start: string; end: string } {
  const end = nowBr()
  const start = end.subtract(30, 'day')
  return { start: start.format('YYYY-MM-DD'), end: end.format('YYYY-MM-DD') }
}

export function VendasAnaliticoPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { start: defStart, end: defEnd } = defaultRange()
  const start = searchParams.get('start') ?? defStart
  const end = searchParams.get('end') ?? defEnd
  const q = (searchParams.get('q') ?? '').trim().toLowerCase()

  const biConfigured = SGBR_BI_ACTIVE
  const [detailRow, setDetailRow] = useState<VendaAnaliticaRow | null>(null)

  const query = useQuery({
    queryKey: queryKeys.vendasAnalitico({ dtDe: start, dtAte: end }),
    queryFn: () => getVendasAnalitico({ dtDe: start, dtAte: end }),
    enabled: biConfigured,
    staleTime: SGBR_ANALITICO_STALE_MS,
  })

  const filtered = useMemo(() => {
    const rows = query.data ?? []
    if (!q) return rows
    return rows.filter((row) => {
      const prod = String(row.decprod).toLowerCase()
      const cli = String(row.nomecliente).toLowerCase()
      const codP = String(row.codprod).toLowerCase()
      const codC = String(row.codcliente).toLowerCase()
      return prod.includes(q) || cli.includes(q) || codP.includes(q) || codC.includes(q)
    })
  }, [query.data, q])

  const totals = useMemo(() => {
    const sumTotal = filtered.reduce((acc, r) => acc + r.total, 0)
    const sumQtd = filtered.reduce((acc, r) => acc + r.qtdevendida, 0)
    return { sumTotal, sumQtd, count: filtered.length }
  }, [filtered])

  const columns: ColumnsType<VendaAnaliticaRow> = [
    {
      title: 'Data',
      dataIndex: 'data',
      key: 'data',
      width: 118,
      render: (v: string) => dayjs(v).format('DD/MM/YYYY HH:mm'),
      sorter: (a, b) => dayjs(a.data).valueOf() - dayjs(b.data).valueOf(),
    },
    {
      title: 'Produto',
      key: 'prod',
      ellipsis: true,
      render: (_, row) => (
        <span>
          <Typography.Text strong>{row.codprod}</Typography.Text>
          <Typography.Text type="secondary"> — {row.decprod}</Typography.Text>
        </span>
      ),
    },
    {
      title: 'Qtd vendida',
      dataIndex: 'qtdevendida',
      key: 'qtdevendida',
      width: 88,
      align: 'right',
      sorter: (a, b) => a.qtdevendida - b.qtdevendida,
    },
    {
      title: 'Und',
      dataIndex: 'und',
      key: 'und',
      width: 64,
    },
    {
      title: 'Preço unitário',
      dataIndex: 'valorunit',
      key: 'valorunit',
      width: 112,
      align: 'right',
      render: (v: number) => formatBRL(v),
      sorter: (a, b) => a.valorunit - b.valorunit,
    },
    {
      title: 'Total R$ (linha)',
      dataIndex: 'total',
      key: 'total',
      width: 120,
      align: 'right',
      render: (v: number) => formatBRL(v),
      sorter: (a, b) => a.total - b.total,
    },
    {
      title: 'Cliente',
      key: 'cli',
      ellipsis: true,
      render: (_, row) => (
        <span>
          <Typography.Text strong>{row.codcliente}</Typography.Text>
          <Typography.Text type="secondary"> — {row.nomecliente}</Typography.Text>
        </span>
      ),
    },
    {
      title: 'Situação',
      dataIndex: 'statuspedido',
      key: 'statuspedido',
      width: 100,
      render: (s: string) => statusTagAnalitico(s),
    },
    {
      title: 'Data fechamento',
      dataIndex: 'datafec',
      key: 'datafec',
      width: 112,
      render: (v: string) => (v ? dayjs(v).format('DD/MM/YYYY') : '—'),
    },
    {
      title: 'Ações',
      key: 'actions',
      width: 108,
      fixed: 'right',
      render: (_, row) => (
        <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => setDetailRow(row)}>
          Detalhes
        </Button>
      ),
    },
  ]

  const header = (
    <PageHeaderCard
      title="Vendas analítico (SGBR BI)"
      subtitle="Cada linha da tabela é um movimento de venda retornado pela API. Use o período e a busca para focar em cliente ou produto; os totais em cima somam só o que está visível (após o filtro)."
      extra={
        <Button icon={<ReloadOutlined />} onClick={() => query.refetch()} disabled={!biConfigured}>
          Atualizar
        </Button>
      }
    />
  )

  if (!biConfigured) {
    return (
      <Space orientation="vertical" size={16} style={{ width: '100%' }}>
        {header}
        <Alert
          type="warning"
          showIcon
          title="API SGBR BI não configurada"
          description={
            <>
              No <Typography.Text code>npm run dev</Typography.Text>, use{' '}
              <Typography.Text code>VITE_SGBR_BI_BASE_URL=proxy</Typography.Text> (evita CORS via Vite) ou a URL
              absoluta do servidor. Em produção, use a URL absoluta; o backend deve enviar headers CORS. Faça
              login SGBR para obter o JWT usado aqui.
            </>
          }
        />
      </Space>
    )
  }

  if (query.isLoading) {
    return (
      <Space orientation="vertical" size={16} style={{ width: '100%' }}>
        {header}
        <Card className="app-card" variant="borderless">
          <Skeleton active paragraph={{ rows: 6 }} />
        </Card>
      </Space>
    )
  }

  if (query.isError) {
    return (
      <Space orientation="vertical" size={16} style={{ width: '100%' }}>
        {header}
        <Alert
          type="error"
          showIcon
          title="Não foi possível carregar as vendas"
          description={
            <>
              {getErrorMessage(query.error, 'Erro desconhecido.')}
              <DevErrorDetail error={query.error} />
            </>
          }
          action={
            <Button size="small" onClick={() => query.refetch()}>
              Tentar novamente
            </Button>
          }
        />
      </Space>
    )
  }

  return (
    <Space orientation="vertical" size={16} style={{ width: '100%' }}>
      {header}

      <Alert
        type="info"
        showIcon
        title="Leitura rápida das colunas"
        description={
          <ul style={{ margin: '8px 0 0', paddingLeft: 18 }}>
            <li>
              <strong>Data</strong> — momento do lançamento; <strong>Produto</strong> — código e nome; <strong>Qtd vendida
              </strong> — unidades nesta linha.
            </li>
            <li>
              <strong>Preço unitário</strong> e <strong>Total R$</strong> — valores de venda; <strong>Cliente</strong> —
              quem comprou.
            </li>
            <li>
              <strong>Situação</strong> — código do ERP (passe o mouse na etiqueta para uma tradução comum).{' '}
              <strong>Data fechamento</strong> — quando o pedido foi encerrado, se informado.
            </li>
            <li>
              <strong>Detalhes</strong> (última coluna) abre o painel com todos os campos da linha e eventuais campos
              extras enviados pelo ERP.
            </li>
          </ul>
        }
      />

      <Card className="app-card" variant="borderless">
        <Row gutter={[12, 12]}>
          <Col xs={24} md={10}>
            <Input.Search
              allowClear
              placeholder="Buscar por cliente, produto ou código"
              value={searchParams.get('q') ?? ''}
              onChange={(e) => {
                const next = e.target.value
                setSearchParams((prev) => {
                  const p = new URLSearchParams(prev)
                  if (next.trim()) p.set('q', next)
                  else p.delete('q')
                  return p
                })
              }}
            />
          </Col>
          <Col xs={24} md={14}>
            <DatePicker.RangePicker
              style={{ width: '100%' }}
              value={[dayjs(start), dayjs(end)]}
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
          </Col>
        </Row>
      </Card>

      <Card className="app-card quantum-table" variant="borderless" title="Todas as linhas do período (detalhe)">
        <Space wrap style={{ marginBottom: 12 }}>
          <Tag color="blue">Linhas exibidas: {totals.count}</Tag>
          <Tag color="green">Soma das quantidades: {totals.sumQtd.toLocaleString('pt-BR')}</Tag>
          <Tag color="purple">Soma dos totais R$: {formatBRL(totals.sumTotal)}</Tag>
        </Space>
        {totals.count === 0 ? (
          <Empty description="Nenhum registro no período (ou nada encontrado na busca)." />
        ) : (
          <Table<VendaAnaliticaRow>
            rowKey={(row, index) =>
              `${row.data}-${row.codprod}-${row.codcliente}-${row.total}-${row.valorunit}-${index}`
            }
            columns={columns}
            dataSource={filtered}
            scroll={{ x: 1200 }}
            pagination={{ pageSize: 15, showSizeChanger: true, pageSizeOptions: [15, 30, 50] }}
          />
        )}
      </Card>

      <VendaAnaliticoDetailDrawer
        open={detailRow != null}
        row={detailRow}
        onClose={() => setDetailRow(null)}
      />
    </Space>
  )
}
