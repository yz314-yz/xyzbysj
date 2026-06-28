import { Activity, Check } from 'lucide-react';

export function SymptomsPanel({ canSubmit, completion, formError, hasInput, loading, onSubmit, onToggle, selected, symptomOptions }) {
  return (
    <section className="panel symptoms">
      <div className="section-title">
        <Activity size={20} />
        <h2>症状选择</h2>
        <span>{completion}%</span>
      </div>
      <div className="chips">
        {symptomOptions.map(({ id, label }) => (
          <button
            key={id}
            className={selected.includes(id) ? 'chip selected' : 'chip'}
            type="button"
            onClick={() => onToggle(id)}
          >
            {selected.includes(id) && <Check size={14} />} {label}
          </button>
        ))}
      </div>
      {!hasInput && <p className="form-hint">请选择症状或上传图片后生成计划。</p>}
      {formError && <p className="form-error">{formError}</p>}
      <button className="primary" type="button" onClick={onSubmit} disabled={!canSubmit}>
        {loading ? '正在生成养生方案...' : '生成七日调理计划'}
      </button>
    </section>
  );
}
