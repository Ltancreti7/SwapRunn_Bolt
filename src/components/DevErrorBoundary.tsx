import React from "react";

type Props = { children: React.ReactNode };
type State = { hasError: boolean; error?: any; info?: any };

export class DevErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, info: any) {
    // Log to console for quick debugging
    // eslint-disable-next-line no-console
    console.error("Runtime error caught by DevErrorBoundary:", error, info);
    this.setState({ info });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleClearLocal = () => {
    try {
      localStorage.removeItem('mock-session');
      localStorage.removeItem('mock-users');
      localStorage.removeItem('mock-sessions');
      localStorage.removeItem('mock-profiles');
      localStorage.removeItem('mock-dealers');
    } catch {}
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div style={{
        minHeight: '100vh',
        background: '#000',
        color: '#fff',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Something went wrong</h1>
        <p style={{ opacity: 0.8 }}>An error occurred while rendering the app. This debug screen only appears in development.</p>
        {this.state.error && (
          <pre style={{ whiteSpace: 'pre-wrap', background: '#111', padding: 12, borderRadius: 8, border: '1px solid #333', overflow: 'auto' }}>
            {String(this.state.error?.stack || this.state.error)}
          </pre>
        )}
        {this.state.info && this.state.info.componentStack && (
          <details open>
            <summary>Component stack</summary>
            <pre style={{ whiteSpace: 'pre-wrap', background: '#111', padding: 12, borderRadius: 8, border: '1px solid #333', overflow: 'auto' }}>{this.state.info.componentStack}</pre>
          </details>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={this.handleReload} style={{ background: '#E11900', color: '#fff', padding: '10px 14px', borderRadius: 8, border: 0 }}>Reload</button>
          <button onClick={this.handleClearLocal} style={{ background: 'transparent', color: '#fff', padding: '10px 14px', borderRadius: 8, border: '1px solid #444' }}>Clear Local Mock Data + Reload</button>
        </div>
      </div>
    );
  }
}
