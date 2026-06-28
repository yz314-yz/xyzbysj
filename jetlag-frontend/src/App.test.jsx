import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { describe, expect, test, vi, beforeEach } from 'vitest';

import { App } from './App';

function renderApp() {
  return render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
}

beforeEach(() => {
  localStorage.clear();
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
        qwen3VLReady: false,
        qwen3VLModel: 'Qwen/Qwen3-VL-8B-Instruct',
      })));
    }
    return Promise.resolve(new Response(JSON.stringify({ success: true, data: [] })));
  }));
});

describe('App', () => {
  test('keeps submit disabled until a symptom is selected', async () => {
    renderApp();
    const submit = await screen.findByRole('button', { name: '生成七日调理计划' });
    expect(submit).toBeDisabled();

    await userEvent.click(await screen.findByRole('button', { name: '口干咽燥' }));
    expect(submit).toBeEnabled();
  });

  test('renders route navigation pages', async () => {
    renderApp();
    await userEvent.click(screen.getByRole('link', { name: /用户手册/ }));
    expect(await screen.findByText('1. 采集信息')).toBeInTheDocument();
  });
});
