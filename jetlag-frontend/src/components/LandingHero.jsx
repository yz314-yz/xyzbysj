import { Link } from 'react-router-dom';
import { InkBackground } from './InkBackground';
import { ThemeToggle } from './ThemeToggle';
import { useMeridianHint } from '../hooks/useMeridianHint';

export function LandingHero({ theme, onThemeToggle }) {
  const meridianHint = useMeridianHint();

  return (
    <section className="landing-hero">
      <InkBackground theme={theme} />
      <ThemeToggle className="landing-theme-toggle" compact theme={theme} onToggle={onThemeToggle} />

      {/* ===== 古籍层 — 正常居中 ===== */}
      <div className="landing-book-area">
        <Link to="/book" className="codex-book" aria-label="启卷">
          {/* 封面主体 */}
          <div className="codex-cover">
            <div className="codex-texture" />
            <div className="codex-frame" />
            {/* 线装穿线 */}
            <div className="codex-binding">
              <span className="codex-knot" />
              <span className="codex-knot" />
              <span className="codex-knot" />
              <span className="codex-knot" />
            </div>
            {/* 签条 — 中医养生典籍意象 */}
            <div className="codex-label">
              <span className="codex-label-text">岐养七日</span>
              <span className="codex-label-sub">中医养生</span>
            </div>
            {/* 朱印 — 岐黄典故 */}
            <div className="codex-seal"><span>岐黄</span></div>
          </div>
          {/* 书脊（左侧） */}
          <div className="codex-spine" />
          {/* 书页侧面（右侧） */}
          <div className="codex-edge" />
        </Link>
      </div>

      {/* UI 层 */}
      <div className="landing-footer">
        <p className="landing-meridian-text">
          <strong>{meridianHint.name}</strong> · {meridianHint.meridian}当令 · {meridianHint.advice}
        </p>
        <p className="landing-disclaimer">本册所载仅供参习，不作诊病之据</p>
        <Link to="/book" className="landing-enter-btn">启卷</Link>
      </div>
    </section>
  );
}
