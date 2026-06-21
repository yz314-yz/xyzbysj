import 'package:flutter/cupertino.dart';
import 'package:jetlag_sync/theme/app_theme.dart';
import 'package:jetlag_sync/views/vibe_check/vibe_check_view.dart';

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
          child: Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(color: AppTheme.cardSurface, borderRadius: BorderRadius.circular(12)),
            child: const Icon(CupertinoIcons.bell_fill, size: 16, color: AppTheme.primaryText),
          ),
        ),
        middle: const Text('时差修复局', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
      ),
      child: SafeArea(
        child: CustomScrollView(
          slivers: [
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(24, 20, 24, 0),
                child: _buildHero(context),
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(24, 16, 24, 0),
                child: Row(
                  children: [
                    Expanded(child: _quickCard('望诊', 'AI 面诊分析', CupertinoIcons.eye_fill, const Color(0xFFDC2626), () {})),
                    const SizedBox(width: 10),
                    Expanded(child: _quickCard('今日', '节律建议', CupertinoIcons.calendar, const Color(0xFF7C3AED), () {})),
                  ],
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(24, 10, 24, 0),
                child: Row(
                  children: [
                    Expanded(child: _quickCard('经络', '子午流注', CupertinoIcons.circle_grid_hex_fill, AppTheme.sage, () {})),
                    const SizedBox(width: 10),
                    Expanded(child: _quickCard('环境', '健康雷达', CupertinoIcons.cloud_fill, const Color(0xFF0EA5E9), () {})),
                  ],
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(24, 24, 24, 0),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: const [
                    Text('今日健康指标', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
                    Text('查看详情', style: TextStyle(fontSize: 12, color: AppTheme.secondaryText, fontWeight: FontWeight.w600)),
                  ],
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(24, 12, 24, 0),
                child: _buildHealthMetrics(),
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(24, 20, 24, 0),
                child: Container(
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: AppTheme.deepSpace,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: const [
                          Text('生物钟状态', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: CupertinoColors.white)),
                          Text('滞后 3 小时', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppTheme.amber)),
                        ],
                      ),
                      const SizedBox(height: 12),
                      const Text('你的入睡时间较标准值晚约 3 小时，建议今晚 22:30 前进入睡眠状态', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: CupertinoColors.systemGrey, height: 1.4)),
                      const SizedBox(height: 16),
                      Container(
                        height: 4,
                        decoration: BoxDecoration(color: const Color(0xFF1E293B), borderRadius: BorderRadius.circular(2)),
                        child: LayoutBuilder(
                          builder: (context, constraints) => Stack(
                            children: [
                              Container(
                                width: constraints.maxWidth * 0.4,
                                decoration: BoxDecoration(
                                  gradient: const LinearGradient(colors: [Color(0xFFDC2626), Color(0xFFFBBF24)]),
                                  borderRadius: BorderRadius.circular(2),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(24, 20, 24, 0),
                child: _buildRhythmTimeline(),
              ),
            ),
            const SliverFillRemaining(hasScrollBody: false, child: SizedBox(height: 36)),
          ],
        ),
      ),
    );
  }

  Widget _buildHero(BuildContext context) {
    return GestureDetector(
      onTap: () {
        Navigator.of(context, rootNavigator: true).push(CupertinoPageRoute(builder: (context) => const VibeCheckView()));
      },
      child: Container(
        padding: const EdgeInsets.all(22),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [const Color(0xFF0EA5E9), AppTheme.sage],
          ),
          borderRadius: BorderRadius.circular(24),
          boxShadow: [BoxShadow(color: AppTheme.sage.withValues(alpha: 0.2), blurRadius: 24, offset: const Offset(0, 10))],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
              decoration: BoxDecoration(color: CupertinoColors.white.withValues(alpha: 0.18), borderRadius: BorderRadius.circular(8)),
              child: const Text('VIBE CHECK', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: CupertinoColors.white, letterSpacing: 0.15)),
            ),
            const SizedBox(height: 14),
            const Text('AI 望诊', style: TextStyle(fontSize: 28, fontWeight: FontWeight.w800, color: CupertinoColors.white, letterSpacing: -0.02)),
            const SizedBox(height: 2),
            const Text('面色 · 舌象 · 精气神', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: CupertinoColors.white, letterSpacing: -0.01)),
            const SizedBox(height: 16),
            Row(
              children: const [
                Text('立即开始', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: CupertinoColors.white)),
                SizedBox(width: 4),
                Icon(CupertinoIcons.arrow_right, size: 14, color: CupertinoColors.white),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _quickCard(String title, String subtitle, IconData icon, Color color, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppTheme.cardSurface,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(color: color.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(10)),
              child: Icon(icon, size: 16, color: color),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 2),
                  Text(subtitle, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w500, color: AppTheme.secondaryText)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHealthMetrics() {
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(color: AppTheme.cardSurface, borderRadius: BorderRadius.circular(20)),
      child: Column(
        children: [
          _metricRow('气血状态', '72 分', 0.72, const Color(0xFFDC2626)),
          _metricRow('津液水平', '58 分', 0.58, const Color(0xFFE8853A)),
          _metricRow('精神指数', '65 分', 0.65, const Color(0xFF7C3AED)),
          _metricRow('肾精储备', '70 分', 0.70, AppTheme.sage, isLast: true),
        ],
      ),
    );
  }

  Widget _metricRow(String label, String value, double progress, Color color, {bool isLast = false}) {
    return Padding(
      padding: EdgeInsets.fromLTRB(14, 12, 14, isLast ? 12 : 0),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(label, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
              Text(value, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: color)),
            ],
          ),
          const SizedBox(height: 8),
          Container(
            height: 4,
            decoration: BoxDecoration(color: AppTheme.outlineVariant, borderRadius: BorderRadius.circular(2)),
            child: LayoutBuilder(
              builder: (context, constraints) => Stack(
                children: [
                  Container(
                    width: constraints.maxWidth * progress,
                    decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(2)),
                  ),
                ],
              ),
            ),
          ),
          if (!isLast) const SizedBox(height: 4),
        ],
      ),
    );
  }

  Widget _buildRhythmTimeline() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('今日节律时刻', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
        const SizedBox(height: 12),
        ...[
          {'time': '11:00-13:00', 'name': '心经 · 午时', 'desc': '宜小憩 20 分钟，养心安神', 'color': const Color(0xFFDC2626)},
          {'time': '13:00-15:00', 'name': '小肠经 · 未时', 'desc': '午餐吸收黄金期，八分饱', 'color': const Color(0xFFD97706)},
          {'time': '15:00-17:00', 'name': '膀胱经 · 申时', 'desc': '多喝水，促进排毒', 'color': const Color(0xFF0EA5E9)},
        ].map((item) => Container(
          margin: const EdgeInsets.only(bottom: 8),
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: AppTheme.cardSurface,
            borderRadius: BorderRadius.circular(14),
          ),
          child: Row(
            children: [
              Container(
                width: 6,
                height: 60,
                decoration: BoxDecoration(
                  color: item['color'] as Color,
                  borderRadius: BorderRadius.circular(3),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(item['time'] as String, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: item['color'] as Color, letterSpacing: 0.05)),
                    const SizedBox(height: 4),
                    Text(item['name'] as String, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
                    const SizedBox(height: 4),
                    Text(item['desc'] as String, style: const TextStyle(fontSize: 11, color: AppTheme.secondaryText)),
                  ],
                ),
              ),
            ],
          ),
        )),
      ],
    );
  }
}
