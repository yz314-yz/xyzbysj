import { CONFIG_TIMEOUT_MS, REQUEST_TIMEOUT_MS } from '../constants/app';

const runtimeConfig = window.__APP_CONFIG__ || {};
const runtimeApiBase = typeof runtimeConfig.API_BASE === 'string' ? runtimeConfig.API_BASE.trim() : '';

export const API_BASE =
  runtimeApiBase || import.meta.env.VITE_API_BASE || (import.meta.env.DEV ? 'http://localhost:3000' : '');

export async function fetchJson(path, options = {}) {
  const { timeout = REQUEST_TIMEOUT_MS, token, headers, ...fetchOptions } = options;
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...fetchOptions,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(headers || {}),
      },
      signal: controller.signal,
    });
    const text = await response.text();
    const payload = text ? JSON.parse(text) : null;

    if (!response.ok || payload?.success === false) {
      throw new Error(payload?.error || '请求失败，请稍后再试。');
    }

    return payload;
  } finally {
    window.clearTimeout(timer);
  }
}

export function loadSymptoms() {
  return fetchJson('/api/v1/symptoms', { timeout: CONFIG_TIMEOUT_MS });
}

export function loadHealth() {
  return fetchJson('/health', { timeout: CONFIG_TIMEOUT_MS });
}

export function login(username, password) {
  return fetchJson('/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
}

export function register(username, password) {
  return fetchJson('/api/v1/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
}

export function loadMe(token) {
  return fetchJson('/api/v1/auth/me', { token, timeout: CONFIG_TIMEOUT_MS });
}

export function loadHistory(token) {
  return fetchJson('/api/v1/history', { token });
}

export function loadHistoryDetail(token, id) {
  return fetchJson(`/api/v1/history/${id}`, { token });
}

export function loadCheckins(token, diagnosisId) {
  return fetchJson(`/api/v1/checkins/${diagnosisId}`, { token });
}

export function saveCheckin(token, payload) {
  return fetchJson('/api/v1/checkins', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    token,
  });
}

export function submitDiagnosis(form, token) {
  return fetchJson('/api/v1/diagnose', {
    method: 'POST',
    body: form,
    token,
    timeout: REQUEST_TIMEOUT_MS,
  });
}

export function sendChatMessage({ question, result, messages }, token) {
  return fetchJson('/api/v1/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, result, messages }),
    token,
    timeout: REQUEST_TIMEOUT_MS,
  });
}
