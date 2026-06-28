import { History, LockKeyhole } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import { loadHistory } from '../services/api';

export function HistoryPage({ auth }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    let cancelled = false;
    if (!auth.token) {
      return undefined;
    }

    loadHistory(auth.token)
      .then((payload) => {
        if (!cancelled) setItems(payload.data || []);
      })
      .catch((error) => toast.error(error.message || '历史记录加载失败。'));

    return () => {
      cancelled = true;
    };
  }, [auth.token]);

  const visibleItems = auth.token ? items : [];

  if (!auth.user) {
    return (
      <section className="panel page-panel">
        <LockKeyhole size={28} />
        <h1>登录后查看历史记录</h1>
        <p>诊断结果会在登录状态下自动保存，便于答辩演示用户体系和数据持久化。</p>
      </section>
    );
  }

  return (
    <section className="panel page-panel">
      <div className="section-title">
        <History size={20} />
        <h2>诊断历史</h2>
        <span>{visibleItems.length} 条</span>
      </div>
      <div className="history-list">
        {visibleItems.map((item) => (
          <article key={item.id}>
            <strong>{item.summary.constitution || '未命名方案'}</strong>
            <small>{new Date(item.createdAt).toLocaleString()}</small>
            <p>匹配度 {item.summary.confidence}% · {item.summary.meridian || '未记录时辰'}</p>
          </article>
        ))}
        {!visibleItems.length && <p className="empty-row">暂无历史记录，生成方案后会自动保存。</p>}
      </div>
    </section>
  );
}
