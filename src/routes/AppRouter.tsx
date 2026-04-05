import { Spin } from 'antd'
import { Suspense, lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '../layouts/AppLayout'
import { RequireAuth } from './RequireAuth'
import { RequirePermission } from './RequirePermission'

const DashboardPage = lazy(() =>
  import('../pages/DashboardPage').then((m) => ({ default: m.DashboardPage })),
)
const DashboardInsightsPage = lazy(() =>
  import('../pages/DashboardInsightsPage').then((m) => ({
    default: m.DashboardInsightsPage,
  })),
)
const DashboardDataPage = lazy(() =>
  import('../pages/DashboardDataPage').then((m) => ({ default: m.DashboardDataPage })),
)
const VendasAnaliticoPage = lazy(() =>
  import('../pages/VendasAnaliticoPage').then((m) => ({ default: m.VendasAnaliticoPage })),
)
const ReportsPage = lazy(() =>
  import('../pages/ReportsPage').then((m) => ({ default: m.ReportsPage })),
)
const FinancePage = lazy(() =>
  import('../pages/FinancePage').then((m) => ({ default: m.FinancePage })),
)
const NotFoundPage = lazy(() =>
  import('../pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })),
)
const LoginPage = lazy(() =>
  import('../pages/LoginPage').then((m) => ({ default: m.LoginPage })),
)
const UsersPage = lazy(() =>
  import('../pages/UsersPage').then((m) => ({ default: m.UsersPage })),
)
const AuditPage = lazy(() =>
  import('../pages/AuditPage').then((m) => ({ default: m.AuditPage })),
)
const ProducaoPage = lazy(() =>
  import('../pages/ProducaoPage').then((m) => ({ default: m.ProducaoPage })),
)
const FichaTecnicaPage = lazy(() =>
  import('../pages/FichaTecnicaPage').then((m) => ({ default: m.FichaTecnicaPage })),
)
const ComercialPage = lazy(() =>
  import('../pages/ComercialPage').then((m) => ({ default: m.ComercialPage })),
)
const DashboardOperacionalPage = lazy(() =>
  import('../pages/DashboardOperacionalPage').then((m) => ({
    default: m.DashboardOperacionalPage,
  })),
)
const AlertasPage = lazy(() =>
  import('../pages/AlertasPage').then((m) => ({ default: m.AlertasPage })),
)
const DataSourceConfigPage = lazy(() =>
  import('../pages/DataSourceConfigPage').then((m) => ({ default: m.DataSourceConfigPage })),
)

export function AppRouter() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: '100vh',
            display: 'grid',
            placeItems: 'center',
            background: 'transparent',
          }}
        >
          <Spin size="large" />
        </div>
      }
    >
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          element={
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route
            path="/dashboard"
            element={
              <RequirePermission permission="dashboard:view">
                <DashboardPage />
              </RequirePermission>
            }
          />
          <Route
            path="/dashboard/analises"
            element={
              <RequirePermission permission="dashboard:view">
                <DashboardInsightsPage />
              </RequirePermission>
            }
          />
          <Route
            path="/dashboard/dados"
            element={
              <RequirePermission permission="dashboard:view">
                <DashboardDataPage />
              </RequirePermission>
            }
          />
          <Route
            path="/dashboard/vendas-analitico"
            element={
              <RequirePermission permission="dashboard:view">
                <VendasAnaliticoPage />
              </RequirePermission>
            }
          />
          <Route
            path="/financeiro"
            element={
              <RequirePermission permission="reports:view">
                <FinancePage />
              </RequirePermission>
            }
          />
          <Route
            path="/relatorios"
            element={
              <RequirePermission permission="reports:view">
                <ReportsPage />
              </RequirePermission>
            }
          />
          <Route
            path="/usuarios"
            element={
              <RequirePermission permission="users:view">
                <UsersPage />
              </RequirePermission>
            }
          />
          <Route
            path="/auditoria"
            element={
              <RequirePermission permission="audit:view">
                <AuditPage />
              </RequirePermission>
            }
          />
          <Route
            path="/producao"
            element={
              <RequirePermission permission="producao:view">
                <ProducaoPage />
              </RequirePermission>
            }
          />
          <Route
            path="/ficha-tecnica"
            element={
              <RequirePermission permission="fichatecnica:view">
                <FichaTecnicaPage />
              </RequirePermission>
            }
          />
          <Route
            path="/comercial"
            element={
              <RequirePermission permission="comercial:view">
                <ComercialPage />
              </RequirePermission>
            }
          />
          <Route
            path="/operacional"
            element={
              <RequirePermission permission="dashboard:view">
                <DashboardOperacionalPage />
              </RequirePermission>
            }
          />
          <Route
            path="/alertas"
            element={
              <RequirePermission permission="alertas:view">
                <AlertasPage />
              </RequirePermission>
            }
          />
          <Route path="/fontes-de-dados" element={<DataSourceConfigPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
