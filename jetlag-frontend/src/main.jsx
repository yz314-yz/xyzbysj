import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Activity,
  CalendarDays,
  Camera,
  Check,
  Clock3,
  FlameKindling,
  HeartPulse,
  Leaf,
  Moon,
  ScanEye,
  RotateCcw,
  Soup,
  Sprout,
  Upload,
} from 'lucide-react';
import './styles.css';

const runtimeConfig = window.__APP_CONFIG__ || {};
const runtimeApiBase = typeof runtimeConfig.API_BASE === 'string' ? runtimeConfig.API_BASE.trim() : '';
const API_BASE = runtimeApiBase || import.meta.env.VITE_API_BASE || (import.meta.env.DEV ? 'http://localhost:3000' : '');

const navItems = [
  { id: 'collection', label: '望诊采集', icon: Leaf },
  { id: 'constitution', label: '体质评估', icon: HeartPulse },
  { id: 'plan', label: '七日计划', icon: CalendarDays },
  { id: 'meridian', label: '子午流注', icon: Clock3 },
];

const symptomOptions = [
  ['dry_mouth', '口干咽燥'],
  ['eye_dry', '眼干涩'],
  ['acne', '面部痘痘或潮红'],
  ['fatigue', '疲倦乏力'],
  ['cold_limbs', '手脚偏凉'],
  ['palpitation', '心悸胸闷'],
  ['insomnia', '入睡困难或多梦'],
  ['anxiety', '焦虑烦躁'],
  ['poor_appetite', '食欲不振'],
  ['bloating', '腹胀便秘'],
  ['back_sore', '腰膝酸软'],
  ['memory', '注意力下降'],
  ['sweat', '虚汗或易出汗'],
  ['bitter', '口苦口黏'],
];

const emptyResult = {
  mode: 'local-rules',
  engineStatus: {
    rules: {
      enabled: true,
      provider: '本地规则引擎',
      active: true,
      role: '根据症状、采集项和子午流注生成体质方向与七日养生计划。',
    },
    vision: {
      provider: 'Qwen3-VL',
      model: 'Qwen/Qwen3-VL-8B-Instruct',
      configured: false,
      active: false,
      baseURL: '未配置',
      fallbackReason: 'Qwen3-VL 模型未配置，已使用本地规则引擎生成养生方案。',
    },
  },
  disclaimer: 'AI 分析仅供学术展示与日常养生参考，不能替代执业医师诊断、治疗或处方。',
  observation: {
    tongue: '舌像待采集：建议在自然光下平拍，避免美颜和强滤镜。',
    face: '面相待采集：建议正脸、自然光、无遮挡拍摄。',
    palm: '手相待采集：建议掌心展开、光线均匀拍摄。',
  },
  selectedSymptoms: [],
  constitution: {
    primary: '等待生成评估',
    secondary: [],
    explanation: '请选择症状并按需上传图像，系统会生成体质方向与七日养生计划。',
    confidence: 0,
    primaryCare: '',
  },
  meridian: { name: '', meridian: '', advice: '' },
  immediateActions: [
    '尚未生成方案。请先完成症状选择、基础信息或图像采集。',
  ],
  qwenVision: null,
  sevenDayPlan: [],
};

const emptyProfile = { age: '', gender: '', bedtime: '', wakeTime: '' };
const emptyFiles = { tongue: null, face: null, palm: null };

function FileDrop({ id, title, hint, icon: Icon, file, onChange }) {
  return (
    <label className={`drop ${file ? 'is-ready' : ''}`} htmlFor={id}>
      <input id={id} type="file" accept="image/*" onChange={(event) => onChange(event.target.files?.[0] || null)} />
      <span className="drop-icon"><Icon size={22} /></span>
      <strong>{title}</strong>
      <small>{file ? file.name : hint}</small>
      {file && <b><Check size={14} /> 已记录</b>}
    </label>
  );
}

function VisionPanel({ result }) {
  const parsed = result.qwenVision?.parsed;
  const visionStatus = result.engineStatus?.vision;
  const statusText = parsed
    ? result.qwenVision.model
    : visionStatus?.configured
      ? '模型已配置'
      : '本地规则已接管';
  const statusDetail = result.modelVisionError
    || (parsed
      ? 'Qwen3-VL 已返回图像特征，本地规则引擎已参与方案生成。'
      : visionStatus?.fallbackReason || '当前使用本地规则引擎生成养生方案。');
  const fallbackReference = visionStatus?.fallbackReason || '当前使用本地规则引擎记录采集状态。';
  const items = parsed
    ? [
        ['舌像', parsed.tongue?.features || [], parsed.tongue?.tcm_reference],
        ['面相', parsed.face?.features || [], parsed.face?.tcm_reference],
        ['手相', parsed.palm?.features || [], parsed.palm?.tcm_reference],
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
        <h2>Qwen3-VL 图像特征</h2>
        <span className={`status-pill ${parsed ? 'is-model' : 'is-rules'}`}>{statusText}</span>
      </div>
      <div className={`engine-banner ${parsed ? 'is-model' : 'is-rules'}`}>
        <Check size={16} />
        <span>{statusDetail}</span>
      </div>
      <div className="feature-list">
        {items.map(([title, features, reference]) => (
          <article key={title}>
            <strong>{title}</strong>
            <p>{features.length ? features.join('，') : '未采集'}</p>
            <small>{reference || '仅做养生参考，不作为医疗诊断。'}</small>
          </article>
        ))}
      </div>
    </section>
  );
}

function App() {
  const [selected, setSelected] = useState([]);
  const [files, setFiles] = useState(emptyFiles);
  const [profile, setProfile] = useState(emptyProfile);
  const [result, setResult] = useState(emptyResult);
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState('collection');
  const completion = useMemo(() => Math.round((selected.length / symptomOptions.length) * 100), [selected]);

  useEffect(() => {
    const sections = navItems
      .map((item) => document.getElementById(item.id))
      .filter(Boolean);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target?.id) setActiveSection(visible.target.id);
      },
      { rootMargin: '-20% 0px -55% 0px', threshold: [0.1, 0.35, 0.6] }
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  function toggleSymptom(id) {
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  function goToSection(id) {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function resetForm() {
    setSelected([]);
    setFiles(emptyFiles);
    setProfile(emptyProfile);
    setResult(emptyResult);
  }

  async function submit() {
    setLoading(true);
    const form = new FormData();
    form.append('symptoms', JSON.stringify(selected));
    form.append('profile', JSON.stringify(profile));
    form.append('hour', new Date().getHours());
    Object.entries(files).forEach(([key, value]) => {
      if (value) form.append(key, value);
    });

    try {
      const response = await fetch(`${API_BASE}/api/v1/diagnose`, { method: 'POST', body: form });
      const payload = await response.json();
      if (!payload.success) throw new Error(payload.error || '分析失败');
      setResult(payload.data);
    } catch (error) {
      setResult((current) => ({
        ...current,
        modelVisionError: `后端暂未连接，当前展示本地演示结果：${error.message}`,
      }));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand"><span>岐</span><div><strong>岐养七日</strong><small>中医养生辅助系统</small></div></div>
        <nav>
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={activeSection === id ? 'active' : ''}
              type="button"
              onClick={() => goToSection(id)}
            >
              <Icon size={18} /> {label}
            </button>
          ))}
        </nav>
        <p className="notice">毕业设计演示版本：以图像特征记录、症状归类和养生计划生成为核心，不提供医疗诊断。</p>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <h1>望诊与七日养生计划</h1>
            <p>上传舌像、面相、手相，结合症状生成饮食、运动与作息建议。</p>
          </div>
          <button className="ghost" onClick={resetForm}><RotateCcw size={16} /> 清空表单</button>
        </header>

        <div className="grid">
          <section className="panel collector" id="collection">
            <div className="section-title"><Camera size={20} /><h2>图像采集</h2><span>{Object.values(files).filter(Boolean).length}/3</span></div>
            <div className="drops">
              <FileDrop id="tongue" title="舌像" hint="自然光、伸舌平拍" icon={Upload} file={files.tongue} onChange={(file) => setFiles({ ...files, tongue: file })} />
              <FileDrop id="face" title="面相" hint="正脸、无遮挡" icon={Camera} file={files.face} onChange={(file) => setFiles({ ...files, face: file })} />
              <FileDrop id="palm" title="手相" hint="掌心展开、光线均匀" icon={Sprout} file={files.palm} onChange={(file) => setFiles({ ...files, palm: file })} />
            </div>

            <div className="profile-row">
              {[
                ['age', '年龄'],
                ['gender', '性别'],
                ['bedtime', '常睡时间'],
                ['wakeTime', '起床时间'],
              ].map(([key, label]) => (
                <label key={key}>{label}<input value={profile[key]} onChange={(event) => setProfile({ ...profile, [key]: event.target.value })} /></label>
              ))}
            </div>
          </section>

          <section className="panel symptoms">
            <div className="section-title"><Activity size={20} /><h2>症状选择</h2><span>{completion}%</span></div>
            <div className="chips">
              {symptomOptions.map(([id, label]) => (
                <button key={id} className={selected.includes(id) ? 'chip selected' : 'chip'} onClick={() => toggleSymptom(id)}>
                  {selected.includes(id) && <Check size={14} />} {label}
                </button>
              ))}
            </div>
            <button className="primary" onClick={submit} disabled={loading}>
              {loading ? '正在生成养生方案...' : '生成七日调理计划'}
            </button>
          </section>

          <section className="panel result-card" id="constitution">
            <div className="score-ring"><span>{result.constitution.confidence}</span><small>匹配度</small></div>
            <div>
              <p className="label">主要调理方向</p>
              <h2>{result.constitution.primary}</h2>
              <p>{result.constitution.explanation}</p>
              <div className="subtypes">{result.constitution.secondary?.map((item) => <span key={item}>{item}</span>)}</div>
            </div>
          </section>

          <section className="panel actions" id="meridian">
            <div className="section-title"><FlameKindling size={20} /><h2>子午流注与今日补救窗口</h2></div>
            {result.immediateActions.map((item) => <p key={item}>{item}</p>)}
          </section>

          <VisionPanel result={result} />
        </div>

        <section className="plan panel" id="plan">
          <div className="section-title"><CalendarDays size={20} /><h2>七日计划表</h2><span>食谱 / 体操 / 作息</span></div>
          <div className="table">
            <div className="thead"><span>日期</span><span>主题</span><span><Soup size={15} /> 食谱计划</span><span><Activity size={15} /> 运动体操</span><span><Moon size={15} /> 作息计划</span></div>
            {result.sevenDayPlan.map((row) => (
              <div className="tr" key={row.day}>
                <b>{row.day}</b><strong>{row.theme}</strong><span>{row.diet}</span><span>{row.exercise}</span><span>{row.sleep}</span>
              </div>
            ))}
            {!result.sevenDayPlan.length && (
              <div className="empty-row">生成方案后，这里会显示 7 天的食谱、运动和作息安排。</div>
            )}
          </div>
        </section>

        <section className="footnote">
          <p>{result.disclaimer}</p>
          {result.modelVisionError && <p>{result.modelVisionError}</p>}
        </section>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
