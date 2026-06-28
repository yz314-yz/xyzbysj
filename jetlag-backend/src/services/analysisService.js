const { z } = require('zod');

const { symptoms, patternMeta, meridianClock, sevenDayThemes } = require('../tcmKnowledge');
const { analyzeWithQwenVision, getVisionProviderStatus } = require('../qwenVision');
const { createDiagnosis } = require('../models/diagnosisModel');
const { createHttpError } = require('../middleware/errors');
const { logger } = require('../logger');

const diagnoseSchema = z.object({
  symptoms: z.array(z.string()).default([]),
  profile: z.object({
    age: z.union([z.string(), z.number()]).optional().default(''),
    gender: z.string().optional().default(''),
    bedtime: z.string().optional().default(''),
    wakeTime: z.string().optional().default(''),
  }).default({}),
  hour: z.coerce.number().int().min(0, '时辰参数需在 0-23 之间。').max(23, '时辰参数需在 0-23 之间。')
    .default(() => new Date().getHours()),
});

function parseJsonField(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'object') return value;
  return JSON.parse(String(value));
}

function sanitizeText(value, maxLength = 80) {
  if (value === undefined || value === null) return '';
  return String(value).trim().slice(0, maxLength);
}

function sanitizeTime(value) {
  const text = sanitizeText(value, 5);
  return /^\d{2}:\d{2}$/.test(text) ? text : '';
}

function parseDiagnoseBody(body) {
  let rawPayload;
  try {
    rawPayload = {
      symptoms: parseJsonField(body.symptoms, []),
      profile: parseJsonField(body.profile, {}),
      hour: body.hour ?? new Date().getHours(),
    };
  } catch {
    throw createHttpError(400, '请求体 JSON 格式不正确。');
  }

  const knownSymptoms = new Set(symptoms.map((item) => item.id));
  const parsed = diagnoseSchema.parse(rawPayload);
  const selectedSymptoms = parsed.symptoms
    .map((item) => String(item))
    .filter((id, index, list) => knownSymptoms.has(id) && list.indexOf(id) === index);

  const ageText = sanitizeText(parsed.profile.age, 3);
  if (ageText && (!/^\d+$/.test(ageText) || Number(ageText) < 1 || Number(ageText) > 120)) {
    throw createHttpError(400, '年龄需填写 1-120 之间的数字。');
  }

  return {
    selectedSymptoms,
    profile: {
      age: ageText,
      gender: sanitizeText(parsed.profile.gender, 20),
      bedtime: sanitizeTime(parsed.profile.bedtime),
      wakeTime: sanitizeTime(parsed.profile.wakeTime),
    },
    hour: parsed.hour,
  };
}

function currentMeridian(hour = new Date().getHours()) {
  const index = Math.floor(((Number(hour) + 1) % 24) / 2);
  return meridianClock[index] || meridianClock[0];
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

function buildEngineStatus(provider, observation, qwenVision) {
  const hasImage = Boolean(observation.tongue || observation.face || observation.palm);
  const hasVisionResult = Boolean(qwenVision?.parsed);
  let fallbackReason = null;

  if (!hasVisionResult) {
    if (!hasImage) {
      fallbackReason = '未上传图像，本次仅使用本地规则引擎生成养生方案。';
    } else if (!provider.enabled) {
      fallbackReason = 'Qwen3-VL 模型未配置，已使用本地规则引擎生成养生方案。';
    } else {
      fallbackReason = '未获得可解析的 Qwen3-VL 图像特征，已使用本地规则引擎生成养生方案。';
    }
  }

  return {
    rules: {
      enabled: true,
      provider: '本地规则引擎',
      active: true,
      role: '根据症状、采集项和子午流注生成体质方向与七日养生计划。',
    },
    vision: {
      provider: provider.provider,
      model: provider.model,
      configured: provider.enabled,
      active: hasVisionResult,
      baseURL: provider.baseURL,
      fallbackReason,
    },
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
    engineStatus: buildEngineStatus(provider, observation, qwenVision),
    disclaimer: 'AI 分析仅供学术展示与日常养生参考，不能替代执业医师诊断、治疗或处方。',
    profile,
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
  };
}

function buildInitialAnalysisContext({ selectedSymptoms, observation, hour, profile }) {
  const ranked = scorePatterns(selectedSymptoms, observation);
  const primary = ranked[0] || { id: 'spleenDeficiency', score: 1, ...patternMeta.spleenDeficiency };
  const selectedLabels = symptoms
    .filter((item) => selectedSymptoms.includes(item.id))
    .map((item) => item.label);

  return {
    profile,
    selectedSymptoms: selectedLabels,
    constitution: {
      primary: primary.name,
      explanation: primary.short,
    },
    meridian: currentMeridian(hour),
    observation: buildObservationCopy(observation),
  };
}

async function runDiagnosis({ body, files, user }) {
  const { selectedSymptoms, profile, hour } = parseDiagnoseBody(body);
  const observation = buildObservation(files || {});
  if (!selectedSymptoms.length && !Object.values(observation).some(Boolean)) {
    throw createHttpError(400, '请至少选择一个症状或上传一张图片。');
  }

  const initialAnalysis = buildInitialAnalysisContext({ selectedSymptoms, observation, hour, profile });
  let qwenVision = null;
  let modelVisionError = null;

  try {
    const qwenResponse = await analyzeWithQwenVision(files || {}, initialAnalysis);
    qwenVision = qwenResponse.result;
  } catch (error) {
    logger.warn('Qwen3-VL 调用失败：' + error.message);
    modelVisionError = 'Qwen3-VL 暂不可用，已使用本地规则完成演示。';
  }

  const analysis = buildAnalysis({ selectedSymptoms, observation, hour, profile, qwenVision });
  if (modelVisionError) analysis.modelVisionError = modelVisionError;

  const saved = user
    ? createDiagnosis({ userId: user.id, symptoms: selectedSymptoms, profile, result: analysis })
    : null;

  return {
    analysis,
    savedId: saved?.id || null,
  };
}

module.exports = {
  buildAnalysis,
  buildInitialAnalysisContext,
  currentMeridian,
  parseDiagnoseBody,
  runDiagnosis,
  scorePatterns,
};
