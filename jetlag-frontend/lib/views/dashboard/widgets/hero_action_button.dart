import 'dart:io';
import 'package:flutter/cupertino.dart';
import 'package:jetlag_sync/theme/app_theme.dart';

class HeroActionButton extends StatelessWidget {
  final VoidCallback onTap;
  final VoidCallback onPhotoTap;
  final bool isLoading;
  final String? imagePath;

  const HeroActionButton({
    super.key,
    required this.onTap,
    required this.onPhotoTap,
    this.isLoading = false,
    this.imagePath,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        if (imagePath == null)
          GestureDetector(
            onTap: onPhotoTap,
            child: Container(
              height: 56,
              decoration: BoxDecoration(
                color: AppTheme.cardSurface,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: AppTheme.outlineVariant,
                  width: 1,
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(
                    CupertinoIcons.camera,
                    size: 18,
                    color: AppTheme.secondaryText,
                  ),
                  const SizedBox(width: 8),
                  const Text(
                    '拍照辅助诊断（可选）',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                      color: AppTheme.secondaryText,
                    ),
                  ),
                ],
              ),
            ),
          ),
        const SizedBox(height: 12),
        GestureDetector(
          onTap: isLoading ? null : onTap,
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            curve: Curves.easeOut,
            height: 64,
            decoration: BoxDecoration(
              color: isLoading
                  ? AppTheme.primaryText.withValues(alpha: 0.5)
                  : AppTheme.primaryText,
              borderRadius: BorderRadius.circular(32),
              boxShadow: [
                BoxShadow(
                  color: AppTheme.primaryText.withValues(alpha: 0.15),
                  blurRadius: 20,
                  offset: const Offset(0, 8),
                ),
              ],
            ),
            child: Center(
              child: isLoading
                  ? const CupertinoActivityIndicator(
                      color: CupertinoColors.white,
                    )
                  : Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(4),
                          decoration: BoxDecoration(
                            color: CupertinoColors.white.withValues(alpha: 0.15),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            CupertinoIcons.bolt_fill,
                            size: 14,
                            color: CupertinoColors.white,
                          ),
                        ),
                        const SizedBox(width: 10),
                        const Text(
                          '一键开启 Vibe Check 修复',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            color: CupertinoColors.white,
                            letterSpacing: -0.01,
                          ),
                        ),
                      ],
                    ),
            ),
          ),
        ),
      ],
    );
  }
}
