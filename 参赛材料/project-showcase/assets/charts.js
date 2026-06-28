// assets/charts.js
(function () {
  // ---- Read CSS variables ----
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();

  // ---- Initialize Mermaid ----
  if (typeof mermaid !== 'undefined') {
    mermaid.initialize({
      startOnLoad: true,
      theme: 'neutral',
      securityLevel: 'loose',
      themeVariables: {
        primaryColor: bg2,
        primaryTextColor: ink,
        primaryBorderColor: accent,
        lineColor: muted,
        secondaryColor: bg2,
        tertiaryColor: bg2,
        fontFamily: 'InstrumentSans, "PingFang SC", "Microsoft YaHei", sans-serif'
      }
    });
  }

  // ---- Chart: Capability Radar ----
  var radarEl = document.getElementById('chart-radar');
  if (radarEl && typeof echarts !== 'undefined') {
    var chart = echarts.init(radarEl, null, { renderer: 'svg' });
    chart.setOption({
      animation: false,
      tooltip: {
        trigger: 'item',
        appendToBody: true
      },
      radar: {
        indicator: [
          { name: '功能完整度', max: 100 },
          { name: '工程化', max: 100 },
          { name: '安全性', max: 100 },
          { name: '可测试性', max: 100 },
          { name: '可部署性', max: 100 },
          { name: 'AI 集成度', max: 100 }
        ],
        shape: 'polygon',
        splitNumber: 5,
        axisName: {
          color: ink,
          fontSize: 13,
          fontWeight: 600
        },
        splitLine: {
          lineStyle: { color: rule, width: 1 }
        },
        splitArea: {
          areaStyle: { color: ['transparent', 'rgba(139,94,60,0.03)'] }
        },
        axisLine: {
          lineStyle: { color: rule }
        }
      },
      series: [{
        type: 'radar',
        data: [{
          value: [90, 95, 85, 80, 95, 85],
          name: '能力评分',
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: {
            color: accent,
            width: 2
          },
          itemStyle: {
            color: accent
          },
          areaStyle: {
            color: accent + '22'
          },
          label: {
            show: true,
            color: accent,
            fontSize: 12,
            fontWeight: 600,
            formatter: function (params) {
              return params.value;
            }
          }
        }]
      }]
    });
    window.addEventListener('resize', function () { chart.resize(); });
  }
})();
