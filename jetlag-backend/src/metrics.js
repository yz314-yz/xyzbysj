const { getVisionProviderStatus } = require('./qwenVision');

const startedAt = Date.now();
const requestTotals = new Map();
const requestDurations = new Map();

function increment(map, key, amount = 1) {
  map.set(key, (map.get(key) || 0) + amount);
}

function escapeLabel(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/"/g, '\\"');
}

function labelString(labels) {
  return Object.entries(labels)
    .map(([key, value]) => `${key}="${escapeLabel(value)}"`)
    .join(',');
}

function keyFromLabels(labels) {
  return JSON.stringify(labels);
}

function labelsFromKey(key) {
  return JSON.parse(key);
}

function getRouteLabel(req) {
  if (!req.route) return req.path || 'unknown';
  const path = typeof req.route.path === 'string' ? req.route.path : String(req.route.path);
  if (path === '/' && req.baseUrl) return req.baseUrl;
  return `${req.baseUrl || ''}${path}`;
}

function metricsMiddleware(req, res, next) {
  if (req.path === '/metrics') {
    next();
    return;
  }

  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const durationSeconds = Number(process.hrtime.bigint() - start) / 1e9;
    const baseLabels = {
      method: req.method,
      route: getRouteLabel(req),
      status: String(res.statusCode),
    };
    const durationLabels = {
      method: req.method,
      route: baseLabels.route,
    };

    increment(requestTotals, keyFromLabels(baseLabels));
    increment(requestDurations, keyFromLabels({ ...durationLabels, metric: 'sum' }), durationSeconds);
    increment(requestDurations, keyFromLabels({ ...durationLabels, metric: 'count' }));
  });

  next();
}

function renderMetricLine(name, labels, value) {
  const suffix = labels && Object.keys(labels).length ? `{${labelString(labels)}}` : '';
  return `${name}${suffix} ${value}`;
}

function renderMetrics() {
  const lines = [
    '# HELP tcm_app_info Static application information.',
    '# TYPE tcm_app_info gauge',
    renderMetricLine('tcm_app_info', { service: 'tcm-wellness-backend' }, 1),
    '# HELP tcm_process_uptime_seconds Node.js process uptime.',
    '# TYPE tcm_process_uptime_seconds gauge',
    renderMetricLine('tcm_process_uptime_seconds', {}, process.uptime().toFixed(3)),
    '# HELP tcm_app_started_at_seconds Application start timestamp.',
    '# TYPE tcm_app_started_at_seconds gauge',
    renderMetricLine('tcm_app_started_at_seconds', {}, Math.floor(startedAt / 1000)),
    '# HELP tcm_vision_provider_configured Whether Qwen3-VL provider is configured.',
    '# TYPE tcm_vision_provider_configured gauge',
    renderMetricLine(
      'tcm_vision_provider_configured',
      { provider: getVisionProviderStatus().provider },
      getVisionProviderStatus().enabled ? 1 : 0
    ),
    '# HELP tcm_http_requests_total Total HTTP requests by method, route and status.',
    '# TYPE tcm_http_requests_total counter',
  ];

  requestTotals.forEach((value, key) => {
    lines.push(renderMetricLine('tcm_http_requests_total', labelsFromKey(key), value));
  });

  lines.push(
    '# HELP tcm_http_request_duration_seconds Total request duration and count by method and route.',
    '# TYPE tcm_http_request_duration_seconds summary'
  );
  requestDurations.forEach((value, key) => {
    const labels = labelsFromKey(key);
    const metric = labels.metric;
    delete labels.metric;
    lines.push(renderMetricLine(`tcm_http_request_duration_seconds_${metric}`, labels, value.toFixed(6)));
  });

  return `${lines.join('\n')}\n`;
}

function metricsHandler(req, res) {
  res.type('text/plain; version=0.0.4; charset=utf-8').send(renderMetrics());
}

module.exports = { metricsHandler, metricsMiddleware, renderMetrics };
