import 'package:flutter/cupertino.dart';
import 'package:flutter/services.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import 'package:jetlag_sync/theme/app_theme.dart';

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
          child: const Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(CupertinoIcons.back, size: 18, color: AppTheme.primaryText),
              SizedBox(width: 4),
              Text('返回', style: TextStyle(fontSize: 15, color: AppTheme.primaryText, fontWeight: FontWeight.w600)),
            ],
          ),
        ),
        middle: const Column(
          children: [
            Text('修复蓝图', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700, color: AppTheme.primaryText)),
            SizedBox(height: 2),
            Text('SYNC BLUEPRINT', style: TextStyle(fontSize: 9, fontWeight: FontWeight.w700, color: AppTheme.sage, letterSpacing: 0.15)),
          ],
        ),
      ),
      child: SafeArea(
        child: Stack(
          children: [
            SingleChildScrollView(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(24, 14, 24, 36),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _statusBanner(),
                    const SizedBox(height: 20),
                    Container(
                      decoration: BoxDecoration(color: AppTheme.cardSurface, borderRadius: BorderRadius.circular(20)),
                      padding: const EdgeInsets.all(20),
                      child: MarkdownBody(
                        data: widget.blueprint,
                        styleSheet: MarkdownStyleSheet(
                          p: const TextStyle(fontSize: 13, color: AppTheme.primaryText, height: 1.65),
                          h1: const TextStyle(fontSize: 19, fontWeight: FontWeight.w800, color: AppTheme.primaryText, height: 1.3),
                          h2: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: AppTheme.primaryText, height: 1.2),
                          listBullet: const TextStyle(fontSize: 13, color: AppTheme.sage, fontWeight: FontWeight.w700),
                          code: const TextStyle(fontSize: 12, color: AppTheme.secondaryText),
                          strong: const TextStyle(fontWeight: FontWeight.w700, color: AppTheme.primaryText),
                          horizontalRuleDecoration: BoxDecoration(border: Border(top: BorderSide(width: 1, color: AppTheme.outlineVariant))),
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
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                    decoration: BoxDecoration(
                      color: AppTheme.primaryText.withValues(alpha: 0.92),
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: [BoxShadow(color: AppTheme.primaryText.withValues(alpha: 0.2), blurRadius: 12, offset: const Offset(0, 4))],
                    ),
                    child: Text(_toastMessage, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: CupertinoColors.white)),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _statusBanner() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.sage.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.sage.withValues(alpha: 0.2), width: 1),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(color: AppTheme.sage.withValues(alpha: 0.15), shape: BoxShape.circle),
            child: const Icon(CupertinoIcons.check_mark, size: 14, color: AppTheme.sage),
          ),
          const SizedBox(width: 12),
          const Expanded(
            child: Text(
              '诊断完成 · 请按此方案进行节律修复',
              style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppTheme.primaryText),
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
            child: Container(
              height: 48,
              decoration: BoxDecoration(
                color: AppTheme.cardSurface,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: AppTheme.outlineVariant, width: 1),
              ),
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(CupertinoIcons.share, size: 16, color: AppTheme.primaryText),
                  SizedBox(width: 6),
                  Text('分享', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppTheme.primaryText)),
                ],
              ),
            ),
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: GestureDetector(
            onTap: _onSave,
            child: Container(
              height: 48,
              decoration: BoxDecoration(
                color: AppTheme.primaryText,
                borderRadius: BorderRadius.circular(24),
                boxShadow: [BoxShadow(color: AppTheme.primaryText.withValues(alpha: 0.2), blurRadius: 12, offset: const Offset(0, 4))],
              ),
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(CupertinoIcons.bookmark_fill, size: 16, color: CupertinoColors.white),
                  SizedBox(width: 6),
                  Text('保存为今日方案', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: CupertinoColors.white)),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}
