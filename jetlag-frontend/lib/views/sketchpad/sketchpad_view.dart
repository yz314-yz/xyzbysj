import 'dart:math' as math;
import 'package:flutter/cupertino.dart';
import 'package:perfect_freehand/perfect_freehand.dart';
import 'package:jetlag_sync/theme/app_theme.dart';
import 'package:jetlag_sync/widgets/sketch/sketch_widgets.dart';

/// Excalidraw 风格手绘画板
///
/// 使用 perfect_freehand（Excalidraw 官方笔触算法的 Dart 移植版）
/// 让用户在 Flutter 应用内真正体验 Excalidraw 的手绘笔触。
class SketchpadView extends StatefulWidget {
  const SketchpadView({super.key});

  @override
  State<SketchpadView> createState() => _SketchpadViewState();
}

class _SketchpadViewState extends State<SketchpadView> {
  /// 所有已完成的笔触
  final List<_Stroke> _strokes = [];

  /// 当前正在绘制的笔触点
  final List<PointVector> _currentPoints = [];

  /// 当前颜色
  Color _currentColor = AppTheme.ink;

  /// 当前笔触粗细
  double _currentSize = 4.0;

  /// 是否橡皮擦模式
  bool _eraserMode = false;

  /// 调色板（Excalidraw 9 色）
  static const List<Color> _palette = [
    AppTheme.ink,
    AppTheme.excalRed,
    AppTheme.excalOrange,
    AppTheme.excalYellow,
    AppTheme.excalGreen,
    AppTheme.excalCyan,
    AppTheme.excalBlue,
    AppTheme.excalViolet,
    AppTheme.excalPink,
  ];

  void _onPanStart(DragStartDetails details) {
    setState(() {
      _currentPoints.clear();
      _currentPoints.add(PointVector(details.localPosition.dx, details.localPosition.dy));
    });
  }

  void _onPanUpdate(DragUpdateDetails details) {
    setState(() {
      _currentPoints.add(PointVector(details.localPosition.dx, details.localPosition.dy));
    });
  }

  void _onPanEnd(DragEndDetails _) {
    if (_currentPoints.length < 2) {
      // 单击：补一个略微偏移的点保证 getStroke 能生成
      final p = _currentPoints.last;
      _currentPoints.add(PointVector(p.x + 0.5, p.y + 0.5));
    }
    setState(() {
      _strokes.add(_Stroke(
        points: List.of(_currentPoints),
        color: _eraserMode ? AppTheme.cardSurface : _currentColor,
        size: _currentSize,
        isEraser: _eraserMode,
      ));
      _currentPoints.clear();
    });
  }

  void _undo() {
    setState(() {
      if (_strokes.isNotEmpty) _strokes.removeLast();
    });
  }

  void _clear() {
    setState(() {
      _strokes.clear();
      _currentPoints.clear();
    });
  }

  @override
  Widget build(BuildContext context) {
    return CupertinoPageScaffold(
      backgroundColor: AppTheme.surface,
      navigationBar: CupertinoNavigationBar(
        backgroundColor: AppTheme.surface,
        border: null,
        middle: Column(
          children: [
            Text('手绘画板', style: SketchFonts.title(size: 22, color: AppTheme.ink)),
            const SizedBox(height: 2),
            Text('EXCALIDRAW SKETCHPAD', style: SketchFonts.tag(size: 9, color: AppTheme.excalGreen, letterSpacing: 0.3)),
          ],
        ),
        trailing: CupertinoButton(
          padding: EdgeInsets.zero,
          onPressed: _clear,
          child: const Icon(CupertinoIcons.trash, size: 20, color: AppTheme.excalRed),
        ),
      ),
      child: SafeArea(
        child: Column(
          children: [
            // 顶部说明
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 8),
              child: Row(
                children: [
                  SketchBadge(emoji: '✏️', color: AppTheme.excalOrange, size: 26, seed: 1),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      '在画布上自由手绘，体验 Excalidraw 同款 perfect-freehand 笔触',
                      style: SketchFonts.body(size: 12, color: AppTheme.secondaryText),
                    ),
                  ),
                ],
              ),
            ),
            // 画布
            Expanded(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 0),
                child: SketchCard(
                  seed: 100,
                  borderColor: AppTheme.ink,
                  fillColor: AppTheme.cardSurface,
                  padding: EdgeInsets.zero,
                  cornerRadius: 16,
                  strokeWidth: 1.5,
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(15),
                    child: GestureDetector(
                      onPanStart: _onPanStart,
                      onPanUpdate: _onPanUpdate,
                      onPanEnd: _onPanEnd,
                      child: CustomPaint(
                        painter: _SketchpadPainter(
                          strokes: _strokes,
                          currentPoints: _currentPoints,
                          currentColor: _eraserMode ? AppTheme.cardSurface : _currentColor,
                          currentSize: _currentSize,
                        ),
                        child: const SizedBox.expand(),
                      ),
                    ),
                  ),
                ),
              ),
            ),
            // 调色板与工具栏
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 16),
              child: Column(
                children: [
                  // 颜色选择
                  SizedBox(
                    height: 40,
                    child: ListView.separated(
                      scrollDirection: Axis.horizontal,
                      itemCount: _palette.length,
                      separatorBuilder: (_, __) => const SizedBox(width: 10),
                      itemBuilder: (context, index) {
                        final color = _palette[index];
                        final selected = ! _eraserMode && _currentColor.value == color.value;
                        return GestureDetector(
                          onTap: () => setState(() {
                            _eraserMode = false;
                            _currentColor = color;
                          }),
                          child: _ColorDot(color: color, selected: selected, seed: 200 + index),
                        );
                      },
                    ),
                  ),
                  const SizedBox(height: 12),
                  // 工具行：撤销 / 橡皮擦 / 粗细
                  Row(
                    children: [
                      // 撤销
                      GestureDetector(
                        onTap: _undo,
                        child: SketchCard(
                          seed: 301,
                          borderColor: AppTheme.ink,
                          fillColor: AppTheme.cardSurface,
                          strokeWidth: 1.4,
                          cornerRadius: 10,
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                          withShadow: false,
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(CupertinoIcons.reply, size: 14, color: AppTheme.ink),
                              const SizedBox(width: 4),
                              Text('撤销', style: SketchFonts.body(size: 12, color: AppTheme.ink, weight: FontWeight.w600)),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      // 橡皮擦
                      GestureDetector(
                        onTap: () => setState(() => _eraserMode = !_eraserMode),
                        child: SketchCard(
                          seed: 302,
                          borderColor: _eraserMode ? AppTheme.excalRed : AppTheme.ink,
                          fillColor: _eraserMode ? AppTheme.excalRed.withValues(alpha: 0.1) : AppTheme.cardSurface,
                          strokeWidth: _eraserMode ? 1.8 : 1.4,
                          cornerRadius: 10,
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                          withShadow: false,
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(CupertinoIcons.clear_thick, size: 14, color: _eraserMode ? AppTheme.excalRed : AppTheme.ink),
                              const SizedBox(width: 4),
                              Text('橡皮擦', style: SketchFonts.body(size: 12, color: _eraserMode ? AppTheme.excalRed : AppTheme.ink, weight: FontWeight.w600)),
                            ],
                          ),
                        ),
                      ),
                      const Spacer(),
                      // 粗细
                      Row(
                        children: [
                          Text('粗细', style: SketchFonts.body(size: 12, color: AppTheme.secondaryText, weight: FontWeight.w600)),
                          const SizedBox(width: 8),
                          GestureDetector(
                            onTap: () => setState(() => _currentSize = (_currentSize - 1).clamp(1.0, 12.0)),
                            child: const Icon(CupertinoIcons.minus_circle, size: 20, color: AppTheme.ink),
                          ),
                          const SizedBox(width: 8),
                          SizedBox(
                            width: 28,
                            child: Center(
                              child: Text('${_currentSize.toStringAsFixed(0)}', style: SketchFonts.numeric(size: 14, color: AppTheme.ink)),
                            ),
                          ),
                          const SizedBox(width: 8),
                          GestureDetector(
                            onTap: () => setState(() => _currentSize = (_currentSize + 1).clamp(1.0, 12.0)),
                            child: const Icon(CupertinoIcons.plus_circle, size: 20, color: AppTheme.ink),
                          ),
                        ],
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ColorDot extends StatelessWidget {
  final Color color;
  final bool selected;
  final int seed;

  const _ColorDot({required this.color, required this.selected, required this.seed});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 32,
      height: 32,
      child: Stack(
        alignment: Alignment.center,
        children: [
          CustomPaint(
            painter: _ColorDotPainter(
              color: color,
              selected: selected,
              seed: seed,
            ),
            size: const Size(32, 32),
          ),
          if (selected)
            const Icon(CupertinoIcons.check_mark, size: 14, color: Color(0xFFFFFEF7)),
        ],
      ),
    );
  }
}

class _ColorDotPainter extends CustomPainter {
  final Color color;
  final bool selected;
  final int seed;

  _ColorDotPainter({required this.color, required this.selected, required this.seed});

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2 - 3;
    final rng = math.Random(seed);

    // 填充
    final fillPaint = Paint()..color = color..style = PaintingStyle.fill;
    final fillPath = Path();
    final segs = 30;
    for (int i = 0; i <= segs; i++) {
      final a = (i / segs) * math.pi * 2;
      final r = radius + (rng.nextDouble() - 0.5) * 0.8;
      final x = center.dx + r * math.cos(a);
      final y = center.dy + r * math.sin(a);
      if (i == 0) {
        fillPath.moveTo(x, y);
      } else {
        fillPath.lineTo(x, y);
      }
    }
    canvas.drawPath(fillPath, fillPaint);

    // 边框
    if (selected) {
      final borderPaint = Paint()
        ..color = const Color(0xFFFFFEF7)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 2.0
        ..strokeCap = StrokeCap.round;
      canvas.drawPath(fillPath, borderPaint);
    }
  }

  @override
  bool shouldRepaint(covariant _ColorDotPainter old) =>
      old.color != color || old.selected != selected || old.seed != seed;
}

/// 一条完整笔触
class _Stroke {
  final List<PointVector> points;
  final Color color;
  final double size;
  final bool isEraser;

  const _Stroke({
    required this.points,
    required this.color,
    required this.size,
    this.isEraser = false,
  });
}

/// 画板绘制器
class _SketchpadPainter extends CustomPainter {
  final List<_Stroke> strokes;
  final List<PointVector> currentPoints;
  final Color currentColor;
  final double currentSize;

  _SketchpadPainter({
    required this.strokes,
    required this.currentPoints,
    required this.currentColor,
    required this.currentSize,
  });

  @override
  void paint(Canvas canvas, Size size) {
    // 绘制已完成笔触
    for (final stroke in strokes) {
      _drawStroke(
        canvas,
        stroke.points,
        stroke.color,
        stroke.size,
        stroke.isEraser,
        isComplete: true,
      );
    }
    // 绘制当前正在画的笔触
    if (currentPoints.isNotEmpty) {
      _drawStroke(
        canvas,
        currentPoints,
        currentColor,
        currentSize,
        false,
        isComplete: false,
      );
    }
  }

  void _drawStroke(
    Canvas canvas,
    List<PointVector> points,
    Color color,
    double size,
    bool isEraser, {
    required bool isComplete,
  }) {
    if (points.isEmpty) return;
    // 使用 perfect_freehand 算法生成笔触轮廓
    final outline = getStroke(
      points,
      options: StrokeOptions(
        size: size,
        thinning: 0.6,
        smoothing: 0.5,
        streamline: 0.5,
        simulatePressure: false,
        start: StrokeEndOptions.start(cap: true),
        end: StrokeEndOptions.end(cap: true),
        isComplete: isComplete,
      ),
    );

    if (outline.isEmpty) return;

    // 转成 Path
    final path = Path();
    path.moveTo(outline.first.dx, outline.first.dy);
    for (int i = 1; i < outline.length; i++) {
      path.lineTo(outline[i].dx, outline[i].dy);
    }
    path.close();

    if (isEraser) {
      // 橡皮擦：用 BlendMode.clear 抹除
      canvas.saveLayer(Offset.zero & Size.infinite, Paint());
      canvas.drawPath(path, Paint()..blendMode = BlendMode.clear);
      canvas.restore();
    } else {
      canvas.drawPath(path, Paint()..color = color..style = PaintingStyle.fill);
    }
  }

  @override
  bool shouldRepaint(covariant _SketchpadPainter old) =>
      old.strokes != strokes ||
      old.currentPoints != currentPoints ||
      old.currentColor != currentColor ||
      old.currentSize != currentSize;
}
