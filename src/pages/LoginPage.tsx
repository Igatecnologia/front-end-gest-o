import { LockOutlined, MailOutlined } from '@ant-design/icons'
import { Alert, Button, Card, Form, Input, Space, Typography } from 'antd'
import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { PageHeaderCard } from '../components/PageHeaderCard'
import { useAuth } from '../auth/AuthContext'
import { publicAssetUrl } from '../utils/publicAssetUrl'

type LoginForm = {
  email: string
  password: string
}

export function LoginPage() {
  const { isAuthenticated, signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const from =
    (location.state as { from?: string } | null)?.from || '/dashboard'

  if (isAuthenticated) return <Navigate to={from} replace />

  async function onFinish(values: LoginForm) {
    setSubmitting(true)
    setErrorMsg(null)
    try {
      await signIn(values)
      navigate(from, { replace: true })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao fazer login.'
      setErrorMsg(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="login-shell">
      <div className="login-card-wrap">
        <PageHeaderCard
          title="Entrar"
          subtitle="IGA Gestão e Análise de Dados — use as credenciais de demo abaixo."
          extra={
            <img
              src={publicAssetUrl('logo.png.png')}
              alt="IGA"
              className="login-header-logo"
            />
          }
        />

        <Card className="app-card" style={{ marginTop: 16, borderRadius: 14 }}>
          <Form<LoginForm>
            layout="vertical"
            onFinish={onFinish}
            initialValues={{ email: 'admin@admin.com', password: 'admin' }}
            scrollToFirstError
          >
            {errorMsg ? (
              <Alert
                type="error"
                showIcon
                message={errorMsg}
                className="login-error-alert"
              />
            ) : null}

            <Form.Item
              label="E-mail"
              name="email"
              rules={[
                { required: true, message: 'Informe o e-mail.' },
                { type: 'email', message: 'E-mail inválido.' },
              ]}
            >
              <Input
                prefix={<MailOutlined />}
                placeholder="admin@admin.com"
                autoComplete="username"
              />
            </Form.Item>

            <Form.Item
              label="Senha"
              name="password"
              rules={[{ required: true, message: 'Informe a senha.' }]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="admin"
                autoComplete="current-password"
              />
            </Form.Item>

            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={submitting}
                block
              >
                Entrar
              </Button>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                Demo:
                <br />
                <strong>admin@admin.com</strong> / <strong>admin</strong>
                <br />
                <strong>manager@admin.com</strong> / <strong>admin</strong>
                <br />
                <strong>viewer@admin.com</strong> / <strong>admin</strong>
              </Typography.Text>
            </Space>
          </Form>
        </Card>
      </div>
    </div>
  )
}

