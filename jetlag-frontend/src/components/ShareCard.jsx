import { Copy, Download, Share2 } from 'lucide-react';
import { useMemo, useRef } from 'react';
import toast from 'react-hot-toast';

function buildShareText(result) {
  const constitution = result.constitution?.primary || '待生成';
  const confidence = result.constitution?.confidence || 0;
  const action = result.immediateActions?.[0] || '完成望诊采集后生成七日养生方案。';
  const days = (result.sevenDayPlan || [])
    .slice(0, 3)
    .map((item) => `${item.day}：${item.theme}`)
    .join('；');
  return `我的岐养七日方案：${constitution}，匹配度 ${confidence}。${action}${days ? ` 前三日重点：${days}` : ''}`;
}

export function ShareCard({ result }) {
  const cardRef = useRef(null);
  const hasResult = result.sevenDayPlan?.length > 0;
  const shareText = useMemo(() => buildShareText(result), [result]);
  const firstDays = useMemo(() => (result.sevenDayPlan || []).slice(0, 3), [result.sevenDayPlan]);

  async function downloadCard() {
    if (!cardRef.current) return;
    try {
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(cardRef.current, { backgroundColor: '#f7f3ea', scale: 2 });
      const link = document.createElement('a');
      link.download = '岐养七日-分享卡片.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success('分享卡片已下载。');
    } catch (error) {
      toast.error(error.message || '生成分享卡片失败。');
    }
  }

  async function copySummary() {
    try {
      await navigator.clipboard.writeText(shareText);
      toast.success('方案摘要已复制。');
    } catch {
      toast.error('当前浏览器不支持复制，请手动选择摘要。');
    }
  }

  return (
    <section className="panel share-panel" id="share">
      <div className="section-title">
        <Share2 size={20} />
        <h2>方案分享卡</h2>
        <span>{hasResult ? '可下载图片' : '等待方案'}</span>
      </div>

      <div className="share-card-preview" ref={cardRef}>
        <div className="share-card-head">
          <span>岐</span>
          <div>
            <strong>岐养七日</strong>
            <small>中医养生辅助方案</small>
          </div>
        </div>
        <p className="share-card-label">体质方向</p>
        <h3>{result.constitution.primary}</h3>
        <div className="share-card-score">
          <span>{result.constitution.confidence || 0}</span>
          <small>匹配度</small>
        </div>
        <p className="share-card-action">{result.immediateActions?.[0]}</p>
        <div className="share-card-days">
          {firstDays.length ? firstDays.map((item) => (
            <div key={item.day}>
              <b>{item.day}</b>
              <span>{item.theme}</span>
            </div>
          )) : (
            <div>
              <b>待生成</b>
              <span>完成采集后生成七日计划</span>
            </div>
          )}
        </div>
        <p className="share-card-disclaimer">AI 分析仅供学术参考，不作为医疗诊断。</p>
      </div>

      <div className="share-actions">
        <button className="ghost" type="button" onClick={downloadCard} disabled={!hasResult}>
          <Download size={16} /> 下载卡片
        </button>
        <button className="ghost" type="button" onClick={copySummary} disabled={!hasResult}>
          <Copy size={16} /> 复制摘要
        </button>
      </div>
    </section>
  );
}
