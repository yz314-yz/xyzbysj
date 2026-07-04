import { LogIn, LogOut, UserPlus } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

export function AuthPanel({ auth }) {
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  async function submit(event) {
    event?.preventDefault();
    try {
      await auth.submitAuth(mode, username, password);
      setPassword('');
    } catch (error) {
      toast.error(error.message || '登录失败，请稍后重试。');
    }
  }

  if (auth.user) {
    return (
      <section className="auth-panel">
        <strong>{auth.user.username}</strong>
        <small>历史记录已开启</small>
        <button type="button" onClick={auth.logout}>
          <LogOut size={15} /> 退出
        </button>
      </section>
    );
  }

  return (
    <form className="auth-panel" onSubmit={submit}>
      <div className="auth-tabs">
        <button className={mode === 'login' ? 'active' : ''} type="button" onClick={() => setMode('login')}>
          <LogIn size={14} /> 登录
        </button>
        <button className={mode === 'register' ? 'active' : ''} type="button" onClick={() => setMode('register')}>
          <UserPlus size={14} /> 注册
        </button>
      </div>
      <input
        autoComplete="username"
        placeholder="用户名"
        value={username}
        onChange={(event) => setUsername(event.target.value)}
      />
      <input
        autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
        placeholder="密码"
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />
      <button type="submit" disabled={auth.authLoading}>
        {auth.authLoading ? '处理中...' : mode === 'register' ? '创建账号' : '登录账号'}
      </button>
    </form>
  );
}
