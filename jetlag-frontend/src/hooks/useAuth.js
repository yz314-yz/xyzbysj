import { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';

import { loadMe, login, register } from '../services/api';
import { safeStorage } from '../utils/safeStorage';

const TOKEN_KEY = 'tcm-wellness-token';

export function useAuth() {
  const [token, setToken] = useState(() => safeStorage.getItem(TOKEN_KEY) || '');
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  // submitAuth 已经设置了 user，避免随后 token 变化触发 loadMe 重复请求
  const skipNextLoadRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    if (!token) {
      return undefined;
    }
    if (skipNextLoadRef.current) {
      skipNextLoadRef.current = false;
      return undefined;
    }

    loadMe(token)
      .then((payload) => {
        if (!cancelled) setUser(payload.data.user);
      })
      .catch(() => {
        if (!cancelled) {
          safeStorage.removeItem(TOKEN_KEY);
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
      safeStorage.setItem(TOKEN_KEY, payload.data.token);
      skipNextLoadRef.current = true;
      setToken(payload.data.token);
      setUser(payload.data.user);
      toast.success(mode === 'register' ? '注册成功，已登录。' : '登录成功。');
    } finally {
      setAuthLoading(false);
    }
  }

  function logout() {
    safeStorage.removeItem(TOKEN_KEY);
    setToken('');
    setUser(null);
    toast.success('已退出登录。');
  }

  return useMemo(
    () => ({ authLoading, logout, submitAuth, token, user }),
    [authLoading, token, user]
  );
}
