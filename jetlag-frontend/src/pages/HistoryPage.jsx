import { ChevronDown, ChevronUp, History, LockKeyhole, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

import { loadHistory, loadHistoryDetail } from '../services/api';

export function HistoryPage({ auth }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [detailCache, setDetailCache] = useState({});
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!auth.token) {
      return undefined;
    }

    setLoading(true);
    loadHistory(auth.token)
      .then((payload) => {
        if (!cancelled) setItems(payload.data || []);
      })
      .catch((error) => toast.error(error.message || '历史记录加载失败。'))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [auth.token]);

  const visibleItems = auth.token ? items : [];

  async function toggleExpand(item) {
    if (expandedId === item.id) {
      setExpandedId(null);
      return;
    }

    setExpandedId(item.id);

    if (detailCache[item.id]) return;

    setDetailLoading(true);
    try {
      const payload = await loadHistoryDetail(auth.token, item.id);
      setDetailCache((prev) => ({ ...prev, [item.id]: payload.data }));
    } catch (error) {
      toast.error(error.message || '详情加载失败。');
      setExpandedId(null);
    } finally {
      setDetailLoading(false);
    }
  }

  if (!auth.user) {
    return (
      <section className="panel page-panel">
        <LockKeyhole size={28} />
        <h1>登录后查看历史记录</h1>
        <p>诊断结果会在登录状态下自动保存，便于答辩演示用户体系和数据持久化。</p>
        <Link className="ghost page-action" to="/login">去登录</Link>
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
        {loading && (
          <p className="empty-row">
            <Loader2 size={16} className="spin" /> 加载中…
          </p>
        )}
        {!loading && visibleItems.map((item) => {
          const detail = detailCache[item.id];
          const isOpen = expandedId === item.id;
          return (
            <article
              key={item.id}
              className={`history-card ${isOpen ? 'is-open' : ''}`}
              onClick={() => toggleExpand(item)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  toggleExpand(item);
                }
              }}
            >
              <div className="history-card-header">
                <div className="history-card-meta">
                  <strong>{item.summary.constitution || '未命名方案'}</strong>
                  <small>{new Date(item.createdAt).toLocaleString()}</small>
                  <p>匹配度 {item.summary.confidence}% · {item.summary.meridian || '未记录时辰'}</p>
                </div>
                <span className="history-toggle">
                  {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </span>
              </div>

              {isOpen && (
                <div className="history-detail" onClick={(e) => e.stopPropagation()}>
                  {detailLoading && !detail ? (
                    <p className="empty-row"><Loader2 size={16} className="spin" /> 正在加载完整报告…</p>
                  ) : detail ? (
                    <>
                      {detail.result?.disclaimer && (
                        <p className="history-disclaimer">{detail.result.disclaimer}</p>
                      )}

                      <div className="history-section">
                        <h4>体质方向</h4>
                        <p>
                          主方向：{detail.result?.constitution?.primary || '未记录'}
                          {detail.result?.constitution?.secondary?.length > 0 &&
                            '；兼顾：' + detail.result.constitution.secondary.join('、')}
                        </p>
                        <p className="muted">{detail.result?.constitution?.explanation}</p>
                      </div>

                      <div className="history-section">
                        <h4>当下时辰建议</h4>
                        {detail.result?.immediateActions?.map((action, i) => (
                          <p key={i}>{action}</p>
                        )) || <p className="muted">未记录</p>}
                      </div>

                      <div className="history-section">
                        <h4>七日调理计划</h4>
                        <div className="history-plan-grid">
                          {detail.result?.sevenDayPlan?.map((day, i) => (
                            <div key={i} className="history-plan-day">
                              <strong>{day.day}</strong>
                              <span className="plan-theme">{day.theme}</span>
                              <p><b>饮食</b>{day.diet}</p>
                              <p><b>运动</b>{day.exercise}</p>
                              <p><b>作息</b>{day.sleep}</p>
                              {day.note && <p className="muted">{day.note}</p>}
                            </div>
                          )) || <p className="muted">未记录</p>}
                        </div>
                      </div>

                      {detail.result?.observation &&
                        Object.values(detail.result.observation).some((v) => v) && (
                          <div className="history-section">
                            <h4>望诊记录</h4>
                            {Object.entries(detail.result.observation).map(([key, value]) => (
                              <p key={key}><b>{key === 'tongue' ? '舌像' : key === 'face' ? '面相' : '手相'}</b>{value}</p>
                            ))}
                          </div>
                        )}
                    </>
                  ) : (
                    <p className="muted">详情加载失败，请重试。</p>
                  )}
                </div>
              )}
            </article>
          );
        })}
        {!loading && !visibleItems.length && <p className="empty-row">暂无历史记录，生成方案后会自动保存。</p>}
      </div>
    </section>
  );
}
