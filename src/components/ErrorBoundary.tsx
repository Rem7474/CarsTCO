import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('CarsTCO crashed:', error, info.componentStack)
  }

  handleReset = () => {
    try {
      localStorage.clear()
    } catch {
      // ignore
    }
    window.location.href = window.location.pathname
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="flex min-h-screen items-center justify-center bg-cream px-4 font-sans">
        <div className="max-w-md rounded-2xl border border-border bg-white p-6 text-center">
          <h1 className="font-display text-lg font-bold text-ink">Une erreur est survenue</h1>
          <p className="mt-2 text-sm text-muted">
            Le scénario chargé (import, lien partagé ou sauvegarde locale) semble corrompu ou invalide. Réinitialiser
            l'application pour repartir d'un scénario par défaut.
          </p>
          <button
            className="mt-4 rounded-[10px] bg-teal px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-teal-dark"
            onClick={this.handleReset}
          >
            Réinitialiser CarsTCO
          </button>
        </div>
      </div>
    )
  }
}
