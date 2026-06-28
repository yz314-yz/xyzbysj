export function ResultCard({ result }) {
  const confidence = Number(result.constitution.confidence || 0);
  const scoreTone = confidence >= 80 ? 'is-high' : confidence >= 50 ? 'is-mid' : 'is-low';

  return (
    <section className="panel result-card" id="constitution">
      <div className={`score-ring ${scoreTone}`}>
        <span>{confidence}</span>
        <small>匹配度</small>
      </div>
      <div>
        <p className="label">主要调理方向</p>
        <h2>{result.constitution.primary}</h2>
        <p>{result.constitution.explanation}</p>
        <div className="subtypes">
          {result.constitution.secondary?.map((item, index) => (
            <span key={`${index}-${item}`}>{item}</span>
          ))}
        </div>
      </div>
    </section>
  );
}
