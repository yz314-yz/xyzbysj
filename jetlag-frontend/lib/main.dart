import 'package:flutter/cupertino.dart';
import 'package:provider/provider.dart';
import 'package:jetlag_sync/views/dashboard/dashboard_view.dart';
import 'package:jetlag_sync/views/vibe_check/vibe_check_view.dart';
import 'package:jetlag_sync/views/environment/environment_view.dart';
import 'package:jetlag_sync/views/meridians/meridians_view.dart';
import 'package:jetlag_sync/views/sync_blueprint/sync_blueprint_view.dart';
import 'package:jetlag_sync/services/api_service.dart';
import 'package:jetlag_sync/theme/app_theme.dart';

void main() {
  runApp(
    Provider<ApiService>(
      create: (_) => ApiService(
        baseUrl: 'http://localhost:3000',
      ),
      child: const JetLagSyncApp(),
    ),
  );
}

class JetLagSyncApp extends StatelessWidget {
  const JetLagSyncApp({super.key});

  @override
  Widget build(BuildContext context) {
    return CupertinoApp(
      title: '时差修复局',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.build(),
      home: const RootTabView(),
    );
  }
}

class RootTabView extends StatelessWidget {
  const RootTabView({super.key});

  @override
  Widget build(BuildContext context) {
    return CupertinoTabScaffold(
      tabBar: CupertinoTabBar(
        backgroundColor: AppTheme.surface.withValues(alpha: 0.92),
        activeColor: AppTheme.primaryText,
        inactiveColor: AppTheme.secondaryText.withValues(alpha: 0.5),
        border: Border(
          top: BorderSide(color: AppTheme.outlineVariant, width: 0.5),
        ),
        items: const [
          BottomNavigationBarItem(
            icon: Icon(CupertinoIcons.home, size: 22),
            activeIcon: Icon(CupertinoIcons.home, size: 22),
            label: '首页',
          ),
          BottomNavigationBarItem(
            icon: Icon(CupertinoIcons.eye_fill, size: 22),
            activeIcon: Icon(CupertinoIcons.eye_fill, size: 22),
            label: 'Vibe Check',
          ),
          BottomNavigationBarItem(
            icon: Icon(CupertinoIcons.cloud_fill, size: 22),
            activeIcon: Icon(CupertinoIcons.cloud_fill, size: 22),
            label: '环境',
          ),
          BottomNavigationBarItem(
            icon: Icon(CupertinoIcons.circle_grid_hex_fill, size: 22),
            activeIcon: Icon(CupertinoIcons.circle_grid_hex_fill, size: 22),
            label: '经络',
          ),
          BottomNavigationBarItem(
            icon: Icon(CupertinoIcons.doc_text_fill, size: 22),
            activeIcon: Icon(CupertinoIcons.doc_text_fill, size: 22),
            label: '蓝图',
          ),
        ],
      ),
      tabBuilder: (context, index) {
        switch (index) {
          case 0:
            return CupertinoTabView(builder: (context) => const DashboardView());
          case 1:
            return CupertinoTabView(builder: (context) => const VibeCheckView());
          case 2:
            return CupertinoTabView(builder: (context) => const EnvironmentView());
          case 3:
            return CupertinoTabView(builder: (context) => const MeridiansView());
          case 4:
            return CupertinoTabView(
              builder: (context) => SyncBlueprintView(
                blueprint: _demoBlueprint,
              ),
            );
          default:
            return CupertinoTabView(builder: (context) => const DashboardView());
        }
      },
    );
  }
}

const String _demoBlueprint = '''
# 1. 望诊分析

## 面象诊断
面色潮红、额部泛油光、眼下青黑——典型阴虚火旺、虚火上炎之象。熬夜损耗津液，面部失去滋养。

## 舌象诊断
舌红少苔、舌尖散布红点、舌根轻微黄腻——心火偏亢兼肾阴不足，熬夜劳心兼湿热下注。

## 精气神评估
精亏（中度）：注意力不集中、腰膝酸软
气虚（轻度）：说话无力、易倦怠
神散（中度）：情绪焦虑、入睡困难
火旺（显著）：口干舌燥、眼睛干涩、爆痘

# 2. 熬夜伤损判定
- **主导伤损**：伤津耗液 + 伤心神
- **兼夹伤损**：伤气血、伤精

# 3. 熬夜紧急补救方案

## 🌙 凌晨继续熬夜
- **每 45 分钟起身活动 3 分钟**：促进气血循环，避免久坐伤气
- **饮用枸杞麦冬泡水（温）**：滋阴润燥，缓解口干
- **按揉合谷 + 内关穴**：各 1 分钟，降火宁心
- **避免甜食咖啡**：加重湿热与心火

## 😴 准备强行入睡
- **22:00-22:30 为最佳入睡窗口**
- **睡前 30 分钟远离屏幕**：减少蓝光刺激褪黑素分泌
- **泡脚 10 分钟（40°C温水）**：引火下行，安神助眠
- **按揉三阴交 + 涌泉**：各 3 分钟，补肾养阴

## ☀️ 次日早晨
- **7:00 起床后晒太阳 10 分钟**：重置生物钟，提升阳气
- **早餐：小米粥 + 红枣 + 鸡蛋**：益气健脾，温补不燥
- **午休 20 分钟（12:30-13:00）**：补心安神，补充精力

## 🧘 日常经络调理
- **敲胆经（大腿外侧）**：每侧 5 分钟，疏通胆气
- **按揉太溪 + 复溜**：补肾养阴，每日各 2 分钟
- **艾灸足三里**：每周 2 次，健脾益气

# 4. 今夜复位窗口
- **推荐睡眠时间：22:00 - 06:00（8 小时）**
- **子午流注原理**：23:00-01:00 胆经当令需熟睡，01:00-03:00 肝经当令宜深眠
- **褪黑素节律**：21:00 后光线变暗开始分泌，23:00 达到高峰，确保此时入眠质量最高
''';
