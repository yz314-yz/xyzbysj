import { Activity, CalendarDays, ChevronDown, Moon, Soup } from 'lucide-react';
import { useState } from 'react';

export function PlanTable({ result }) {
  const days = result.sevenDayPlan || [];
  const defaultOpenDay = days[0]?.day || '';
  const [openDay, setOpenDay] = useState(defaultOpenDay);
  const visibleOpenDay = days.some((row) => row.day === openDay) ? openDay : defaultOpenDay;

  return (
    <section className="plan panel" id="plan">
      <div className="section-title">
        <CalendarDays size={20} />
        <h2>七日计划表</h2>
        <span>食谱 / 体操 / 作息</span>
      </div>
      <div className="table" aria-label="七日计划桌面表格">
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
          <span>调整依据</span>
        </div>
        {days.map((row) => (
          <div className="tr" key={row.day}>
            <b>{row.day}</b>
            <strong>{row.theme}</strong>
            <span>{row.diet}</span>
            <span>{row.exercise}</span>
            <span>{row.sleep}</span>
            <small>{row.note}</small>
          </div>
        ))}
        {!days.length && (
          <div className="empty-row">生成方案后，这里会显示 7 天的食谱、运动和作息安排。</div>
        )}
      </div>

      <div className="plan-mobile" aria-label="七日计划移动端折叠列表">
        {days.map((row) => {
          const isOpen = visibleOpenDay === row.day;
          return (
            <article className={`plan-day-card ${isOpen ? 'is-open' : ''}`} key={`mobile-${row.day}`}>
              <button
                className="plan-day-toggle"
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpenDay(row.day)}
              >
                <span>
                  <b>{row.day}</b>
                  <small>{row.theme}</small>
                </span>
                <ChevronDown size={18} />
              </button>
              {isOpen && (
                <div className="plan-day-body">
                  <p>
                    <Soup size={15} />
                    <span>{row.diet}</span>
                  </p>
                  <p>
                    <Activity size={15} />
                    <span>{row.exercise}</span>
                  </p>
                  <p>
                    <Moon size={15} />
                    <span>{row.sleep}</span>
                  </p>
                  <small>{row.note}</small>
                </div>
              )}
            </article>
          );
        })}
        {!days.length && (
          <div className="empty-row is-mobile">生成方案后，这里会显示 7 天的食谱、运动和作息安排。</div>
        )}
      </div>
    </section>
  );
}
