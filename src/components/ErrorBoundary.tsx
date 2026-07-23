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
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
        <div className="max-w-md rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Une erreur est survenue</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Le scénario chargé (import, lien partagé ou sauvegarde locale) semble corrompu ou invalide. Réinitialiser
            l'application pour repartir d'un scénario par défaut.
          </p>
          <button
            className="mt-4 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
            onClick={this.handleReset}
          >
            Réinitialiser CarsTCO
          </button>
        </div>
      </div>
    )
  }
}
