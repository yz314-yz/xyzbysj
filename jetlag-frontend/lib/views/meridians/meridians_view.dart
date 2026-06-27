import 'package:flutter/cupertino.dart';
import 'package:jetlag_sync/theme/app_theme.dart';
import 'package:jetlag_sync/widgets/sketch/sketch_widgets.dart';

class _Meridian {
  final String name;
  final String shichen;
  final String time;
  final String organ;
  final Color color;
  final String advice;
  final String emoji;

  const _Meridian({
    required this.name,
    required this.shichen,
    required this.time,
    required this.organ,
    required this.color,
    required this.advice,
    required this.emoji,
  });
}

const List<_Meridian> _meridians = [
  _Meridian(name: '胆经', shichen: '子时', time: '23:00-01:00', organ: '胆', color: Color(0xFF1971C2), advice: '必须熟睡，不可熬夜。胆经排毒，熬夜则胆汁分泌紊乱', emoji: '🦉'),
  _Meridian(name: '肝经', shichen: '丑时', time: '01:00-03:00', organ: '肝', color: Color(0xFF2F9E44), advice: '深眠养肝血。肝经当令，肝脏解毒代谢最旺盛', emoji: '🌿'),
  _Meridian(name: '肺经', shichen: '寅时', time: '03:00-05:00', organ: '肺', color: Color(0xFF0C8599), advice: '熟睡让气血归于肺经。肺气血重新分布，为天亮做准备', emoji: '💨'),
  _Meridian(name: '大肠经', shichen: '卯时', time: '05:00-07:00', organ: '大肠', color: Color(0xFFF08C00), advice: '宜起床排便。大肠蠕动旺盛，早餐前一杯温水助排便', emoji: '🌅'),
  _Meridian(name: '胃经', shichen: '辰时', time: '07:00-09:00', organ: '胃', color: Color(0xFFE67700), advice: '必须吃早餐。胃气最旺，宜温热食物忌生冷', emoji: '🍚'),
  _Meridian(name: '脾经', shichen: '巳时', time: '09:00-11:00', organ: '脾', color: Color(0xFFE03131), advice: '宜工作学习。脾运化能力强，思考效率最高', emoji: '🧠'),
  _Meridian(name: '心经', shichen: '午时', time: '11:00-13:00', organ: '心', color: Color(0xFFC2255C), advice: '务必小憩 20 分钟。心经当令，午休养心安神', emoji: '❤️'),
  _Meridian(name: '小肠经', shichen: '未时', time: '13:00-15:00', organ: '小肠', color: Color(0xFF8B5E3C), advice: '午餐营养吸收高峰期。避免暴食暴饮，八分饱为宜', emoji: '🍲'),
  _Meridian(name: '膀胱经', shichen: '申时', time: '15:00-17:00', organ: '膀胱', color: Color(0xFF1971C2), advice: '多喝水。膀胱经当令，是排毒泄热的最佳时机', emoji: '💧'),
  _Meridian(name: '肾经', shichen: '酉时', time: '17:00-19:00', organ: '肾', color: Color(0xFF6741D9), advice: '宜休息养阴。肾气收藏，不宜剧烈运动和熬夜', emoji: '🫘'),
  _Meridian(name: '心包经', shichen: '戌时', time: '19:00-21:00', organ: '心包', color: Color(0xFFC2255C), advice: '宜放松娱乐。心包护心，适宜散步聊天、轻音乐', emoji: '🎵'),
  _Meridian(name: '三焦经', shichen: '亥时', time: '21:00-23:00', organ: '三焦', color: Color(0xFF1E1E1E), advice: '宜准备入睡。百脉休息，放下手机，温水泡脚助眠', emoji: '🌙'),
];

class MeridiansView extends StatelessWidget {
  const MeridiansView({super.key});

  @override
  Widget build(BuildContext context) {
    return CupertinoPageScaffold(
      backgroundColor: AppTheme.surface,
      navigationBar: CupertinoNavigationBar(
        backgroundColor: AppTheme.surface,
        border: null,
        middle: Column(
          children: [
            Text('子午流注', style: SketchFonts.title(size: 22, color: AppTheme.ink)),
            const SizedBox(height: 2),
            Text('12 MERIDIANS', style: SketchFonts.tag(size: 9, color: AppTheme.excalGreen, letterSpacing: 0.3)),
          ],
        ),
      ),
      child: SafeArea(
        child: CustomScrollView(
          slivers: [
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
                child: SketchCard(
                  seed: 700,
                  borderColor: AppTheme.deepSpace,
                  fillColor: AppTheme.deepSpace,
                  padding: const EdgeInsets.all(18),
                  cornerRadius: 16,
                  strokeWidth: 1.5,
                  withShadow: false,
                  child: Row(
                    children: [
                      SketchBadge(emoji: '☯', color: AppTheme.excalGreen, size: 48, seed: 701),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('循经调理原则', style: SketchFonts.title(size: 18, color: const Color(0xFFFFFEF7))),
                            const SizedBox(height: 4),
                            Text('按时辰调理对应经络，事半功倍', style: SketchFonts.body(size: 12, color: const Color(0xFFD8D8D8))),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 22, 20, 0),
                child: Row(
                  children: [
                    SketchBadge(emoji: '✦', color: AppTheme.excalGreen, size: 22, seed: 702),
                    const SizedBox(width: 8),
                    Text('十二时辰经络图', style: SketchFonts.title(size: 20, color: AppTheme.ink)),
                  ],
                ),
              ),
            ),
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 36),
              sliver: SliverGrid(
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  mainAxisSpacing: 12,
                  crossAxisSpacing: 12,
                  childAspectRatio: 0.92,
                ),
                delegate: SliverChildBuilderDelegate(
                  (context, index) {
                    final m = _meridians[index];
                    return SketchCard(
                      seed: 800 + index,
                      borderColor: m.color,
                      fillColor: AppTheme.cardSurface,
                      padding: const EdgeInsets.all(14),
                      cornerRadius: 14,
                      strokeWidth: 1.5,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              SketchBadge(emoji: m.emoji, color: m.color, size: 30, seed: 900 + index),
                              const Spacer(),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(
                                  color: m.color.withValues(alpha: 0.12),
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: Text(m.shichen, style: SketchFonts.tag(size: 10, color: m.color, letterSpacing: 0.2)),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Text(m.name, style: SketchFonts.title(size: 22, color: m.color)),
                          const SizedBox(height: 2),
                          Text(m.time, style: SketchFonts.body(size: 12, color: AppTheme.secondaryText, weight: FontWeight.w600)),
                          const SizedBox(height: 6),
                          Text(
                            m.advice,
                            maxLines: 4,
                            overflow: TextOverflow.ellipsis,
                            style: SketchFonts.body(size: 12, color: AppTheme.ink, height: 1.4),
                          ),
                        ],
                      ),
                    );
                  },
                  childCount: _meridians.length,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
