import { useEffect, useRef } from 'react';
import inkLandscape from '../assets/ink-landscape-bg.jpg';

/**
 * 水墨山水背景 — 纯素材底图 + CSS雾气/水波动画
 *
 * 不用CSS画山，使用一张水墨山水素材作为全屏底图
 * CSS只负责：雾气漂移、水波微动、暗角
 */
export function InkBackground({ theme = 'light' }) {
  const canvasRef = useRef(null);
  const themeRef = useRef(theme);

  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    let raf = 0;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let lastFrame = 0;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const waves = [];

    function initWaves() {
      waves.length = 0;
      const baseY = height * 0.68;
      for (let i = 0; i < 4; i++) {
        waves.push({
          y: baseY + i * 13 + Math.random() * 5,
          phase: Math.random() * Math.PI * 2,
          speed: 0.003 + Math.random() * 0.005,
          amp: 0.4 + Math.random() * 1.0,
          alpha: 0.025 + Math.random() * 0.04,
        });
      }
    }

    function resize() {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      initWaves();
    }

    function render(now) {
      if (now - lastFrame < 50) { raf = requestAnimationFrame(render); return; }
      lastFrame = now;
      ctx.clearRect(0, 0, width, height);
      const isDark = themeRef.current === 'dark';
      for (const w of waves) {
        w.phase += w.speed;
        const alpha = w.alpha * (0.4 + Math.sin(w.phase * 0.6) * 0.6);
        if (alpha < 0.003) continue;
        ctx.strokeStyle = isDark
          ? `rgba(90, 98, 105, ${alpha})`
          : `rgba(50, 52, 55, ${alpha * 0.35})`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        const startX = width * 0.1;
        const endX = width * 0.9;
        ctx.moveTo(startX, w.y);
        for (let x = startX; x <= endX; x += 7) {
          ctx.lineTo(x, w.y + Math.sin(x * 0.009 + w.phase) * w.amp);
        }
        ctx.stroke();
      }
      raf = requestAnimationFrame(render);
    }

    function handleVisibility() {
      if (document.hidden) { cancelAnimationFrame(raf); }
      else { lastFrame = 0; raf = requestAnimationFrame(render); }
    }

    let resizeTimer = null;
    function debouncedResize() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 150);
    }

    resize();
    window.addEventListener('resize', debouncedResize);
    if (!reduceMotion) {
      document.addEventListener('visibilitychange', handleVisibility);
      raf = requestAnimationFrame(render);
    }

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(resizeTimer);
      window.removeEventListener('resize', debouncedResize);
      if (!reduceMotion) document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  return (
    <div className="scene-wrapper" aria-hidden="true">
      {/* ===== 水墨山水底图 ===== */}
      <img src={inkLandscape} alt="" className="scene-bg-image" />
      {/* 暖色中和层 — 消除背景图中的桃橙光带 */}
      <div className="scene-cool-overlay" />
      {/* 暗色模式压暗 */}
      {theme === 'dark' && <div className="scene-dark-overlay" />}

      {/* ===== 古典淡月 — 朦胧残月，融入雾气 ===== */}
      <div className="scene-moon" />

      {/* ===== 雾气动画层 — 仅漂移，不画山 ===== */}
      <div className="scene-mist mist-1" />
      <div className="scene-mist mist-2" />

      {/* ===== 水波动画层 ===== */}
      <canvas ref={canvasRef} className="scene-water-canvas" />

      {/* ===== 暗角 ===== */}
      <div className="scene-vignette" />
    </div>
  );
}
