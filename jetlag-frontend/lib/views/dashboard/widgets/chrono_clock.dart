import 'package:flutter/cupertino.dart';
import 'package:jetlag_sync/theme/app_theme.dart';

class ChronoClock extends StatelessWidget {
  final int hour;

  const ChronoClock({
    super.key,
    required this.hour,
  });

  String get _meridian {
    if (hour >= 11 && hour < 13) return '午时 · 心经当令';
    if (hour >= 13 && hour < 15) return '未时 · 小肠经当令';
    if (hour >= 15 && hour < 17) return '申时 · 膀胱经当令';
    if (hour >= 17 && hour < 19) return '酉时 · 肾经当令';
    if (hour >= 19 && hour < 21) return '戌时 · 心包经当令';
    if (hour >= 21 && hour < 23) return '亥时 · 三焦经当令';
    if (hour >= 23 || hour < 1) return '子时 · 胆经当令';
    if (hour >= 1 && hour < 3) return '丑时 · 肝经当令';
    if (hour >= 3 && hour < 5) return '寅时 · 肺经当令';
    if (hour >= 5 && hour < 7) return '卯时 · 大肠经当令';
    if (hour >= 7 && hour < 9) return '辰时 · 胃经当令';
    return '巳时 · 脾经当令';
  }

  double get _progress {
    final now = DateTime.now();
    return now.minute / 60.0;
  }

  @override
  Widget build(BuildContext context) {
    final timeStr =
        '${hour.toString().padLeft(2, '0')}:${DateTime.now().minute.toString().padLeft(2, '0')}';

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppTheme.cardSurface,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            height: 160,
            child: Stack(
              alignment: Alignment.center,
              children: [
                SizedBox(
                  width: 160,
                  height: 160,
                  child: CustomPaint(
                    painter: _RingPainter(
                      progress: _progress,
                    ),
                  ),
                ),
                Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Text(
                      '当前时辰',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.secondaryText,
                        letterSpacing: 0.1,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      timeStr,
                      style: const TextStyle(
                        fontSize: 36,
                        fontWeight: FontWeight.w300,
                        color: AppTheme.primaryText,
                        letterSpacing: -0.02,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: AppTheme.sage.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        _meridian,
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          color: AppTheme.sage,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppTheme.surface,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              '$_meridian。建议在此时段进行相应的调养活动，以配合体内气血节律。',
              style: const TextStyle(
                fontSize: 13,
                color: AppTheme.secondaryText,
                height: 1.5,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _RingPainter extends CustomPainter {
  final double progress;

  _RingPainter({required this.progress});

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2 - 8;

    final bgPaint = Paint()
      ..color = AppTheme.outlineVariant
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3;

    canvas.drawCircle(center, radius, bgPaint);

    final arcPaint = Paint()
      ..color = AppTheme.sage
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3
      ..strokeCap = StrokeCap.round;

    final sweepAngle = 2 * 3.14159 * progress;
    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      -3.14159 / 2,
      sweepAngle,
      false,
      arcPaint,
    );
  }

  @override
  bool shouldRepaint(_RingPainter old) => progress != old.progress;
}
