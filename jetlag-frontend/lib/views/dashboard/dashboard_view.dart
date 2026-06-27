import 'package:flutter/cupertino.dart';
import 'package:jetlag_sync/theme/app_theme.dart';
import 'package:jetlag_sync/views/vibe_check/vibe_check_view.dart';
import 'package:jetlag_sync/widgets/sketch/sketch_widgets.dart';

class DashboardView extends StatelessWidget {
  const DashboardView({super.key});

  @override
  Widget build(BuildContext context) {
    return CupertinoPageScaffold(
      backgroundColor: AppTheme.surface,
      navigationBar: CupertinoNavigationBar(
        backgroundColor: AppTheme.surface,
        border: null,
        trailing: CupertinoButton(
          padding: EdgeInsets.zero,
          onPressed: () {},
          child: const Icon(CupertinoIcons.bell, size: 20, color: AppTheme.ink),
        ),
        middle: Text('时差修复局', style: SketchFonts.title(size: 22, color: AppTheme.ink)),
      ),
      child: SafeArea(
        child: CustomScrollView(
          slivers: [
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
                child: _buildHero(context),
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 18, 20, 0),
                child: Row(
                  children: [
                    Expanded(child: _quickCard('望诊', 'AI 面诊', '👁', AppTheme.excalRed, 1, () {})),
                    const SizedBox(width: 10),
                    Expanded(child: _quickCard('今日', '节律建议', '📅', AppTheme.excalViolet, 2, () {})),
                  ],
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 10, 20, 0),
                child: Row(
                  children: [
                    Expanded(child: _quickCard('经络', '子午流注', '☯', AppTheme.excalGreen, 3, () {})),
                    const SizedBox(width: 10),
                    Expanded(child: _quickCard('环境', '健康雷达', '☁️', AppTheme.excalBlue, 4, () {})),
                  ],
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 24, 20, 0),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text('今日健康指标', style: SketchFonts.title(size: 20, color: AppTheme.ink)),
                    const SizedBox(width: 8),
                    Padding(
                      padding: const EdgeInsets.only(bottom: 4),
                      child: Text('~ sketch by JetLag', style: SketchFonts.tag(size: 11, color: AppTheme.secondaryText)),
                    ),
                  ],
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
                child: _buildHealthMetrics(),
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 18, 20, 0),
                child: _buildBioClock(),
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
                child: _buildRhythmTimeline(),
              ),
            ),
            const SliverFillRemaining(hasScrollBody: false, child: SizedBox(height: 36)),
          ],
        ),
      ),
    );
  }

  /// Hero 卡片：Excalidraw 风格的涂鸦式入口
  Widget _buildHero(BuildContext context) {
    return GestureDetector(
      onTap: () {
        Navigator.of(context, rootNavigator: true).push(
          CupertinoPageRoute(builder: (context) => const VibeCheckView()),
        );
      },
      child: SketchCard(
        seed: 7,
        borderColor: AppTheme.excalBlue,
        fillColor: const Color(0xFFFFFEF7),
        padding: const EdgeInsets.all(22),
        cornerRadius: 18,
        strokeWidth: 1.8,
        child: Stack(
          children: [
            // 右上角手绘小太阳
            Positioned(
              right: 0,
              top: 0,
              child: SketchBadge(emoji: '☀️', color: AppTheme.excalOrange, size: 40, seed: 11),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppTheme.excalBlue.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    'VIBE CHECK',
                    style: SketchFonts.tag(size: 10, color: AppTheme.excalBlue, letterSpacing: 0.5),
                  ),
                ),
                const SizedBox(height: 14),
                Text('AI 望诊', style: SketchFonts.title(size: 32, color: AppTheme.ink)),
                const SizedBox(height: 4),
                Text('面色 · 舌象 · 精气神', style: SketchFonts.body(size: 15, color: AppTheme.secondaryText)),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Text('立即开始', style: SketchFonts.body(size: 14, color: AppTheme.excalBlue, weight: FontWeight.w700)),
                    const SizedBox(width: 6),
                    const Icon(CupertinoIcons.arrow_right, size: 14, color: AppTheme.excalBlue),
                  ],
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _quickCard(String title, String subtitle, String emoji, Color color, int seed, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: SketchCard(
        seed: seed,
        borderColor: color,
        fillColor: AppTheme.cardSurface,
        padding: const EdgeInsets.all(14),
        cornerRadius: 14,
        strokeWidth: 1.5,
        child: Row(
          children: [
            SketchBadge(emoji: emoji, color: color, size: 36, seed: seed + 20),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: SketchFonts.title(size: 18, color: AppTheme.ink)),
                  const SizedBox(height: 2),
                  Text(subtitle, style: SketchFonts.body(size: 12, color: AppTheme.secondaryText)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHealthMetrics() {
    return SketchCard(
      seed: 21,
      borderColor: AppTheme.ink,
      fillColor: AppTheme.cardSurface,
      padding: const EdgeInsets.all(16),
      cornerRadius: 16,
      strokeWidth: 1.5,
      child: Column(
        children: [
          _metricRow('气血状态', '72 分', 0.72, AppTheme.excalRed, 31),
          const _SketchMiniDivider(),
          _metricRow('津液水平', '58 分', 0.58, AppTheme.excalOrange, 32),
          const _SketchMiniDivider(),
          _metricRow('精神指数', '65 分', 0.65, AppTheme.excalViolet, 33),
          const _SketchMiniDivider(),
          _metricRow('肾精储备', '70 分', 0.70, AppTheme.excalGreen, 34),
        ],
      ),
    );
  }

  Widget _metricRow(String label, String value, double progress, Color color, int seed) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(label, style: SketchFonts.body(size: 14, color: AppTheme.ink, weight: FontWeight.w600)),
              Text(value, style: SketchFonts.numeric(size: 18, color: color)),
            ],
          ),
          const SizedBox(height: 6),
          SketchProgress(value: progress, color: color, seed: seed, height: 12),
        ],
      ),
    );
  }

  /// 生物钟状态：黑板色卡片（手绘粉笔感）
  Widget _buildBioClock() {
    return SketchCard(
      seed: 41,
      borderColor: AppTheme.deepSpace,
      fillColor: AppTheme.deepSpace,
      padding: const EdgeInsets.all(18),
      cornerRadius: 16,
      strokeWidth: 1.5,
      withShadow: false,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('生物钟状态', style: SketchFonts.title(size: 18, color: const Color(0xFFFFFEF7))),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: AppTheme.excalOrange.withValues(alpha: 0.18),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text('滞后 3 小时', style: SketchFonts.body(size: 12, color: AppTheme.excalOrange, weight: FontWeight.w700)),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            '你的入睡时间较标准值晚约 3 小时，建议今晚 22:30 前进入睡眠状态',
            style: SketchFonts.body(size: 13, color: const Color(0xFFD8D8D8)),
          ),
          const SizedBox(height: 16),
          // 手绘粉笔风格进度条
          SketchProgress(
            value: 0.4,
            color: AppTheme.excalOrange,
            seed: 42,
            height: 14,
          ),
        ],
      ),
    );
  }

  Widget _buildRhythmTimeline() {
    final items = [
      {'time': '11:00-13:00', 'name': '心经 · 午时', 'desc': '宜小憩 20 分钟，养心安神', 'emoji': '🌞', 'color': AppTheme.excalRed, 'seed': 51},
      {'time': '13:00-15:00', 'name': '小肠经 · 未时', 'desc': '午餐吸收黄金期，八分饱', 'emoji': '🍚', 'color': AppTheme.excalOrange, 'seed': 52},
      {'time': '15:00-17:00', 'name': '膀胱经 · 申时', 'desc': '多喝水，促进排毒', 'emoji': '💧', 'color': AppTheme.excalBlue, 'seed': 53},
    ];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('今日节律时刻', style: SketchFonts.title(size: 20, color: AppTheme.ink)),
        const SizedBox(height: 12),
        ...items.map((item) => Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: SketchCard(
                seed: item['seed'] as int,
                borderColor: item['color'] as Color,
                fillColor: AppTheme.cardSurface,
                padding: const EdgeInsets.all(14),
                cornerRadius: 14,
                strokeWidth: 1.5,
                child: Row(
                  children: [
                    SketchBadge(
                      emoji: item['emoji'] as String,
                      color: item['color'] as Color,
                      size: 42,
                      seed: (item['seed'] as int) + 5,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            item['time'] as String,
                            style: SketchFonts.tag(size: 10, color: item['color'] as Color, letterSpacing: 0.3),
                          ),
                          const SizedBox(height: 2),
                          Text(item['name'] as String, style: SketchFonts.title(size: 18, color: AppTheme.ink)),
                          const SizedBox(height: 2),
                          Text(item['desc'] as String, style: SketchFonts.body(size: 12, color: AppTheme.secondaryText)),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            )),
      ],
    );
  }
}

class _SketchMiniDivider extends StatelessWidget {
  const _SketchMiniDivider();

  @override
  Widget build(BuildContext context) {
    return const Padding(
      padding: EdgeInsets.symmetric(vertical: 4),
      child: SketchDivider(color: Color(0xFFE8DEC6), height: 8, seed: 99, strokeWidth: 1.0),
    );
  }
}
