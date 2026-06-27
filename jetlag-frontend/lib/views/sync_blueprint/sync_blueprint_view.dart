import 'package:flutter/cupertino.dart';
import 'package:flutter/services.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:jetlag_sync/theme/app_theme.dart';
import 'package:jetlag_sync/widgets/sketch/sketch_widgets.dart';

class SyncBlueprintView extends StatefulWidget {
  final String blueprint;

  const SyncBlueprintView({
    super.key,
    required this.blueprint,
  });

  @override
  State<SyncBlueprintView> createState() => _SyncBlueprintViewState();
}

class _SyncBlueprintViewState extends State<SyncBlueprintView> {
  String _toastMessage = '';
  bool _toastVisible = false;

  void _triggerToast(String message) {
    setState(() {
      _toastMessage = message;
      _toastVisible = true;
    });
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) {
        setState(() => _toastVisible = false);
      }
    });
  }

  Future<void> _onShare() async {
    try {
      final text = '【时差修复局 · 今日修复蓝图】\n\n${widget.blueprint}\n\n—— 来自 JetLag Sync';
      await Clipboard.setData(ClipboardData(text: text));
      _triggerToast('方案已复制到剪贴板');
    } catch (e) {
      _triggerToast('分享失败');
    }
  }

  Future<void> _onSave() async {
    try {
      await Clipboard.setData(ClipboardData(text: widget.blueprint));
      _triggerToast('已保存到剪贴板');
    } catch (e) {
      _triggerToast('保存失败');
    }
  }

  @override
  Widget build(BuildContext context) {
    return CupertinoPageScaffold(
      backgroundColor: AppTheme.surface,
      navigationBar: CupertinoNavigationBar(
        backgroundColor: AppTheme.surface,
        border: null,
        leading: CupertinoButton(
          padding: EdgeInsets.zero,
          onPressed: () => Navigator.of(context).pop(),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(CupertinoIcons.back, size: 18, color: AppTheme.ink),
              const SizedBox(width: 4),
              Text('返回', style: SketchFonts.body(size: 15, color: AppTheme.ink, weight: FontWeight.w600)),
            ],
          ),
        ),
        middle: Column(
          children: [
            Text('修复蓝图', style: SketchFonts.title(size: 22, color: AppTheme.ink)),
            const SizedBox(height: 2),
            Text('SYNC BLUEPRINT', style: SketchFonts.tag(size: 9, color: AppTheme.excalGreen, letterSpacing: 0.3)),
          ],
        ),
      ),
      child: SafeArea(
        child: Stack(
          children: [
            SingleChildScrollView(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 14, 20, 36),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _statusBanner(),
                    const SizedBox(height: 20),
                    SketchCard(
                      seed: 500,
                      borderColor: AppTheme.ink,
                      fillColor: AppTheme.cardSurface,
                      padding: const EdgeInsets.all(20),
                      cornerRadius: 16,
                      strokeWidth: 1.5,
                      child: MarkdownBody(
                        data: widget.blueprint,
                        styleSheet: MarkdownStyleSheet(
                          p: GoogleFonts.patrickHand(
                            fontSize: 14,
                            color: AppTheme.ink,
                            height: 1.7,
                          ),
                          h1: GoogleFonts.caveat(
                            fontSize: 24,
                            fontWeight: FontWeight.w700,
                            color: AppTheme.ink,
                            height: 1.3,
                          ),
                          h2: GoogleFonts.caveat(
                            fontSize: 19,
                            fontWeight: FontWeight.w700,
                            color: AppTheme.excalViolet,
                            height: 1.3,
                          ),
                          listBullet: GoogleFonts.patrickHand(
                            fontSize: 14,
                            color: AppTheme.excalGreen,
                            fontWeight: FontWeight.w700,
                          ),
                          code: GoogleFonts.kalam(
                            fontSize: 12,
                            color: AppTheme.secondaryText,
                          ),
                          strong: GoogleFonts.patrickHand(
                            fontWeight: FontWeight.w700,
                            color: AppTheme.excalRed,
                          ),
                          horizontalRuleDecoration: BoxDecoration(
                            border: Border(
                              top: BorderSide(width: 1.5, color: AppTheme.outlineVariant),
                            ),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),
                    _actionFooter(),
                    const SizedBox(height: 40),
                  ],
                ),
              ),
            ),
            if (_toastVisible)
              Positioned(
                left: 0,
                right: 0,
                bottom: 100,
                child: Center(
                  child: SketchCard(
                    seed: 555,
                    borderColor: AppTheme.ink,
                    fillColor: AppTheme.ink,
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                    cornerRadius: 20,
                    strokeWidth: 1.5,
                    withShadow: true,
                    child: Text(
                      _toastMessage,
                      style: SketchFonts.body(
                        size: 13,
                        color: const Color(0xFFFFFEF7),
                        weight: FontWeight.w700,
                      ),
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _statusBanner() {
    return SketchCard(
      seed: 511,
      borderColor: AppTheme.excalGreen,
      fillColor: AppTheme.excalGreen.withValues(alpha: 0.08),
      strokeWidth: 1.5,
      cornerRadius: 14,
      padding: const EdgeInsets.all(14),
      child: Row(
        children: [
          SketchBadge(emoji: '✓', color: AppTheme.excalGreen, size: 32, seed: 512),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              '诊断完成 · 请按此方案进行节律修复',
              style: SketchFonts.body(size: 13, color: AppTheme.ink, weight: FontWeight.w700),
            ),
          ),
        ],
      ),
    );
  }

  Widget _actionFooter() {
    return Row(
      children: [
        Expanded(
          child: GestureDetector(
            onTap: _onShare,
            child: SketchCard(
              seed: 521,
              borderColor: AppTheme.ink,
              fillColor: AppTheme.cardSurface,
              strokeWidth: 1.6,
              cornerRadius: 22,
              padding: const EdgeInsets.symmetric(vertical: 14),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(CupertinoIcons.share, size: 16, color: AppTheme.ink),
                  const SizedBox(width: 6),
                  Text('分享', style: SketchFonts.body(size: 14, color: AppTheme.ink, weight: FontWeight.w700)),
                ],
              ),
            ),
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: GestureDetector(
            onTap: _onSave,
            child: SketchCard(
              seed: 522,
              borderColor: AppTheme.ink,
              fillColor: AppTheme.ink,
              strokeWidth: 1.6,
              cornerRadius: 22,
              padding: const EdgeInsets.symmetric(vertical: 14),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(CupertinoIcons.bookmark_fill, size: 16, color: Color(0xFFFFFEF7)),
                  const SizedBox(width: 6),
                  Text('保存为今日方案', style: SketchFonts.body(size: 14, color: const Color(0xFFFFFEF7), weight: FontWeight.w700)),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}
