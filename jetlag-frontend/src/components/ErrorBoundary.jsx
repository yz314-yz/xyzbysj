import { Component } from 'react';
import { HeartPulse } from 'lucide-react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('界面渲染失败：', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="fallback-shell">
          <section className="panel error-panel">
            <HeartPulse size={28} />
            <h1>页面暂时无法显示</h1>
            <p>请刷新页面后重试，已保留为安全的错误兜底状态。</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{ marginTop: '16px', padding: '8px 20px', cursor: 'pointer' }}
            >
              重新加载
            </button>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}
