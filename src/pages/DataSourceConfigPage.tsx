import { useEffect, useState, useCallback } from 'react'
import {
  Alert,
  App,
  AutoComplete,
  Badge,
  Button,
  Card,
  Col,
  Divider,
  Drawer,
  Dropdown,
  Empty,
  Form,
  Input,
  Result,
  Row,
  Select,
  Space,
  Statistic,
  Switch,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd'
import {
  CheckCircleFilled,
  ClockCircleOutlined,
  CloseCircleFilled,
  DatabaseOutlined,
  DeleteOutlined,
  EditOutlined,
  LoadingOutlined,
  MoreOutlined,
  PlusOutlined,
  ReloadOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import {
  listDataSources,
  createDataSource,
  updateDataSource,
  deleteDataSource,
  testDataSourceConnection,
  testDataSourceDraft,
  type DataSource,
  type DataSourceCreatePayload,
  type DataSourceTestResult,
} from '../services/dataSourceService'
import { DataSourceStatus } from '../components/DataSourceStatus'
import { ERP_STANDARD_FIELDS, ERP_ENDPOINT_OPTIONS } from '../api/erpStandardFields'
import { diagnoseFields, type DiagnosticResult, type FieldAnalysis } from '../utils/dataSourceDiagnostic'

const TYPE_OPTIONS = [
  { value: 'rest_api', label: 'Conexao direta' },
  { value: 'sgbr_bi', label: 'SGBR BI (IGA)' },
  { value: 'database_view', label: 'Banco de dados' },
  { value: 'custom', label: 'Personalizado' },
]

const AUTH_OPTIONS = [
  { value: 'none', label: 'Nenhuma' },
  { value: 'bearer_token', label: 'Token de acesso' },
  { value: 'api_key', label: 'Chave de acesso' },
  { value: 'basic_auth', label: 'Usuario e senha' },
]

const PASSWORD_OPTIONS = [
  { value: 'plain', label: 'Texto normal' },
  { value: 'sha256', label: 'SHA-256' },
  { value: 'md5', label: 'MD5' },
]

const TRANSFORM_OPTIONS = [
  { value: 'none', label: 'Nenhuma' },
  { value: 'trim', label: 'Limpar espacos' },
  { value: 'number', label: 'Numero' },
  { value: 'date_iso', label: 'Data' },
  { value: 'uppercase', label: 'Maiusculas' },
  { value: 'lowercase', label: 'Minusculas' },
]

type DataSourceStats = {
  recordCount: number | null
  latencyMs: number | null
  lastRefresh: string | null
  refreshing: boolean
  error: string | null
}

export function DataSourceConfigPage() {
  const [dataSources, setDataSources] = useState<DataSource[]>([])
  const [loading, setLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [testResult, setTestResult] = useState<DataSourceTestResult | null>(null)
  const [diagnostic, setDiagnostic] = useState<DiagnosticResult | null>(null)
  const [testing, setTesting] = useState(false)
  const [stats, setStats] = useState<Record<string, DataSourceStats>>({})
  const [form] = Form.useForm()
  const { notification, modal } = App.useApp()

  const load = async () => {
    setLoading(true)
    try { setDataSources(await listDataSources()) } catch { /* */ }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const refreshStats = useCallback(async (dsId: string) => {
    setStats((prev) => ({ ...prev, [dsId]: { ...prev[dsId], refreshing: true, error: null, recordCount: prev[dsId]?.recordCount ?? null, latencyMs: prev[dsId]?.latencyMs ?? null, lastRefresh: prev[dsId]?.lastRefresh ?? null } }))
    try {
      const result = await testDataSourceConnection(dsId)
      const countMatch = result.message.match(/^(\d+)\s+registro/)
      const count = countMatch ? parseInt(countMatch[1], 10) : 0
      setStats((prev) => ({
        ...prev,
        [dsId]: {
          recordCount: result.success ? count : null,
          latencyMs: result.latencyMs,
          lastRefresh: new Date().toISOString(),
          refreshing: false,
          error: result.success ? null : result.message,
        },
      }))
      load()
    } catch (err) {
      setStats((prev) => ({
        ...prev,
        [dsId]: { recordCount: null, latencyMs: null, lastRefresh: new Date().toISOString(), refreshing: false, error: err instanceof Error ? err.message : 'Erro' },
      }))
    }
  }, [])

  // Buscar stats ao carregar a pagina
  useEffect(() => {
    if (dataSources.length > 0 && Object.keys(stats).length === 0) {
      dataSources.forEach((ds) => refreshStats(ds.id))
    }
  }, [dataSources, stats, refreshStats])

  const openDrawer = (ds?: DataSource) => {
    setTestResult(null)
    setDiagnostic(null)
    if (ds) {
      setEditingId(ds.id)
      form.setFieldsValue({
        name: ds.name, type: ds.type, apiUrl: ds.apiUrl,
        dataEndpoint: ds.dataEndpoint ?? '',
        authMethod: ds.authMethod, authCredentials: '',
        apiLogin: '',
        apiPassword: '',
        isAuthSource: ds.isAuthSource ?? false,
        loginEndpoint: ds.loginEndpoint ?? '',
        loginFieldUser: ds.loginFieldUser ?? 'login',
        loginFieldPassword: ds.loginFieldPassword ?? 'senha',
        passwordMode: ds.passwordMode ?? 'plain',
        erpEndpoints: ds.erpEndpoints,
        fieldMappings: ds.fieldMappings,
      })
    } else {
      setEditingId(null)
      form.resetFields()
    }
    setDrawerOpen(true)
  }

  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)
    setDiagnostic(null)
    try {
      let result: DataSourceTestResult
      if (editingId) {
        result = await testDataSourceConnection(editingId)
      } else {
        const v = form.getFieldsValue()
        result = await testDataSourceDraft({
          name: v.name ?? 'Teste', type: v.type ?? 'rest_api',
          apiUrl: v.apiUrl, authMethod: v.authMethod ?? 'none',
          authCredentials: v.authCredentials || undefined,
          apiLogin: v.apiLogin || undefined,
          apiPassword: v.apiPassword || undefined,
          dataEndpoint: v.dataEndpoint || undefined,
          isAuthSource: v.isAuthSource ?? false,
          passwordMode: v.passwordMode || 'plain',
          loginFieldUser: v.loginFieldUser || 'login',
          loginFieldPassword: v.loginFieldPassword || 'senha',
          erpEndpoints: [], fieldMappings: [],
        })
      }

      setTestResult(result)

      const fields = result.sampleFields ?? []
      if (fields.length > 0) {
        const diag = diagnoseFields(
          fields,
          (result as Record<string, unknown>).fieldTypes as Record<string, string> | undefined,
          (result as Record<string, unknown>).sampleRows as Record<string, unknown>[] | undefined,
        )
        setDiagnostic(diag)
        if ((form.getFieldValue('erpEndpoints') ?? []).length === 0 && diag.suggestedEndpoints.length > 0)
          form.setFieldValue('erpEndpoints', diag.suggestedEndpoints)
        if ((form.getFieldValue('fieldMappings') ?? []).length === 0 && diag.suggestedMappings.length > 0)
          form.setFieldValue('fieldMappings', diag.suggestedMappings)
      }
    } catch (err) {
      setTestResult({ success: false, latencyMs: 0, message: err instanceof Error ? err.message : 'Falha.' })
    } finally {
      setTesting(false)
    }
  }

  const handleSave = async () => {
    try {
      const v = await form.validateFields()
      setSaving(true)
      const payload: DataSourceCreatePayload = {
        name: v.name, type: v.type, apiUrl: v.apiUrl,
        authMethod: v.authMethod,
        authCredentials: v.authCredentials || undefined,
        apiLogin: v.apiLogin || undefined,
        apiPassword: v.apiPassword || undefined,
        erpEndpoints: v.erpEndpoints ?? [],
        fieldMappings: (v.fieldMappings ?? []).filter((m: { standardField?: string; sourceField?: string }) => m.standardField && m.sourceField),
        isAuthSource: v.isAuthSource ?? false,
        loginEndpoint: v.loginEndpoint || undefined,
        dataEndpoint: v.dataEndpoint || undefined,
        passwordMode: v.passwordMode || 'plain',
        loginFieldUser: v.loginFieldUser || 'login',
        loginFieldPassword: v.loginFieldPassword || 'senha',
      }
      if (editingId) { await updateDataSource(editingId, payload); notification.success({ message: 'Atualizado' }) }
      else { await createDataSource(payload); notification.success({ message: 'Conexao criada' }) }
      setDrawerOpen(false)
      load()
    } catch (err) {
      if (err instanceof Error) notification.error({ message: 'Erro', description: err.message })
    } finally { setSaving(false) }
  }

  const handleDelete = (ds: DataSource) => {
    modal.confirm({
      title: `Excluir "${ds.name}"?`, okText: 'Excluir', okButtonProps: { danger: true },
      onOk: async () => { await deleteDataSource(ds.id); notification.success({ message: 'Removida' }); load() },
    })
  }

  const sampleFieldOptions = (testResult?.sampleFields ?? []).map((f) => ({ value: f }))
  const selectedEndpoints: string[] = Form.useWatch('erpEndpoints', form) ?? []
  const standardFieldOptions = selectedEndpoints
    .flatMap((ep) => ERP_STANDARD_FIELDS[ep]?.fields ?? [])
    .filter((v, i, arr) => arr.indexOf(v) === i)
    .map((f) => ({ value: f, label: f }))

  const columns: ColumnsType<DataSource> = [
    { title: 'Nome', dataIndex: 'name' },
    { title: 'Tipo', dataIndex: 'type', width: 130, render: (t: string) => <Tag>{TYPE_OPTIONS.find((o) => o.value === t)?.label ?? t}</Tag> },
    { title: 'Status', width: 140, render: (_: unknown, r: DataSource) => <DataSourceStatus status={r.status} lastCheckedAt={r.lastCheckedAt} lastError={r.lastError} /> },
    {
      title: 'Registros', width: 120,
      render: (_: unknown, r: DataSource) => {
        const s = stats[r.id]
        if (!s || s.refreshing) return <LoadingOutlined />
        if (s.error) return <Tag color="red">Erro</Tag>
        return (
          <Tooltip title={s.latencyMs ? `Latencia: ${s.latencyMs}ms` : undefined}>
            <Tag color="blue" style={{ fontWeight: 600 }}>{s.recordCount?.toLocaleString('pt-BR') ?? 0}</Tag>
          </Tooltip>
        )
      },
    },
    {
      title: 'Ultima consulta', width: 150,
      render: (_: unknown, r: DataSource) => {
        const s = stats[r.id]
        if (!s?.lastRefresh) return '—'
        const d = new Date(s.lastRefresh)
        return (
          <Tooltip title={d.toLocaleString('pt-BR')}>
            <Space size={4}>
              <ClockCircleOutlined style={{ fontSize: 11, color: '#999' }} />
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </Typography.Text>
            </Space>
          </Tooltip>
        )
      },
    },
    { title: 'Login', width: 60, dataIndex: 'isAuthSource', render: (v: boolean) => v ? <Badge status="success" text="Sim" /> : '—' },
    {
      title: '', width: 80,
      render: (_: unknown, record: DataSource) => (
        <Space size={4}>
          <Tooltip title="Atualizar registros">
            <Button
              type="text"
              size="small"
              icon={<ReloadOutlined spin={stats[record.id]?.refreshing} />}
              disabled={stats[record.id]?.refreshing}
              onClick={() => refreshStats(record.id)}
            />
          </Tooltip>
          <Dropdown trigger={['click']} menu={{ items: [
            { key: 'edit', icon: <EditOutlined />, label: 'Editar', onClick: () => openDrawer(record) },
            { key: 'test', icon: <ThunderboltOutlined />, label: 'Testar', onClick: async () => { setEditingId(record.id); const r = await testDataSourceConnection(record.id); notification[r.success ? 'success' : 'error']({ message: r.success ? 'Conectado' : 'Falha', description: r.message }); load() } },
            { type: 'divider' },
            { key: 'del', icon: <DeleteOutlined />, label: 'Excluir', danger: true, onClick: () => handleDelete(record) },
          ] }}>
            <Button type="text" size="small" icon={<MoreOutlined />} />
          </Dropdown>
        </Space>
      ),
    },
  ]

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 0' }}>
      <Space direction="vertical" size={24} style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography.Title level={3} style={{ margin: 0 }}><DatabaseOutlined /> Conexoes</Typography.Title>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openDrawer()}>Nova conexao</Button>
        </div>

        {dataSources.length > 0 && (
          <Row gutter={[12, 12]}>
            <Col xs={24} sm={8}>
              <Card size="small">
                <Statistic
                  title="Conexoes ativas"
                  value={dataSources.filter((d) => d.status === 'connected').length}
                  suffix={`/ ${dataSources.length}`}
                  valueStyle={{ color: 'var(--qc-success)' }}
                  prefix={<DatabaseOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card size="small">
                <Statistic
                  title="Total de registros"
                  value={Object.values(stats).reduce((sum, s) => sum + (s.recordCount ?? 0), 0)}
                  valueStyle={{ color: 'var(--qc-info)' }}
                  loading={Object.values(stats).some((s) => s.refreshing)}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card size="small">
                <Statistic
                  title="Latencia media"
                  value={(() => {
                    const latencies = Object.values(stats).filter((s) => s.latencyMs != null).map((s) => s.latencyMs!)
                    return latencies.length ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 0
                  })()}
                  suffix="ms"
                  loading={Object.values(stats).some((s) => s.refreshing)}
                />
              </Card>
            </Col>
          </Row>
        )}

        <Card size="small">
          {dataSources.length === 0 && !loading ? (
            <Empty description="Nenhuma conexao configurada" image={Empty.PRESENTED_IMAGE_SIMPLE}>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => openDrawer()}>Configurar primeira conexao</Button>
            </Empty>
          ) : (
            <Table dataSource={dataSources} columns={columns} rowKey="id" loading={loading} size="small" pagination={false} />
          )}
        </Card>
      </Space>

      {/* ═══ DRAWER — Tudo em uma tela ═══ */}
      <Drawer
        title={editingId ? 'Editar conexao' : 'Nova conexao'}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={580}
        extra={
          <Button type="primary" loading={saving} onClick={handleSave}>Salvar</Button>
        }
      >
        <Form
          form={form}
          layout="vertical"
          preserve
          initialValues={{
            type: 'rest_api', authMethod: 'none', isAuthSource: false,
            passwordMode: 'plain', loginFieldUser: 'login', loginFieldPassword: 'senha',
            erpEndpoints: [], fieldMappings: [],
          }}
        >
          {/* ── 1. CONEXAO ── */}
          <Typography.Text strong>1. Conexao com o servidor</Typography.Text>
          <div style={{ marginTop: 12 }}>
            <Form.Item label="Nome" name="name" rules={[{ required: true, message: 'Obrigatorio' }]}>
              <Input placeholder="Ex: Sistema principal" />
            </Form.Item>
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item label="Tipo" name="type">
                  <Select options={TYPE_OPTIONS} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Autenticacao" name="authMethod">
                  <Select options={AUTH_OPTIONS} />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item
              label="Endereco do servidor (somente dominio e porta)"
              name="apiUrl"
              rules={[{ required: true }, { type: 'url', message: 'Endereco invalido' }]}
              help="Apenas o endereco base, sem caminhos. Ex: http://108.181.223.103:3007"
            >
              <Input placeholder="http://108.181.223.103:3007" />
            </Form.Item>
            <Form.Item
              label="Caminho dos dados"
              name="dataEndpoint"
              help="Caminho relativo ao servidor. Ex: /sgbrbi/vendas/analitico"
            >
              <Input placeholder="/sgbrbi/vendas/analitico" />
            </Form.Item>

            <Form.Item noStyle shouldUpdate={(p, c) => p.authMethod !== c.authMethod}>
              {({ getFieldValue }) => {
                const m = getFieldValue('authMethod')
                if (m === 'none') return null
                return (
                  <Form.Item label={m === 'bearer_token' ? 'Token' : m === 'api_key' ? 'Chave' : 'Credenciais'} name="authCredentials">
                    <Input.Password placeholder={editingId ? 'Vazio = manter atual' : 'Informe'} />
                  </Form.Item>
                )
              }}
            </Form.Item>
          </div>

          {/* ── 2. LOGIN ── */}
          <Divider />
          <Typography.Text strong>2. Login dos usuarios</Typography.Text>
          <div style={{ marginTop: 12 }}>
            <Form.Item name="isAuthSource" valuePropName="checked">
              <Switch checkedChildren="Ativo" unCheckedChildren="Desativado" />
            </Form.Item>

            <Form.Item noStyle shouldUpdate>
              {({ getFieldValue }) => !getFieldValue('isAuthSource') ? (
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>Ative se os usuarios fazem login por esta conexao.</Typography.Text>
              ) : (
                <>
                  <Form.Item
                    label="Caminho de login"
                    name="loginEndpoint"
                    help="Caminho relativo. Ex: /sgbrbi/usuario/login"
                  >
                    <Input placeholder="/sgbrbi/usuario/login" />
                  </Form.Item>
                  <Row gutter={12}>
                    <Col span={12}>
                      <Form.Item
                        label="Usuario da API (fonte de dados)"
                        name="apiLogin"
                        help="Usado para login automatico da API no backend."
                      >
                        <Input placeholder="Ex: iga" autoComplete="username" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label="Senha da API (fonte de dados)"
                        name="apiPassword"
                        help={editingId ? 'Preencha para atualizar. Em branco = manter atual.' : undefined}
                      >
                        <Input.Password placeholder="Ex: 123456" autoComplete="current-password" />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={12}>
                    <Col span={8}>
                      <Form.Item label="Campo de usuario na API" name="loginFieldUser">
                        <Select options={[
                          { value: 'login', label: 'login' },
                          { value: 'username', label: 'username' },
                          { value: 'user', label: 'user' },
                          { value: 'email', label: 'email' },
                          { value: 'usuario', label: 'usuario' },
                          { value: 'cpf', label: 'cpf' },
                        ]} />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item label="Campo de senha na API" name="loginFieldPassword">
                        <Select options={[
                          { value: 'senha', label: 'senha' },
                          { value: 'password', label: 'password' },
                          { value: 'pass', label: 'pass' },
                          { value: 'pwd', label: 'pwd' },
                          { value: 'secret', label: 'secret' },
                        ]} />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item label="Envio da senha" name="passwordMode">
                        <Select options={PASSWORD_OPTIONS} />
                      </Form.Item>
                    </Col>
                  </Row>
                </>
              )}
            </Form.Item>
          </div>

          {/* ── 3. TESTAR ── */}
          <Divider />
          <Typography.Text strong>3. Testar conexao</Typography.Text>
          <div style={{ marginTop: 12 }}>
            <Button icon={testing ? <LoadingOutlined /> : <ThunderboltOutlined />} loading={testing} onClick={handleTest} type="primary" ghost>
              Testar agora
            </Button>

            {testResult && (
              <div style={{ marginTop: 12 }}>
                <Result
                  status={testResult.success ? 'success' : 'error'}
                  icon={testResult.success ? <CheckCircleFilled style={{ fontSize: 32 }} /> : <CloseCircleFilled style={{ fontSize: 32 }} />}
                  title={testResult.success ? 'Conectado' : 'Falha'}
                  subTitle={testResult.message}
                  style={{ padding: '12px 0' }}
                />

                {!testResult.success && (testResult.message.includes('401') || testResult.message.includes('403')) && (
                  <Alert type="warning" showIcon message="Servidor pede autenticacao — preencha acima" style={{ marginBottom: 8 }} />
                )}

                {testResult.success && (!testResult.sampleFields || testResult.sampleFields.length === 0) && (
                  <Alert type="warning" showIcon message="Conectado mas sem dados — verifique o caminho dos dados" style={{ marginBottom: 8 }} />
                )}

                {/* ── Resumo automático da API ── */}
                {diagnostic?.apiSummary && (
                  <Alert
                    type="info"
                    showIcon
                    message="Análise automática da API"
                    description={diagnostic.apiSummary}
                    style={{ marginBottom: 8 }}
                  />
                )}

                {/* ── Áreas reconhecidas ── */}
                {diagnostic && diagnostic.recognized.length > 0 && (
                  <Card size="small" title="Áreas compatíveis" style={{ marginBottom: 8 }}>
                    {diagnostic.recognized.map((r) => (
                      <div key={r.area} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid var(--qc-border)' }}>
                        <div>
                          <span style={{ fontWeight: 500 }}>{r.label}</span>
                          <Typography.Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
                            {r.matchedFields.length} campos encontrados
                            {r.missingFields.length > 0 && ` · ${r.missingFields.length} faltando`}
                          </Typography.Text>
                        </div>
                        <Tag color={r.confidence === 'alta' ? 'green' : r.confidence === 'media' ? 'orange' : 'default'}>
                          {r.confidence === 'alta' ? 'Compatível' : r.confidence === 'media' ? 'Provável' : 'Possível'}
                        </Tag>
                      </div>
                    ))}
                    {diagnostic.suggestedMappings.length > 0 && (
                      <Typography.Text type="success" style={{ fontSize: 12, marginTop: 8, display: 'block' }}>
                        {diagnostic.suggestedMappings.length} campos mapeados automaticamente
                      </Typography.Text>
                    )}
                  </Card>
                )}

                {/* ── Preview dos campos detectados ── */}
                {diagnostic && diagnostic.fieldAnalysis.length > 0 && (
                  <Card size="small" title={`Campos detectados (${diagnostic.fieldAnalysis.length})`} style={{ marginBottom: 8 }}>
                    <div style={{ maxHeight: 240, overflowY: 'auto' }}>
                      <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--qc-border)', textAlign: 'left' }}>
                            <th style={{ padding: '4px 8px', fontWeight: 600, color: 'var(--qc-text-muted)', fontSize: 11 }}>Campo</th>
                            <th style={{ padding: '4px 8px', fontWeight: 600, color: 'var(--qc-text-muted)', fontSize: 11 }}>Tipo</th>
                            <th style={{ padding: '4px 8px', fontWeight: 600, color: 'var(--qc-text-muted)', fontSize: 11 }}>Função</th>
                            <th style={{ padding: '4px 8px', fontWeight: 600, color: 'var(--qc-text-muted)', fontSize: 11 }}>Exemplo</th>
                          </tr>
                        </thead>
                        <tbody>
                          {diagnostic.fieldAnalysis.map((f: FieldAnalysis) => (
                            <tr key={f.name} style={{ borderBottom: '1px solid var(--qc-border)' }}>
                              <td style={{ padding: '4px 8px', fontWeight: 500, fontFamily: 'monospace' }}>{f.name}</td>
                              <td style={{ padding: '4px 8px' }}>
                                <Tag style={{ fontSize: 10, margin: 0 }}>{f.type}</Tag>
                              </td>
                              <td style={{ padding: '4px 8px' }}>
                                {f.suggestedRole ? (
                                  <Tag color="blue" style={{ fontSize: 10, margin: 0 }}>{f.suggestedRole}</Tag>
                                ) : (
                                  <Typography.Text type="secondary" style={{ fontSize: 11 }}>—</Typography.Text>
                                )}
                              </td>
                              <td style={{ padding: '4px 8px', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--qc-text-muted)' }}>
                                {f.sampleValue !== null && f.sampleValue !== undefined
                                  ? String(f.sampleValue).slice(0, 60)
                                  : <span style={{ opacity: 0.5 }}>null</span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                )}

                {/* ── Campos não reconhecidos ── */}
                {diagnostic && diagnostic.unknownFields.length > 0 && (
                  <div style={{ marginBottom: 8 }}>
                    <Typography.Text type="secondary" style={{ fontSize: 11 }}>Campos da API não usados nas telas do sistema:</Typography.Text>
                    <div style={{ marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {diagnostic.unknownFields.map((f) => <Tag key={f} style={{ fontSize: 11 }}>{f}</Tag>)}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── 4. AREAS E MAPEAMENTO ── */}
          <Divider />
          <Typography.Text strong>4. Areas e mapeamento</Typography.Text>
          <div style={{ marginTop: 12 }}>
            <Form.Item label="Areas alimentadas" name="erpEndpoints">
              <Select mode="multiple" options={ERP_ENDPOINT_OPTIONS} placeholder="Selecione" />
            </Form.Item>

            <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 8, fontSize: 12 }}>
              Relacione os campos do painel com os da API do cliente:
            </Typography.Text>

            <Form.List name="fieldMappings">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...rest }) => (
                    <Row key={key} gutter={6} align="middle" style={{ marginBottom: 6 }}>
                      <Col span={8}>
                        <Form.Item {...rest} name={[name, 'standardField']} style={{ marginBottom: 0 }}>
                          <Select placeholder="Nosso campo" showSearch options={standardFieldOptions} size="small" />
                        </Form.Item>
                      </Col>
                      <Col span={1} style={{ textAlign: 'center', fontSize: 11 }}>→</Col>
                      <Col span={7}>
                        <Form.Item {...rest} name={[name, 'sourceField']} style={{ marginBottom: 0 }}>
                          <AutoComplete placeholder="Campo API" options={sampleFieldOptions} size="small" />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item {...rest} name={[name, 'transform']} initialValue="none" style={{ marginBottom: 0 }}>
                          <Select options={TRANSFORM_OPTIONS} size="small" />
                        </Form.Item>
                      </Col>
                      <Col span={2}>
                        <Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={() => remove(name)} />
                      </Col>
                    </Row>
                  ))}
                  <Button type="dashed" size="small" onClick={() => add({ standardField: '', sourceField: '', transform: 'none' })} block icon={<PlusOutlined />}>
                    Adicionar
                  </Button>
                </>
              )}
            </Form.List>
          </div>
        </Form>
      </Drawer>
    </div>
  )
}
