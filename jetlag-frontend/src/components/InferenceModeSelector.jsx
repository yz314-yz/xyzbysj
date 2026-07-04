import { CheckCircle2, Globe2, HardDrive } from 'lucide-react';

import { INFERENCE_MODE_OFFLINE_QWEN, inferenceModeOptions } from '../constants/app';

const MODE_ICONS = {
  'public-free': Globe2,
  'offline-qwen': HardDrive,
};

export function InferenceModeSelector({
  value,
  onChange,
  offlineAvailable,
  requireModelEvidence = false,
  disabled = false,
}) {
  return (
    <div className="inference-mode-control" role="group" aria-label="推理模式">
      {inferenceModeOptions.map((option) => {
        const Icon = MODE_ICONS[option.id] || Globe2;
        const active = value === option.id;
        const offlineBlocked = option.id === INFERENCE_MODE_OFFLINE_QWEN && !offlineAvailable;
        const publicNeedsModel = option.id === 'public-free' && requireModelEvidence;

        return (
          <button
            aria-pressed={active}
            className={`inference-mode-option ${active ? 'is-active' : ''}`}
            disabled={disabled || offlineBlocked}
            key={option.id}
            onClick={() => onChange(option.id)}
            title={option.description}
            type="button"
          >
            <span className="inference-mode-icon">
              {active ? <CheckCircle2 size={15} /> : <Icon size={15} />}
            </span>
            <span>
              <strong>{option.label}</strong>
              <small>{offlineBlocked ? '未连接' : publicNeedsModel ? '需浏览器模型' : option.shortLabel}</small>
            </span>
          </button>
        );
      })}
    </div>
  );
}
