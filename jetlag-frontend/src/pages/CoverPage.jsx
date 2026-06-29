import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Particles from '@tsparticles/react';
import { ArrowRight, Leaf } from 'lucide-react';

// 根据当前子午流注时辰给出一句养生提示
function currentMeridianHint(hour) {
  const table = [
    { range: '23:00-01:00', name: '子时', meridian: '胆经', advice: '宜熟睡养胆气' },
    { range: '01:00-03:00', name: '丑时', meridian: '肝经', advice: '深睡利肝血收藏' },
    { range: '03:00-05:00', name: '寅时', meridian: '肺经', advice: '安卧避早醒用脑' },
    { range: '05:00-07:00', name: '卯时', meridian: '大肠经', advice: '饮温水培养排便' },
    { range: '07:00-09:00', name: '辰时', meridian: '胃经', advice: '温热早餐护胃气' },
    { range: '09:00-11:00', name: '巳时', meridian: '脾经', advice: '专注工作少甜腻' },
    { range: '11:00-13:00', name: '午时', meridian: '心经', advice: '小憩 15 分钟养心' },
    { range: '13:00-15:00', name: '未时', meridian: '小肠经', advice: '轻食慢行助消化' },
    { range: '15:00-17:00', name: '申时', meridian: '膀胱经', advice: '补水伸展通背部' },
    { range: '17:00-19:00', name: '酉时', meridian: '肾经', advice: '收敛强度养肾精' },
    { range: '19:00-21:00', name: '戌时', meridian: '心包经', advice: '放松交流减内耗' },
    { range: '21:00-23:00', name: '亥时', meridian: '三焦经', advice: '泡脚准备入睡' },
  ];
  const index = Math.floor(((Number(hour) + 1) % 24) / 2);
  return table[index] || table[0];
}

// 经络粒子流配置：青绿墨色，低速流动，鼠标轻推
function buildParticleOptions(theme) {
  const isDark = theme === 'dark';
  return {
    fullScreen: { enable: false },
    background: { color: 'transparent' },
    fpsLimit: 60,
    detectRetina: true,
    particles: {
      color: { value: isDark ? '#9fd3b4' : '#2f6f54' },
      links: {
        enable: true,
        color: isDark ? '#3a7d5c' : '#7bbf9a',
        distance: 140,
        opacity: isDark ? 0.35 : 0.5,
        width: 1,
      },
      move: {
        enable: true,
        speed: 0.7,
        direction: 'none',
        outModes: { default: 'bounce' },
      },
      number: {
        value: typeof window !== 'undefined' && window.innerWidth < 768 ? 30 : 60,
        density: { enable: true, area: 900 },
      },
      opacity: { value: { min: 0.25, max: 0.7 } },
      shape: { type: 'circle' },
      size: { value: { min: 1, max: 3 } },
    },
    interactivity: {
      events: {
        onHover: { enable: true, mode: 'push' },
        onClick: { enable: true, mode: 'repulse' },
      },
      modes: {
        push: { quantity: 3 },
        repulse: { distance: 120 },
      },
    },
  };
}

export function CoverPage({ theme }) {
  const navigate = useNavigate();
  const options = useMemo(() => buildParticleOptions(theme), [theme]);
  const meridianHint = useMemo(() => currentMeridianHint(new Date().getHours()), []);

  return (
    <section className="cover">
      <Particles id="tcm-cover" options={options} className="cover-canvas" />
      <div className="cover-inner">
        <div className="cover-brand">
          <span className="cover-mark">岐</span>
          <Leaf size={22} />
        </div>
        <h1 className="cover-title">岐养七日</h1>
        <p className="cover-subtitle">中医养生辅助系统 · 望诊 · 子午流注 · 七日调理</p>
        <p className="cover-meridian">
          当前 <strong>{meridianHint.name}</strong> · {meridianHint.meridian} 当令 · {meridianHint.advice}
        </p>
        <p className="cover-disclaimer">
          ⚠️ AI 分析仅供学术参考，不作为医疗诊断。请咨询执业中医师。
        </p>
        <button
          className="cover-enter"
          type="button"
          onClick={() => navigate('/collection')}
        >
          进入系统 <ArrowRight size={18} />
        </button>
      </div>
      <div className="cover-taiji" aria-hidden="true" />
    </section>
  );
}
