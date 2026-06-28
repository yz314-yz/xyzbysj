import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

import { loadMe, login, register } from '../services/api';

const TOKEN_KEY = 'tcm-wellness-token';

export function useAuth() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || '');
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!token) {
      return undefined;
    }

    loadMe(token)
      .then((payload) => {
        if (!cancelled) setUser(payload.data.user);
      })
      .catch(() => {
        if (!cancelled) {
          localStorage.removeItem(TOKEN_KEY);
          setToken('');
          setUser(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  async function submitAuth(mode, username, password) {
    setAuthLoading(true);
    try {
      const action = mode === 'register' ? register : login;
      const payload = await action(username, password);
      localStorage.setItem(TOKEN_KEY, payload.data.token);
      setToken(payload.data.token);
      setUser(payload.data.user);
      toast.success(mode === 'register' ? '注册成功，已登录。' : '登录成功。');
    } finally {
      setAuthLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    setToken('');
    setUser(null);
    toast.success('已退出登录。');
  }

  return useMemo(
    () => ({ authLoading, logout, submitAuth, token, user }),
    [authLoading, token, user]
  );
}
