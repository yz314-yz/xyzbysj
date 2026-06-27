const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const { symptoms, patternMeta, meridianClock, sevenDayThemes } = require('./tcmKnowledge');
const { analyzeWithQwenVision, getVisionProviderStatus } = require('./qwenVision');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const uploadsDir = path.join(__dirname, '..', 'uploads');
const publicDir = path.join(__dirname, '..', 'public');
const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);

fs.mkdirSync(uploadsDir, { recursive: true });

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error('当前来源未被 CORS_ORIGIN 允许'));
  },
}));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

app.get('/env.js', (req, res) => {
  res.type('application/javascript').send(
    'window.__APP_CONFIG__ = { API_BASE: ' + JSON.stringify(process.env.PUBLIC_API_BASE || '') + ' };'
  );
});

const upload = multer({
  dest: uploadsDir,
  limits: { fileSize: 8 * 1024 * 1024 },
});

function currentMeridian(hour = new Date().getHours()) {
  const index = Math.floor(((Number(hour) + 1) % 24) / 2);
  return meridianClock[index] || meridianClock[0];
}

function parseJsonField(value, fallback) {
  if (!value) return fallback;
  if (Array.isArray(value)) return value;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return String(value)
      .split(/[,，\s]+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
}

function buildObservation(files) {
  return {
    tongue: Boolean(files.tongue?.[0]),
    face: Boolean(files.face?.[0]),
    palm: Boolean(files.palm?.[0]),
  };
}

function applyVisionTextScores(scores, visionText) {
  const text = String(visionText || '');
  if (!text) return;

  if (/舌红|红点|少苔|少津|裂纹|干燥|口干|眼干/.test(text)) {
    scores.yinDeficiency += 2;
  }
  if (/黄腻|厚腻|油光|口黏|痘|潮红|湿热/.test(text)) {
    scores.dampHeat += 2;
    scores.heartFire += 1;
  }
  if (/淡白|苍白|少华|疲倦|虚汗|掌色淡/.test(text)) {
    scores.qiBloodDeficiency += 2;
    scores.spleenDeficiency += 1;
  }
  if (/暗沉|青紫|黑眼圈|腰膝|掌纹深|络脉/.test(text)) {
    scores.kidneyEssence += 1;
    scores.qiBloodDeficiency += 1;
  }
  if (/烦躁|眼神疲惫|心神|睡眠|多梦/.test(text)) {
    scores.heartSpirit += 2;
  }
  if (/口苦|胁|郁|紧张|情绪/.test(text)) {
    scores.liverConstraint += 1;
  }
}

function scorePatterns(selectedIds, observation, visionText) {
  const scores = Object.fromEntries(Object.keys(patternMeta).map((key) => [key, 0]));
  const symptomMap = new Map(symptoms.map((item) => [item.id, item]));

  selectedIds.forEach((id) => {
    const symptom = symptomMap.get(id);
    if (!symptom) return;
    symptom.patterns.forEach((pattern) => {
      scores[pattern] += 2;
    });
  });

  if (observation.tongue) {
    scores.yinDeficiency += 1;
    scores.spleenDeficiency += 1;
  }
  if (observation.face) {
    scores.qiBloodDeficiency += 1;
    scores.heartSpirit += 1;
  }
  if (observation.palm) {
    scores.qiBloodDeficiency += 1;
    scores.kidneyEssence += 1;
  }

  applyVisionTextScores(scores, visionText);

  return Object.entries(scores)
    .filter(([, score]) => score > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([id, score]) => ({ id, score, ...patternMeta[id] }));
}

function buildSevenDayPlan(primary) {
  return sevenDayThemes.map(([theme, diet, exercise, sleep], index) => ({
    day: '第 ' + (index + 1) + ' 天',
    theme,
    diet: index === 0 && primary?.foods?.[0] ? primary.foods[0] + ' + ' + diet : diet,
    exercise: index === 0 && primary?.exercise?.[0] ? primary.exercise[0] + '；' + exercise : exercise,
    sleep,
    note: index < 3 ? '先稳住脾胃与睡眠节律' : '再逐步增加恢复性活动',
  }));
}

function buildObservationCopy(observation, qwenVision) {
  const parsed = qwenVision?.parsed || {};
  const tongueFeatures = parsed.tongue?.features || [];
  const faceFeatures = parsed.face?.features || [];
  const palmFeatures = parsed.palm?.features || [];

  return {
    tongue: observation.tongue
      ? (tongueFeatures.length ? 'Qwen3-VL 舌像特征：' + tongueFeatures.join('，') : '已采集舌像：按舌色、舌苔、津液、舌下络脉归档。')
      : '未采集舌像：建议在自然光下伸舌平拍，避免美颜和强滤镜。',
    face: observation.face
      ? (faceFeatures.length ? 'Qwen3-VL 面相特征：' + faceFeatures.join('，') : '已采集面相：按面色、眼神、黑眼圈、油光潮红归档。')
      : '未采集面相：建议正脸、自然光、无遮挡拍摄。',
    palm: observation.palm
      ? (palmFeatures.length ? 'Qwen3-VL 手相特征：' + palmFeatures.join('，') : '已采集手相：按掌色、掌纹清晰度、温润度归档。')
      : '未采集手相：建议掌心展开、光线均匀拍摄。',
  };
}

function buildAnalysis({ selectedSymptoms, observation, hour, profile, qwenVision }) {
  const ranked = scorePatterns(selectedSymptoms, observation, qwenVision?.featureText);
  const primary = ranked[0] || { id: 'spleenDeficiency', score: 1, ...patternMeta.spleenDeficiency };
  const secondary = ranked.slice(1, 3);
  const meridian = currentMeridian(hour);
  const selectedLabels = symptoms
    .filter((item) => selectedSymptoms.includes(item.id))
    .map((item) => item.label);
  const provider = getVisionProviderStatus();

  return {
    mode: qwenVision?.parsed ? 'qwen3-vl-plus-rules' : 'local-rules',
    disclaimer: 'AI 分析仅供学术展示与日常养生参考，不能替代执业医师诊断、治疗或处方。',
    profile: {
      age: profile.age || '',
      gender: profile.gender || '',
      bedtime: profile.bedtime || '',
      wakeTime: profile.wakeTime || '',
    },
    observation: buildObservationCopy(observation, qwenVision),
    selectedSymptoms: selectedLabels,
    constitution: {
      primary: primary.name,
      primaryCare: primary.care,
      secondary: secondary.map((item) => item.name),
      explanation: primary.short,
      confidence: Math.min(95, 58 + primary.score * 8 + (qwenVision?.parsed ? 5 : 0)),
    },
    meridian,
    immediateActions: [
      '现在处于' + meridian.name + '，' + meridian.meridian + '当令：' + meridian.advice,
      '今日饮食以“' + primary.foods[0] + '”为主线，少辛辣、少冰饮、不过饱。',
      '今日运动选择：' + primary.exercise[0] + '，以微汗或身心放松为度。',
      '睡前 30 分钟停止高刺激内容，泡脚 10 分钟后做腹式呼吸。',
    ],
    sevenDayPlan: buildSevenDayPlan(primary),
    qwenVision: qwenVision?.parsed ? {
      provider: 'Qwen3-VL',
      model: provider.model,
      parsed: qwenVision.parsed,
    } : null,
    modelSuggestion: {
      recommended: 'Qwen/Qwen3-VL-8B-Instruct',
      reason: 'Qwen3-VL 是开源视觉语言模型，适合对舌像、面相、手相做可观察特征描述；本系统通过 OpenAI 兼容接口调用，云部署时可把模型放在 GPU 服务中。',
      env: [
        'OPEN_MODEL_BASE_URL=https://你的-qwen3-vl-服务/v1',
        'OPEN_MODEL_API_KEY=你的服务密钥或 EMPTY',
        'OPEN_MODEL_NAME=Qwen/Qwen3-VL-8B-Instruct',
      ],
    },
  };
}

function cleanup(files) {
  Object.values(files || {}).flat().forEach((file) => {
    try {
      fs.unlinkSync(file.path);
    } catch {
      // 临时上传文件清理失败不影响本次响应。
    }
  });
}

app.get('/health', (req, res) => {
  const provider = getVisionProviderStatus();
  res.json({
    status: 'ok',
    service: '中医养生辅助系统',
    qwen3VLReady: provider.enabled,
    qwen3VLModel: provider.model,
    time: new Date().toISOString(),
  });
});

app.get('/api/v1/symptoms', (req, res) => {
  res.json({ success: true, data: symptoms });
});

app.post(
  '/api/v1/diagnose',
  upload.fields([
    { name: 'tongue', maxCount: 1 },
    { name: 'face', maxCount: 1 },
    { name: 'palm', maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const selectedSymptoms = parseJsonField(req.body.symptoms, []);
      const profile = parseJsonField(req.body.profile, {});
      const hour = req.body.hour || new Date().getHours();
      const observation = buildObservation(req.files || {});
      const initialAnalysis = buildAnalysis({ selectedSymptoms, observation, hour, profile });

      let qwenVision = null;
      let modelVisionError = null;
      try {
        const qwenResponse = await analyzeWithQwenVision(req.files || {}, initialAnalysis);
        qwenVision = qwenResponse.result;
      } catch (error) {
        modelVisionError = 'Qwen3-VL 暂不可用，已使用本地规则完成演示：' + error.message;
      }

      const analysis = buildAnalysis({ selectedSymptoms, observation, hour, profile, qwenVision });
      if (modelVisionError) analysis.modelVisionError = modelVisionError;
      res.json({ success: true, data: analysis });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    } finally {
      cleanup(req.files);
    }
  }
);

if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
  app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
      next();
      return;
    }
    res.sendFile(path.join(publicDir, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log('中医养生辅助系统后端已启动：http://localhost:' + PORT);
});
