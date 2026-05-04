import React from "react";

interface State {
  hasError: boolean;
  error: Error | null;
}

interface Props {
  children: React.ReactNode;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
          <div className="max-w-md w-full bg-card border border-border rounded-xl p-6 shadow-card">
            <h1 className="text-lg font-semibold text-foreground mb-2">Algo deu errado</h1>
            <p className="text-sm text-muted-foreground mb-4">
              A tela travou ao processar os dados. Provavelmente algum registro está em formato inválido.
            </p>
            {this.state.error && (
              <pre className="text-[11px] bg-muted/40 border border-border rounded p-2 mb-4 overflow-auto max-h-40 text-muted-foreground">
                {this.state.error.message}
              </pre>
            )}
            <div className="flex gap-2">
              <button
                onClick={this.handleReload}
                className="flex-1 px-3 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:opacity-90"
              >
                Tentar novamente
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 px-3 py-2 rounded-lg text-sm font-medium border border-border hover:bg-accent"
              >
                Recarregar página
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
