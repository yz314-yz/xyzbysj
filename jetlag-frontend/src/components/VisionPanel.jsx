import { Check, ScanEye } from 'lucide-react';

function toTextArray(value) {
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  return value ? [String(value)] : [];
}

export function VisionPanel({ result }) {
  const parsed = result.qwenVision?.parsed;
  const visionStatus = result.engineStatus?.vision;
  const statusText = parsed
    ? result.qwenVision.model
    : visionStatus?.configured
      ? '模型已配置'
      : '本地规则已接管';
  const statusDetail =
    result.modelVisionError ||
    (parsed
      ? 'Qwen2.5-VL 已返回图像特征，本地规则引擎已参与方案生成。'
      : visionStatus?.fallbackReason || '当前使用本地规则引擎生成养生方案。');
  const fallbackReference = visionStatus?.fallbackReason || '当前使用本地规则引擎记录采集状态。';
  const items = parsed
    ? [
        ['舌像', toTextArray(parsed.tongue?.features), parsed.tongue?.tcm_reference],
        ['面相', toTextArray(parsed.face?.features), parsed.face?.tcm_reference],
        ['手相', toTextArray(parsed.palm?.features), parsed.palm?.tcm_reference],
      ]
    : [
        ['舌像', [result.observation.tongue], fallbackReference],
        ['面相', [result.observation.face], fallbackReference],
        ['手相', [result.observation.palm], fallbackReference],
      ];

  return (
    <section className="panel vision-panel">
      <div className="section-title">
        <ScanEye size={20} />
        <h2>Qwen2.5-VL 图像特征</h2>
        <span className={`status-pill ${parsed ? 'is-model' : 'is-rules'}`}>{statusText}</span>
      </div>
      <div className={`engine-banner ${parsed ? 'is-model' : 'is-rules'}`}>
        <Check size={16} />
        <span>{statusDetail}</span>
      </div>
      <div className="feature-list">
        {items.map(([title, features, reference], index) => (
          <article key={`${title}-${index}`}>
            <strong>{title}</strong>
            <p>{features.length ? features.join('，') : '未采集'}</p>
            <small>{reference || '仅做养生参考，不作为医疗诊断。'}</small>
          </article>
        ))}
      </div>
    </section>
  );
}
