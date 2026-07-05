const { getVisionProviderStatus, checkVisionProviderHealth } = require('../qwenVision');
const { config } = require('../config');

let healthCache = { data: null, expireAt: 0 };
const HEALTH_CACHE_TTL = 30 * 1000; // 30秒

async function health(req, res, next) {
  try {
    const now = Date.now();
    if (healthCache.data && now < healthCache.expireAt) {
      return res.json(healthCache.data);
    }
    const provider = getVisionProviderStatus();
    const upstream = await checkVisionProviderHealth();

    const payload = {
      status: 'ok',
      service: '中医养生辅助系统',
      publicExperienceReady: true,
      offlineEnhancedReady: provider.enabled,
      requireModelEvidence: config.requireModelEvidence,
      productReadiness: {
        publicFree: config.requireModelEvidence ? 'requires-browser-multimodal-model' : 'demo-ready',
        offlineQwen: provider.enabled ? 'model-service-configured' : 'requires-local-qwen-service',
      },
      visionModelReady: provider.enabled,
      visionModelProvider: provider.provider,
      visionModelName: provider.model,
      visionModelUpstream: upstream,
      localRuleEngineReady: true,
      activeMode: provider.enabled ? 'offline-qwen-available' : 'public-free-browser-rules',
      inferenceModes: [
        {
          id: 'public-free',
          label: '公网免费体验版',
          ready: !config.requireModelEvidence,
          runtime: 'visitor-browser',
          requirement: config.requireModelEvidence ? '浏览器端多模态模型特征' : '轻量浏览器特征 + 规则引擎',
        },
        {
          id: 'offline-qwen',
          label: '离线增强演示版',
          ready: provider.enabled,
          runtime: 'local-qwen-compatible-service',
          requirement: '本机 Qwen3-VL OpenAI 兼容服务',
        },
      ],
      time: new Date().toISOString(),
    };

    healthCache = { data: payload, expireAt: now + HEALTH_CACHE_TTL };
    res.json(payload);
  } catch (error) {
    next(error);
  }
}

module.exports = { health };
