const { z } = require('zod');

const { symptoms, patternMeta, meridianClock, sevenDayThemes } = require('../tcmKnowledge');
const { analyzeWithQwenVision, getVisionProviderStatus } = require('../qwenVision');
const { createDiagnosis } = require('../models/diagnosisModel');
const { config } = require('../config');
const { createHttpError } = require('../middleware/errors');
const { logger } = require('../logger');

const INFERENCE_MODE_PUBLIC = 'public-free';
const INFERENCE_MODE_OFFLINE_QWEN = 'offline-qwen';
const IMAGE_KEYS = ['tongue', 'face', 'palm'];

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
  inferenceMode: z.enum([INFERENCE_MODE_PUBLIC, INFERENCE_MODE_OFFLINE_QWEN]).default(INFERENCE_MODE_PUBLIC),
  browserFeatures: z.record(z.unknown()).default({}),
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

function clampConfidence(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(1, number));
}

function sanitizeObservedFeatures(value) {
  if (!value || typeof value !== 'object') return {};
  return {
    lightLevel: sanitizeText(value.lightLevel, 24),
    clarity: sanitizeText(value.clarity, 24),
    colorTone: sanitizeText(value.colorTone, 24),
  };
}

function sanitizeBrowserFeature(key, value) {
  if (!value || typeof value !== 'object') return null;
  const observedFeatures = sanitizeObservedFeatures(value.observedFeatures);
  const featureParts = Object.values(observedFeatures).filter(Boolean);
  const featureText = sanitizeText(value.featureText || featureParts.join('，'), 160);
  const hasFeature = featureText || featureParts.length;

  if (!hasFeature) return null;

  return {
    engine: sanitizeText(value.engine, 40) || 'browser-lightweight-v1',
    runtime: 'visitor-browser',
    modelBacked: value.modelBacked === true,
    modelKind: sanitizeText(value.modelKind, 60),
    analysisScope: key,
    imageQuality: value.imageQuality === 'good' ? 'good' : 'needs_review',
    safetyGate: value.safetyGate === 'pass' ? 'pass' : 'review',
    confidence: clampConfidence(value.confidence || 0.58),
    observedFeatures,
    featureText,
  };
}

function sanitizeBrowserFeatures(value) {
  const raw = value && typeof value === 'object' ? value : {};
  return IMAGE_KEYS.reduce((features, key) => {
    const item = sanitizeBrowserFeature(key, raw[key]);
    if (item) features[key] = item;
    return features;
  }, {});
}

function parseDiagnoseBody(body) {
  let rawPayload;
  try {
    rawPayload = {
      symptoms: parseJsonField(body.symptoms, []),
      profile: parseJsonField(body.profile, {}),
      hour: body.hour ?? new Date().getHours(),
      inferenceMode: body.inferenceMode || INFERENCE_MODE_PUBLIC,
      browserFeatures: parseJsonField(body.browserFeatures, {}),
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
    inferenceMode: parsed.inferenceMode,
    browserFeatures: sanitizeBrowserFeatures(parsed.browserFeatures),
  };
}

function currentMeridian(hour = new Date().getHours()) {
  const index = Math.floor(((Number(hour) + 1) % 24) / 2);
  return meridianClock[index] || meridianClock[0];
}

function buildObservation(files, browserFeatures = {}) {
  return {
    tongue: Boolean(files.tongue?.[0] || browserFeatures.tongue),
    face: Boolean(files.face?.[0] || browserFeatures.face),
    palm: Boolean(files.palm?.[0] || browserFeatures.palm),
  };
}

function buildLocalVision(browserFeatures = {}) {
  const parsed = IMAGE_KEYS.reduce((items, key) => {
    if (browserFeatures[key]) items[key] = browserFeatures[key];
    return items;
  }, {});
  const values = Object.values(parsed);
  if (!values.length) return null;

  return {
    provider: '浏览器轻量识别',
    model: 'browser-lightweight-v1',
    engine: 'browser-lightweight-v1',
    runtime: 'visitor-browser',
    parsed,
    featureText: values.map((item) => item.featureText).filter(Boolean).join('；'),
    confidence: values.reduce((sum, item) => sum + item.confidence, 0) / values.length,
    safetyGate: values.every((item) => item.safetyGate === 'pass') ? 'pass' : 'review',
    modelBacked: values.some((item) => item.modelBacked),
  };
}

function assertModelEvidence({ inferenceMode, localVision, qwenVision }) {
  if (!config.requireModelEvidence) return;

  if (inferenceMode === INFERENCE_MODE_PUBLIC && !localVision?.modelBacked) {
    throw createHttpError(
      422,
      '上线严格模式要求公网体验版必须加载浏览器端多模态模型。当前只有轻量图片质量/颜色特征，不能生成上线级七日方案。'
    );
  }

  if (inferenceMode === INFERENCE_MODE_OFFLINE_QWEN && !qwenVision?.parsed) {
    throw createHttpError(
      503,
      '上线严格模式要求离线增强版必须成功调用 Qwen2.5-VL。当前本机模型不可用，不能生成上线级七日方案。'
    );
  }
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

function timeToMinutes(value) {
  if (!/^\d{2}:\d{2}$/.test(String(value || ''))) return null;
  const [hour, minute] = value.split(':').map(Number);
  return hour * 60 + minute;
}

function buildPlanContext({ selectedSymptoms, selectedLabels, profile, observation, qwenVision, localVision }) {
  const symptomSet = new Set(selectedSymptoms);
  const visionText = qwenVision?.featureText || localVision?.featureText || '';
  const bedtimeMinutes = timeToMinutes(profile.bedtime);
  const wakeMinutes = timeToMinutes(profile.wakeTime);
  const lateSleep = bedtimeMinutes !== null && (bedtimeMinutes >= 23 * 60 || bedtimeMinutes < 3 * 60);
  const earlyWake = wakeMinutes !== null && wakeMinutes <= 6 * 60 + 30;
  const age = Number(profile.age || 0);

  return {
    symptomSet,
    selectedLabels,
    visionText,
    lateSleep,
    earlyWake,
    ageGroup: age >= 45 ? 'midlife' : age > 0 && age <= 25 ? 'young' : 'adult',
    hasVision: Boolean(qwenVision?.parsed || localVision?.parsed),
    observationKeys: Object.entries(observation)
      .filter(([, enabled]) => enabled)
      .map(([key]) => key),
  };
}

function pickByIndex(list, index) {
  if (!list.length) return '';
  return list[index % list.length];
}

function buildAdaptiveFocus(primary, secondary, context) {
  const focus = [
    {
      theme: primary?.care || '稳定作息与饮食节律',
      diet: pickByIndex(primary?.foods || [], 0),
      exercise: pickByIndex(primary?.exercise || [], 0),
      basis: '主方向：' + (primary?.name || '基础调理'),
    },
  ];

  secondary.forEach((item, index) => {
    focus.push({
      theme: item.care,
      diet: pickByIndex(item.foods || [], index),
      exercise: pickByIndex(item.exercise || [], index),
      basis: '兼顾：' + item.name,
    });
  });

  if (context.symptomSet.has('insomnia') || context.symptomSet.has('palpitation') || context.lateSleep) {
    focus.push({
      theme: '安神稳眠，降低夜间刺激',
      diet: '桂圆莲子粥或酸枣仁小米粥',
      exercise: '睡前肩颈拉伸 12 分钟，神门穴按揉',
      basis: context.lateSleep ? '作息提示：入睡时间偏晚' : '症状提示：睡眠或心神不稳',
    });
  }

  if (context.symptomSet.has('bloating') || context.symptomSet.has('poor_appetite')) {
    focus.push({
      theme: '健脾助运，减轻腹胀与食欲低',
      diet: '山药小米粥 + 陈皮水，晚餐七分饱',
      exercise: '饭后慢走 20 分钟，顺时针摩腹 5 分钟',
      basis: '症状提示：食欲或腹胀相关',
    });
  }

  if (context.symptomSet.has('dry_mouth') || context.symptomSet.has('eye_dry') || /少津|干燥|舌红|裂纹/.test(context.visionText)) {
    focus.push({
      theme: '养阴生津，减少燥热消耗',
      diet: '银耳百合羹或梨汤少糖',
      exercise: '腹式呼吸 8 分钟，避免大汗运动',
      basis: /少津|干燥|舌红|裂纹/.test(context.visionText) ? '视觉提示：舌面津液或颜色偏燥热' : '症状提示：口眼干燥',
    });
  }

  if (context.symptomSet.has('acne') || context.symptomSet.has('bitter') || /黄腻|厚腻|油光|痘|潮红/.test(context.visionText)) {
    focus.push({
      theme: '清利湿热，控制油腻辛辣',
      diet: '冬瓜薏米汤 + 绿豆百合水',
      exercise: '快走微汗 20 分钟，避免熬夜后剧烈运动',
      basis: /黄腻|厚腻|油光|痘|潮红/.test(context.visionText) ? '视觉提示：油光、潮红或苔腻倾向' : '症状提示：口苦、痘痘或潮热',
    });
  }

  if (context.symptomSet.has('fatigue') || context.symptomSet.has('cold_limbs') || /淡白|苍白|少华|掌色淡/.test(context.visionText)) {
    focus.push({
      theme: '益气养血，避免空腹与过劳',
      diet: '黄芪红枣粥或山药胡萝卜鸡汤',
      exercise: '八段锦调理脾胃，饭后散步 15 分钟',
      basis: /淡白|苍白|少华|掌色淡/.test(context.visionText) ? '视觉提示：面色或掌色偏淡' : '症状提示：疲倦、虚汗或手脚偏凉',
    });
  }

  if (context.symptomSet.has('anxiety') || /烦躁|紧张|情绪|眼神疲惫/.test(context.visionText)) {
    focus.push({
      theme: '疏肝理气，给情绪留出口',
      diet: '玫瑰陈皮茶 + 清淡主食',
      exercise: '扩胸运动 3 组，户外慢走 20 分钟',
      basis: /烦躁|紧张|情绪|眼神疲惫/.test(context.visionText) ? '视觉/文本提示：神情疲惫或情绪紧张' : '症状提示：焦虑烦躁',
    });
  }

  if (context.symptomSet.has('back_sore') || context.symptomSet.has('memory') || /黑眼圈|腰膝|暗沉|络脉/.test(context.visionText)) {
    focus.push({
      theme: '温肾固本，降低夜间透支',
      diet: '黑豆核桃粥或枸杞山药蒸蛋',
      exercise: '擦腰温肾 3 分钟，静蹲 2 组',
      basis: /黑眼圈|腰膝|暗沉|络脉/.test(context.visionText) ? '视觉提示：暗沉、黑眼圈或络脉线索' : '症状提示：腰膝或注意力恢复相关',
    });
  }

  if (context.hasVision && context.observationKeys.length) {
    focus.push({
      theme: '复核图像线索，观察变化',
      diet: '延续前一日主食，记录口干、食欲和精神变化',
      exercise: '轻柔拉伸 15 分钟，不追求强度',
      basis: '已采集图像：' + context.observationKeys.join('、') + '；计划已纳入图像可观察特征',
    });
  }

  return focus;
}

function buildSleepAdvice(index, profile, context) {
  if (context.lateSleep) {
    const target = index < 3 ? '比当前提前 15 分钟上床' : '尽量在 23:00 前进入睡前流程';
    return target + '，睡前 30 分钟离屏。';
  }
  if (profile.bedtime) {
    return '维持 ' + profile.bedtime + ' 左右睡前流程，晚间只做低刺激活动。';
  }
  if (context.earlyWake) {
    return '早起后先温水与轻伸展，午间闭目 15-20 分钟。';
  }
  return index < 3 ? '固定起卧节律，午后少咖啡因。' : '记录睡眠、食欲、精神三项变化。';
}

function buildSevenDayPlan(primary, secondary, options = {}) {
  const context = buildPlanContext(options);
  const focus = buildAdaptiveFocus(primary, secondary, context);

  return sevenDayThemes.map((fallback, index) => {
    const current = focus[index % focus.length] || {};
    const next = focus[(index + 1) % focus.length] || {};
    const theme = current.theme || fallback[0];
    const dietBase = current.diet || pickByIndex(primary?.foods || [], index) || fallback[1];
    const exerciseBase = current.exercise || pickByIndex(primary?.exercise || [], index) || fallback[2];
    const symptomsText = context.selectedLabels.length
      ? '本日重点来自：' + context.selectedLabels.slice(0, 3).join('、')
      : '本日重点来自：上传图像与基础采集项';

    return {
      day: '第 ' + (index + 1) + ' 天',
      theme,
      diet: dietBase + (index % 2 === 0 ? '；晚餐减油减甜。' : '；三餐定时，不空腹饮浓茶咖啡。'),
      exercise: exerciseBase + (context.ageGroup === 'midlife' ? '，强度以微汗不过喘为度。' : '，完成后保留 5 分钟放松。'),
      sleep: buildSleepAdvice(index, options.profile || {}, context),
      note: current.basis + '；' + symptomsText + (next.theme ? '；明日衔接：' + next.theme : ''),
    };
  });
}

function getLocalFeatureList(localVision, key) {
  const observedFeatures = localVision?.parsed?.[key]?.observedFeatures;
  if (!observedFeatures) return [];
  return Object.values(observedFeatures).filter(Boolean);
}

function buildObservationCopy(observation, qwenVision, localVision) {
  const parsed = qwenVision?.parsed || {};
  const tongueFeatures = parsed.tongue?.features || [];
  const faceFeatures = parsed.face?.features || [];
  const palmFeatures = parsed.palm?.features || [];
  const localTongueFeatures = getLocalFeatureList(localVision, 'tongue');
  const localFaceFeatures = getLocalFeatureList(localVision, 'face');
  const localPalmFeatures = getLocalFeatureList(localVision, 'palm');

  return {
    tongue: observation.tongue
      ? (tongueFeatures.length
        ? 'Qwen2.5-VL 舌像特征：' + tongueFeatures.join('，')
        : localTongueFeatures.length
          ? '浏览器舌像特征：' + localTongueFeatures.join('，')
          : '已采集舌像：按舌色、舌苔、津液、舌下络脉归档。')
      : '未采集舌像：建议在自然光下伸舌平拍，避免美颜和强滤镜。',
    face: observation.face
      ? (faceFeatures.length
        ? 'Qwen2.5-VL 面相特征：' + faceFeatures.join('，')
        : localFaceFeatures.length
          ? '浏览器面相特征：' + localFaceFeatures.join('，')
          : '已采集面相：按面色、眼神、黑眼圈、油光潮红归档。')
      : '未采集面相：建议正脸、自然光、无遮挡拍摄。',
    palm: observation.palm
      ? (palmFeatures.length
        ? 'Qwen2.5-VL 手相特征：' + palmFeatures.join('，')
        : localPalmFeatures.length
          ? '浏览器手相特征：' + localPalmFeatures.join('，')
          : '已采集手相：按掌色、掌纹清晰度、温润度归档。')
      : '未采集手相：建议掌心展开、光线均匀拍摄。',
  };
}

function buildEngineStatus(provider, observation, qwenVision, localVision, inferenceMode) {
  const hasImage = Boolean(observation.tongue || observation.face || observation.palm);
  const hasVisionResult = Boolean(qwenVision?.parsed);
  const hasLocalVision = Boolean(localVision?.parsed);
  const offlineMode = inferenceMode === INFERENCE_MODE_OFFLINE_QWEN;
  let fallbackReason = null;

  if (!hasVisionResult) {
    if (!offlineMode) {
      fallbackReason = hasLocalVision
        ? '公网体验版已使用浏览器本地识别特征，不调用服务端 Qwen2.5-VL。'
        : '公网体验版未采集图像，本次仅使用规则引擎生成养生方案。';
    } else if (!hasImage) {
      fallbackReason = '未上传图像，本次仅使用规则引擎生成养生方案。';
    } else if (!provider.enabled) {
      fallbackReason = '本机 Qwen2.5-VL 未连接，已回退浏览器特征与规则引擎。';
    } else {
      fallbackReason = '未获得可解析的 Qwen2.5-VL 图像特征，已回退浏览器特征与规则引擎。';
    }
  }

  return {
    rules: {
      enabled: true,
      provider: '规则引擎',
      active: true,
      role: '根据症状、图像特征和子午流注生成体质方向与七日养生计划。',
    },
    browserVision: {
      enabled: true,
      provider: '浏览器轻量识别',
      model: localVision?.model || 'browser-lightweight-v1',
      configured: true,
      active: hasLocalVision,
      runtime: 'visitor-browser',
      role: '在访客浏览器内提取亮度、清晰度、颜色倾向等可观察特征。',
    },
    vision: {
      provider: provider.provider,
      model: provider.model,
      configured: provider.enabled,
      active: hasVisionResult,
      requested: offlineMode,
      baseURL: provider.baseURL,
      fallbackReason,
    },
  };
}

function buildAnalysis({ selectedSymptoms, observation, hour, profile, qwenVision, localVision, inferenceMode }) {
  const offlineMode = inferenceMode === INFERENCE_MODE_OFFLINE_QWEN;
  const hasQwenVision = Boolean(qwenVision?.parsed);
  const hasLocalVision = Boolean(localVision?.parsed);
  const ranked = scorePatterns(selectedSymptoms, observation, qwenVision?.featureText || localVision?.featureText);
  const primary = ranked[0] || { id: 'spleenDeficiency', score: 1, ...patternMeta.spleenDeficiency };
  const secondary = ranked.slice(1, 3);
  const meridian = currentMeridian(hour);
  const selectedLabels = symptoms
    .filter((item) => selectedSymptoms.includes(item.id))
    .map((item) => item.label);
  const provider = getVisionProviderStatus();
  const mode = hasQwenVision
    ? 'offline-qwen25-vl-plus-rules'
    : offlineMode
      ? (hasLocalVision ? 'offline-qwen25-vl-fallback-browser-rules' : 'offline-qwen25-vl-fallback-rules')
      : hasLocalVision
        ? 'public-free-browser-rules'
        : 'public-free-rules';

  return {
    inferenceMode,
    mode,
    evidenceLevel: hasQwenVision ? 'qwen-vl' : hasLocalVision && localVision.modelBacked ? 'browser-multimodal-model' : hasLocalVision ? 'browser-lightweight' : 'rules-only',
    productReady: !config.requireModelEvidence || hasQwenVision || Boolean(hasLocalVision && localVision.modelBacked),
    engineStatus: buildEngineStatus(provider, observation, qwenVision, localVision, inferenceMode),
    disclaimer: '⚠️ AI 分析仅供学术参考，不作为医疗诊断。请咨询执业中医师。',
    profile,
    observation: buildObservationCopy(observation, qwenVision, localVision),
    selectedSymptoms: selectedLabels,
    constitution: {
      primary: primary.name,
      primaryCare: primary.care,
      secondary: secondary.map((item) => item.name),
      explanation: primary.short,
      confidence: Math.min(95, 58 + primary.score * 8 + (hasQwenVision ? 5 : hasLocalVision ? 2 : 0)),
    },
    meridian,
    immediateActions: [
      '现在处于' + meridian.name + '，' + meridian.meridian + '当令：' + meridian.advice,
      '今日饮食以“' + primary.foods[0] + '”为主线，少辛辣、少冰饮、不过饱。',
      '今日运动选择：' + primary.exercise[0] + '，以微汗或身心放松为度。',
      '睡前 30 分钟停止高刺激内容，泡脚 10 分钟后做腹式呼吸。',
    ],
    sevenDayPlan: buildSevenDayPlan(primary, secondary, {
      selectedSymptoms,
      selectedLabels,
      profile,
      observation,
      qwenVision,
      localVision,
    }),
    localVision: localVision ? {
      provider: localVision.provider,
      model: localVision.model,
      engine: localVision.engine,
      runtime: localVision.runtime,
      parsed: localVision.parsed,
      featureText: localVision.featureText,
      confidence: localVision.confidence,
      safetyGate: localVision.safetyGate,
      modelBacked: localVision.modelBacked,
    } : null,
    qwenVision: qwenVision?.parsed ? {
      provider: 'Qwen2.5-VL',
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
  const { selectedSymptoms, profile, hour, inferenceMode, browserFeatures } = parseDiagnoseBody(body);
  const observation = buildObservation(files || {}, browserFeatures);
  if (!selectedSymptoms.length && !Object.values(observation).some(Boolean)) {
    throw createHttpError(400, '请至少选择一个症状或上传一张图片。');
  }

  const initialAnalysis = buildInitialAnalysisContext({ selectedSymptoms, observation, hour, profile });
  const localVision = buildLocalVision(browserFeatures);
  let qwenVision = null;
  let modelVisionError = null;

  const hasUploadedImages = Boolean(
    (files?.tongue?.[0]) || (files?.face?.[0]) || (files?.palm?.[0])
  );

  if (hasUploadedImages) {
    try {
      const qwenResponse = await analyzeWithQwenVision(files || {}, initialAnalysis);
      qwenVision = qwenResponse.result;
    } catch (error) {
      logger.warn('Qwen 视觉调用失败：' + error.message);
      modelVisionError = '视觉模型暂不可用，已回退浏览器本地特征与规则引擎。';
    }
  }

  assertModelEvidence({ inferenceMode, localVision, qwenVision });

  const analysis = buildAnalysis({
    selectedSymptoms,
    observation,
    hour,
    profile,
    qwenVision,
    localVision,
    inferenceMode,
  });
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
  INFERENCE_MODE_OFFLINE_QWEN,
  INFERENCE_MODE_PUBLIC,
  buildAnalysis,
  buildInitialAnalysisContext,
  currentMeridian,
  parseDiagnoseBody,
  runDiagnosis,
  scorePatterns,
};
