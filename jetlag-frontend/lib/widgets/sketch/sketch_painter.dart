import 'dart:math';
import 'package:flutter/material.dart';

/// Excalidraw / rough.js 风格手绘抖动笔触核心绘制器
///
/// 通过为每条线生成多条略微偏移的子线，模拟人手反复描线的手绘质感。
/// 这是整个手绘风格的视觉精髓。
class SketchPainter extends CustomPainter {
  /// 矩形路径列表，每个为 [left, top, width, height, color, strokeWidth]
  final List<List<dynamic>> rects;

  /// 圆形列表，每个为 [centerX, centerY, radius, color, strokeWidth]
  final List<List<dynamic>> circles;

  /// 椭圆列表，每个为 [centerX, centerY, radiusX, radiusY, color, strokeWidth]
  final List<List<dynamic>> ellipses;

  /// 直线列表，每个为 [x1, y1, x2, y2, color, strokeWidth]
  final List<List<dynamic>> lines;

  /// 折线列表，每个为 [List<Offset>, color, strokeWidth]
  final List<List<dynamic>> polylines;

  /// 随机种子，保证同一组件多次绘制结果一致
  final int seed;

  /// 抖动幅度，越大越"潦草"
  final double jitter;

  SketchPainter({
    List<List<dynamic>>? rects,
    List<List<dynamic>>? circles,
    List<List<dynamic>>? ellipses,
    List<List<dynamic>>? lines,
    List<List<dynamic>>? polylines,
    this.seed = 1,
    this.jitter = 1.0,
  })  : rects = rects ?? const [],
        circles = circles ?? const [],
        ellipses = ellipses ?? const [],
        lines = lines ?? const [],
        polylines = polylines ?? const [];

  @override
  void paint(Canvas canvas, Size size) {
    for (final r in rects) {
      _drawSketchRect(
        canvas,
        Rect.fromLTWH(r[0] as double, r[1] as double, r[2] as double, r[3] as double),
        r[4] as Color,
        r[5] as double,
      );
    }
    for (final c in circles) {
      _drawSketchCircle(canvas, Offset(c[0] as double, c[1] as double), c[2] as double, c[3] as Color, c[4] as double);
    }
    for (final e in ellipses) {
      _drawSketchEllipse(
        canvas,
        Offset(e[0] as double, e[1] as double),
        e[2] as double,
        e[3] as double,
        e[4] as Color,
        e[5] as double,
      );
    }
    for (final l in lines) {
      _drawSketchLine(canvas, Offset(l[0] as double, l[1] as double), Offset(l[2] as double, l[3] as double), l[4] as Color, l[5] as double);
    }
    for (final p in polylines) {
      _drawSketchPolyline(canvas, p[0] as List<Offset>, p[1] as Color, p[2] as double);
    }
  }

  void _drawSketchRect(Canvas canvas, Rect rect, Color color, double strokeWidth) {
    // rough.js 风格：2~3 条略偏移的子线
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;

    final rng = Random(seed);

    // 子线1：略偏移的实线
    final o1 = rng.nextDouble() * 0.8 * jitter;
    canvas.drawRect(
      Rect.fromLTWH(rect.left + o1, rect.top - o1 * 0.5, rect.width, rect.height),
      paint,
    );

    // 子线2：另一方向偏移
    final o2 = rng.nextDouble() * 1.4 * jitter;
    final path2 = Path()
      ..moveTo(rect.left + o2, rect.top)
      ..lineTo(rect.right - o2 * 0.6, rect.top + o2 * 0.3)
      ..lineTo(rect.right, rect.bottom - o2 * 0.4)
      ..lineTo(rect.left + o2 * 0.5, rect.bottom)
      ..close();
    canvas.drawPath(path2, paint..color = color.withValues(alpha: 0.7));
  }

  void _drawSketchCircle(Canvas canvas, Offset center, double radius, Color color, double strokeWidth) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round;

    final rng = Random(seed + 7);
    // 子线1：抖动圆
    final path1 = Path();
    final segs = 36;
    for (int i = 0; i <= segs; i++) {
      final a = (i / segs) * 2 * pi;
      final r = radius + (rng.nextDouble() - 0.5) * 1.4 * jitter;
      final x = center.dx + r * cos(a);
      final y = center.dy + r * sin(a);
      if (i == 0) {
        path1.moveTo(x, y);
      } else {
        path1.lineTo(x, y);
      }
    }
    canvas.drawPath(path1, paint);

    // 子线2：稍小、偏移的圆
    final path2 = Path();
    for (int i = 0; i <= segs; i++) {
      final a = (i / segs) * 2 * pi;
      final r = radius - 1.2 + (rng.nextDouble() - 0.5) * 0.8 * jitter;
      final x = center.dx + r * cos(a) + 0.6;
      final y = center.dy + r * sin(a) - 0.4;
      if (i == 0) {
        path2.moveTo(x, y);
      } else {
        path2.lineTo(x, y);
      }
    }
    canvas.drawPath(path2, paint..color = color.withValues(alpha: 0.55));
  }

  void _drawSketchEllipse(Canvas canvas, Offset center, double rx, double ry, Color color, double strokeWidth) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round;

    final rng = Random(seed + 13);
    final segs = 48;
    final path1 = Path();
    for (int i = 0; i <= segs; i++) {
      final a = (i / segs) * 2 * pi;
      final rxx = rx + (rng.nextDouble() - 0.5) * 1.2 * jitter;
      final ryy = ry + (rng.nextDouble() - 0.5) * 1.2 * jitter;
      final x = center.dx + rxx * cos(a);
      final y = center.dy + ryy * sin(a);
      if (i == 0) {
        path1.moveTo(x, y);
      } else {
        path1.lineTo(x, y);
      }
    }
    canvas.drawPath(path1, paint);
  }

  void _drawSketchLine(Canvas canvas, Offset p1, Offset p2, Color color, double strokeWidth) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round;

    final rng = Random(seed + 23);
    // 子线1：轻微弯曲
    final mid1 = Offset((p1.dx + p2.dx) / 2 + (rng.nextDouble() - 0.5) * 1.2 * jitter,
        (p1.dy + p2.dy) / 2 + (rng.nextDouble() - 0.5) * 1.2 * jitter);
    final path1 = Path()
      ..moveTo(p1.dx, p1.dy)
      ..quadraticBezierTo(mid1.dx, mid1.dy, p2.dx, p2.dy);
    canvas.drawPath(path1, paint);

    // 子线2：略偏移
    final o = (rng.nextDouble() - 0.5) * 1.4 * jitter;
    final path2 = Path()
      ..moveTo(p1.dx + o, p1.dy + o * 0.6)
      ..quadraticBezierTo(mid1.dx + o, mid1.dy + o, p2.dx + o * 0.4, p2.dy + o * 0.4);
    canvas.drawPath(path2, paint..color = color.withValues(alpha: 0.6));
  }

  void _drawSketchPolyline(Canvas canvas, List<Offset> points, Color color, double strokeWidth) {
    if (points.isEmpty) return;
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;

    final rng = Random(seed + 31);
    // 子线1
    final path1 = Path()..moveTo(points.first.dx, points.first.dy);
    for (int i = 1; i < points.length; i++) {
      path1.lineTo(points[i].dx, points[i].dy);
    }
    canvas.drawPath(path1, paint);

    // 子线2：偏移版本
    final path2 = Path();
    for (int i = 0; i < points.length; i++) {
      final o = (rng.nextDouble() - 0.5) * 1.0 * jitter;
      final p = Offset(points[i].dx + o, points[i].dy + o * 0.7);
      if (i == 0) {
        path2.moveTo(p.dx, p.dy);
      } else {
        path2.lineTo(p.dx, p.dy);
      }
    }
    canvas.drawPath(path2, paint..color = color.withValues(alpha: 0.55));
  }

  @override
  bool shouldRepaint(covariant SketchPainter old) =>
      old.rects != rects ||
      old.circles != circles ||
      old.ellipses != ellipses ||
      old.lines != lines ||
      old.polylines != polylines ||
      old.seed != seed;
}

/// 一条手绘箭头：直线 + 箭头
class SketchArrow {
  final Offset from;
  final Offset to;
  final Color color;
  final double strokeWidth;

  const SketchArrow({
    required this.from,
    required this.to,
    required this.color,
    this.strokeWidth = 1.6,
  });

  List<List<dynamic>> toPainterLines() {
    // 主线 + 两条箭头线
    final angle = (to - from).direction;
    const arrowLen = 8.0;
    const arrowAngle = 0.5; // 弧度
    final a1 = to - Offset(arrowLen * cos(angle - arrowAngle), arrowLen * sin(angle - arrowAngle));
    final a2 = to - Offset(arrowLen * cos(angle + arrowAngle), arrowLen * sin(angle + arrowAngle));
    return [
      [from.dx, from.dy, to.dx, to.dy, color, strokeWidth],
      [to.dx, to.dy, a1.dx, a1.dy, color, strokeWidth],
      [to.dx, to.dy, a2.dx, a2.dy, color, strokeWidth],
    ];
  }
}
