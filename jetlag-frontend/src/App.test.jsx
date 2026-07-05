import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { App } from './App';

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
        visionModelName: 'Qwen/Qwen3-VL-32B-Instruct',
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

  test('book route avoids the flipbook engine on mobile viewports', async () => {
    vi.stubGlobal('matchMedia', vi.fn((query) => ({
      matches: query.includes('max-width') || query.includes('pointer: coarse'),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })));

    renderApp('/book');

    expect(await screen.findByTestId('mobile-book-reader')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-flipbook')).not.toBeInTheDocument();
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
});
