import { Button, Result } from 'antd'
import React from 'react'

type Props = {
  children: React.ReactNode
}

type State = {
  hasError: boolean
}

export class AppErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
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
          subTitle="Tente recarregar a página. Se o erro persistir, nos avise."
          extra={
            <Button type="primary" onClick={() => window.location.reload()}>
              Recarregar
            </Button>
          }
        />
      </div>
    )
  }
}

