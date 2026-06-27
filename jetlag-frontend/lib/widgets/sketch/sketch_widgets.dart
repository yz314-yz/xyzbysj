import 'dart:math';
import 'package:flutter/cupertino.dart';
import 'package:google_fonts/google_fonts.dart';

/// 手写字体助手 - 加载 Excalidraw 标志性的手写感字体
class SketchFonts {
  /// 标题手写字体（Caveat，类似 Excalidraw 默认字体 Virgil）
  static TextStyle title({
    double size = 22,
    Color color = const Color(0xFF1E1E1E),
    FontWeight weight = FontWeight.w700,
    double letterSpacing = 0.1,
  }) =>
      GoogleFonts.caveat(
        fontSize: size,
        color: color,
        fontWeight: weight,
        letterSpacing: letterSpacing,
        height: 1.1,
      );

  /// 正文手写字体（Patrick Hand）
  static TextStyle body({
    double size = 14,
    Color color = const Color(0xFF1E1E1E),
    FontWeight weight = FontWeight.w400,
    double letterSpacing = 0.0,
    double height = 1.5,
  }) =>
      GoogleFonts.patrickHand(
        fontSize: size,
        color: color,
        fontWeight: weight,
        letterSpacing: letterSpacing,
        height: height,
      );

  /// 强调/数字手写字体（Kalam，略带潦草）
  static TextStyle numeric({
    double size = 24,
    Color color = const Color(0xFF1E1E1E),
    FontWeight weight = FontWeight.w700,
    double letterSpacing = 0.0,
  }) =>
      GoogleFonts.kalam(
        fontSize: size,
        color: color,
        fontWeight: weight,
        letterSpacing: letterSpacing,
      );

  /// 副标题/小标签手写字体（Gloria Hallelujah，最潦草）
  static TextStyle tag({
    double size = 11,
    Color color = const Color(0xFF6B7280),
    FontWeight weight = FontWeight.w400,
    double letterSpacing = 0.4,
  }) =>
      GoogleFonts.gloriaHallelujah(
        fontSize: size,
        color: color,
        fontWeight: weight,
        letterSpacing: letterSpacing,
        height: 1.2,
      );
}

/// Excalidraw 风格手绘卡片：带粗糙手绘边框 + 温暖纸质背景
class SketchCard extends StatelessWidget {
  final Widget child;
  final Color? borderColor;
  final Color? fillColor;
  final double strokeWidth;
  final EdgeInsets padding;
  final double cornerRadius;
  final int seed;
  final double jitter;
  final bool withShadow;

  const SketchCard({
    super.key,
    required this.child,
    this.borderColor = const Color(0xFF1E1E1E),
    this.fillColor = const Color(0xFFFFFEF7),
    this.strokeWidth = 1.6,
    this.padding = const EdgeInsets.all(16),
    this.cornerRadius = 14,
    this.seed = 1,
    this.jitter = 1.0,
    this.withShadow = true,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: withShadow
          ? BoxDecoration(
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF1E1E1E).withValues(alpha: 0.08),
                  blurRadius: 8,
                  offset: const Offset(2, 3),
                ),
              ],
            )
          : null,
      child: CustomPaint(
        painter: _SketchCardPainter(
          borderColor: borderColor!,
          fillColor: fillColor!,
          strokeWidth: strokeWidth,
          cornerRadius: cornerRadius,
          seed: seed,
          jitter: jitter,
        ),
        child: Padding(
          padding: padding,
          child: child,
        ),
      ),
    );
  }
}

class _SketchCardPainter extends CustomPainter {
  final Color borderColor;
  final Color fillColor;
  final double strokeWidth;
  final double cornerRadius;
  final int seed;
  final double jitter;

  _SketchCardPainter({
    required this.borderColor,
    required this.fillColor,
    required this.strokeWidth,
    required this.cornerRadius,
    required this.seed,
    required this.jitter,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final rrect = RRect.fromRectAndRadius(
      Rect.fromLTWH(0, 0, size.width, size.height),
      Radius.circular(cornerRadius),
    );

    // 1. 填充背景
    canvas.drawRRect(
      rrect,
      Paint()
        ..color = fillColor
        ..style = PaintingStyle.fill,
    );

    // 2. rough.js 风格手绘边框：2 条略偏移的子线
    final paint = Paint()
      ..color = borderColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;

    // 子线1：标准圆角矩形
    canvas.drawRRect(rrect, paint);

    // 子线2：沿圆角矩形周长采点，加抖动
    final path = Path()..addRRect(rrect);
    final metric = path.computeMetrics().first;
    final totalLen = metric.length;
    final rng = Random(seed);
    final path2 = Path();
    final segs = 60;
    for (int i = 0; i <= segs; i++) {
      final t = (i / segs) * totalLen;
      final tangent = metric.getTangentForOffset(t);
      if (tangent == null) continue;
      final p = tangent.position;
      final ox = (rng.nextDouble() - 0.5) * 1.4 * jitter;
      final oy = (rng.nextDouble() - 0.5) * 1.4 * jitter;
      if (i == 0) {
        path2.moveTo(p.dx + ox, p.dy + oy);
      } else {
        path2.lineTo(p.dx + ox, p.dy + oy);
      }
    }
    canvas.drawPath(path2, paint..color = borderColor.withValues(alpha: 0.55));
  }

  @override
  bool shouldRepaint(covariant _SketchCardPainter old) =>
      old.borderColor != borderColor ||
      old.fillColor != fillColor ||
      old.strokeWidth != strokeWidth ||
      old.cornerRadius != cornerRadius ||
      old.seed != seed;
}

/// 手绘按钮
class SketchButton extends StatelessWidget {
  final String label;
  final VoidCallback? onTap;
  final Color? color;
  final Color? textColor;
  final double strokeWidth;
  final IconData? icon;
  final bool filled;
  final double cornerRadius;
  final int seed;

  const SketchButton({
    super.key,
    required this.label,
    this.onTap,
    this.color = const Color(0xFF1E1E1E),
    this.textColor = const Color(0xFF1E1E1E),
    this.strokeWidth = 1.8,
    this.icon,
    this.filled = false,
    this.cornerRadius = 12,
    this.seed = 1,
  });

  @override
  Widget build(BuildContext context) {
    final btnTextColor = filled ? const Color(0xFFFFFEF7) : textColor!;
    return GestureDetector(
      onTap: onTap,
      child: CustomPaint(
        painter: _SketchButtonPainter(
          color: color!,
          textColor: textColor!,
          strokeWidth: strokeWidth,
          cornerRadius: cornerRadius,
          filled: filled,
          seed: seed,
        ),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (icon != null) ...[
                Icon(icon, size: 16, color: btnTextColor),
                const SizedBox(width: 8),
              ],
              Text(
                label,
                style: SketchFonts.body(
                  size: 15,
                  color: btnTextColor,
                  weight: FontWeight.w700,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SketchButtonPainter extends CustomPainter {
  final Color color;
  final Color textColor;
  final double strokeWidth;
  final double cornerRadius;
  final bool filled;
  final int seed;

  _SketchButtonPainter({
    required this.color,
    required this.textColor,
    required this.strokeWidth,
    required this.cornerRadius,
    required this.filled,
    required this.seed,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final rrect = RRect.fromRectAndRadius(
      Rect.fromLTWH(0, 0, size.width, size.height),
      Radius.circular(cornerRadius),
    );

    if (filled) {
      canvas.drawRRect(rrect, Paint()..color = color);
    }

    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;

    canvas.drawRRect(rrect, paint);

    // 手绘第二条偏移线
    final path = Path()..addRRect(rrect);
    final metric = path.computeMetrics().first;
    final totalLen = metric.length;
    final rng = Random(seed);
    final path2 = Path();
    final segs = 40;
    for (int i = 0; i <= segs; i++) {
      final t = (i / segs) * totalLen;
      final tangent = metric.getTangentForOffset(t);
      if (tangent == null) continue;
      final p = tangent.position;
      final ox = (rng.nextDouble() - 0.5) * 1.2;
      final oy = (rng.nextDouble() - 0.5) * 1.2;
      if (i == 0) {
        path2.moveTo(p.dx + ox, p.dy + oy);
      } else {
        path2.lineTo(p.dx + ox, p.dy + oy);
      }
    }
    canvas.drawPath(path2, paint..color = color.withValues(alpha: 0.5));
  }

  @override
  bool shouldRepaint(covariant _SketchButtonPainter old) =>
      old.color != color || old.filled != filled || old.seed != seed;
}

/// 手绘分割线（一条抖动横线）
class SketchDivider extends StatelessWidget {
  final Color color;
  final double strokeWidth;
  final int seed;
  final double height;

  const SketchDivider({
    super.key,
    this.color = const Color(0xFF1E1E1E),
    this.strokeWidth = 1.4,
    this.seed = 1,
    this.height = 16,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: height,
      child: CustomPaint(
        painter: _SketchDividerPainter(color: color, strokeWidth: strokeWidth, seed: seed),
        child: const SizedBox.expand(),
      ),
    );
  }
}

class _SketchDividerPainter extends CustomPainter {
  final Color color;
  final double strokeWidth;
  final int seed;

  _SketchDividerPainter({
    required this.color,
    required this.strokeWidth,
    required this.seed,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round;

    final rng = Random(seed);
    final midY = size.height / 2;

    // 子线1：略弯曲
    final path1 = Path();
    final segs = 20;
    for (int i = 0; i <= segs; i++) {
      final x = (i / segs) * size.width;
      final y = midY + (rng.nextDouble() - 0.5) * 1.2;
      if (i == 0) {
        path1.moveTo(x, y);
      } else {
        path1.lineTo(x, y);
      }
    }
    canvas.drawPath(path1, paint);

    // 子线2：偏移
    final path2 = Path();
    for (int i = 0; i <= segs; i++) {
      final x = (i / segs) * size.width;
      final y = midY + 1.5 + (rng.nextDouble() - 0.5) * 1.0;
      if (i == 0) {
        path2.moveTo(x, y);
      } else {
        path2.lineTo(x, y);
      }
    }
    canvas.drawPath(path2, paint..color = color.withValues(alpha: 0.55));
  }

  @override
  bool shouldRepaint(covariant _SketchDividerPainter old) => old.seed != seed;
}

/// 手绘 Chip / 标签胶囊
class SketchChip extends StatelessWidget {
  final String label;
  final bool selected;
  final Color? color;
  final String? emoji;
  final VoidCallback? onTap;
  final int seed;

  const SketchChip({
    super.key,
    required this.label,
    this.selected = false,
    this.color = const Color(0xFF1E1E1E),
    this.emoji,
    this.onTap,
    this.seed = 1,
  });

  @override
  Widget build(BuildContext context) {
    final chipTextColor = selected ? color! : const Color(0xFF1E1E1E);
    return GestureDetector(
      onTap: onTap,
      child: CustomPaint(
        painter: _SketchChipPainter(
          color: color!,
          selected: selected,
          seed: seed,
        ),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (emoji != null) ...[
                Text(emoji!, style: const TextStyle(fontSize: 13)),
                const SizedBox(width: 5),
              ],
              Text(
                label,
                style: SketchFonts.body(
                  size: 13,
                  color: chipTextColor,
                  weight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SketchChipPainter extends CustomPainter {
  final Color color;
  final bool selected;
  final int seed;

  _SketchChipPainter({required this.color, required this.selected, required this.seed});

  @override
  void paint(Canvas canvas, Size size) {
    final rrect = RRect.fromRectAndRadius(
      Rect.fromLTWH(0, 0, size.width, size.height),
      const Radius.circular(20),
    );

    // 选中时填充淡色
    if (selected) {
      canvas.drawRRect(
        rrect,
        Paint()..color = color.withValues(alpha: 0.12),
      );
    }

    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = selected ? 2.0 : 1.4
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;

    canvas.drawRRect(rrect, paint);

    // 手绘第二条偏移线
    final path = Path()..addRRect(rrect);
    final metric = path.computeMetrics().first;
    final totalLen = metric.length;
    final rng = Random(seed);
    final path2 = Path();
    final segs = 30;
    for (int i = 0; i <= segs; i++) {
      final t = (i / segs) * totalLen;
      final tangent = metric.getTangentForOffset(t);
      if (tangent == null) continue;
      final p = tangent.position;
      final ox = (rng.nextDouble() - 0.5) * 1.0;
      final oy = (rng.nextDouble() - 0.5) * 1.0;
      if (i == 0) {
        path2.moveTo(p.dx + ox, p.dy + oy);
      } else {
        path2.lineTo(p.dx + ox, p.dy + oy);
      }
    }
    canvas.drawPath(path2, paint..color = color.withValues(alpha: 0.5));
  }

  @override
  bool shouldRepaint(covariant _SketchChipPainter old) =>
      old.color != color || old.selected != selected || old.seed != seed;
}

/// 手绘进度条
class SketchProgress extends StatelessWidget {
  final double value; // 0.0 ~ 1.0
  final Color color;
  final double height;
  final int seed;

  const SketchProgress({
    super.key,
    required this.value,
    this.color = const Color(0xFF1E1E1E),
    this.height = 14,
    this.seed = 1,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: height,
      child: LayoutBuilder(
        builder: (context, constraints) {
          return CustomPaint(
            painter: _SketchProgressPainter(
              value: value,
              color: color,
              width: constraints.maxWidth,
              height: height,
              seed: seed,
            ),
            child: const SizedBox.expand(),
          );
        },
      ),
    );
  }
}

class _SketchProgressPainter extends CustomPainter {
  final double value;
  final Color color;
  final double width;
  final double height;
  final int seed;

  _SketchProgressPainter({
    required this.value,
    required this.color,
    required this.width,
    required this.height,
    required this.seed,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.4
      ..strokeCap = StrokeCap.round;

    final rng = Random(seed);
    final midY = height / 2;
    final fillW = width * value.clamp(0.0, 1.0);

    // 背景线
    final bgPath = Path();
    final bgSegs = 20;
    for (int i = 0; i <= bgSegs; i++) {
      final x = (i / bgSegs) * width;
      final y = midY + (rng.nextDouble() - 0.5) * 0.8;
      if (i == 0) {
        bgPath.moveTo(x, y);
      } else {
        bgPath.lineTo(x, y);
      }
    }
    canvas.drawPath(bgPath, paint..color = color.withValues(alpha: 0.2));

    // 填充线
    final fillPath = Path();
    final fillSegs = (bgSegs * value).ceil().clamp(1, bgSegs);
    for (int i = 0; i <= fillSegs; i++) {
      final x = (i / bgSegs) * width;
      final y = midY + (rng.nextDouble() - 0.5) * 1.2;
      if (i == 0) {
        fillPath.moveTo(x, y);
      } else {
        fillPath.lineTo(x, y);
      }
    }
    // 多绘 2 条手绘子线
    canvas.drawPath(fillPath, paint..color = color);
    final fillPath2 = Path();
    for (int i = 0; i <= fillSegs; i++) {
      final x = (i / bgSegs) * width;
      final y = midY + 1.6 + (rng.nextDouble() - 0.5) * 1.0;
      if (i == 0) {
        fillPath2.moveTo(x, y);
      } else {
        fillPath2.lineTo(x, y);
      }
    }
    canvas.drawPath(fillPath2, paint..color = color.withValues(alpha: 0.6));
  }

  @override
  bool shouldRepaint(covariant _SketchProgressPainter old) =>
      old.value != value || old.color != color || old.seed != seed;
}

/// 手绘小图标徽章（一个圆+表情/字符）
class SketchBadge extends StatelessWidget {
  final String emoji;
  final Color? color;
  final double size;
  final int seed;

  const SketchBadge({
    super.key,
    required this.emoji,
    this.color = const Color(0xFF1E1E1E),
    this.size = 36,
    this.seed = 1,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: Stack(
        alignment: Alignment.center,
        children: [
          CustomPaint(
            painter: _SketchBadgePainter(color: color!, seed: seed),
            size: Size(size, size),
          ),
          Text(emoji, style: TextStyle(fontSize: size * 0.5)),
        ],
      ),
    );
  }
}

class _SketchBadgePainter extends CustomPainter {
  final Color color;
  final int seed;

  _SketchBadgePainter({required this.color, required this.seed});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.6
      ..strokeCap = StrokeCap.round;

    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2 - 2;
    final rng = Random(seed);
    final segs = 36;

    // 子线1
    final path1 = Path();
    for (int i = 0; i <= segs; i++) {
      final a = (i / segs) * 2 * pi;
      final r = radius + (rng.nextDouble() - 0.5) * 1.0;
      final x = center.dx + r * cos(a);
      final y = center.dy + r * sin(a);
      if (i == 0) {
        path1.moveTo(x, y);
      } else {
        path1.lineTo(x, y);
      }
    }
    canvas.drawPath(path1, paint);

    // 子线2
    final path2 = Path();
    for (int i = 0; i <= segs; i++) {
      final a = (i / segs) * 2 * pi;
      final r = radius - 1.2 + (rng.nextDouble() - 0.5) * 0.6;
      final x = center.dx + r * cos(a) + 0.4;
      final y = center.dy + r * sin(a) - 0.4;
      if (i == 0) {
        path2.moveTo(x, y);
      } else {
        path2.lineTo(x, y);
      }
    }
    canvas.drawPath(path2, paint..color = color.withValues(alpha: 0.55));
  }

  @override
  bool shouldRepaint(covariant _SketchBadgePainter old) => old.seed != seed;
}
