import {
  Badge,
  Card,
  Col,
  Progress,
  Row,
  Skeleton,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { AlertOutlined, WarningOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { MetricCard } from '../components/MetricCard'
import { queryKeys } from '../query/queryKeys'
import {
  getLotesProducao,
  getPedidos,
  getOrdensProducao,
  getFaturamentos,
  getCustoRealProdutos,
  getAlertasOperacionais,
  getMovimentosEstoque,
} from '../services/erpService'
import type {
  CustoRealProduto,
  MovimentoEstoque,
} from '../types/models'

/* ── Helpers ── */

function formatBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function margemColor(pct: number): string {
  if (pct < 30) return '#f5222d'
  if (pct < 40) return '#fa8c16'
  return '#52c41a'
}

function severityColor(s: 'alta' | 'media' | 'baixa') {
  if (s === 'alta') return 'red'
  if (s === 'media') return 'orange'
  return 'blue'
}

function statusColor(s: string) {
  switch (s) {
    case 'Concluído': return 'green'
    case 'Faturado': return 'cyan'
    case 'Em Produção': return 'processing'
    case 'Pendente': return 'default'
    case 'Cancelado': return 'red'
    case 'Emitida': return 'green'
    default: return 'default'
  }
}

/* ── Tipagem auxiliar ── */

type DensidadeRow = {
  densidade: string
  lotes: number
  volumeM3: number
  custoTotal: number
  custoPorM3: number
}

type ClienteRow = {
  cliente: string
  pedidos: number
  valorTotal: number
  volumeM3: number
}

type EstoqueRow = {
  key: string
  nivel: string
  item: string
  saldo: number
  unidade: string
}

type ConciliacaoRow = {
  key: string
  pedidoId: string
  cliente: string
  valorPedido: number
  statusPedido: string
  opId: string
  statusOp: string
  nf: string
  valorFaturado: number
  statusFat: string
}

/* ══════════════════════════════════════════════ */

export function DashboardOperacionalPage() {
  /* ── Queries ── */

  const lotesQ = useQuery({
    queryKey: queryKeys.lotesProducao(),
    queryFn: getLotesProducao,
    staleTime: 30_000,
  })

  const pedidosQ = useQuery({
    queryKey: queryKeys.pedidos(),
    queryFn: getPedidos,
    staleTime: 30_000,
  })

  const ordensQ = useQuery({
    queryKey: queryKeys.ordensProducao(),
    queryFn: getOrdensProducao,
    staleTime: 30_000,
  })

  const fatQ = useQuery({
    queryKey: queryKeys.faturamentos(),
    queryFn: getFaturamentos,
    staleTime: 30_000,
  })

  const custoQ = useQuery({
    queryKey: queryKeys.custoRealProdutos(),
    queryFn: getCustoRealProdutos,
    staleTime: 30_000,
  })

  const alertasQ = useQuery({
    queryKey: queryKeys.alertasOperacionais(),
    queryFn: getAlertasOperacionais,
    staleTime: 30_000,
  })

  const movQ = useQuery({
    queryKey: queryKeys.movimentosEstoque(),
    queryFn: getMovimentosEstoque,
    staleTime: 30_000,
  })

  const loading =
    lotesQ.isLoading ||
    pedidosQ.isLoading ||
    ordensQ.isLoading ||
    fatQ.isLoading ||
    custoQ.isLoading ||
    alertasQ.isLoading ||
    movQ.isLoading

  const lotes = useMemo(() => lotesQ.data ?? [], [lotesQ.data])
  const pedidos = useMemo(() => pedidosQ.data ?? [], [pedidosQ.data])
  const ordens = useMemo(() => ordensQ.data ?? [], [ordensQ.data])
  const faturamentos = useMemo(() => fatQ.data ?? [], [fatQ.data])
  const custoReal = useMemo(() => custoQ.data ?? [], [custoQ.data])
  const alertas = useMemo(() => alertasQ.data ?? [], [alertasQ.data])
  const movimentos = useMemo(() => movQ.data ?? [], [movQ.data])

  /* ── KPIs ── */

  const lotesConcluidos = useMemo(
    () => lotes.filter((l) => l.status === 'Concluído'),
    [lotes],
  )

  const producaoM3 = useMemo(
    () => lotesConcluidos.reduce((s, l) => s + l.volumeTotalM3, 0),
    [lotesConcluidos],
  )

  const custoMedioM3 = useMemo(() => {
    if (!lotesConcluidos.length) return 0
    const totalCusto = lotesConcluidos.reduce((s, l) => s + l.custoTotalLote, 0)
    return producaoM3 > 0 ? totalCusto / producaoM3 : 0
  }, [lotesConcluidos, producaoM3])

  const faturamentoTotal = useMemo(
    () =>
      faturamentos
        .filter((f) => f.status === 'Emitida')
        .reduce((s, f) => s + f.valorTotal, 0),
    [faturamentos],
  )

  const pedidosEmAberto = useMemo(
    () => pedidos.filter((p) => p.status !== 'Faturado' && p.status !== 'Cancelado').length,
    [pedidos],
  )

  const opsEmAndamento = useMemo(
    () => ordens.filter((o) => o.status === 'Em Produção').length,
    [ordens],
  )

  const margemMedia = useMemo(() => {
    if (!custoReal.length) return 0
    return custoReal.reduce((s, c) => s + c.margemRealPct, 0) / custoReal.length
  }, [custoReal])

  /* ── Alertas não lidos ── */

  const alertasNaoLidos = useMemo(
    () => alertas.filter((a) => !a.lido).slice(0, 3),
    [alertas],
  )

  /* ── Produção por Densidade ── */

  const densidadeRows = useMemo<DensidadeRow[]>(() => {
    const map = new Map<string, { lotes: number; vol: number; custo: number }>()
    for (const l of lotesConcluidos) {
      const curr = map.get(l.densidade) ?? { lotes: 0, vol: 0, custo: 0 }
      curr.lotes += 1
      curr.vol += l.volumeTotalM3
      curr.custo += l.custoTotalLote
      map.set(l.densidade, curr)
    }
    return Array.from(map.entries())
      .map(([d, v]) => ({
        densidade: d,
        lotes: v.lotes,
        volumeM3: v.vol,
        custoTotal: v.custo,
        custoPorM3: v.vol > 0 ? v.custo / v.vol : 0,
      }))
      .sort((a, b) => b.volumeM3 - a.volumeM3)
  }, [lotesConcluidos])

  /* ── Top 5 Produtos por Margem (piores primeiro) ── */

  const top5Margem = useMemo(
    () => [...custoReal].sort((a, b) => a.margemRealPct - b.margemRealPct).slice(0, 5),
    [custoReal],
  )

  /* ── Vendas por Cliente ── */

  const clienteRows = useMemo<ClienteRow[]>(() => {
    const map = new Map<string, { pedidos: number; valor: number; vol: number }>()
    for (const p of pedidos) {
      const curr = map.get(p.cliente) ?? { pedidos: 0, valor: 0, vol: 0 }
      curr.pedidos += 1
      curr.valor += p.totalValor
      curr.vol += p.totalM3
      map.set(p.cliente, curr)
    }
    return Array.from(map.entries())
      .map(([c, v]) => ({
        cliente: c,
        pedidos: v.pedidos,
        valorTotal: v.valor,
        volumeM3: v.vol,
      }))
      .sort((a, b) => b.valorTotal - a.valorTotal)
      .slice(0, 5)
  }, [pedidos])

  /* ── Estoque Resumido ── */

  const estoqueRows = useMemo<EstoqueRow[]>(() => {
    const latest = new Map<string, MovimentoEstoque>()
    for (const m of movimentos) {
      const key = `${m.nivelEstoque}::${m.item}`
      const curr = latest.get(key)
      if (!curr || m.id > curr.id) latest.set(key, m)
    }
    return Array.from(latest.values()).map((m) => ({
      key: m.id,
      nivel: m.nivelEstoque,
      item: m.item,
      saldo: m.saldoAtual,
      unidade: m.unidade,
    }))
  }, [movimentos])

  /* ── Conciliação Pedido × Produzido × Faturado ── */

  const conciliacaoRows = useMemo<ConciliacaoRow[]>(() => {
    return pedidos.map((p) => {
      const op = ordens.find((o) => o.pedidoIds.includes(p.id))
      const fat = faturamentos.find((f) => f.pedidoId === p.id)
      return {
        key: p.id,
        pedidoId: p.id,
        cliente: p.cliente,
        valorPedido: p.totalValor,
        statusPedido: p.status,
        opId: op?.id ?? '—',
        statusOp: op?.status ?? '—',
        nf: fat?.numeroNF || '—',
        valorFaturado: fat?.valorTotal ?? 0,
        statusFat: fat?.status ?? '—',
      }
    })
  }, [pedidos, ordens, faturamentos])

  /* ── Colunas das tabelas ── */

  const densidadeCols: ColumnsType<DensidadeRow> = [
    { title: 'Densidade', dataIndex: 'densidade', key: 'densidade' },
    { title: 'Lotes', dataIndex: 'lotes', key: 'lotes', align: 'center' },
    {
      title: 'Volume m³',
      dataIndex: 'volumeM3',
      key: 'volumeM3',
      align: 'right',
      render: (v: number) => v.toFixed(2),
    },
    {
      title: 'Custo Total',
      dataIndex: 'custoTotal',
      key: 'custoTotal',
      align: 'right',
      render: (v: number) => formatBRL(v),
    },
    {
      title: 'Custo/m³',
      dataIndex: 'custoPorM3',
      key: 'custoPorM3',
      align: 'right',
      render: (v: number) => formatBRL(v),
    },
  ]

  const margemCols: ColumnsType<CustoRealProduto> = [
    {
      title: 'Produto',
      dataIndex: 'produto',
      key: 'produto',
      render: (v: string, r) =>
        r.margemRealPct < 30 ? (
          <Space size={4}>
            <WarningOutlined style={{ color: '#f5222d' }} />
            {v}
          </Space>
        ) : (
          v
        ),
    },
    {
      title: 'Custo Real',
      dataIndex: 'custoRealTotal',
      key: 'custoReal',
      align: 'right',
      render: (v: number) => formatBRL(v),
    },
    {
      title: 'Preço',
      dataIndex: 'precoVenda',
      key: 'preco',
      align: 'right',
      render: (v: number) => formatBRL(v),
    },
    {
      title: 'Margem Real',
      dataIndex: 'margemRealPct',
      key: 'margem',
      align: 'center',
      width: 160,
      render: (v: number) => (
        <Space size={8}>
          <Progress
            percent={v}
            size="small"
            strokeColor={margemColor(v)}
            showInfo={false}
            style={{ width: 60 }}
          />
          <span style={{ color: margemColor(v), fontWeight: 600 }}>{v.toFixed(1)}%</span>
        </Space>
      ),
    },
  ]

  const clienteCols: ColumnsType<ClienteRow> = [
    { title: 'Cliente', dataIndex: 'cliente', key: 'cliente' },
    { title: 'Pedidos', dataIndex: 'pedidos', key: 'pedidos', align: 'center' },
    {
      title: 'Valor Total',
      dataIndex: 'valorTotal',
      key: 'valor',
      align: 'right',
      render: (v: number) => formatBRL(v),
    },
    {
      title: 'Volume m³',
      dataIndex: 'volumeM3',
      key: 'vol',
      align: 'right',
      render: (v: number) => v.toFixed(2),
    },
  ]

  const estoqueCols: ColumnsType<EstoqueRow> = [
    { title: 'Nível', dataIndex: 'nivel', key: 'nivel' },
    { title: 'Item', dataIndex: 'item', key: 'item' },
    {
      title: 'Saldo Atual',
      dataIndex: 'saldo',
      key: 'saldo',
      align: 'right',
      render: (v: number, r) => {
        if (r.nivel === 'Produto Base' && v < 5) {
          return <Tag color="red">{v.toFixed(2)}</Tag>
        }
        return v.toFixed(2)
      },
    },
    { title: 'Unidade', dataIndex: 'unidade', key: 'unidade', align: 'center' },
  ]

  const conciliacaoCols: ColumnsType<ConciliacaoRow> = [
    { title: 'Pedido', dataIndex: 'pedidoId', key: 'ped' },
    { title: 'Cliente', dataIndex: 'cliente', key: 'cli' },
    {
      title: 'Valor Pedido',
      dataIndex: 'valorPedido',
      key: 'vp',
      align: 'right',
      render: (v: number) => formatBRL(v),
    },
    {
      title: 'Status Pedido',
      dataIndex: 'statusPedido',
      key: 'sp',
      align: 'center',
      render: (v: string) => <Tag color={statusColor(v)}>{v}</Tag>,
    },
    { title: 'OP', dataIndex: 'opId', key: 'op', align: 'center' },
    {
      title: 'Status OP',
      dataIndex: 'statusOp',
      key: 'sop',
      align: 'center',
      render: (v: string) => (v === '—' ? '—' : <Tag color={statusColor(v)}>{v}</Tag>),
    },
    { title: 'NF', dataIndex: 'nf', key: 'nf', align: 'center' },
    {
      title: 'Valor Faturado',
      dataIndex: 'valorFaturado',
      key: 'vf',
      align: 'right',
      render: (v: number) => (v ? formatBRL(v) : '—'),
    },
    {
      title: 'Status Fat.',
      dataIndex: 'statusFat',
      key: 'sf',
      align: 'center',
      render: (v: string) => (v === '—' ? '—' : <Tag color={statusColor(v)}>{v}</Tag>),
    },
  ]

  /* ── Render ── */

  if (loading) {
    return (
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Row gutter={[16, 16]}>
          {[1, 2, 3, 4, 5, 6].map((k) => (
            <Col key={k} xs={24} sm={12} lg={8} xl={4}>
              <Card>
                <Skeleton active paragraph={{ rows: 1 }} />
              </Card>
            </Col>
          ))}
        </Row>
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card><Skeleton active paragraph={{ rows: 5 }} /></Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card><Skeleton active paragraph={{ rows: 5 }} /></Card>
          </Col>
        </Row>
        <Card><Skeleton active paragraph={{ rows: 6 }} /></Card>
      </Space>
    )
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {/* ── Row 1: Alertas Ativos ── */}
      {alertasNaoLidos.length > 0 && (
        <Card
          className="app-card"
          variant="borderless"
          style={{ background: 'rgba(255, 77, 79, 0.06)', borderLeft: '4px solid #f5222d' }}
          title={
            <Space>
              <AlertOutlined style={{ color: '#f5222d' }} />
              <span>Alertas Ativos</span>
              <Badge count={alertas.filter((a) => !a.lido).length} />
            </Space>
          }
        >
          <Space direction="vertical" size={8} style={{ width: '100%' }}>
            {alertasNaoLidos.map((a) => (
              <div key={a.id} style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <Tag color={severityColor(a.severidade)} style={{ minWidth: 52, textAlign: 'center' }}>
                  {a.severidade}
                </Tag>
                <div>
                  <Typography.Text strong>{a.titulo}</Typography.Text>
                  <br />
                  <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                    {a.descricao}
                  </Typography.Text>
                </div>
              </div>
            ))}
            <Typography.Link style={{ fontSize: 13 }}>Ver todos os alertas →</Typography.Link>
          </Space>
        </Card>
      )}

      {/* ── Row 2: KPIs Principais ── */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={8} xl={4}>
          <MetricCard title="Produção m³/mês" value={`${producaoM3.toFixed(2)} m³`} />
        </Col>
        <Col xs={24} sm={12} lg={8} xl={4}>
          <MetricCard title="Custo Médio/m³" value={formatBRL(custoMedioM3)} />
        </Col>
        <Col xs={24} sm={12} lg={8} xl={4}>
          <MetricCard title="Faturamento" value={formatBRL(faturamentoTotal)} />
        </Col>
        <Col xs={24} sm={12} lg={8} xl={4}>
          <MetricCard title="Pedidos em Aberto" value={pedidosEmAberto} />
        </Col>
        <Col xs={24} sm={12} lg={8} xl={4}>
          <MetricCard title="OPs em Andamento" value={opsEmAndamento} />
        </Col>
        <Col xs={24} sm={12} lg={8} xl={4}>
          <MetricCard
            title="Margem Média Real"
            value={
              <span style={{ color: margemColor(margemMedia) }}>
                {margemMedia.toFixed(1)}%
              </span>
            }
          />
        </Col>
      </Row>

      {/* ── Row 3: Produção por Densidade + Top 5 Margem ── */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card className="app-card" variant="borderless" title="Produção por Densidade">
            <Table<DensidadeRow>
              dataSource={densidadeRows}
              columns={densidadeCols}
              rowKey="densidade"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card className="app-card" variant="borderless" title="Top 5 Produtos por Margem (piores)">
            <Table<CustoRealProduto>
              dataSource={top5Margem}
              columns={margemCols}
              rowKey="fichaTecnicaId"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      {/* ── Row 4: Vendas por Cliente + Estoque Resumido ── */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card className="app-card" variant="borderless" title="Vendas por Cliente">
            <Table<ClienteRow>
              dataSource={clienteRows}
              columns={clienteCols}
              rowKey="cliente"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card className="app-card" variant="borderless" title="Estoque Resumido">
            <Table<EstoqueRow>
              dataSource={estoqueRows}
              columns={estoqueCols}
              rowKey="key"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      {/* ── Row 5: Conciliação ── */}
      <Card
        className="app-card"
        variant="borderless"
        title="Conciliação Pedido × Produzido × Faturado"
      >
        <Table<ConciliacaoRow>
          dataSource={conciliacaoRows}
          columns={conciliacaoCols}
          rowKey="key"
          pagination={false}
          size="small"
          scroll={{ x: 1000 }}
        />
      </Card>
    </Space>
  )
}
