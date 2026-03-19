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
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  )
}

