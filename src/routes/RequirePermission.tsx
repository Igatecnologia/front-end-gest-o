import { Result, Button } from 'antd'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { hasPermission, type Permission } from '../auth/permissions'

export function RequirePermission({
  permission,
  children,
}: {
  permission: Permission
  children: React.ReactNode
}) {
  const { session } = useAuth()

  if (!hasPermission(session, permission)) {
    return (
      <Result
        status="403"
        title="Sem acesso"
        subTitle="Você não tem permissão para acessar esta página."
        extra={
          <Button type="primary">
            <Link to="/dashboard">Voltar</Link>
          </Button>
        }
      />
    )
  }

  return children
}

