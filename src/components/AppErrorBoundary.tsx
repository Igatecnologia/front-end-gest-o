import { Button, Result, Typography } from 'antd'
import React from 'react'
import { captureError } from '../monitoring/errorTracker'

type Props = {
  children: React.ReactNode
}

type State = {
  hasError: boolean
  errorId: string | null
}

function generateErrorId(): string {
  return `ERR-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
}

export class AppErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, errorId: null }

  static getDerivedStateFromError() {
    return { hasError: true, errorId: generateErrorId() }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    captureError(error, {
      component: 'AppErrorBoundary',
      extra: {
        componentStack: errorInfo.componentStack,
        errorId: this.state.errorId,
      },
    })
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          padding: 16,
        }}
      >
        <Result
          status="500"
          title="Algo deu errado"
          subTitle="Tente recarregar a página. Se o erro persistir, entre em contato com o suporte."
          extra={
            <>
              <Button type="primary" onClick={() => window.location.reload()}>
                Recarregar
              </Button>
              {this.state.errorId ? (
                <Typography.Text
                  type="secondary"
                  style={{ display: 'block', marginTop: 12, fontSize: 12 }}
                  copyable
                >
                  Código do erro: {this.state.errorId}
                </Typography.Text>
              ) : null}
            </>
          }
        />
      </div>
    )
  }
}
