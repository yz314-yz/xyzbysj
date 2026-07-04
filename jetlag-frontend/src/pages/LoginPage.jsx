import { History, LockKeyhole, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

import { AuthPanel } from '../components/AuthPanel';

export function LoginPage({ auth }) {
  return (
    <section className="login-page">
      <div className="login-copy">
        <span className="login-mark">
          <LockKeyhole size={22} />
        </span>
        <h1>账号登录</h1>
        <p>登录后，系统会自动保存每次望诊评估与七日计划，方便答辩展示用户体系、历史记录和数据持久化。</p>
        <div className="login-benefits">
          <span>
            <History size={16} /> 保存诊断历史
          </span>
          <span>
            <ShieldCheck size={16} /> 本地演示账号
          </span>
        </div>
        <Link className="ghost login-back" to="/book">
          返回望诊采集
        </Link>
      </div>
      <AuthPanel auth={auth} />
    </section>
  );
}
