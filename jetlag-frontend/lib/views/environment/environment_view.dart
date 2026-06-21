import 'package:flutter/cupertino.dart';
import 'package:jetlag_sync/theme/app_theme.dart';

class EnvironmentView extends StatelessWidget {
  const EnvironmentView({super.key});

  @override
  Widget build(BuildContext context) {
    return CupertinoPageScaffold(
      backgroundColor: AppTheme.surface,
      navigationBar: CupertinoNavigationBar(
        backgroundColor: AppTheme.surface,
        border: null,
        middle: const Column(
          children: [
            Text(
              '环境健康',
              style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700, color: AppTheme.primaryText),
            ),
            SizedBox(height: 2),
            Text(
              'ENVIRONMENT RADAR',
              style: TextStyle(fontSize: 9, fontWeight: FontWeight.w700, color: AppTheme.sage, letterSpacing: 0.15),
            ),
          ],
        ),
      ),
      child: SafeArea(
        child: CustomScrollView(
          slivers: [
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(24, 16, 24, 0),
                child: _buildCircadianClock(),
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(24, 20, 24, 0),
                child: Row(
                  children: [
                    Expanded(child: _metricCard('温度', '28°C', CupertinoIcons.thermometer, AppTheme.amber, '偏高')),
                    const SizedBox(width: 12),
                    Expanded(child: _metricCard('湿度', '85%', CupertinoIcons.drop_fill, const Color(0xFF0284C7), '偏高')),
                  ],
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(24, 12, 24, 0),
                child: Row(
                  children: [
                    Expanded(child: _metricCard('空气质量', '优', CupertinoIcons.wind, AppTheme.sage, 'AQI 42')),
                    const SizedBox(width: 12),
                    Expanded(child: _metricCard('紫外线', '中', CupertinoIcons.sun_max_fill, const Color(0xFFF59E0B), '防护')),
                  ],
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(24, 20, 24, 0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('今日节律建议', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: AppTheme.primaryText)),
                    const SizedBox(height: 12),
                    _rhythmRow('06:00', '起床', '接触自然光，重置生物钟', AppTheme.sage),
                    _rhythmRow('11:00', '午时', '心经当令，宜小憩', const Color(0xFFDC2626)),
                    _rhythmRow('13:00', '未时', '小肠经当令，避免暴食', const Color(0xFFD97706)),
                    _rhythmRow('21:00', '亥时', '三焦经当令，宜睡前放松', const Color(0xFF7C3AED)),
                    _rhythmRow('22:00', '入睡', '胆经当令前进入深眠', AppTheme.primaryText),
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

  Widget _buildCircadianClock() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppTheme.cardSurface,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '生物节律',
                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
                  ),
                  SizedBox(height: 2),
                  Text(
                    'CIRCADIAN RHYTHM',
                    style: TextStyle(fontSize: 9, fontWeight: FontWeight.w700, color: AppTheme.sage, letterSpacing: 0.1),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: AppTheme.amber.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Text(
                  '滞后 3h',
                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppTheme.amber),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          SizedBox(
            height: 140,
            child: CustomPaint(
              painter: CircadianPainter(),
              child: const Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      '23:47',
                      style: TextStyle(fontSize: 28, fontWeight: FontWeight.w800, letterSpacing: -0.02),
                    ),
                    SizedBox(height: 2),
                    Text(
                      '子时 · 胆经',
                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppTheme.sage),
                    ),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              _rhythmPill('清醒', 0.8, AppTheme.amber),
              _rhythmPill('褪黑素', 0.6, AppTheme.deepSpace),
              _rhythmPill('皮质醇', 0.3, const Color(0xFFDC2626)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _rhythmPill(String label, double value, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(width: 8, height: 8, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
          const SizedBox(width: 6),
          Text(label, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }

  Widget _metricCard(String label, String value, IconData icon, Color color, String subtitle) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.cardSurface,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(color: color.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(10)),
            child: Icon(icon, size: 16, color: color),
          ),
          const SizedBox(height: 10),
          Text(label, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppTheme.secondaryText)),
          const SizedBox(height: 4),
          Text(value, style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: color)),
          const SizedBox(height: 4),
          Text(subtitle, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w500, color: AppTheme.secondaryText)),
        ],
      ),
    );
  }

  Widget _rhythmRow(String time, String title, String desc, Color color) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10),
      child: Row(
        children: [
          Container(
            width: 48,
            padding: const EdgeInsets.symmetric(vertical: 4),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Text(time, textAlign: TextAlign.center, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: color)),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
                const SizedBox(height: 2),
                Text(desc, style: const TextStyle(fontSize: 11, color: AppTheme.secondaryText)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class CircadianPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2 - 10;

    final bgPaint = Paint()
      ..color = AppTheme.outlineVariant
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2;
    canvas.drawCircle(center, radius, bgPaint);

    final arcPaint = Paint()
      ..color = AppTheme.sage.withValues(alpha: 0.3)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 6
      ..strokeCap = StrokeCap.round;

    final awakePaint = Paint()
      ..color = AppTheme.amber
      ..style = PaintingStyle.stroke
      ..strokeWidth = 6
      ..strokeCap = StrokeCap.round;

    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      -3.14 / 2,
      3.14 * 0.6,
      false,
      arcPaint,
    );

    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      -3.14 / 2 + 3.14 * 0.6,
      3.14 * 0.4,
      false,
      awakePaint,
    );

    for (int i = 0; i < 24; i++) {
      final angle = (i / 24) * 6.28 - 3.14 / 2;
      final x = center.dx + radius * 0.85 * (i % 6 == 0 ? 1.1 : 1.05) * 0;
      final x1 = center.dx + radius * 0.92 * (angle % 1 == 0 ? 1 : 1);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
