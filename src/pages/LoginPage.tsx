import { LockOutlined, MailOutlined, UserOutlined } from '@ant-design/icons'
import { Alert, Button, Card, Form, Input, Space, Typography } from 'antd'
import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { PageHeaderCard } from '../components/PageHeaderCard'
import { useAuth } from '../auth/AuthContext'
import { publicAssetUrl } from '../utils/publicAssetUrl'
import { IS_SGBR_BI_AUTH } from '../api/apiEnv'

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
          subtitle={
            IS_SGBR_BI_AUTH
              ? 'IGA — autenticação via API SGBR BI (usuário e senha).'
              : 'IGA Gestão e Análise de Dados — use as credenciais de demo abaixo.'
          }
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
            initialValues={
              IS_SGBR_BI_AUTH
                ? { email: 'iga', password: '' }
                : { email: 'admin@admin.com', password: 'admin' }
            }
            scrollToFirstError
          >
            {errorMsg ? (
              <Alert
                type="error"
                showIcon
                title={errorMsg}
                className="login-error-alert"
              />
            ) : null}

            <Form.Item
              label={IS_SGBR_BI_AUTH ? 'Usuário' : 'E-mail'}
              name="email"
              rules={
                IS_SGBR_BI_AUTH
                  ? [{ required: true, message: 'Informe o usuário.' }]
                  : [
                      { required: true, message: 'Informe o e-mail.' },
                      { type: 'email', message: 'E-mail inválido.' },
                    ]
              }
            >
              <Input
                prefix={IS_SGBR_BI_AUTH ? <UserOutlined /> : <MailOutlined />}
                placeholder={IS_SGBR_BI_AUTH ? 'iga' : 'admin@admin.com'}
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
                placeholder={IS_SGBR_BI_AUTH ? 'Senha' : 'admin'}
                autoComplete="current-password"
              />
            </Form.Item>

            <Space orientation="vertical" size={8} style={{ width: '100%' }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={submitting}
                block
              >
                Entrar
              </Button>
              {IS_SGBR_BI_AUTH ? (
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  A senha é enviada como SHA-256 (hex), como esperado pela API.
                </Typography.Text>
              ) : (
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  Demo:
                  <br />
                  <strong>admin@admin.com</strong> / <strong>admin</strong>
                  <br />
                  <strong>manager@admin.com</strong> / <strong>admin</strong>
                  <br />
                  <strong>viewer@admin.com</strong> / <strong>admin</strong>
                </Typography.Text>
              )}
            </Space>
          </Form>
        </Card>
      </div>
    </div>
  )
}

