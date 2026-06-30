const fs = require('fs');
const { OpenAI } = require('openai');
const { logger } = require('./logger');

const DEFAULT_QWEN_MODEL = 'Qwen/Qwen2.5-VL-3B-Instruct';
const DEFAULT_TIMEOUT_MS = 30 * 1000;
const COMPATIBLE_PROVIDER_PLACEHOLDER_KEY = 'local-compatible-provider-without-key';

function getVisionProviderStatus() {
  const baseURL = (process.env.OPEN_MODEL_BASE_URL || '').trim();
  const model = process.env.OPEN_MODEL_NAME || DEFAULT_QWEN_MODEL;
  const timeoutMs = Number(process.env.OPEN_MODEL_TIMEOUT_MS || DEFAULT_TIMEOUT_MS);
  const enabled = Boolean(baseURL);

  return {
    enabled,
    provider: 'Qwen2.5-VL',
    model,
    baseURL: baseURL || '未配置',
    timeoutMs,
    apiKeyConfigured: Boolean(process.env.OPEN_MODEL_API_KEY),
  };
}

function isUnsafeMissingKey(status) {
  return status.enabled
    && !status.apiKeyConfigured
    && String(status.baseURL || '').toLowerCase().includes('api.openai.com');
}

function createClient() {
  const status = getVisionProviderStatus();
  if (!status.enabled) return null;
  if (isUnsafeMissingKey(status)) {
    logger.warn('OPEN_MODEL_BASE_URL 指向真实 OpenAI 端点但未配置 OPEN_MODEL_API_KEY，本次停用图像模型调用。');
    return null;
  }

  return new OpenAI({
    baseURL: process.env.OPEN_MODEL_BASE_URL,
    apiKey: process.env.OPEN_MODEL_API_KEY || COMPATIBLE_PROVIDER_PLACEHOLDER_KEY,
    timeout: status.timeoutMs,
  });
}

function warnIfUnsafeVisionConfig() {
  const status = getVisionProviderStatus();
  if (isUnsafeMissingKey(status)) {
    logger.warn('OPEN_MODEL_BASE_URL 指向真实 OpenAI 端点，但 OPEN_MODEL_API_KEY 未配置。');
  }
}

async function checkVisionProviderHealth() {
  const status = getVisionProviderStatus();
  if (!status.enabled) {
    return { configured: false, reachable: false, reason: '未配置 OPEN_MODEL_BASE_URL' };
  }
  if (isUnsafeMissingKey(status)) {
    return { configured: true, reachable: false, reason: '真实 OpenAI 端点必须配置 OPEN_MODEL_API_KEY' };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Math.min(status.timeoutMs, 5000));

  try {
    const response = await fetch(status.baseURL.replace(/\/$/, '') + '/models', {
      signal: controller.signal,
      headers: {
        Authorization: 'Bearer ' + (process.env.OPEN_MODEL_API_KEY || COMPATIBLE_PROVIDER_PLACEHOLDER_KEY),
      },
    });
    return {
      configured: true,
      reachable: response.ok,
      statusCode: response.status,
    };
  } catch (error) {
    return {
      configured: true,
      reachable: false,
      reason: error.name === 'AbortError' ? '上游探测超时' : error.message,
    };
  } finally {
    clearTimeout(timer);
  }
}

async function imagePartFromFile(file, label) {
  const base64 = await fs.promises.readFile(file.path, 'base64');
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
    const source = String(text);
    for (let start = 0; start < source.length; start += 1) {
      if (source[start] !== '{') continue;

      let depth = 0;
      let inString = false;
      let escaped = false;

      for (let end = start; end < source.length; end += 1) {
        const char = source[end];

        if (inString) {
          if (escaped) {
            escaped = false;
          } else if (char === '\\') {
            escaped = true;
          } else if (char === '"') {
            inString = false;
          }
          continue;
        }

        if (char === '"') {
          inString = true;
        } else if (char === '{') {
          depth += 1;
        } else if (char === '}') {
          depth -= 1;
          if (depth === 0) {
            try {
              return JSON.parse(source.slice(start, end + 1));
            } catch {
              break;
            }
          }
        }
      }
    }
  }
  return null;
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

  const imagePartTasks = [];
  if (files.tongue?.[0]) imagePartTasks.push(imagePartFromFile(files.tongue[0], '舌像'));
  if (files.face?.[0]) imagePartTasks.push(imagePartFromFile(files.face[0], '面相'));
  if (files.palm?.[0]) imagePartTasks.push(imagePartFromFile(files.palm[0], '手相'));
  const imageParts = (await Promise.all(imagePartTasks)).flat();
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

  const response = await client.chat.completions.create(
    {
      model: status.model,
      temperature: 0.1,
      max_tokens: 900,
      messages: [
        {
          role: 'user',
          content: [{ type: 'text', text: prompt }, ...imageParts],
        },
      ],
    },
    { timeout: status.timeoutMs }
  );

  if (response.error) {
    throw new Error('模型服务返回错误。');
  }

  const raw = response.choices?.[0]?.message?.content;
  if (typeof raw !== 'string' || !raw.trim()) {
    throw new Error('模型响应缺少可解析内容。');
  }

  const parsed = extractJsonObject(raw);
  if (!parsed) {
    throw new Error('模型响应不是有效 JSON。');
  }

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
  checkVisionProviderHealth,
  getVisionProviderStatus,
  warnIfUnsafeVisionConfig,
};

