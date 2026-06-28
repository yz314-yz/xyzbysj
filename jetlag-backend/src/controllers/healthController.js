const { getVisionProviderStatus, checkVisionProviderHealth } = require('../qwenVision');

async function health(req, res) {
  const provider = getVisionProviderStatus();
  const upstream = await checkVisionProviderHealth();

  res.json({
    status: 'ok',
    service: '中医养生辅助系统',
    qwen3VLReady: provider.enabled,
    qwen3VLModel: provider.model,
    qwen3VLUpstream: upstream,
    localRuleEngineReady: true,
    activeMode: provider.enabled ? 'qwen3-vl-configured-plus-local-rules' : 'local-rules',
    time: new Date().toISOString(),
  });
}

module.exports = { health };
