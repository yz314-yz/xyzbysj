import { FlameKindling } from 'lucide-react';

export function MeridianActions({ result }) {
  return (
    <section className="panel actions" id="meridian">
      <div className="section-title">
        <FlameKindling size={20} />
        <h2>子午流注与今日补救窗口</h2>
      </div>
      {result.meridian?.name && (
        <div className="meridian-card">
          <strong>
            {result.meridian.name} · {result.meridian.meridian}
          </strong>
          <span>{result.meridian.range}</span>
          <p>{result.meridian.advice}</p>
        </div>
      )}
      {result.immediateActions.map((item, index) => (
        <p key={`${index}-${item}`}>{item}</p>
      ))}
    </section>
  );
}
