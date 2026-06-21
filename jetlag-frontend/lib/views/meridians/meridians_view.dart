import 'package:flutter/cupertino.dart';
import 'package:jetlag_sync/theme/app_theme.dart';

class _Meridian {
  final String name;
  final String shichen;
  final String time;
  final String organ;
  final Color color;
  final String advice;

  const _Meridian({
    required this.name,
    required this.shichen,
    required this.time,
    required this.organ,
    required this.color,
    required this.advice,
  });
}

const List<_Meridian> _meridians = [
  _Meridian(name: '胆经', shichen: '子时', time: '23:00-01:00', organ: '胆', color: Color(0xFF1E40AF), advice: '必须熟睡，不可熬夜。此时胆经排毒，熬夜则胆汁分泌紊乱'),
  _Meridian(name: '肝经', shichen: '丑时', time: '01:00-03:00', organ: '肝', color: Color(0xFF059669), advice: '深眠养肝血。此时肝经当令，肝脏解毒代谢最旺盛'),
  _Meridian(name: '肺经', shichen: '寅时', time: '03:00-05:00', organ: '肺', color: Color(0xFFE0E7FF), advice: '熟睡让气血归于肺经。此时肺气血重新分布，为天亮做准备'),
  _Meridian(name: '大肠经', shichen: '卯时', time: '05:00-07:00', organ: '大肠', color: Color(0xFFD97706), advice: '宜起床排便。此时大肠蠕动旺盛，早餐前一杯温水助排便'),
  _Meridian(name: '胃经', shichen: '辰时', time: '07:00-09:00', organ: '胃', color: Color(0xFFE8853A), advice: '必须吃早餐。此时胃气最旺，宜温热食物忌生冷'),
  _Meridian(name: '脾经', shichen: '巳时', time: '09:00-11:00', organ: '脾', color: Color(0xFFFBBF24), advice: '宜工作学习。此时脾运化能力强，思考效率最高'),
  _Meridian(name: '心经', shichen: '午时', time: '11:00-13:00', organ: '心', color: Color(0xFFDC2626), advice: '务必小憩 20 分钟。此时心经当令，午休养心安神'),
  _Meridian(name: '小肠经', shichen: '未时', time: '13:00-15:00', organ: '小肠', color: Color(0xFFB45309), advice: '午餐营养吸收高峰期。避免暴食暴饮，八分饱为宜'),
  _Meridian(name: '膀胱经', shichen: '申时', time: '15:00-17:00', organ: '膀胱', color: Color(0xFF0EA5E9), advice: '多喝水。此时膀胱经当令，是排毒泄热的最佳时机'),
  _Meridian(name: '肾经', shichen: '酉时', time: '17:00-19:00', organ: '肾', color: Color(0xFF7C3AED), advice: '宜休息养阴。此时肾气收藏，不宜剧烈运动和熬夜'),
  _Meridian(name: '心包经', shichen: '戌时', time: '19:00-21:00', organ: '心包', color: Color(0xFFF472B6), advice: '宜放松娱乐。此时心包护心，适宜散步聊天、轻音乐'),
  _Meridian(name: '三焦经', shichen: '亥时', time: '21:00-23:00', organ: '三焦', color: Color(0xFF334155), advice: '宜准备入睡。此时百脉休息，放下手机，温水泡脚助眠'),
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
        middle: const Column(
          children: [
            Text('子午流注', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
            SizedBox(height: 2),
            Text('12 MERIDIANS', style: TextStyle(fontSize: 9, fontWeight: FontWeight.w700, color: AppTheme.sage, letterSpacing: 0.15)),
          ],
        ),
      ),
      child: SafeArea(
        child: CustomScrollView(
          slivers: [
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(24, 16, 24, 0),
                child: Container(
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [AppTheme.deepSpace, const Color(0xFF1E293B)],
                    ),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(color: AppTheme.sage.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(12)),
                        child: const Icon(CupertinoIcons.clock_fill, size: 22, color: AppTheme.sage),
                      ),
                      const SizedBox(width: 14),
                      const Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('循经调理原则', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: CupertinoColors.white)),
                            SizedBox(height: 4),
                            Text('按时辰调理对应经络，事半功倍', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w500, color: CupertinoColors.systemGrey)),
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
                padding: const EdgeInsets.fromLTRB(24, 20, 24, 0),
                child: Row(
                  children: const [
                    Icon(CupertinoIcons.sparkles, size: 16, color: AppTheme.sage),
                    SizedBox(width: 6),
                    Text('十二时辰经络图', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
                  ],
                ),
              ),
            ),
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(24, 12, 24, 36),
              sliver: SliverGrid(
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  mainAxisSpacing: 12,
                  crossAxisSpacing: 12,
                  childAspectRatio: 1.0,
                ),
                delegate: SliverChildBuilderDelegate(
                  (context, index) {
                    final m = _meridians[index];
                    return Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: AppTheme.cardSurface,
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Container(
                                width: 8,
                                height: 8,
                                decoration: BoxDecoration(color: m.color, shape: BoxShape.circle),
                              ),
                              const SizedBox(width: 6),
                              Text(m.shichen, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppTheme.secondaryText)),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Text(m.name, style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: m.color, letterSpacing: -0.01)),
                          const SizedBox(height: 2),
                          Text(m.time, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppTheme.secondaryText)),
                          const SizedBox(height: 8),
                          Text(
                            m.advice,
                            maxLines: 4,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(fontSize: 11, height: 1.4, color: AppTheme.primaryText),
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
