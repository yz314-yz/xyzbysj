const { OpenAI } = require('openai');
const { z } = require('zod');

const { createHttpError } = require('../middleware/errors');
const { logger } = require('../logger');

const DEFAULT_TEXT_MODEL = 'Qwen/Qwen2.5-7B-Instruct';
const DEFAULT_TIMEOUT_MS = 30 * 1000;
const COMPATIBLE_PROVIDER_PLACEHOLDER_KEY = 'local-compatible-provider-without-key';
const DISCLAIMER = '⚠️ AI 分析仅供学术参考，不作为医疗诊断。请咨询执业中医师。';
const INFERENCE_MODE_PUBLIC = 'public-free';

const chatSchema = z.object({
  question: z.string().trim().min(1, '请输入要追问的问题。').max(500, '单次追问不能超过 500 字。'),
  result: z.object({}).passthrough().optional().default({}),
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().trim().min(1).max(800),
  })).max(8).optional().default([]),
});

function getTextProviderStatus() {
  const baseURL = (process.env.OPEN_MODEL_BASE_URL || '').trim();
  const model = process.env.OPEN_TEXT_MODEL_NAME || process.env.OPEN_MODEL_NAME || DEFAULT_TEXT_MODEL;
  const timeoutMs = Number(process.env.OPEN_MODEL_TIMEOUT_MS || DEFAULT_TIMEOUT_MS);

  return {
    enabled: Boolean(baseURL),
    provider: 'Qwen 文本模型',
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

function createTextClient() {
  const status = getTextProviderStatus();
  if (!status.enabled || isUnsafeMissingKey(status)) return null;

  return new OpenAI({
    baseURL: process.env.OPEN_MODEL_BASE_URL,
    apiKey: process.env.OPEN_MODEL_API_KEY || COMPATIBLE_PROVIDER_PLACEHOLDER_KEY,
    timeout: status.timeoutMs,
  });
}

function compactList(items, limit = 4) {
  if (!Array.isArray(items)) return [];
  return items.filter(Boolean).slice(0, limit);
}

function sanitizePromptText(value, maxLength = 180) {
  if (value === undefined || value === null) return '';
  return String(value).replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

function summarizeResult(result) {
  const constitution = result.constitution || {};
  const meridian = result.meridian || {};
  const plan = compactList(result.sevenDayPlan, 7).map((item) => ({
    day: sanitizePromptText(item.day, 20),
    theme: sanitizePromptText(item.theme, 60),
    diet: sanitizePromptText(item.diet),
    exercise: sanitizePromptText(item.exercise),
    sleep: sanitizePromptText(item.sleep),
  }));

  return {
    constitution: {
      primary: sanitizePromptText(constitution.primary, 60) || '未生成',
      confidence: Number(constitution.confidence || 0),
      explanation: sanitizePromptText(constitution.explanation),
      primaryCare: sanitizePromptText(constitution.primaryCare),
      secondary: compactList(constitution.secondary, 3).map((item) => sanitizePromptText(item, 60)),
    },
    selectedSymptoms: compactList(result.selectedSymptoms, 8).map((item) => sanitizePromptText(item, 40)),
    meridian: {
      name: sanitizePromptText(meridian.name, 20),
      meridian: sanitizePromptText(meridian.meridian, 20),
      advice: sanitizePromptText(meridian.advice, 80),
    },
    immediateActions: compactList(result.immediateActions, 4).map((item) => sanitizePromptText(item)),
    sevenDayPlan: plan,
    engineMode: sanitizePromptText(result.mode, 60) || 'local-rules',
  };
}

function buildSystemPrompt(result) {
  return [
    '你是“岐养七日”的中医养生问答助手，只能基于用户当前方案做日常养生解释和执行建议。',
    '边界要求：不得诊断疾病，不得开药方，不得替代医生，不使用“确诊”“治疗”“处方”等医疗结论。',
    '如果用户问到急症、严重疼痛、持续发热、出血、胸痛、呼吸困难、妊娠用药、儿童用药等高风险内容，必须建议线下就医或咨询执业医师。',
    '回答要简洁、可执行，优先围绕饮食、运动、作息、观察记录四类建议，每次 3-5 条即可。',
    '必须在回答末尾保留边界提醒：' + DISCLAIMER,
    '当前方案摘要：' + JSON.stringify(summarizeResult(result)),
  ].join('\n');
}

function withDisclaimer(text) {
  const trimmed = String(text || '').trim();
  if (trimmed.includes('AI 分析仅供学术参考')) return trimmed;
  return `${trimmed}\n\n${DISCLAIMER}`;
}

function isPublicExperienceResult(result) {
  return result?.inferenceMode === INFERENCE_MODE_PUBLIC || String(result?.mode || '').startsWith('public-free');
}

function offlineReply(reason) {
  return {
    available: false,
    provider: getTextProviderStatus(),
    reply: reason || '当前为离线演示模式，AI 对话助手不可用。你仍可依据上方七日计划执行，并记录饮食、运动、作息和当日感受；如需启用追问，请配置 OPEN_MODEL_BASE_URL 后再试。',
  };
}

async function answerChat(payload) {
  const parsed = chatSchema.parse(payload);
  const status = getTextProviderStatus();
  const client = createTextClient();

  if (isPublicExperienceResult(parsed.result)) {
    return offlineReply('当前为公网免费体验版，AI 对话不会调用后端大模型。你仍可依据七日计划执行，并记录饮食、运动、作息和当日感受。');
  }

  if (!client) {
    if (isUnsafeMissingKey(status)) {
      logger.warn('OPEN_MODEL_BASE_URL 指向真实 OpenAI 端点但未配置 OPEN_MODEL_API_KEY，本次停用文本对话调用。');
    }
    return offlineReply();
  }

  const history = parsed.messages
    .slice(-6)
    .map((item) => ({ role: item.role, content: item.content }));

  try {
    const response = await client.chat.completions.create(
      {
        model: status.model,
        temperature: 0.3,
        max_tokens: 700,
        messages: [
          { role: 'system', content: buildSystemPrompt(parsed.result) },
          ...history,
          { role: 'user', content: parsed.question },
        ],
      },
      { timeout: status.timeoutMs }
    );

    const reply = response.choices?.[0]?.message?.content;
    if (typeof reply !== 'string' || !reply.trim()) {
      throw new Error('模型响应缺少文本内容。');
    }

    return {
      available: true,
      provider: status,
      reply: withDisclaimer(reply),
    };
  } catch (error) {
    logger.warn('Qwen 文本对话调用失败：' + error.message);
    throw createHttpError(503, 'AI 对话暂不可用，请稍后再试。');
  }
}

module.exports = { answerChat, getTextProviderStatus };
