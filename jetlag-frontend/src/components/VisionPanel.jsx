import { Check, ScanEye } from 'lucide-react';

function toTextArray(value) {
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  return value ? [String(value)] : [];
}

function localFeatureList(item) {
  if (!item?.observedFeatures) return [];
  return Object.values(item.observedFeatures).filter(Boolean).map(String);
}

function localReference(item) {
  if (!item) return '';
  const quality = item.imageQuality === 'good' ? '质量可用' : '建议复核';
  const confidence = item.confidence ? `置信 ${Math.round(item.confidence * 100)}%` : '浏览器本地特征';
  return `${quality} · ${confidence}`;
}

export function VisionPanel({ result }) {
  const parsed = result.qwenVision?.parsed;
  const localParsed = result.localVision?.parsed;
  const visionStatus = result.engineStatus?.vision;
  const browserStatus = result.engineStatus?.browserVision;
  const modelConfigured = Boolean(visionStatus?.configured);
  const hasLocalVision = Boolean(result.localVision?.featureText);
  const modelBackedLocal = Boolean(result.localVision?.modelBacked);
  const activeClass = parsed ? 'is-model' : hasLocalVision ? 'is-browser' : 'is-rules';
  const neutralFallback = result.inferenceMode === 'offline-qwen'
    ? (modelConfigured
      ? '离线增强模式已连接本机 Qwen3-VL；上传图像后会参与特征分析。'
      : '离线增强模式未连接本机 Qwen3-VL，已回退规则引擎。')
    : '公网体验版使用浏览器本地特征与规则引擎，不上传原始图片。';
  const statusText = parsed
    ? result.qwenVision.model
    : hasLocalVision
      ? browserStatus?.model || result.localVision.engine || '浏览器本地识别'
      : modelConfigured && result.inferenceMode === 'offline-qwen'
        ? '模型已配置'
        : '等待图像采集';
  const statusDetail =
    result.modelVisionError ||
    (parsed
      ? 'Qwen3-VL 已返回图像特征，规则引擎已参与方案生成。'
      : hasLocalVision
        ? (modelBackedLocal
          ? '浏览器端多模态模型已完成特征提取，规则引擎已据此生成七日建议。'
          : '浏览器已完成轻量特征提取；这不是多模态大模型识别，适合演示或拍摄质量辅助。')
        : neutralFallback || visionStatus?.fallbackReason || '当前使用规则引擎生成养生方案。');
  const fallbackReference = hasLocalVision
    ? '浏览器本地识别特征，仅做养生参考。'
    : modelConfigured
    ? neutralFallback
    : visionStatus?.fallbackReason || '当前使用规则引擎记录采集状态。';
  const items = parsed
    ? [
        ['舌像', toTextArray(parsed.tongue?.features), parsed.tongue?.tcm_reference],
        ['面相', toTextArray(parsed.face?.features), parsed.face?.tcm_reference],
        ['手相', toTextArray(parsed.palm?.features), parsed.palm?.tcm_reference],
      ]
    : hasLocalVision
      ? [
          ['舌像', localFeatureList(localParsed?.tongue), localReference(localParsed?.tongue)],
          ['面相', localFeatureList(localParsed?.face), localReference(localParsed?.face)],
          ['手相', localFeatureList(localParsed?.palm), localReference(localParsed?.palm)],
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
        <h2>图像特征</h2>
        <span className={`status-pill ${activeClass}`}>{statusText}</span>
      </div>
      <div className={`engine-banner ${activeClass}`}>
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
