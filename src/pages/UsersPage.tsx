import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import {
  Alert,
  App,
  Button,
  Card,
  Col,
  DatePicker,
  Empty,
  Form,
  Input,
  Modal,
  Popconfirm,
  Row,
  Select,
  Skeleton,
  Space,
  Tag,
} from 'antd'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import { PageHeaderCard } from '../components/PageHeaderCard'
import { DatePresetRange } from '../components/DatePresetRange'
import { MetricCard } from '../components/MetricCard'
import { VirtualTable, type VirtualColumn } from '../components/VirtualTable'
import { useAuth } from '../auth/AuthContext'
import { hasPermission } from '../auth/permissions'
import type { User, UserRole } from '../mocks/users'
import { createUser, deleteUser, listUsers, updateUser } from '../services/usersService'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../query/queryKeys'
import { SGBR_BI_ACTIVE } from '../api/apiEnv'
import { DevErrorDetail } from '../components/DevErrorDetail'
import { getErrorMessage } from '../api/httpError'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { pctDelta, shiftRange } from '../utils/dateRange'

type UserForm = {
  name: string
  email: string
  role: UserRole
  status: User['status']
  password?: string
}

function roleTag(role: UserRole) {
  if (role === 'admin') return <Tag color="red">Admin</Tag>
  if (role === 'manager') return <Tag color="blue">Manager</Tag>
  return <Tag>Viewer</Tag>
}

function statusTag(status: User['status']) {
  return status === 'active' ? <Tag color="green">Ativo</Tag> : <Tag>Inativo</Tag>
}

export function UsersPage() {
  const { notification } = App.useApp()
  const { session } = useAuth()
  const canWrite = hasPermission(session, 'users:write')
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 300)
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<User['status'] | 'all'>('all')
  const [createdRange, setCreatedRange] = useState<[string, string] | null>(null)
  const queryClient = useQueryClient()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [saving, setSaving] = useState(false)
  const [form] = Form.useForm<UserForm>()

  const usersQuery = useQuery({
    queryKey: queryKeys.users({ q: debouncedSearch, role: roleFilter, status: statusFilter }),
    queryFn: listUsers,
    staleTime: 30_000,
  })

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<UserForm> }) => updateUser(id, patch),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (usersQuery.data ?? []).filter((u) => {
      const matchQ =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q)
      const matchRole = roleFilter === 'all' || u.role === roleFilter
      const matchStatus = statusFilter === 'all' || u.status === statusFilter
      const [start, end] = createdRange ?? ['', '']
      const matchDate =
        (!start || dayjs(u.createdAt).isSame(start, 'day') || dayjs(u.createdAt).isAfter(start, 'day')) &&
        (!end || dayjs(u.createdAt).isSame(end, 'day') || dayjs(u.createdAt).isBefore(end, 'day'))
      return matchQ && matchRole && matchStatus && matchDate
    })
  }, [search, roleFilter, statusFilter, usersQuery.data, createdRange])

  const usersSummary = useMemo(() => {
    const total = filtered.length
    const active = filtered.filter((u) => u.status === 'active').length
    const admins = filtered.filter((u) => u.role === 'admin').length
    const recent30d = filtered.filter((u) => dayjs().diff(dayjs(u.createdAt), 'day') <= 30).length
    return { total, active, admins, recent30d }
  }, [filtered])
  const previousUsersSummary = useMemo(() => {
    const shifted = shiftRange(createdRange?.[0], createdRange?.[1])
    if (!shifted) return null
    const q = search.trim().toLowerCase()
    const prev = (usersQuery.data ?? []).filter((u) => {
      const matchQ =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q)
      const matchRole = roleFilter === 'all' || u.role === roleFilter
      const matchStatus = statusFilter === 'all' || u.status === statusFilter
      const d = dayjs(u.createdAt)
      const matchDate =
        d.isSame(shifted.prevStart, 'day') ||
        d.isSame(shifted.prevEnd, 'day') ||
        (d.isAfter(shifted.prevStart, 'day') && d.isBefore(shifted.prevEnd, 'day'))
      return matchQ && matchRole && matchStatus && matchDate
    })
    return {
      total: prev.length,
      active: prev.filter((u) => u.status === 'active').length,
      admins: prev.filter((u) => u.role === 'admin').length,
      recent30d: prev.filter((u) => dayjs().diff(dayjs(u.createdAt), 'day') <= 30).length,
    }
  }, [createdRange, roleFilter, search, statusFilter, usersQuery.data])

  const columns: VirtualColumn<User>[] = useMemo(
    () => [
      {
        key: 'name',
        title: 'Nome',
        render: (u) => u.name,
      },
      { key: 'email', title: 'E-mail', render: (u) => u.email },
      { key: 'role', title: 'Perfil', width: 120, render: (u) => roleTag(u.role) },
      {
        key: 'status',
        title: 'Status',
        width: 120,
        render: (u) => statusTag(u.status),
      },
      {
        key: 'createdAt',
        title: 'Criado em',
        width: 120,
        render: (u) => dayjs(u.createdAt).format('DD/MM/YYYY'),
      },
      {
        key: 'actions',
        title: '',
        width: 140,
        render: (record) => (
          <Space>
            <Button
              size="small"
              icon={<EditOutlined />}
              disabled={!canWrite}
              onClick={() => {
                setEditing(record)
                form.setFieldsValue({
                  name: record.name,
                  email: record.email,
                  role: record.role,
                  status: record.status,
                })
                setModalOpen(true)
              }}
            />
            <Popconfirm
              title="Excluir usuário?"
              description="Essa ação não pode ser desfeita."
              okText="Excluir"
              okButtonProps={{ danger: true }}
              cancelText="Cancelar"
              disabled={!canWrite}
              onConfirm={async () => {
                try {
                  await deleteMutation.mutateAsync(record.id)
                  notification.success({ title: 'Usuário excluído' })
                } catch (e) {
                  const message = getErrorMessage(e, 'Erro inesperado.')
                  notification.error({ title: 'Usuários', description: message })
                }
              }}
            >
              <Button size="small" danger icon={<DeleteOutlined />} disabled={!canWrite} />
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [form, canWrite, deleteMutation, notification],
  )

  const headerExtra = (
    <Space>
      <Button icon={<ReloadOutlined />} onClick={() => usersQuery.refetch()}>
        Atualizar
      </Button>
      <Button
        type="primary"
        icon={<PlusOutlined />}
        disabled={!canWrite || SGBR_BI_ACTIVE}
        onClick={() => {
          setEditing(null)
          form.resetFields()
          form.setFieldsValue({ role: 'viewer', status: 'active' })
          setModalOpen(true)
        }}
      >
        Novo usuário
      </Button>
    </Space>
  )

  return (
    <Space orientation="vertical" size={16} style={{ width: '100%' }}>
      <PageHeaderCard
        title="Usuários"
        subtitle={
          SGBR_BI_ACTIVE
            ? 'A API SGBR BI usada neste projeto não expõe cadastro de usuários. Use o painel do fornecedor se precisar.'
            : 'Gestão de usuários via API configurada em VITE_API_BASE_URL.'
        }
        extra={headerExtra}
      />

      {SGBR_BI_ACTIVE ? (
        <Alert
          type="info"
          showIcon
          title="Sem listagem de usuários pela API SGBR"
          description="Esta tela permanece vazia até existir um endpoint dedicado ou outro backend em VITE_API_BASE_URL."
        />
      ) : null}

      <Card className="app-card" variant="borderless">
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} md={10}>
            <Input.Search
              allowClear
              placeholder="Buscar por nome, e-mail ou ID"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </Col>
          <Col xs={24} md={7}>
            <Select
              style={{ width: '100%' }}
              value={roleFilter}
              onChange={setRoleFilter}
              options={[
                { value: 'all', label: 'Todos os perfis' },
                { value: 'admin', label: 'Admin' },
                { value: 'manager', label: 'Manager' },
                { value: 'viewer', label: 'Viewer' },
              ]}
            />
          </Col>
          <Col xs={24} md={7}>
            <Select
              style={{ width: '100%' }}
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: 'all', label: 'Todos os status' },
                { value: 'active', label: 'Ativo' },
                { value: 'inactive', label: 'Inativo' },
              ]}
            />
          </Col>
          <Col xs={24} md={7}>
            <DatePicker.RangePicker
              style={{ width: '100%' }}
              onChange={(vals) => {
                if (!vals || !vals[0] || !vals[1]) {
                  setCreatedRange(null)
                  return
                }
                setCreatedRange([vals[0].format('YYYY-MM-DD'), vals[1].format('YYYY-MM-DD')])
              }}
            />
          </Col>
          <Col xs={24} md={24}>
            <DatePresetRange
              storageKey="date-preset:users"
              onApply={(start, end) => setCreatedRange([start, end])}
            />
          </Col>
        </Row>
      </Card>

      <Row gutter={[12, 12]}>
        <Col xs={24} sm={12} lg={6}>
          <MetricCard
            title="Total usuários"
            value={usersSummary.total}
            previousValue={previousUsersSummary?.total}
            deltaPct={
              previousUsersSummary ? pctDelta(usersSummary.total, previousUsersSummary.total) : undefined
            }
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <MetricCard
            title="Ativos"
            value={usersSummary.active}
            previousValue={previousUsersSummary?.active}
            deltaPct={
              previousUsersSummary
                ? pctDelta(usersSummary.active, previousUsersSummary.active)
                : undefined
            }
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <MetricCard
            title="Admins"
            value={usersSummary.admins}
            previousValue={previousUsersSummary?.admins}
            deltaPct={
              previousUsersSummary
                ? pctDelta(usersSummary.admins, previousUsersSummary.admins)
                : undefined
            }
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <MetricCard
            title="Novos em 30 dias"
            value={usersSummary.recent30d}
            previousValue={previousUsersSummary?.recent30d}
            deltaPct={
              previousUsersSummary
                ? pctDelta(usersSummary.recent30d, previousUsersSummary.recent30d)
                : undefined
            }
          />
        </Col>
      </Row>

      {(usersQuery.isLoading || usersQuery.isFetching) && (
        <Card>
          <Skeleton active paragraph={{ rows: 6 }} />
        </Card>
      )}

      {usersQuery.isError && (
        <Card extra={<Button onClick={() => usersQuery.refetch()}>Tentar novamente</Button>}>
          <Alert
            type="error"
            showIcon
            title="Não foi possível carregar"
            description={
              <>
                {getErrorMessage(usersQuery.error, 'Falha ao carregar usuários.')}
                <DevErrorDetail error={usersQuery.error} />
              </>
            }
          />
        </Card>
      )}

      {!usersQuery.isLoading && !filtered.length && (
        <Card>
          <div style={{ padding: 32 }}>
            <Empty
              description="Nenhum usuário cadastrado."
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </div>
        </Card>
      )}

      {!!filtered.length && (
        <Card className="app-card quantum-table" variant="borderless" title="Lista de usuários">
          {filtered.length > 100 ? (
            <VirtualTable
              rows={filtered}
              rowKey={(u) => u.id}
              columns={columns}
              height={520}
            />
          ) : (
            <VirtualTable
              rows={filtered}
              rowKey={(u) => u.id}
              columns={columns}
              height={Math.min(520, 56 + filtered.length * 46)}
            />
          )}
        </Card>
      )}

      <Modal
        open={modalOpen}
        title={editing ? 'Editar usuário' : 'Novo usuário'}
        okText={editing ? 'Salvar' : 'Criar'}
        cancelText="Cancelar"
        confirmLoading={saving}
        onCancel={() => setModalOpen(false)}
        onOk={async () => {
          try {
            const values = await form.validateFields()
            setSaving(true)
            if (editing) {
              const { password, ...rest } = values
              const patch: Partial<UserForm> = { ...rest }
              if (password) patch.password = password
              await updateMutation.mutateAsync({ id: editing.id, patch })
              notification.success({ title: 'Usuário atualizado' })
            } else {
              await createMutation.mutateAsync(values as Required<Pick<UserForm, 'password'>> & UserForm)
              notification.success({ title: 'Usuário criado' })
            }
            setModalOpen(false)
          } catch (e) {
            if (e && typeof e === 'object' && 'errorFields' in e) return
            const message = getErrorMessage(e, 'Erro inesperado.')
            notification.error({ title: 'Usuários', description: message })
          } finally {
            setSaving(false)
          }
        }}
      >
        <Form<UserForm> form={form} layout="vertical">
          <Form.Item
            label="Nome"
            name="name"
            rules={[{ required: true, message: 'Informe o nome.' }]}
          >
            <Input placeholder="Ex: Ana Silva" />
          </Form.Item>
          <Form.Item
            label="E-mail"
            name="email"
            rules={[
              { required: true, message: 'Informe o e-mail.' },
              { type: 'email', message: 'E-mail inválido.' },
            ]}
          >
            <Input placeholder="ex: ana@empresa.com" />
          </Form.Item>
          <Form.Item
            label={editing ? 'Redefinir senha (opcional)' : 'Senha'}
            name="password"
            normalize={(v) => (typeof v === 'string' && v.trim() ? v.trim() : undefined)}
            rules={
              editing
                ? []
                : [{ required: true, message: 'Informe a senha.' }]
            }
          >
            <Input.Password placeholder={editing ? 'Deixe em branco para manter' : 'Defina uma senha'} />
          </Form.Item>
          <Row gutter={12}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Perfil"
                name="role"
                rules={[{ required: true, message: 'Selecione o perfil.' }]}
              >
                <Select
                  options={[
                    { value: 'admin', label: 'Admin' },
                    { value: 'manager', label: 'Manager' },
                    { value: 'viewer', label: 'Viewer' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Status"
                name="status"
                rules={[{ required: true, message: 'Selecione o status.' }]}
              >
                <Select
                  options={[
                    { value: 'active', label: 'Ativo' },
                    { value: 'inactive', label: 'Inativo' },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </Space>
  )
}

