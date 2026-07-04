const { getVisionProviderStatus, checkVisionProviderHealth } = require('../qwenVision');
const { config } = require('../config');

async function health(req, res) {
  const provider = getVisionProviderStatus();
  const upstream = await checkVisionProviderHealth();

  res.json({
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
        requirement: '本机 Qwen2.5-VL OpenAI 兼容服务',
      },
    ],
    time: new Date().toISOString(),
  });
}

module.exports = { health };
