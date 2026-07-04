import HTMLFlipBook from 'react-pageflip';
import { useEffect, useRef, useState } from 'react';
import {
  BookOpen, Camera, CheckCircle2, ChevronLeft, ChevronRight,
  Loader2, LockKeyhole, RotateCcw, Save, Soup, Star, Activity, Moon, Sun, List, X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

import { BookPage } from './BookPage';
import { FileDrop } from './FileDrop';
import { ProfileForm } from './ProfileForm';
import { ResultCard } from './ResultCard';
import { VisionPanel } from './VisionPanel';
import { InferenceModeSelector } from './InferenceModeSelector';
import { ChatPanel } from './ChatPanel';
import { ShareCard } from './ShareCard';
import { ExportButton } from './ExportButton';
import { InkBackground } from './InkBackground';
import {
  INFERENCE_MODE_OFFLINE_QWEN, INFERENCE_MODE_PUBLIC,
  emptyFiles, emptyProfile, createEmptyResult, fallbackSymptomOptions, MERIDIAN_TABLE,
} from '../constants/app';
import { useMeridianHint } from '../hooks/useMeridianHint';
import { loadHistory, loadHistoryDetail, loadCheckins, saveCheckin, submitDiagnosis } from '../services/api';

function useBookDimensions() {
  const [dims, setDims] = useState({ width: 460, height: 620 });
  useEffect(() => {
    let timer = null;
    function calc() {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        if (vw < 768) {
          setDims({ width: Math.min(vw - 24, 440), height: Math.min(vh - 90, 640) });
        } else {
          setDims({ width: Math.min(Math.floor((vw - 48) / 2), 540), height: Math.min(vh - 56, 760) });
        }
      }, 150);
    }
    calc();
    window.addEventListener('resize', calc);
    return () => { clearTimeout(timer); window.removeEventListener('resize', calc); };
  }, []);
  return dims;
}

const BOOK_SWIPE_SKIP_SELECTOR = 'button, a, input, textarea, select, label, [role="button"], [data-no-book-swipe]';
const IMAGE_LABELS = { tongue: '舌像', face: '面相', palm: '手相' };

function getImageQualityError(features) {
  const issues = Object.entries(features)
    .filter(([, item]) => item?.safetyGate !== 'pass' || Number(item?.confidence || 0) < 0.55)
    .map(([key, item]) => {
      const details = Object.values(item?.observedFeatures || {}).filter(Boolean).join('、');
      return `${IMAGE_LABELS[key] || key}${details ? `（${details}）` : ''}`;
    });
  if (!issues.length) return '';
  return `图片质量不足：${issues.join('；')}。请在自然光、画面清晰、主体居中的条件下重新拍摄。`;
}

export function BookExperience({
  auth,
  modelName,
  offlineVisionAvailable = false,
  requireModelEvidence = false,
  symptomOptions,
  visionConfigured,
  theme,
  onThemeToggle,
}) {
  // ===== diagnosis state =====
  const [inferenceMode, setInferenceMode] = useState(INFERENCE_MODE_PUBLIC);
  const [selected, setSelected] = useState([]);
  const [files, setFiles] = useState(emptyFiles);
  const [browserFeatures, setBrowserFeatures] = useState({});
  const [profile, setProfile] = useState(emptyProfile);
  const [result, setResult] = useState(() => createEmptyResult(modelName, INFERENCE_MODE_PUBLIC));
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [profileErrors, setProfileErrors] = useState({});
  const [fileInputVersion, setFileInputVersion] = useState(0);

  // ===== book navigation =====
  const bookRef = useRef(null);
  const tocPanelRef = useRef(null);
  const previousFocusRef = useRef(null);
  const swipeStartRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [showToc, setShowToc] = useState(false);
  const dims = useBookDimensions();

  // ===== history state =====
  const [historyItems, setHistoryItems] = useState([]);
  const [expandedHistoryId, setExpandedHistoryId] = useState(null);
  const [historyDetail, setHistoryDetail] = useState({});

  // ===== shared checkin state (avoid 7 independent API calls) =====
  const [checkins, setCheckins] = useState([]);
  const [checkinDrafts, setCheckinDrafts] = useState({});
  const [checkinSavingDay, setCheckinSavingDay] = useState(null);

  const meridianHint = useMeridianHint();
  const hasResult = result.sevenDayPlan && result.sevenDayPlan.length > 0;
  const planPageCount = hasResult ? result.sevenDayPlan.length : 7;
  const meridianPage = 4 + planPageCount;
  const historyPage = meridianPage + 1;
  const epiloguePage = historyPage + 1;
  const symptoms = symptomOptions?.length ? symptomOptions : fallbackSymptomOptions;

  // ===== load history on auth change =====
  useEffect(() => {
    if (!auth.token) return;
    loadHistory(auth.token)
      .then((p) => setHistoryItems(p.data || []))
      .catch(() => {});
  }, [auth.token]);

  // ===== load checkins once when a saved diagnosis exists =====
  useEffect(() => {
    if (!auth.token || !result.savedId) return;
    loadCheckins(auth.token, result.savedId)
      .then((p) => {
        const items = p.data?.items || [];
        setCheckins(items);
        const drafts = {};
        items.forEach((item) => {
          drafts[item.day] = {
            dietDone: Boolean(item.dietDone),
            exerciseDone: Boolean(item.exerciseDone),
            sleepDone: Boolean(item.sleepDone),
            rating: item.rating || 3,
            note: item.note || '',
          };
        });
        setCheckinDrafts(drafts);
      })
      .catch(() => {});
  }, [auth.token, result.savedId]);

  // ===== keyboard navigation =====
  useEffect(() => {
    function onKey(e) {
      if (showToc) {
        if (e.key === 'Escape') {
          e.preventDefault();
          setShowToc(false);
        }
        return;
      }
      const tag = e.target?.tagName || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target.isContentEditable) return;
      if (e.key === 'ArrowLeft') bookRef.current?.pageFlip()?.flipPrev();
      if (e.key === 'ArrowRight') bookRef.current?.pageFlip()?.flipNext();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showToc]);

  useEffect(() => {
    if (!showToc) return undefined;
    previousFocusRef.current = document.activeElement;
    const raf = window.requestAnimationFrame(() => tocPanelRef.current?.focus());
    return () => {
      window.cancelAnimationFrame(raf);
      if (previousFocusRef.current instanceof HTMLElement) {
        previousFocusRef.current.focus();
      }
    };
  }, [showToc]);

  // ===== diagnosis actions =====
  function toggleSymptom(id) {
    setFormError('');
    setSelected((cur) => (cur.includes(id) ? cur.filter((i) => i !== id) : [...cur, id]));
  }
  function updateInferenceMode(nextMode) {
    if (nextMode === INFERENCE_MODE_OFFLINE_QWEN && !offlineVisionAvailable) {
      toast.error('离线增强模式需要先连接本机 Qwen2.5-VL 服务。');
      return;
    }
    setInferenceMode(nextMode);
    setResult(createEmptyResult(modelName, nextMode));
  }
  function updateFile(key, file, features) {
    setFormError('');
    setFiles((c) => ({ ...c, [key]: file }));
    if (features) setBrowserFeatures((c) => ({ ...c, [key]: features }));
  }
  function removeFile(key) {
    setFormError('');
    setFiles((c) => ({ ...c, [key]: null }));
    setBrowserFeatures((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
  }
  function updateProfile(key, val) {
    setFormError('');
    setProfileErrors((current) => ({ ...current, [key]: '' }));
    setProfile((c) => ({ ...c, [key]: val }));
  }
  function resetForm() {
    setSelected([]); setFiles(emptyFiles); setBrowserFeatures({}); setProfile(emptyProfile);
    setResult(createEmptyResult(modelName, inferenceMode)); setFormError(''); setProfileErrors({});
    setFileInputVersion((c) => c + 1);
  }

  function validateProfile() {
    const errors = {};
    const age = Number(profile.age);
    if (!profile.age) errors.age = '请填写年龄';
    else if (!Number.isFinite(age) || age < 1 || age > 120) errors.age = '年龄需在 1-120 岁';
    if (!profile.gender) errors.gender = '请选择性别';
    if (!profile.bedtime) errors.bedtime = '请选择常睡时间';
    if (!profile.wakeTime) errors.wakeTime = '请选择起床时间';
    setProfileErrors(errors);
    return errors;
  }

  async function submit() {
    const hasInput = selected.length > 0 || Object.values(files).some(Boolean);
    if (!hasInput) { setFormError('请至少选择一个症状或上传一张图片。'); return; }
    const qualityError = getImageQualityError(browserFeatures);
    if (qualityError) {
      setFormError(qualityError);
      toast.error(qualityError);
      return;
    }
    if (requireModelEvidence && inferenceMode === INFERENCE_MODE_PUBLIC) {
      const message = '上线严格模式要求公网体验版加载浏览器端多模态模型。当前仅有轻量图片特征，不能生成上线级方案。';
      setFormError(message);
      toast.error(message);
      return;
    }
    const errors = validateProfile();
    if (Object.keys(errors).length) {
      setFormError(`请补全基本信息：${Object.values(errors).join('、')}`);
      return;
    }
    setLoading(true); setFormError('');
    const form = new FormData();
    form.append('inferenceMode', inferenceMode);
    form.append('symptoms', JSON.stringify(selected));
    form.append('profile', JSON.stringify(profile));
    form.append('hour', new Date().getHours());
    form.append('browserFeatures', JSON.stringify(browserFeatures));
    Object.entries(files).forEach(([k, v]) => { if (v) form.append(k, v); });
    try {
      const payload = await submitDiagnosis(form, auth.token);
      setResult({ ...payload.data, savedId: payload.savedId || null });
      toast.success('方案已生成，翻页查看七日调理。');
      setTimeout(() => bookRef.current?.pageFlip()?.flip(3), 600);
    } catch (err) {
      const msg = err.name === 'AbortError' ? '请求超时，请稍后重试。' : err.message || '请求失败。';
      setFormError(msg); toast.error(msg);
    } finally { setLoading(false); }
  }

  // ===== checkin actions (shared across all day pages) =====
  function updateCheckinDraft(day, patch) {
    setCheckinDrafts((cur) => ({
      ...cur,
      [day]: { ...(cur[day] || { dietDone: false, exerciseDone: false, sleepDone: false, rating: 3, note: '' }), ...patch },
    }));
  }

  async function submitCheckin(day) {
    if (!result.savedId || checkinSavingDay) return;
    setCheckinSavingDay(day);
    const draft = checkinDrafts[day] || { dietDone: false, exerciseDone: false, sleepDone: false, rating: 3, note: '' };
    try {
      const payload = await saveCheckin(auth.token, {
        diagnosisId: result.savedId,
        day,
        ...draft,
      });
      const items = payload.data?.items || [];
      setCheckins(items);
      const drafts = {};
      items.forEach((item) => {
        drafts[item.day] = {
          dietDone: Boolean(item.dietDone),
          exerciseDone: Boolean(item.exerciseDone),
          sleepDone: Boolean(item.sleepDone),
          rating: item.rating || 3,
          note: item.note || '',
        };
      });
      setCheckinDrafts(drafts);
      toast.success(`第 ${day} 天打卡已保存。`);
    } catch (error) {
      toast.error(error.message || '打卡保存失败。');
    } finally {
      setCheckinSavingDay(null);
    }
  }

  async function toggleHistory(id) {
    if (expandedHistoryId === id) { setExpandedHistoryId(null); return; }
    setExpandedHistoryId(id);
    if (historyDetail[id]) return;
    try {
      const p = await loadHistoryDetail(auth.token, id);
      setHistoryDetail((prev) => ({ ...prev, [id]: p.data }));
    } catch {
      setExpandedHistoryId(null);
      toast.error('详情加载失败。');
    }
  }

  function flipNext() { bookRef.current?.pageFlip()?.flipNext(); }
  function flipPrev() { bookRef.current?.pageFlip()?.flipPrev(); }
  function flipTo(p) { bookRef.current?.pageFlip()?.flip(p); setShowToc(false); }

  function shouldIgnoreBookSwipe(event) {
    if (!event.pointerType || (event.pointerType !== 'touch' && event.pointerType !== 'pen')) return true;
    if (showToc) return true;
    const target = event.target;
    return target instanceof Element && Boolean(target.closest(BOOK_SWIPE_SKIP_SELECTOR));
  }

  function handleBookPointerDown(event) {
    if (shouldIgnoreBookSwipe(event)) return;
    swipeStartRef.current = {
      x: event.clientX,
      y: event.clientY,
      time: Date.now(),
    };
  }

  function handleBookPointerUp(event) {
    const start = swipeStartRef.current;
    swipeStartRef.current = null;
    if (!start || shouldIgnoreBookSwipe(event)) return;

    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;
    const isHorizontalSwipe = Math.abs(deltaX) >= 56 && Math.abs(deltaX) > Math.abs(deltaY) * 1.35;
    const isIntentional = Date.now() - start.time < 900;
    if (!isHorizontalSwipe || !isIntentional) return;

    if (deltaX < 0) flipNext();
    else flipPrev();
  }

  function clearBookSwipe() {
    swipeStartRef.current = null;
  }

  // 实际翻页索引：0=封面, 1=序, 2=问诊, 3=辨识, 4 起为调理页，后续页随计划长度动态后移。
  const tocItems = [
    { page: 0, title: '封面' },
    { page: 1, title: '序言' },
    { page: 2, title: '问诊' },
    { page: 3, title: '辨识结果' },
    { page: 4, title: '七日调理' },
    { page: meridianPage, title: '时辰养生' },
    { page: historyPage, title: '诊史' },
    { page: epiloguePage, title: '跋' },
  ];

  return (
    <div
      className="book-shell"
      onPointerCancel={clearBookSwipe}
      onPointerDown={handleBookPointerDown}
      onPointerLeave={clearBookSwipe}
      onPointerUp={handleBookPointerUp}
    >
      <InkBackground theme={theme} />

      {/* ===== Book ===== */}
      <HTMLFlipBook
        ref={bookRef}
        width={dims.width}
        height={dims.height}
        size="fixed"
        drawShadow
        flippingTime={450}
        usePortrait
        startZIndex={0}
        autoSize
        maxShadowOpacity={0.5}
        useMouseEvents={false}
        swipeDistance={60}
        showPageCorners={false}
        className="book-flip"
        style={{}}
        startPage={0}
        onFlip={(e) => setCurrentPage(e.data)}
      >
        {/* ===== Page 0: 封面 ===== */}
        <BookPage key="cover" pageNum={0} title="" showTitle={false} showNum={false} className="is-cover">
          <div className="bk-cover">
            {/* 线装穿线（四目式） */}
            <div className="bk-cover-thread">
              <span className="bk-cover-knot" />
              <span className="bk-cover-knot" />
              <span className="bk-cover-knot" />
              <span className="bk-cover-knot" />
            </div>
            {/* 签条（白色竖排书名贴） */}
            <div className="bk-cover-label">
              <span className="bk-cover-label-text">岐养七日</span>
              <span className="bk-cover-label-sub">中医养生</span>
            </div>
            {/* 底部信息区 */}
            <div className="bk-cover-info">
              <div className="bk-cover-meridian">
                <strong>{meridianHint.name}</strong> · {meridianHint.meridian}当令 · {meridianHint.advice}
              </div>
              <p className="bk-cover-disclaimer">⚠️ 本册所载仅供参习，不作诊病之据。若有疾患，请询执业医师。</p>
              <div className="bk-cover-hint">翻页启卷</div>
            </div>
            <div className="bk-cover-seal">岐黄</div>
          </div>
        </BookPage>

        {/* ===== Page 1: 序言 ===== */}
        <BookPage key="preface" pageNum={1} title="序">
          <div className="bk-preface">
            <p className="bk-preface-opening">岐黄之术</p>
            <p>昔神农尝百草，黄帝问岐伯，医道乃立。千载之下，体质之辨、经络之流、望闻问切之法，载于典籍，传于后世。</p>
            <p>此册以体质为纲，七日为目。先辨寒热虚实，再参以舌面之色、经络之时，遂成一方调理之策。</p>
            <p>每日一则，饮食有节，起居有常，动静相宜。七日周而复始，缓缓调之，非求速效，但求本固。</p>
            <p>子午流注者，气血行于经络，十二时辰各有所主。依时养生，事半功倍。</p>
            <div className="bk-preface-disclaimer">
              ⚠️ 本册所载仅供参习，不作诊病之据。若有疾患，请询执业医师。
            </div>
            <div className="bk-seal-small">岐养七日</div>
          </div>
        </BookPage>

        {/* ===== Page 2: 问诊 ===== */}
        <BookPage key="assessment" pageNum={2} title="问诊">
          <div className="bk-assessment">
            <div className="bk-section-label">症状勾选</div>
            <div className="bk-symptoms">
              {symptoms.map((s) => (
                <button
                  key={s.id}
                  className={`bk-symptom-chip ${selected.includes(s.id) ? 'is-active' : ''}`}
                  type="button"
                  onClick={() => toggleSymptom(s.id)}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <div className="bk-section-label">望诊采集</div>
            <InferenceModeSelector
              disabled={loading}
              requireModelEvidence={requireModelEvidence}
              offlineAvailable={offlineVisionAvailable || visionConfigured}
              onChange={updateInferenceMode}
              value={inferenceMode}
            />
            <div className="bk-drops">
              <FileDrop key={`t-${fileInputVersion}`} id="tongue" title="舌像" hint="自然光" icon={Camera}
                file={files.tongue} onChange={(f, features) => updateFile('tongue', f, features)} onRemove={() => removeFile('tongue')} onError={setFormError} />
              <FileDrop key={`f-${fileInputVersion}`} id="face" title="面相" hint="正脸" icon={Camera}
                file={files.face} onChange={(f, features) => updateFile('face', f, features)} onRemove={() => removeFile('face')} onError={setFormError} />
              <FileDrop key={`p-${fileInputVersion}`} id="palm" title="手相" hint="掌心" icon={Camera}
                file={files.palm} onChange={(f, features) => updateFile('palm', f, features)} onRemove={() => removeFile('palm')} onError={setFormError} />
            </div>

            <div className="bk-section-label">基本信息</div>
            <ProfileForm profile={profile} errors={profileErrors} onChange={updateProfile} />

            {formError && <p className="bk-form-error">{formError}</p>}

            <div className="bk-submit-bar">
              <button className="bk-submit-btn" type="button" onClick={submit} disabled={loading || (!selected.length && !Object.values(files).some(Boolean))}>
                {loading ? <><Loader2 size={16} className="spin" /> 分析中…</> : '生成方案'}
              </button>
              <button className="bk-reset-btn" type="button" onClick={resetForm}>
                <RotateCcw size={14} /> 清空
              </button>
            </div>
            <p className="bk-hint">→ 生成方案后自动翻至辨识页</p>
          </div>
        </BookPage>

        {/* ===== Page 3: 辨识结果 ===== */}
        <BookPage key="result" pageNum={3} title="辨识">
          <div className="bk-result">
            {hasResult ? (
              <>
                <ResultCard result={result} />
                <VisionPanel result={{
                  ...result,
                  engineStatus: {
                    ...result.engineStatus,
                    vision: {
                      ...result.engineStatus.vision,
                      configured: offlineVisionAvailable || visionConfigured || result.engineStatus.vision.configured,
                      model: modelName || result.engineStatus.vision.model,
                      requested: inferenceMode === INFERENCE_MODE_OFFLINE_QWEN || result.engineStatus.vision.requested,
                    },
                  },
                }} />
                <div className="bk-result-actions">
                  <ExportButton disabled={!result.sevenDayPlan.length} />
                  <ShareCard result={result} />
                </div>
                <ChatPanel result={result} token={auth.token} />
                <p className="bk-hint">续页详载七日调理之法</p>
              </>
            ) : (
              <div className="bk-placeholder">
                <BookOpen size={32} />
                <p>请先翻回"问诊"页完成采集，生成方案后将显示体质辨识结果。</p>
              </div>
            )}
          </div>
        </BookPage>

        {/* ===== Pages 4-10: 七日调理 (每天一页) ===== */}
        {result.sevenDayPlan.map((day, i) => (
          <BookPage key={`day-${i}`} pageNum={4 + i} title={day.day}>
            <div className="bk-day">
              <h3 className="bk-day-theme">{day.theme}</h3>
              <div className="bk-day-section">
                <span className="bk-day-icon"><Soup size={16} /></span>
                <div><b>饮食</b><p>{day.diet}</p></div>
              </div>
              <div className="bk-day-section">
                <span className="bk-day-icon"><Activity size={16} /></span>
                <div><b>运动</b><p>{day.exercise}</p></div>
              </div>
              <div className="bk-day-section">
                <span className="bk-day-icon"><Moon size={16} /></span>
                <div><b>作息</b><p>{day.sleep}</p></div>
              </div>
              {day.note && <p className="bk-day-note">{day.note}</p>}
              {result.savedId && auth.token && (
                <div className="bk-day-checkin">
                  <div className="bk-day-checkin-title">
                    {checkins.some((c) => c.day === i + 1) ? <CheckCircle2 size={14} /> : null}
                    <span>第 {i + 1} 天打卡</span>
                  </div>
                  <div className="bk-day-checkin-tasks">
                    <label className="bk-checkin-chip">
                      <input type="checkbox"
                        checked={checkinDrafts[i + 1]?.dietDone || false}
                        onChange={(e) => updateCheckinDraft(i + 1, { dietDone: e.target.checked })}
                      />
                      <span>饮食</span>
                    </label>
                    <label className="bk-checkin-chip">
                      <input type="checkbox"
                        checked={checkinDrafts[i + 1]?.exerciseDone || false}
                        onChange={(e) => updateCheckinDraft(i + 1, { exerciseDone: e.target.checked })}
                      />
                      <span>运动</span>
                    </label>
                    <label className="bk-checkin-chip">
                      <input type="checkbox"
                        checked={checkinDrafts[i + 1]?.sleepDone || false}
                        onChange={(e) => updateCheckinDraft(i + 1, { sleepDone: e.target.checked })}
                      />
                      <span>作息</span>
                    </label>
                  </div>
                  <div className="bk-day-checkin-rating" aria-label="感受评分">
                    {[1, 2, 3, 4, 5].map((r) => (
                      <button key={r} type="button"
                        aria-label={`第 ${i + 1} 天感受评分 ${r} 星`}
                        className={(checkinDrafts[i + 1]?.rating || 3) >= r ? 'is-active' : ''}
                        onClick={() => updateCheckinDraft(i + 1, { rating: r })}
                      >
                        <Star size={14} />
                      </button>
                    ))}
                  </div>
                  <textarea
                    className="bk-day-checkin-note"
                    maxLength={200}
                    placeholder="今日备注（可选）"
                    value={checkinDrafts[i + 1]?.note || ''}
                    onChange={(e) => updateCheckinDraft(i + 1, { note: e.target.value })}
                  />
                  <button
                    className="bk-day-checkin-save"
                    type="button"
                    disabled={Boolean(checkinSavingDay)}
                    onClick={() => submitCheckin(i + 1)}
                  >
                    {checkinSavingDay === i + 1 ? <Loader2 size={14} className="spin" /> : <Save size={14} />}
                    {checkinSavingDay === i + 1 ? '保存中…' : '保存打卡'}
                  </button>
                </div>
              )}
            </div>
          </BookPage>
        ))}
        {/* placeholder pages if no plan */}
        {!hasResult && Array.from({ length: 7 }).map((_, i) => (
          <BookPage key={`day-empty-${i}`} pageNum={4 + i} title={`第${'一二三四五六七'[i]}日`}>
            <div className="bk-placeholder">
              <BookOpen size={28} />
              <p>完成问诊后，此处将显示第{i + 1}日的调理方案。</p>
            </div>
          </BookPage>
        ))}

        {/* ===== 时辰养生 ===== */}
        <BookPage key="meridian" pageNum={meridianPage} title="时辰">
          <div className="bk-meridian">
            <div className="bk-meridian-current">
              <span className="bk-meridian-name">{meridianHint.name}</span>
              <span className="bk-meridian-meridian">{meridianHint.meridian} 当令</span>
              <span className="bk-meridian-range">{meridianHint.range}</span>
            </div>
            <p className="bk-meridian-advice">{meridianHint.advice}</p>
            <div className="bk-meridian-table">
              {MERIDIAN_TABLE.map((m) => (
                <div key={m.name} className={`bk-meridian-row ${m.name === meridianHint.name ? 'is-now' : ''}`}>
                  <b>{m.name}</b>
                  <span>{m.meridian}</span>
                  <small>{m.advice}</small>
                </div>
              ))}
            </div>
            <p className="bk-meridian-note">每至时辰交更，自动提醒当令经络养生之要。</p>
          </div>
        </BookPage>

        {/* ===== 诊史 ===== */}
        <BookPage key="history" pageNum={historyPage} title="诊史">
          <div className="bk-history">
            {!auth.token ? (
              <div className="bk-placeholder">
                <LockKeyhole size={28} />
                <p>登录后可查看历史诊断记录。</p>
                <Link className="bk-login-link" to="/login">去登录</Link>
              </div>
            ) : historyItems.length === 0 ? (
              <div className="bk-placeholder">
                <BookOpen size={28} />
                <p>暂无历史记录，生成方案后会自动保存。</p>
              </div>
            ) : (
              <div className="bk-history-list">
                {historyItems.map((item) => (
                  <div key={item.id} className={`bk-history-card ${expandedHistoryId === item.id ? 'is-open' : ''}`}
                    onClick={() => toggleHistory(item.id)} role="button" tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter') toggleHistory(item.id); }}
                  >
                    <div className="bk-history-header">
                      <strong>{item.summary.constitution || '未命名'}</strong>
                      <small>{new Date(item.createdAt).toLocaleDateString()}</small>
                      <span>匹配度 {item.summary.confidence}%</span>
                    </div>
                    {expandedHistoryId === item.id && historyDetail[item.id] && (
                      <div className="bk-history-detail" onClick={(e) => e.stopPropagation()}>
                        <p><b>主方向：</b>{historyDetail[item.id].result?.constitution?.primary || '暂无'}</p>
                        {historyDetail[item.id].result?.sevenDayPlan?.map((d, j) => (
                          <div key={j} className="bk-history-day">
                            <b>{d.day}</b> · {d.theme} — {d.diet}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </BookPage>

        {/* ===== 跋 ===== */}
        <BookPage key="epilogue" pageNum={epiloguePage} title="跋">
          <div className="bk-epilogue">
            <p className="bk-epilogue-opening">医者意也</p>
            <p>书至尾声，调理之道已述其略。然医道精微，非一册可尽，七日不过启端，持守方得长远。</p>
            <p>望诊辨色，子午顺时，体质调摄，三者相合，养生之要略备矣。然人各有禀赋，不可一概而论。</p>
            <p>凡有所惑，当访明医，切勿以书自断。养生在勤，知行合一，方为正途。</p>
            <div className="bk-epilogue-disclaimer">
              ⚠️ 本册所载仅供参习，不作诊病之据。若有疾患，请询执业医师。
            </div>
            <div className="bk-seal-final">岐养七日</div>
          </div>
        </BookPage>
      </HTMLFlipBook>

      {/* ===== Navigation ===== */}
      <button className="book-nav book-nav-prev" type="button" onClick={flipPrev}
        style={{ opacity: currentPage === 0 ? 0.3 : 1 }} aria-label="上一页">
        <ChevronLeft size={24} />
      </button>
      <button className="book-nav book-nav-next" type="button" onClick={flipNext}
        style={{ opacity: currentPage >= epiloguePage ? 0.3 : 1 }} aria-label="下一页">
        <ChevronRight size={24} />
      </button>

      {/* ===== Top bar ===== */}
      <div className="book-topbar">
        <button className="book-toc-btn" type="button" onClick={() => setShowToc(true)}>
          <List size={18} /> 目录
        </button>
        <span className="book-topbar-title">岐养七日</span>
        <button className="book-theme-btn" type="button" onClick={onThemeToggle} aria-label="切换明暗主题">
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>

      {/* ===== Table of Contents ===== */}
      {showToc && (
        <div className="book-toc-overlay" onClick={() => setShowToc(false)}>
          <div
            aria-labelledby="book-toc-title"
            aria-modal="true"
            className="book-toc-panel"
            onClick={(e) => e.stopPropagation()}
            ref={tocPanelRef}
            role="dialog"
            tabIndex={-1}
          >
            <div className="book-toc-head">
              <h3 id="book-toc-title">目 录</h3>
              <button className="book-toc-close" type="button" onClick={() => setShowToc(false)} aria-label="关闭目录">
                <X size={16} />
              </button>
            </div>
            {tocItems.map((item) => (
              <button key={item.page} className={`book-toc-item ${currentPage === item.page ? 'is-active' : ''}`}
                type="button" onClick={() => flipTo(item.page)}>
                <span className="book-toc-num">—</span>
                <span>{item.title}</span>
                <ChevronRight size={14} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ===== Hidden export container for PDF export ===== */}
      {hasResult && (
        <div id="export-report" className="export-report-hidden" aria-hidden="true">
          <h2>岐养七日 — 调理计划</h2>
          <p>体质方向：{result.constitution?.primary}（匹配度 {result.constitution?.confidence}%）</p>
          <p>{result.constitution?.explanation}</p>
          <h3>七日调理计划</h3>
          {result.sevenDayPlan?.map((day) => (
            <div key={day.day}>
              <strong>{day.day}：{day.theme}</strong>
              <p>饮食：{day.diet}</p>
              <p>运动：{day.exercise}</p>
              <p>作息：{day.sleep}</p>
              {day.note && <p>备注：{day.note}</p>}
            </div>
          ))}
          <p>⚠️ AI 分析仅供学术参考，不作为医疗诊断。请咨询执业中医师。</p>
        </div>
      )}
    </div>
  );
}
