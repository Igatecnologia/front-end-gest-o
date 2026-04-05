import {
  AlertOutlined,
  AppstoreOutlined,
  BarChartOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  DollarOutlined,
  DotChartOutlined,
  ExperimentOutlined,
  FileSearchOutlined,
  FileTextOutlined,
  HomeOutlined,
  MenuOutlined,
  MoonOutlined,
  ProfileOutlined,
  ShoppingCartOutlined,
  SunOutlined,
  TableOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons'
import {
  Button,
  Drawer,
  Dropdown,
  Layout,
  Menu,
  Space,
  Tag,
  Tooltip,
  Typography,
  theme,
} from 'antd'
import { Grid } from 'antd'
import { useMemo, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { hasPermission } from '../auth/permissions'
import { useAppTheme } from '../theme/ThemeContext'
import { useTenant } from '../tenant/TenantContext'
import { getAppEnvBadge } from '../api/apiEnv'

const { Header, Sider, Content } = Layout

function useSelectedMenuKey(pathname: string) {
  return useMemo(() => {
    if (pathname.startsWith('/dashboard/analises')) return 'dashboard-analises'
    if (pathname.startsWith('/dashboard/dados')) return 'dashboard-dados'
    if (pathname.startsWith('/dashboard/vendas-analitico')) return 'dashboard-vendas-analitico'
    if (pathname.startsWith('/financeiro')) return 'financeiro'
    if (pathname.startsWith('/relatorios')) return 'relatorios'
    if (pathname.startsWith('/usuarios')) return 'usuarios'
    if (pathname.startsWith('/auditoria')) return 'auditoria'
    if (pathname.startsWith('/producao')) return 'producao'
    if (pathname.startsWith('/ficha-tecnica')) return 'ficha-tecnica'
    if (pathname.startsWith('/comercial')) return 'comercial'
    if (pathname.startsWith('/operacional')) return 'operacional'
    if (pathname.startsWith('/alertas')) return 'alertas'
    if (pathname.startsWith('/fontes-de-dados')) return 'fontes-de-dados'
    return 'dashboard'
  }, [pathname])
}

/** Detecta qual grupo do sidebar deve estar aberto baseado na rota */
function useOpenSubMenuKeys(selectedKey: string) {
  return useMemo(() => {
    if (selectedKey.startsWith('dashboard') || selectedKey === 'operacional' || selectedKey === 'alertas') return ['sub-dashboard']
    if (selectedKey === 'producao' || selectedKey === 'ficha-tecnica' || selectedKey === 'comercial') return ['sub-erp']
    if (selectedKey === 'financeiro' || selectedKey === 'relatorios') return ['sub-analytics']
    if (['usuarios', 'auditoria', 'fontes-de-dados'].includes(selectedKey)) return ['sub-admin']
    return ['sub-dashboard']
  }, [selectedKey])
}

export function AppLayout() {
  const location = useLocation()
  const selectedKey = useSelectedMenuKey(location.pathname)
  const defaultOpenKeys = useOpenSubMenuKeys(selectedKey)
  const [collapsed, setCollapsed] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const { mode, toggle } = useAppTheme()
  const { session, signOut } = useAuth()
  const { token } = theme.useToken()
  const screens = Grid.useBreakpoint()
  const navigate = useNavigate()
  const tenant = useTenant()
  const envBadge = useMemo(() => getAppEnvBadge(), [])

  /* ── Sub-menus colapsáveis ── */
  const navItems = useMemo(() => {
    const items: NonNullable<React.ComponentProps<typeof Menu>['items']> = []

    if (hasPermission(session, 'dashboard:view')) {
      items.push({
        key: 'sub-dashboard',
        icon: <BarChartOutlined />,
        label: 'Dashboard',
        children: [
          { key: 'dashboard', icon: <HomeOutlined />, label: <Link to="/dashboard">Visão geral</Link> },
          { key: 'dashboard-analises', icon: <DotChartOutlined />, label: <Link to="/dashboard/analises">Análises BI</Link> },
          { key: 'dashboard-dados', icon: <TableOutlined />, label: <Link to="/dashboard/dados">Dados detalhados</Link> },
          { key: 'dashboard-vendas-analitico', icon: <ShoppingCartOutlined />, label: <Link to="/dashboard/vendas-analitico">Vendas analítico</Link> },
          { key: 'operacional', icon: <DashboardOutlined />, label: <Link to="/operacional">Operacional</Link> },
          { key: 'alertas', icon: <AlertOutlined />, label: <Link to="/alertas">Alertas</Link> },
        ],
      })
    }

    {
      const erpChildren: NonNullable<React.ComponentProps<typeof Menu>['items']> = []
      if (hasPermission(session, 'producao:view')) {
        erpChildren.push({ key: 'producao', icon: <ExperimentOutlined />, label: <Link to="/producao">Produção</Link> })
      }
      if (hasPermission(session, 'fichatecnica:view')) {
        erpChildren.push({ key: 'ficha-tecnica', icon: <ProfileOutlined />, label: <Link to="/ficha-tecnica">Ficha Técnica</Link> })
      }
      if (hasPermission(session, 'comercial:view')) {
        erpChildren.push({ key: 'comercial', icon: <ShoppingCartOutlined />, label: <Link to="/comercial">Comercial</Link> })
      }
      if (erpChildren.length) {
        items.push({
          key: 'sub-erp',
          icon: <AppstoreOutlined />,
          label: 'ERP / Produção',
          children: erpChildren,
        })
      }
    }

    if (hasPermission(session, 'reports:view')) {
      items.push({
        key: 'sub-analytics',
        icon: <DollarOutlined />,
        label: 'Financeiro',
        children: [
          { key: 'financeiro', icon: <DollarOutlined />, label: <Link to="/financeiro">Visão Financeira</Link> },
          { key: 'relatorios', icon: <FileTextOutlined />, label: <Link to="/relatorios">Relatórios</Link> },
        ],
      })
    }

    const adminChildren: NonNullable<React.ComponentProps<typeof Menu>['items']> = []
    if (hasPermission(session, 'users:view')) {
      adminChildren.push({ key: 'usuarios', icon: <TeamOutlined />, label: <Link to="/usuarios">Usuários</Link> })
    }
    if (hasPermission(session, 'audit:view')) {
      adminChildren.push({ key: 'auditoria', icon: <FileSearchOutlined />, label: <Link to="/auditoria">Auditoria</Link> })
    }
    if (session?.user.role === 'admin') {
      adminChildren.push({ key: 'fontes-de-dados', icon: <DatabaseOutlined />, label: <Link to="/fontes-de-dados">Fontes de Dados</Link> })
    }
    if (adminChildren.length) {
      items.push({
        key: 'sub-admin',
        icon: <TeamOutlined />,
        label: 'Administração',
        children: adminChildren,
      })
    }

    return items
  }, [session])

  /* ── Bottom nav items (mobile) — apenas os principais ── */
  const bottomNavItems = useMemo(() => {
    const items: { key: string; icon: React.ReactNode; label: string; path: string }[] = []
    if (hasPermission(session, 'dashboard:view')) {
      items.push({ key: 'dashboard', icon: <BarChartOutlined />, label: 'Dashboard', path: '/dashboard' })
    }
    if (hasPermission(session, 'reports:view')) {
      items.push({ key: 'financeiro', icon: <DollarOutlined />, label: 'Financeiro', path: '/financeiro' })
      items.push({ key: 'relatorios', icon: <FileTextOutlined />, label: 'Relatórios', path: '/relatorios' })
    }
    return items
  }, [session])

  /** Qual key do bottom nav está ativa */
  const activeBottomKey = useMemo(() => {
    if (selectedKey.startsWith('dashboard')) return 'dashboard'
    return selectedKey
  }, [selectedKey])

  return (
    <Layout className="app-shell" style={{ minHeight: '100vh' }}>
      <a
        href="#main-content"
        style={{
          position: 'absolute',
          left: -9999,
          top: 8,
          zIndex: 9999,
          padding: '6px 10px',
          background: token.colorBgElevated,
          border: `1px solid ${token.colorBorder}`,
          borderRadius: 8,
        }}
        onFocus={(e) => {
          e.currentTarget.style.left = '12px'
        }}
        onBlur={(e) => {
          e.currentTarget.style.left = '-9999px'
        }}
      >
        Pular para o conteúdo
      </a>
      {!screens.xs ? (
        <Sider
          breakpoint="lg"
          collapsedWidth={72}
          collapsed={collapsed}
          onCollapse={setCollapsed}
          style={{
            position: 'sticky',
            top: 0,
            height: '100vh',
            overflow: 'auto',
            borderRight: `1px solid ${token.colorBorderSecondary}`,
          }}
        >
          <div className="app-sider-brand">
            <Space size={10} align="center">
              <img
                src={tenant.logoUrl}
                alt={tenant.companyName}
                className="app-sider-logo"
              />
              {!collapsed && (
                <div style={{ lineHeight: 1.1 }}>
                  <span className="app-sider-brand-name" style={{ color: token.colorText }}>
                    {tenant.companyName}
                  </span>
                  <br />
                  <Typography.Text
                    style={{
                      color:
                        mode === 'dark'
                          ? 'var(--qc-text-muted)'
                          : token.colorTextSecondary,
                      fontSize: 12,
                    }}
                  >
                    {tenant.subtitle}
                  </Typography.Text>
                </div>
              )}
            </Space>
          </div>

          <Menu
            className="app-sider-menu"
            theme={mode === 'dark' ? 'dark' : 'light'}
            mode="inline"
            selectedKeys={[selectedKey]}
            defaultOpenKeys={collapsed ? [] : defaultOpenKeys}
            items={navItems}
            style={{ background: 'transparent', borderInlineEnd: 0 }}
          />
        </Sider>
      ) : (
        <Drawer
          open={mobileNavOpen}
          onClose={() => setMobileNavOpen(false)}
          placement="left"
          width={280}
          bodyStyle={{ padding: 0 }}
          title="Menu"
        >
          <Menu
            className="app-sider-menu"
            theme={mode === 'dark' ? 'dark' : 'light'}
            mode="inline"
            selectedKeys={[selectedKey]}
            defaultOpenKeys={defaultOpenKeys}
            items={navItems}
            onClick={() => setMobileNavOpen(false)}
            style={{ borderInlineEnd: 0 }}
          />
        </Drawer>
      )}

      <Layout>
        <Header
          style={{
            padding: '0 20px',
            background: token.colorBgContainer,
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
        >
          <div
            style={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              maxWidth: 1400,
              margin: '0 auto',
              width: '100%',
            }}
          >
            <Space align="center" size={10}>
              <Typography.Title level={5} style={{ margin: 0 }}>
                {{
                  relatorios: 'Relatórios',
                  financeiro: 'Financeiro',
                  usuarios: 'Usuários',
                  auditoria: 'Auditoria',
                  'dashboard-analises': 'Análises BI',
                  'dashboard-dados': 'Dados detalhados',
                  'dashboard-vendas-analitico': 'Vendas Analítico',
                  producao: 'Produção',
                  'ficha-tecnica': 'Ficha Técnica',
                  comercial: 'Comercial',
                  operacional: 'Dashboard Operacional',
                  alertas: 'Alertas',
                  'fontes-de-dados': 'Conexoes',
                }[selectedKey] ?? 'Dashboard'}
              </Typography.Title>
              {envBadge ? (
                <Tag color={envBadge.color} style={{ margin: 0 }}>
                  {envBadge.label}
                </Tag>
              ) : null}
            </Space>
            <Space>
              {screens.xs ? (
                <Button
                  type="text"
                  aria-label="Abrir menu"
                  icon={<MenuOutlined />}
                  onClick={() => setMobileNavOpen(true)}
                />
              ) : null}
              <Tooltip title={mode === 'dark' ? 'Tema claro' : 'Tema escuro'}>
                <Button
                  type="text"
                  aria-label="Alternar tema"
                  icon={mode === 'dark' ? <SunOutlined /> : <MoonOutlined />}
                  onClick={toggle}
                />
              </Tooltip>

              <Dropdown
                placement="bottomRight"
                menu={{
                  items: [
                    {
                      key: 'user',
                      disabled: true,
                      label: (
                        <div style={{ lineHeight: 1.2 }}>
                          <strong>{session?.user.name ?? 'Usuário'}</strong>
                          <br />
                          <span style={{ opacity: 0.7 }}>
                            {session?.user.email ?? ''}
                          </span>
                        </div>
                      ),
                    },
                    { type: 'divider' },
                    {
                      key: 'logout',
                      label: 'Sair',
                      onClick: () => {
                        signOut()
                        navigate('/login', { replace: true })
                      },
                    },
                  ],
                }}
              >
                <Button type="text" aria-label="Menu do usuário" icon={<UserOutlined />} />
              </Dropdown>
            </Space>
          </div>
        </Header>

        <Content
          id="main-content"
          role="main"
          style={{
            background: token.colorBgLayout,
            padding: 0,
            /* Espaço para o bottom nav no mobile */
            paddingBottom: screens.xs ? 64 : 0,
          }}
        >
          <div className="app-content">
            <div className="app-container">
              <Outlet />
            </div>
          </div>
        </Content>

        {/* ── Bottom Navigation Mobile ── */}
        {screens.xs && bottomNavItems.length > 0 ? (
          <nav className="app-bottom-nav" aria-label="Navegação principal mobile">
            {bottomNavItems.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`app-bottom-nav-item${activeBottomKey === item.key ? ' active' : ''}`}
                onClick={() => navigate(item.path)}
                aria-current={activeBottomKey === item.key ? 'page' : undefined}
              >
                <span className="app-bottom-nav-icon">{item.icon}</span>
                <span className="app-bottom-nav-label">{item.label}</span>
              </button>
            ))}
            <button
              type="button"
              className="app-bottom-nav-item"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Mais opções"
            >
              <span className="app-bottom-nav-icon"><MenuOutlined /></span>
              <span className="app-bottom-nav-label">Mais</span>
            </button>
          </nav>
        ) : null}
      </Layout>
    </Layout>
  )
}
