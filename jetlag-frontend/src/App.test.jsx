import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { App } from './App';
import { PlanTable } from './components/PlanTable';

vi.mock('react-pageflip', async () => {
  const React = await vi.importActual('react');
  return {
    default: React.forwardRef(function MockFlipBook({ children, onFlip }, ref) {
      React.useImperativeHandle(ref, () => ({
        pageFlip: () => ({
          flip: (page) => onFlip?.({ data: page }),
          flipNext: () => {},
          flipPrev: () => {},
        }),
      }));
      return <div data-testid="mock-flipbook">{children}</div>;
    }),
  };
});

function renderApp(initialEntry = '/') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <App />
    </MemoryRouter>
  );
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
    addColorStop: vi.fn(),
    arc: vi.fn(),
    beginPath: vi.fn(),
    clearRect: vi.fn(),
    createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    drawImage: vi.fn(),
    fill: vi.fn(),
    lineTo: vi.fn(),
    moveTo: vi.fn(),
    setTransform: vi.fn(),
    stroke: vi.fn(),
  }));
  vi.stubGlobal('matchMedia', vi.fn(() => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })));
  vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1));
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  vi.stubGlobal('fetch', vi.fn((url) => {
    if (String(url).endsWith('/api/v1/symptoms')) {
      return Promise.resolve(new Response(JSON.stringify({
        success: true,
        data: [{ id: 'dry_mouth', label: '口干咽燥' }],
      })));
    }
    if (String(url).endsWith('/health')) {
      return Promise.resolve(new Response(JSON.stringify({
        status: 'ok',
        visionModelReady: false,
        visionModelName: 'Qwen/Qwen2.5-VL-3B-Instruct',
      })));
    }
    return Promise.resolve(new Response(JSON.stringify({ success: true, data: [] })));
  }));
});

describe('App', () => {
  test('home page exposes the book entry and theme toggle', async () => {
    renderApp('/');

    const entryLinks = await screen.findAllByRole('link', { name: '启卷' });
    expect(entryLinks).toHaveLength(2);
    entryLinks.forEach((link) => expect(link).toHaveAttribute('href', '/book'));

    await userEvent.click(screen.getByRole('button', { name: '切换明暗主题' }));

    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    expect(localStorage.getItem('tcm-theme')).toBe('dark');
  });

  test('login page returns to the current book route', async () => {
    renderApp('/login');

    expect(await screen.findByRole('link', { name: '返回望诊采集' })).toHaveAttribute('href', '/book');
  });

  test('book assessment requires profile fields before submitting', async () => {
    renderApp('/book');

    expect(await screen.findByRole('button', { name: /公网体验/ })).toBeEnabled();
    expect(screen.getByRole('button', { name: /离线增强/ })).toBeDisabled();

    await userEvent.click(await screen.findByRole('button', { name: '口干咽燥' }));
    await userEvent.click(screen.getByRole('button', { name: '生成方案' }));

    expect(await screen.findByText(/请补全基本信息/)).toBeInTheDocument();
    expect(screen.getByText('请填写年龄')).toBeInTheDocument();
    expect(screen.getByText('请选择性别')).toBeInTheDocument();
  });

  test('renders the seven-day plan as a single-open mobile accordion', async () => {
    const result = {
      sevenDayPlan: [
        { day: '第1天', theme: '健脾', diet: '山药小米粥', exercise: '八段锦', sleep: '23 点前睡', note: '先固护脾胃' },
        { day: '第2天', theme: '疏肝', diet: '玫瑰陈皮茶', exercise: '舒展肩颈', sleep: '午间小憩', note: '减少郁滞' },
      ],
    };

    render(<PlanTable result={result} />);

    const mobilePlan = screen.getByLabelText('七日计划移动端折叠列表');
    expect(within(mobilePlan).getByText('山药小米粥')).toBeInTheDocument();
    expect(within(mobilePlan).queryByText('玫瑰陈皮茶')).not.toBeInTheDocument();

    await userEvent.click(within(mobilePlan).getByRole('button', { name: /第2天/ }));

    expect(within(mobilePlan).getByText('玫瑰陈皮茶')).toBeInTheDocument();
    expect(within(mobilePlan).queryByText('山药小米粥')).not.toBeInTheDocument();
  });
});
