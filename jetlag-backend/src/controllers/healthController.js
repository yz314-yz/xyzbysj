const { getVisionProviderStatus, checkVisionProviderHealth } = require('../qwenVision');

async function health(req, res) {
  const provider = getVisionProviderStatus();
  const upstream = await checkVisionProviderHealth();

  res.json({
    status: 'ok',
    service: '中医养生辅助系统',
    visionModelReady: provider.enabled,
    visionModelProvider: provider.provider,
    visionModelName: provider.model,
    visionModelUpstream: upstream,
    localRuleEngineReady: true,
    activeMode: provider.enabled ? 'vision-model-configured-plus-local-rules' : 'local-rules',
    time: new Date().toISOString(),
  });
}

module.exports = { health };
