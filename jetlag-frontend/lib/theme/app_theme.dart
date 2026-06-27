import 'package:flutter/cupertino.dart';
import 'package:google_fonts/google_fonts.dart';

/// Excalidraw 风格主题
///
/// 视觉精髓：
/// - 温暖纸质背景（米白 #FFFAEC）
/// - 深炭黑主线条 (#1E1E1E)
/// - 手绘调色板：饱和明亮但带温度
class AppTheme {
  // ===== 纸质背景色系 =====
  /// 主背景：温暖米白（Excalidraw 纸张色）
  static const Color surface = Color(0xFFFFFAEC);

  /// 卡片背景：略亮纸白
  static const Color cardSurface = Color(0xFFFFFEF7);

  /// 深色背景（黑板色，用于反白卡片）
  static const Color deepSpace = Color(0xFF1E1E1E);

  // ===== 文字色系 =====
  /// 主文本：深炭黑（Excalidraw 标志性墨水色）
  static const Color primaryText = Color(0xFF1E1E1E);

  /// 次文本：温暖灰
  static const Color secondaryText = Color(0xFF6B6B6B);

  // ===== Excalidraw 调色板 =====
  /// 琥珀色（保留兼容）
  static const Color amber = Color(0xFFF08C00);

  /// 鼠尾草绿（保留兼容）
  static const Color sage = Color(0xFF2F9E44);

  /// 边框淡色
  static const Color outlineVariant = Color(0xFFE8DEC6);

  // ===== Excalidraw 完整调色板 =====
  // 9 种 Excalidraw 标志性颜色
  static const Color ink = Color(0xFF1E1E1E); // 主墨水
  static const Color excalRed = Color(0xFFE03131);
  static const Color excalOrange = Color(0xFFF08C00);
  static const Color excalYellow = Color(0xFFE67700); // 略偏橙黄
  static const Color excalGreen = Color(0xFF2F9E44);
  static const Color excalCyan = Color(0xFF0C8599);
  static const Color excalBlue = Color(0xFF1971C2);
  static const Color excalViolet = Color(0xFF6741D9);
  static const Color excalPink = Color(0xFFC2255C);
  static const Color excalBrown = Color(0xFF8B5E3C);

  static CupertinoThemeData build() {
    return CupertinoThemeData(
      brightness: Brightness.light,
      primaryColor: ink,
      barBackgroundColor: surface,
      scaffoldBackgroundColor: surface,
      textTheme: CupertinoTextThemeData(
        primaryColor: ink,
        textStyle: GoogleFonts.patrickHand(
          color: ink,
          fontSize: 16,
          letterSpacing: 0.0,
          height: 1.5,
        ),
        navTitleTextStyle: GoogleFonts.caveat(
          color: ink,
          fontSize: 22,
          fontWeight: FontWeight.w700,
          letterSpacing: 0.1,
        ),
        navLargeTitleTextStyle: GoogleFonts.caveat(
          color: ink,
          fontSize: 32,
          fontWeight: FontWeight.w700,
          letterSpacing: 0.1,
        ),
      ),
    );
  }
}
