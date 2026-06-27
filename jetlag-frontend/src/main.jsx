import React, { useMemo, useState } from 'react';
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
  RefreshCcw,
  Soup,
  Sprout,
  Upload,
} from 'lucide-react';
import './styles.css';

const runtimeConfig = window.__APP_CONFIG__ || {};
const API_BASE = Object.prototype.hasOwnProperty.call(runtimeConfig, 'API_BASE')
  ? runtimeConfig.API_BASE
  : import.meta.env.VITE_API_BASE || 'http://localhost:3000';

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

const demoResult = {
  disclaimer: 'AI 分析仅供学术展示与日常养生参考，不能替代执业医师诊断、治疗或处方。',
  observation: {
    tongue: '舌像待采集：建议在自然光下平拍，避免美颜和强滤镜。',
    face: '面相待采集：建议正脸、自然光、无遮挡拍摄。',
    palm: '手相待采集：建议掌心展开、光线均匀拍摄。',
  },
  selectedSymptoms: ['口干咽燥', '入睡困难或多梦', '疲倦乏力'],
  constitution: {
    primary: '阴液不足，虚火偏扰',
    secondary: ['心神失养，睡眠节律紊乱', '气血不足，推动无力'],
    explanation: '偏向津液耗伤，常见口干、眼干、舌红少津。',
    confidence: 78,
    primaryCare: '养阴生津，减少辛辣煎炸和连续熬夜。',
  },
  meridian: { name: '亥时', meridian: '三焦经', advice: '宜洗漱泡脚，准备入睡。' },
  immediateActions: [
    '现在处于亥时，三焦经当令：宜洗漱泡脚，准备入睡。',
    '今日饮食以“银耳百合羹”为主线，少辛辣、少冰饮、不过饱。',
    '今日运动选择“八段锦‘两手托天理三焦’”，以微汗或身心放松为度。',
    '睡前 30 分钟停止高刺激内容，泡脚 10 分钟后做腹式呼吸。',
  ],
  qwenVision: null,
  sevenDayPlan: [
    ['第 1 天', '清心降火', '莲子百合粥 + 清炒菠菜 + 冬瓜汤', '八段锦 15 分钟，内关穴各 1 分钟', '22:30 上床，睡前 30 分钟离屏'],
    ['第 2 天', '健脾和胃', '山药小米粥 + 胡萝卜鸡丝 + 陈皮水', '饭后慢走 20 分钟，摩腹 5 分钟', '午休 20 分钟，晚餐七分饱'],
    ['第 3 天', '疏肝理气', '荞麦面 + 佛手瓜炒蛋 + 玫瑰陈皮茶', '扩胸运动 3 组，太冲穴各 2 分钟', '21:30 后只做轻任务'],
  ].map(([day, theme, diet, exercise, sleep]) => ({ day, theme, diet, exercise, sleep })),
};

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
  const items = parsed
    ? [
        ['舌像', parsed.tongue?.features || [], parsed.tongue?.tcm_reference],
        ['面相', parsed.face?.features || [], parsed.face?.tcm_reference],
        ['手相', parsed.palm?.features || [], parsed.palm?.tcm_reference],
      ]
    : [
        ['舌像', [result.observation.tongue], '等待 Qwen3-VL 图像识别或使用本地规则记录。'],
        ['面相', [result.observation.face], '等待 Qwen3-VL 图像识别或使用本地规则记录。'],
        ['手相', [result.observation.palm], '等待 Qwen3-VL 图像识别或使用本地规则记录。'],
      ];

  return (
    <section className="panel vision-panel">
      <div className="section-title"><ScanEye size={20} /><h2>Qwen3-VL 图像特征</h2><span>{parsed ? result.qwenVision.model : '未连接'}</span></div>
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
  const [selected, setSelected] = useState(['dry_mouth', 'insomnia', 'fatigue']);
  const [files, setFiles] = useState({ tongue: null, face: null, palm: null });
  const [profile, setProfile] = useState({ age: '22', gender: '女', bedtime: '01:00', wakeTime: '08:30' });
  const [result, setResult] = useState(demoResult);
  const [loading, setLoading] = useState(false);
  const completion = useMemo(() => Math.round((selected.length / symptomOptions.length) * 100), [selected]);

  function toggleSymptom(id) {
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
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
          <a className="active"><Leaf size={18} /> 望诊采集</a>
          <a><HeartPulse size={18} /> 体质评估</a>
          <a><CalendarDays size={18} /> 七日计划</a>
          <a><Clock3 size={18} /> 子午流注</a>
        </nav>
        <p className="notice">毕业设计演示版本：以图像特征记录、症状归类和养生计划生成为核心，不提供医疗诊断。</p>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <h1>望诊与七日养生计划</h1>
            <p>上传舌像、面相、手相，结合症状生成饮食、运动与作息建议。</p>
          </div>
          <button className="ghost" onClick={() => setResult(demoResult)}><RefreshCcw size={16} /> 恢复示例</button>
        </header>

        <div className="grid">
          <section className="panel collector">
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

          <section className="panel result-card">
            <div className="score-ring"><span>{result.constitution.confidence}</span><small>匹配度</small></div>
            <div>
              <p className="label">主要调理方向</p>
              <h2>{result.constitution.primary}</h2>
              <p>{result.constitution.explanation}</p>
              <div className="subtypes">{result.constitution.secondary?.map((item) => <span key={item}>{item}</span>)}</div>
            </div>
          </section>

          <section className="panel actions">
            <div className="section-title"><FlameKindling size={20} /><h2>今日补救窗口</h2></div>
            {result.immediateActions.map((item) => <p key={item}>{item}</p>)}
          </section>

          <VisionPanel result={result} />
        </div>

        <section className="plan panel">
          <div className="section-title"><CalendarDays size={20} /><h2>七日计划表</h2><span>食谱 / 体操 / 作息</span></div>
          <div className="table">
            <div className="thead"><span>日期</span><span>主题</span><span><Soup size={15} /> 食谱计划</span><span><Activity size={15} /> 运动体操</span><span><Moon size={15} /> 作息计划</span></div>
            {result.sevenDayPlan.map((row) => (
              <div className="tr" key={row.day}>
                <b>{row.day}</b><strong>{row.theme}</strong><span>{row.diet}</span><span>{row.exercise}</span><span>{row.sleep}</span>
              </div>
            ))}
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
