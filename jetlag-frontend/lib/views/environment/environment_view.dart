import 'dart:math' as math;
import 'package:flutter/cupertino.dart';
import 'package:jetlag_sync/theme/app_theme.dart';
import 'package:jetlag_sync/widgets/sketch/sketch_widgets.dart';

class EnvironmentView extends StatelessWidget {
  const EnvironmentView({super.key});

  @override
  Widget build(BuildContext context) {
    return CupertinoPageScaffold(
      backgroundColor: AppTheme.surface,
      navigationBar: CupertinoNavigationBar(
        backgroundColor: AppTheme.surface,
        border: null,
        middle: Column(
          children: [
            Text('环境健康', style: SketchFonts.title(size: 22, color: AppTheme.ink)),
            const SizedBox(height: 2),
            Text('ENVIRONMENT RADAR', style: SketchFonts.tag(size: 9, color: AppTheme.excalGreen, letterSpacing: 0.3)),
          ],
        ),
      ),
      child: SafeArea(
        child: CustomScrollView(
          slivers: [
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
                child: _buildCircadianClock(),
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 18, 20, 0),
                child: Row(
                  children: [
                    Expanded(child: _metricCard('温度', '28°C', '🌡️', AppTheme.excalOrange, '偏高', 1)),
                    const SizedBox(width: 12),
                    Expanded(child: _metricCard('湿度', '85%', '💧', AppTheme.excalBlue, '偏高', 2)),
                  ],
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
                child: Row(
                  children: [
                    Expanded(child: _metricCard('空气质量', '优', '🍃', AppTheme.excalGreen, 'AQI 42', 3)),
                    const SizedBox(width: 12),
                    Expanded(child: _metricCard('紫外线', '中', '☀️', AppTheme.amber, '防护', 4)),
                  ],
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 22, 20, 0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('今日节律建议', style: SketchFonts.title(size: 20, color: AppTheme.ink)),
                    const SizedBox(height: 12),
                    _rhythmRow('06:00', '起床', '接触自然光，重置生物钟', '🌅', AppTheme.excalGreen, 11),
                    _rhythmRow('11:00', '午时', '心经当令，宜小憩', '🌞', AppTheme.excalRed, 12),
                    _rhythmRow('13:00', '未时', '小肠经当令，避免暴食', '🍚', AppTheme.excalOrange, 13),
                    _rhythmRow('21:00', '亥时', '三焦经当令，宜睡前放松', '🌙', AppTheme.excalViolet, 14),
                    _rhythmRow('22:00', '入睡', '胆经当令前进入深眠', '😴', AppTheme.ink, 15),
                  ],
                ),
              ),
            ),
            SliverFillRemaining(hasScrollBody: false, child: const SizedBox(height: 36)),
          ],
        ),
      ),
    );
  }

  /// 手绘风生物节律钟盘
  Widget _buildCircadianClock() {
    return SketchCard(
      seed: 200,
      borderColor: AppTheme.ink,
      fillColor: AppTheme.cardSurface,
      padding: const EdgeInsets.all(20),
      cornerRadius: 16,
      strokeWidth: 1.5,
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('生物节律', style: SketchFonts.title(size: 18, color: AppTheme.ink)),
                  const SizedBox(height: 2),
                  Text('CIRCADIAN RHYTHM', style: SketchFonts.tag(size: 9, color: AppTheme.excalGreen, letterSpacing: 0.3)),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: AppTheme.excalOrange.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text('滞后 3h', style: SketchFonts.body(size: 12, color: AppTheme.excalOrange, weight: FontWeight.w700)),
              ),
            ],
          ),
          const SizedBox(height: 20),
          SizedBox(
            height: 160,
            child: CustomPaint(
              painter: SketchCircadianPainter(),
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text('23:47', style: SketchFonts.numeric(size: 30, color: AppTheme.ink)),
                    const SizedBox(height: 2),
                    Text('子时 · 胆经', style: SketchFonts.body(size: 12, color: AppTheme.excalGreen, weight: FontWeight.w700)),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              _rhythmPill('清醒', AppTheme.excalOrange, 301),
              _rhythmPill('褪黑素', AppTheme.deepSpace, 302),
              _rhythmPill('皮质醇', AppTheme.excalRed, 303),
            ],
          ),
        ],
      ),
    );
  }

  Widget _rhythmPill(String label, Color color, int seed) {
    return SketchCard(
      seed: seed,
      borderColor: color,
      fillColor: color.withValues(alpha: 0.08),
      strokeWidth: 1.4,
      cornerRadius: 12,
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      withShadow: false,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          SketchBadge(emoji: '●', color: color, size: 14, seed: seed + 10),
          const SizedBox(width: 6),
          Text(label, style: SketchFonts.body(size: 12, color: AppTheme.ink, weight: FontWeight.w600)),
        ],
      ),
    );
  }

  Widget _metricCard(String label, String value, String emoji, Color color, String subtitle, int seed) {
    return SketchCard(
      seed: seed,
      borderColor: color,
      fillColor: AppTheme.cardSurface,
      strokeWidth: 1.5,
      cornerRadius: 14,
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SketchBadge(emoji: emoji, color: color, size: 38, seed: seed + 20),
          const SizedBox(height: 12),
          Text(label, style: SketchFonts.body(size: 12, color: AppTheme.secondaryText, weight: FontWeight.w600)),
          const SizedBox(height: 4),
          Text(value, style: SketchFonts.numeric(size: 24, color: color)),
          const SizedBox(height: 4),
          Text(subtitle, style: SketchFonts.body(size: 11, color: AppTheme.secondaryText)),
        ],
      ),
    );
  }

  Widget _rhythmRow(String time, String title, String desc, String emoji, Color color, int seed) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: SketchCard(
        seed: seed,
        borderColor: color,
        fillColor: AppTheme.cardSurface,
        strokeWidth: 1.3,
        cornerRadius: 12,
        padding: const EdgeInsets.all(12),
        withShadow: false,
        child: Row(
          children: [
            SketchBadge(emoji: emoji, color: color, size: 36, seed: seed + 5),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(time, style: SketchFonts.tag(size: 10, color: color, letterSpacing: 0.3)),
                  const SizedBox(height: 2),
                  Text(title, style: SketchFonts.title(size: 16, color: AppTheme.ink)),
                  const SizedBox(height: 2),
                  Text(desc, style: SketchFonts.body(size: 11, color: AppTheme.secondaryText)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// 手绘风生物节律钟盘 Painter
class SketchCircadianPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2 - 12;
    final rng = math.Random(42);

    // 外圈：手绘抖动圆
    final outerPaint = Paint()
      ..color = AppTheme.ink.withValues(alpha: 0.6)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.4
      ..strokeCap = StrokeCap.round;
    final outerPath = Path();
    final segs = 60;
    for (int i = 0; i <= segs; i++) {
      final a = (i / segs) * math.pi * 2;
      final r = radius + (rng.nextDouble() - 0.5) * 1.2;
      final x = center.dx + r * math.cos(a);
      final y = center.dy + r * math.sin(a);
      if (i == 0) {
        outerPath.moveTo(x, y);
      } else {
        outerPath.lineTo(x, y);
      }
    }
    canvas.drawPath(outerPath, outerPaint);

    // 觉醒弧（橙色，约 60% 圆周）
    final awakePaint = Paint()
      ..color = AppTheme.excalOrange
      ..style = PaintingStyle.stroke
      ..strokeWidth = 6
      ..strokeCap = StrokeCap.round;
    final awakePath = Path();
    final awakeStart = -math.pi / 2;
    final awakeSweep = math.pi * 2 * 0.6;
    final awakeSegs = 40;
    for (int i = 0; i <= awakeSegs; i++) {
      final t = i / awakeSegs;
      final a = awakeStart + t * awakeSweep;
      final r = radius - 4 + (rng.nextDouble() - 0.5) * 0.8;
      final x = center.dx + r * math.cos(a);
      final y = center.dy + r * math.sin(a);
      if (i == 0) {
        awakePath.moveTo(x, y);
      } else {
        awakePath.lineTo(x, y);
      }
    }
    canvas.drawPath(awakePath, awakePaint);

    // 睡眠弧（深色）
    final sleepPaint = Paint()
      ..color = AppTheme.deepSpace.withValues(alpha: 0.7)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 6
      ..strokeCap = StrokeCap.round;
    final sleepPath = Path();
    final sleepStart = awakeStart + awakeSweep;
    final sleepSweep = math.pi * 2 * 0.4;
    for (int i = 0; i <= awakeSegs; i++) {
      final t = i / awakeSegs;
      final a = sleepStart + t * sleepSweep;
      final r = radius - 4 + (rng.nextDouble() - 0.5) * 0.8;
      final x = center.dx + r * math.cos(a);
      final y = center.dy + r * math.sin(a);
      if (i == 0) {
        sleepPath.moveTo(x, y);
      } else {
        sleepPath.lineTo(x, y);
      }
    }
    canvas.drawPath(sleepPath, sleepPaint);

    // 12 个时辰刻度（手绘短线）
    final tickPaint = Paint()
      ..color = AppTheme.ink
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.2
      ..strokeCap = StrokeCap.round;
    for (int i = 0; i < 12; i++) {
      final a = (i / 12) * math.pi * 2 - math.pi / 2;
      final r1 = radius + 4;
      final r2 = radius + (i % 3 == 0 ? 12 : 8);
      final ox = (rng.nextDouble() - 0.5) * 0.6;
      final oy = (rng.nextDouble() - 0.5) * 0.6;
      canvas.drawLine(
        Offset(center.dx + r1 * math.cos(a) + ox, center.dy + r1 * math.sin(a) + oy),
        Offset(center.dx + r2 * math.cos(a) + ox, center.dy + r2 * math.sin(a) + oy),
        tickPaint,
      );
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
