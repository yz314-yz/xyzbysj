import { BookOpen, CalendarDays, ClipboardList, HeartPulse, HelpCircle, History, Home, Leaf } from 'lucide-react';
import { NavLink } from 'react-router-dom';

import { AuthPanel } from './AuthPanel';
import { ThemeToggle } from './ThemeToggle';

const navItems = [
  { to: '/', label: '首页', icon: Home },
  { to: '/collection', label: '望诊采集', icon: Leaf },
  { to: '/history', label: '历史记录', icon: History },
  { to: '/help', label: '用户手册', icon: HelpCircle },
  { to: '/about', label: '关于系统', icon: BookOpen },
];

const sectionItems = [
  { id: 'constitution', label: '体质评估', icon: HeartPulse },
  { id: 'plan', label: '七日计划', icon: CalendarDays },
  { id: 'meridian', label: '子午流注', icon: ClipboardList },
];

export function Sidebar({ activeSection, auth, onSectionClick, onThemeToggle, theme }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-glow" aria-hidden="true" />
      <div className="brand">
        <span>岐</span>
        <div>
          <strong>岐养七日</strong>
          <small>中医养生辅助系统</small>
        </div>
      </div>

      <nav>
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => (isActive ? 'active' : '')}>
            <Icon size={18} /> {label}
          </NavLink>
        ))}
        {sectionItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={activeSection === id ? 'active' : ''}
            type="button"
            onClick={() => onSectionClick(id)}
          >
            <Icon size={18} /> {label}
          </button>
        ))}
      </nav>

      <div className="sidebar-actions">
        <ThemeToggle theme={theme} onToggle={onThemeToggle} />
      </div>
      <AuthPanel auth={auth} />
      <p className="notice">毕业设计演示版本：以图像特征记录、症状归类和养生计划生成为核心，不提供医疗诊断。</p>
    </aside>
  );
}
