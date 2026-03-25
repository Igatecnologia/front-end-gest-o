import {
  DotChartOutlined,
  BarChartOutlined,
  DollarOutlined,
  FileSearchOutlined,
  FileTextOutlined,
  MenuOutlined,
  MoonOutlined,
  ShoppingCartOutlined,
  SunOutlined,
  TeamOutlined,
  TableOutlined,
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
import { publicAssetUrl } from '../utils/publicAssetUrl'
import { SGBR_BI_ACTIVE, getAppEnvBadge } from '../api/apiEnv'

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
    return 'dashboard'
  }, [pathname])
}

export function AppLayout() {
  const location = useLocation()
  const selectedKey = useSelectedMenuKey(location.pathname)
  const [collapsed, setCollapsed] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const { mode, toggle } = useAppTheme()
  const { session, signOut } = useAuth()
  const { token } = theme.useToken()
  const screens = Grid.useBreakpoint()
  const navigate = useNavigate()
  const envBadge = useMemo(() => getAppEnvBadge(), [])

  const navItems = useMemo(() => {
    const items: NonNullable<React.ComponentProps<typeof Menu>['items']> = []
    const dashboardChildren: NonNullable<React.ComponentProps<typeof Menu>['items']> = []
    const analyticsChildren: NonNullable<React.ComponentProps<typeof Menu>['items']> = []
    const adminChildren: NonNullable<React.ComponentProps<typeof Menu>['items']> = []

    if (hasPermission(session, 'dashboard:view')) {
      dashboardChildren.push({
        key: 'dashboard',
        icon: <BarChartOutlined />,
        label: <Link to="/dashboard">Visão geral</Link>,
      })
      dashboardChildren.push({
        key: 'dashboard-analises',
        icon: <DotChartOutlined />,
        label: <Link to="/dashboard/analises">Análises BI</Link>,
      })
      dashboardChildren.push({
        key: 'dashboard-dados',
        icon: <TableOutlined />,
        label: <Link to="/dashboard/dados">Dados detalhados</Link>,
      })
      dashboardChildren.push({
        key: 'dashboard-vendas-analitico',
        icon: <ShoppingCartOutlined />,
        label: <Link to="/dashboard/vendas-analitico">Vendas analítico</Link>,
      })
    }

    if (hasPermission(session, 'reports:view')) {
      analyticsChildren.push({
        key: 'financeiro',
        icon: <DollarOutlined />,
        label: <Link to="/financeiro">Financeiro</Link>,
      })
      analyticsChildren.push({
        key: 'relatorios',
        icon: <FileTextOutlined />,
        label: <Link to="/relatorios">Relatórios</Link>,
      })
    }

    if (!SGBR_BI_ACTIVE && hasPermission(session, 'users:view')) {
      adminChildren.push({
        key: 'usuarios',
        icon: <TeamOutlined />,
        label: <Link to="/usuarios">Usuários</Link>,
      })
    }

    if (!SGBR_BI_ACTIVE && hasPermission(session, 'audit:view')) {
      adminChildren.push({
        key: 'auditoria',
        icon: <FileSearchOutlined />,
        label: <Link to="/auditoria">Auditoria</Link>,
      })
    }

    if (dashboardChildren.length) {
      items.push({
        key: 'group-dashboard',
        type: 'group',
        label: 'Dashboard',
        children: dashboardChildren,
      })
    }
    if (analyticsChildren.length) {
      items.push({
        key: 'group-analytics',
        type: 'group',
        label: 'Análises e Relatórios',
        children: analyticsChildren,
      })
    }
    if (adminChildren.length) {
      items.push({
        key: 'group-admin',
        type: 'group',
        label: 'Administração',
        children: adminChildren,
      })
    }

    return items
  }, [session])

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
                src={publicAssetUrl('logo.png.png')}
                alt="IGA"
                className="app-sider-logo"
              />
              {!collapsed && (
                <div style={{ lineHeight: 1.1 }}>
                  <Typography.Text
                    style={{
                      color:
                        mode === 'dark'
                          ? 'color-mix(in srgb, var(--qc-text) 92%, transparent)'
                          : token.colorText,
                    }}
                  >
                    IGA
                  </Typography.Text>
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
                    Gestão e Análise de Dados
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
                {selectedKey === 'relatorios'
                  ? 'Relatórios'
                  : selectedKey === 'financeiro'
                    ? 'Financeiro'
                  : selectedKey === 'usuarios'
                    ? 'Usuários'
                    : selectedKey === 'auditoria'
                      ? 'Auditoria'
                      : selectedKey === 'dashboard-analises'
                        ? 'Análises BI'
                        : selectedKey === 'dashboard-dados'
                          ? 'Dados detalhados'
                          : 'Dashboard'}
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
          }}
        >
          <div className="app-content">
            <div className="app-container">
              <Outlet />
            </div>
          </div>
        </Content>
      </Layout>
    </Layout>
  )
}

