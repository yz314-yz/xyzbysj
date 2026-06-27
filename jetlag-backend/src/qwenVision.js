const fs = require('fs');
const { OpenAI } = require('openai');

const DEFAULT_QWEN_MODEL = 'Qwen/Qwen3-VL-8B-Instruct';

function getVisionProviderStatus() {
  const baseURL = (process.env.OPEN_MODEL_BASE_URL || '').trim();
  const model = process.env.OPEN_MODEL_NAME || DEFAULT_QWEN_MODEL;
  const enabled = Boolean(baseURL);

  return {
    enabled,
    provider: 'Qwen3-VL',
    model,
    baseURL: baseURL || '未配置',
  };
}

function createClient() {
  const status = getVisionProviderStatus();
  if (!status.enabled) return null;

  return new OpenAI({
    baseURL: process.env.OPEN_MODEL_BASE_URL,
    apiKey: process.env.OPEN_MODEL_API_KEY || 'EMPTY',
  });
}

function imagePartFromFile(file, label) {
  const base64 = fs.readFileSync(file.path, 'base64');
  return [
    { type: 'text', text: '下面这张图片类型：' + label + '。' },
    {
      type: 'image_url',
      image_url: { url: 'data:' + file.mimetype + ';base64,' + base64 },
    },
  ];
}

function extractJsonObject(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    const match = String(text).match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

function compactFeatureText(parsed, raw) {
  if (!parsed) return raw || '';
  const chunks = [];
  ['tongue', 'face', 'palm'].forEach((key) => {
    const item = parsed[key];
    if (!item) return;
    if (Array.isArray(item.features)) chunks.push(item.features.join('，'));
    if (item.tcm_reference) chunks.push(item.tcm_reference);
    if (item.summary) chunks.push(item.summary);
  });
  if (Array.isArray(parsed.overall_observation)) chunks.push(parsed.overall_observation.join('，'));
  return chunks.join('；') || raw || '';
}

async function analyzeWithQwenVision(files, initialAnalysis) {
  const client = createClient();
  const status = getVisionProviderStatus();
  if (!client) return { status, result: null };

  const imageParts = [];
  if (files.tongue?.[0]) imageParts.push(...imagePartFromFile(files.tongue[0], '舌像'));
  if (files.face?.[0]) imageParts.push(...imagePartFromFile(files.face[0], '面相'));
  if (files.palm?.[0]) imageParts.push(...imagePartFromFile(files.palm[0], '手相'));
  if (!imageParts.length) return { status, result: null };

  const prompt = [
    '你是中医养生辅助系统的图像特征记录员，任务是记录舌像、面相、手相的可观察特征。',
    '严格边界：只能描述图像特征和中医养生参考，不得输出疾病诊断，不得开处方，不得使用“确诊”“治疗”等医疗结论。',
    '请输出 JSON，不要 Markdown，不要额外解释。JSON 结构如下：',
    '{',
    '  "tongue": { "features": ["舌色/舌苔/津液/舌下络脉等可见特征"], "tcm_reference": "养生参考" },',
    '  "face": { "features": ["面色/眼神/黑眼圈/油光潮红等可见特征"], "tcm_reference": "养生参考" },',
    '  "palm": { "features": ["掌色/掌纹清晰度/温润度等可见特征"], "tcm_reference": "养生参考" },',
    '  "overall_observation": ["1-3 条综合观察"],',
    '  "caution": "仅供学术展示与日常养生参考，不能替代执业医师诊断。"',
    '}',
    '如果某类图片没有提供，对应字段 features 为空数组，tcm_reference 写“未采集”。',
    '规则引擎初步方向：' + (initialAnalysis?.constitution?.primary || '待综合判断'),
  ].join('\n');

  const response = await client.chat.completions.create({
    model: status.model,
    temperature: 0.1,
    max_tokens: 900,
    messages: [
      {
        role: 'user',
        content: [{ type: 'text', text: prompt }, ...imageParts],
      },
    ],
  });

  const raw = response.choices?.[0]?.message?.content || '';
  const parsed = extractJsonObject(raw);
  return {
    status,
    result: {
      raw,
      parsed,
      featureText: compactFeatureText(parsed, raw),
    },
  };
}

module.exports = {
  DEFAULT_QWEN_MODEL,
  analyzeWithQwenVision,
  getVisionProviderStatus,
};
