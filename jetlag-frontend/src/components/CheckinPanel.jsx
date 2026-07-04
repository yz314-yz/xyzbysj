import { CheckCircle2, ClipboardCheck, Loader2, Save, Star } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

import { loadCheckins, saveCheckin } from '../services/api';

function createDefaultDraft() {
  return {
    dietDone: false,
    exerciseDone: false,
    sleepDone: false,
    rating: 3,
    note: '',
  };
}

function draftFromCheckin(item) {
  return {
    dietDone: Boolean(item?.dietDone),
    exerciseDone: Boolean(item?.exerciseDone),
    sleepDone: Boolean(item?.sleepDone),
    rating: item?.rating || 3,
    note: item?.note || '',
  };
}

function mapCheckinsByDay(items) {
  return Object.fromEntries((items || []).map((item) => [item.day, draftFromCheckin(item)]));
}

export function CheckinPanel({ diagnosisId, result, token, dayNum }) {
  const plan = result?.sevenDayPlan || [];
  const isSingleDay = Boolean(dayNum);
  const [selectedDay, setSelectedDay] = useState(dayNum || 1);
  const [draftByDay, setDraftByDay] = useState({});
  const [checkins, setCheckins] = useState([]);
  const [saving, setSaving] = useState(false);
  const hasPlan = plan.length > 0;
  const canCheckin = Boolean(token && diagnosisId && hasPlan && (isSingleDay ? selectedDay === dayNum : true));
  const activeDraft = draftByDay[selectedDay] || createDefaultDraft();
  const activePlan = plan[selectedDay - 1];
  const completedDays = useMemo(() => new Set(checkins.map((item) => item.day)), [checkins]);
  const summary = useMemo(() => {
    const ratings = checkins.map((item) => item.rating).filter(Boolean);
    return {
      completedDays: checkins.length,
      averageRating: ratings.length
        ? Math.round((ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length) * 10) / 10
        : null,
    };
  }, [checkins]);

  useEffect(() => {
    let cancelled = false;
    if (!canCheckin) {
      return undefined;
    }

    loadCheckins(token, diagnosisId)
      .then((payload) => {
        if (cancelled) return;
        const items = payload.data?.items || [];
        setCheckins(items);
        setDraftByDay(mapCheckinsByDay(items));
      })
      .catch((error) => {
        if (!cancelled) toast.error(error.message || '打卡记录加载失败。');
      });

    return () => {
      cancelled = true;
    };
  }, [canCheckin, diagnosisId, token]);

  function updateDraft(patch) {
    setDraftByDay((current) => ({
      ...current,
      [selectedDay]: {
        ...(current[selectedDay] || createDefaultDraft()),
        ...patch,
      },
    }));
  }

  async function submit() {
    if (!canCheckin || saving) return;
    setSaving(true);
    try {
      const payload = await saveCheckin(token, {
        diagnosisId,
        day: selectedDay,
        ...activeDraft,
      });
      const items = payload.data?.items || [];
      setCheckins(items);
      setDraftByDay(mapCheckinsByDay(items));
      toast.success(`第 ${selectedDay} 天打卡已保存。`);
    } catch (error) {
      toast.error(error.message || '打卡保存失败。');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="panel checkin-panel" id="checkins">
      <div className="section-title">
        <ClipboardCheck size={20} />
        <h2>七日打卡追踪</h2>
        <span>{canCheckin ? `${summary.completedDays}/7 天` : '等待登录方案'}</span>
      </div>

      {!token && <p className="form-hint">登录后生成方案，即可记录每日执行情况。</p>}
      {token && !diagnosisId && <p className="form-hint">登录状态下生成并保存方案后，打卡记录会自动关联到历史记录。</p>}
      {token && diagnosisId && !hasPlan && <p className="form-hint">生成七日计划后即可开始打卡。</p>}

      {canCheckin && (
        <>
          {!isSingleDay && (
            <div className="checkin-summary">
              <strong>{summary.completedDays}</strong>
              <span>已打卡天数</span>
              <strong>{summary.averageRating || '-'}</strong>
              <span>平均感受</span>
            </div>
          )}

          {!isSingleDay && (
            <div className="checkin-days" aria-label="选择打卡天数">
              {plan.map((item, index) => {
                const day = index + 1;
                const isActive = selectedDay === day;
                return (
                  <button
                    className={`checkin-day ${isActive ? 'is-active' : ''} ${completedDays.has(day) ? 'is-done' : ''}`}
                    key={item.day}
                    type="button"
                    onClick={() => setSelectedDay(day)}
                  >
                    {completedDays.has(day) && <CheckCircle2 size={14} />}
                    第 {day} 天
                  </button>
                );
              })}
            </div>
          )}

          <div className="checkin-body">
            <div>
              <p className="label">今日主题</p>
              <h3>{activePlan?.theme || `第 ${selectedDay} 天`}</h3>
              <p>{activePlan?.note || '按方案执行后记录感受，便于后续复盘。'}</p>
            </div>

            <div className="checkin-task-grid">
              <label className="checkin-checkbox">
                <input
                  type="checkbox"
                  checked={activeDraft.dietDone}
                  onChange={(event) => updateDraft({ dietDone: event.target.checked })}
                />
                <span>饮食已执行</span>
              </label>
              <label className="checkin-checkbox">
                <input
                  type="checkbox"
                  checked={activeDraft.exerciseDone}
                  onChange={(event) => updateDraft({ exerciseDone: event.target.checked })}
                />
                <span>运动已执行</span>
              </label>
              <label className="checkin-checkbox">
                <input
                  type="checkbox"
                  checked={activeDraft.sleepDone}
                  onChange={(event) => updateDraft({ sleepDone: event.target.checked })}
                />
                <span>作息已执行</span>
              </label>
            </div>

            <div className="rating-row" aria-label="主观感受评分">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  className={activeDraft.rating >= rating ? 'is-active' : ''}
                  key={rating}
                  type="button"
                  aria-label={`${rating} 分`}
                  onClick={() => updateDraft({ rating })}
                >
                  <Star size={18} />
                </button>
              ))}
            </div>

            <label className="checkin-note">
              今日备注
              <textarea
                maxLength={300}
                placeholder="例如：晚饭按计划清淡饮食，睡前泡脚后入睡更快。"
                value={activeDraft.note}
                onChange={(event) => updateDraft({ note: event.target.value })}
              />
            </label>

            <button className="primary" type="button" onClick={submit} disabled={saving}>
              {saving ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
              {saving ? '保存中...' : '保存今日打卡'}
            </button>
          </div>
        </>
      )}
    </section>
  );
}
