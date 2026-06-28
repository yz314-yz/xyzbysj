import { Activity, CalendarDays, Moon, Soup } from 'lucide-react';

export function PlanTable({ result }) {
  return (
    <section className="plan panel" id="plan">
      <div className="section-title">
        <CalendarDays size={20} />
        <h2>七日计划表</h2>
        <span>食谱 / 体操 / 作息</span>
      </div>
      <div className="table">
        <div className="thead">
          <span>日期</span>
          <span>主题</span>
          <span>
            <Soup size={15} /> 食谱计划
          </span>
          <span>
            <Activity size={15} /> 运动体操
          </span>
          <span>
            <Moon size={15} /> 作息计划
          </span>
        </div>
        {result.sevenDayPlan.map((row) => (
          <div className="tr" key={row.day}>
            <b>{row.day}</b>
            <strong>{row.theme}</strong>
            <span>{row.diet}</span>
            <span>{row.exercise}</span>
            <span>{row.sleep}</span>
          </div>
        ))}
        {!result.sevenDayPlan.length && (
          <div className="empty-row">生成方案后，这里会显示 7 天的食谱、运动和作息安排。</div>
        )}
      </div>
    </section>
  );
}
