import 'package:flutter/cupertino.dart';

class AppTheme {
  static const Color surface = Color(0xFFF8FAFC);
  static const Color primaryText = Color(0xFF0F172A);
  static const Color secondaryText = Color(0xFF64748B);
  static const Color amber = Color(0xFFD97706);
  static const Color sage = Color(0xFF059669);
  static const Color cardSurface = Color(0xFFF1F5F9);
  static const Color outlineVariant = Color(0xFFE2E8F0);
  static const Color deepSpace = Color(0xFF0B0F19);

  static CupertinoThemeData build() {
    return CupertinoThemeData(
      brightness: Brightness.light,
      primaryColor: primaryText,
      barBackgroundColor: surface,
      scaffoldBackgroundColor: surface,
      textTheme: CupertinoTextThemeData(
        primaryColor: primaryText,
        textStyle: TextStyle(
          color: primaryText,
          fontSize: 17,
          letterSpacing: -0.01,
        ),
      ),
    );
  }
}
