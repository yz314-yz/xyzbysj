import 'dart:math' as math;
import 'dart:typed_data';
import 'package:flutter/cupertino.dart';
import 'package:provider/provider.dart';
import 'package:image_picker/image_picker.dart';
import 'package:jetlag_sync/services/api_service.dart';
import 'package:jetlag_sync/models/symptom.dart';
import 'package:jetlag_sync/theme/app_theme.dart';
import 'package:jetlag_sync/views/sync_blueprint/sync_blueprint_view.dart';
import 'package:jetlag_sync/widgets/sketch/sketch_widgets.dart';

class VibeCheckView extends StatefulWidget {
  const VibeCheckView({super.key});

  @override
  State<VibeCheckView> createState() => _VibeCheckViewState();
}

class _VibeCheckViewState extends State<VibeCheckView> {
  final Set<String> _selectedSymptoms = {};
  final ImagePicker _picker = ImagePicker();
  Uint8List? _faceBytes;
  Uint8List? _tongueBytes;
  int _currentStep = 0;
  bool _isLoading = false;
  String? _errorMessage;

  List<Map<String, String>> get _steps => [
    {'title': '面部望诊', 'sub': '拍摄面部照片', 'icon': 'face'},
    {'title': '舌象望诊', 'sub': '拍摄舌苔照片', 'icon': 'tongue'},
    {'title': '症状选择', 'sub': '勾选身体不适', 'icon': 'symptoms'},
    {'title': '开始诊断', 'sub': '获取修复蓝图', 'icon': 'check'},
  ];

  @override
  Widget build(BuildContext context) {
    return CupertinoPageScaffold(
      backgroundColor: AppTheme.surface,
      navigationBar: CupertinoNavigationBar(
        backgroundColor: AppTheme.surface,
        border: null,
        middle: Column(
          children: [
            Text('望诊中心', style: SketchFonts.title(size: 22, color: AppTheme.ink)),
            const SizedBox(height: 2),
            Text('FACE & TONGUE DIAGNOSIS', style: SketchFonts.tag(size: 9, color: AppTheme.excalGreen, letterSpacing: 0.3)),
          ],
        ),
      ),
      child: SafeArea(
        child: CustomScrollView(
          slivers: [
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
                child: _buildStepIndicator(),
              ),
            ),
            if (_currentStep == 0)
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 24, 20, 0),
                  child: _buildFacePhotoCard(),
                ),
              ),
            if (_currentStep == 1)
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 24, 20, 0),
                  child: _buildTonguePhotoCard(),
                ),
              ),
            if (_currentStep == 2)
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 24, 20, 0),
                  child: _buildSymptomsList(),
                ),
              ),
            if (_currentStep == 3)
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 24, 20, 0),
                  child: _buildSummary(),
                ),
              ),
            SliverFillRemaining(
              hasScrollBody: false,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 24, 20, 36),
                child: _buildBottomButton(),
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// 手绘风步骤指示器
  Widget _buildStepIndicator() {
    return Row(
      children: [
        for (int i = 0; i < _steps.length; i++) ...[
          Column(
            children: [
              _SketchStepDot(
                index: i + 1,
                active: i == _currentStep,
                done: i < _currentStep,
                seed: i + 1,
              ),
              const SizedBox(height: 6),
              Text(
                _steps[i]['title']!,
                style: SketchFonts.body(
                  size: 11,
                  color: i <= _currentStep ? AppTheme.ink : AppTheme.secondaryText,
                  weight: FontWeight.w600,
                ),
              ),
            ],
          ),
          if (i < _steps.length - 1)
            Expanded(
              child: Padding(
                padding: const EdgeInsets.only(bottom: 18),
                child: SketchDivider(
                  color: i < _currentStep ? AppTheme.excalGreen : AppTheme.outlineVariant,
                  seed: 50 + i,
                  height: 8,
                  strokeWidth: i < _currentStep ? 1.8 : 1.2,
                ),
              ),
            ),
        ],
      ],
    );
  }

  Widget _buildFacePhotoCard() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('第一步：面部望诊', style: SketchFonts.title(size: 22, color: AppTheme.ink)),
        const SizedBox(height: 4),
        Text('AI 分析面色、眼神、黑眼圈等信息', style: SketchFonts.body(size: 13, color: AppTheme.secondaryText)),
        const SizedBox(height: 16),
        _photoCard(
          label: '面部照片',
          hint: '请正面拍摄，光线充足',
          imageBytes: _faceBytes,
          onTap: () => _pickPhoto('face'),
          color: AppTheme.excalOrange,
          emoji: '🙂',
          seed: 101,
        ),
      ],
    );
  }

  Widget _buildTonguePhotoCard() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('第二步：舌象望诊', style: SketchFonts.title(size: 22, color: AppTheme.ink)),
        const SizedBox(height: 4),
        Text('AI 分析舌质、舌苔、舌下静脉', style: SketchFonts.body(size: 13, color: AppTheme.secondaryText)),
        const SizedBox(height: 16),
        _photoCard(
          label: '舌苔照片',
          hint: '张大嘴，伸出舌头，光线充足',
          imageBytes: _tongueBytes,
          onTap: () => _pickPhoto('tongue'),
          color: AppTheme.excalGreen,
          emoji: '👅',
          seed: 102,
        ),
      ],
    );
  }

  Widget _photoCard({
    required String label,
    required String hint,
    required Uint8List? imageBytes,
    required VoidCallback onTap,
    required Color color,
    required String emoji,
    required int seed,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: SketchCard(
        seed: seed,
        borderColor: imageBytes != null ? color : AppTheme.ink,
        fillColor: AppTheme.cardSurface,
        strokeWidth: imageBytes != null ? 2.0 : 1.5,
        cornerRadius: 16,
        padding: EdgeInsets.zero,
        child: SizedBox(
          height: 140,
          child: imageBytes != null
              ? ClipRRect(
                  borderRadius: BorderRadius.circular(15),
                  child: Stack(
                    fit: StackFit.expand,
                    children: [
                      Image.memory(imageBytes, fit: BoxFit.cover),
                      Positioned(
                        top: 10,
                        right: 10,
                        child: GestureDetector(
                          onTap: () => setState(() {
                            if (label == '面部照片') _faceBytes = null;
                            else _tongueBytes = null;
                          }),
                          child: Container(
                            padding: const EdgeInsets.all(6),
                            decoration: const BoxDecoration(
                              color: Color(0xCC1E1E1E),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(CupertinoIcons.xmark, size: 14, color: Color(0xFFFFFEF7)),
                          ),
                        ),
                      ),
                      Positioned(
                        bottom: 10,
                        left: 10,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: color,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text('已拍摄 $label', style: SketchFonts.body(size: 11, color: const Color(0xFFFFFEF7), weight: FontWeight.w700)),
                        ),
                      ),
                    ],
                  ),
                )
              : Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    SketchBadge(emoji: emoji, color: color, size: 56, seed: seed + 5),
                    const SizedBox(width: 16),
                    Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('拍摄 $label', style: SketchFonts.title(size: 18, color: AppTheme.ink)),
                        const SizedBox(height: 4),
                        Text(hint, style: SketchFonts.body(size: 12, color: AppTheme.secondaryText)),
                      ],
                    ),
                  ],
                ),
        ),
      ),
    );
  }

  Widget _buildSymptomsList() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('第三步：症状选择', style: SketchFonts.title(size: 22, color: AppTheme.ink)),
        const SizedBox(height: 4),
        Text('已选 ${_selectedSymptoms.length} 项 · 按分类快速定位',
            style: SketchFonts.body(size: 13, color: AppTheme.secondaryText)),
        const SizedBox(height: 16),
        ..._buildGroupedChips(),
      ],
    );
  }

  List<Widget> _buildGroupedChips() {
    final categories = <String>['伤津耗液', '伤气血', '伤心神', '伤精', '伤脾', '全身'];
    final colors = <Color>[
      AppTheme.excalOrange,
      AppTheme.excalRed,
      AppTheme.excalViolet,
      AppTheme.excalGreen,
      AppTheme.amber,
      AppTheme.secondaryText,
    ];
    final widgets = <Widget>[];
    for (int i = 0; i < categories.length; i++) {
      final items = Symptom.defaults.where((s) => s.category == categories[i]).toList();
      if (items.isEmpty) continue;
      widgets.addAll([
        Padding(
          padding: const EdgeInsets.only(bottom: 8, top: 4),
          child: Row(
            children: [
              SketchBadge(emoji: '◆', color: colors[i], size: 16, seed: i + 200),
              const SizedBox(width: 6),
              Text(categories[i],
                  style: SketchFonts.tag(size: 11, color: colors[i], letterSpacing: 0.3)),
            ],
          ),
        ),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: items.map((s) {
            final isSelected = _selectedSymptoms.contains(s.id);
            return SketchChip(
              label: s.label,
              emoji: s.emoji,
              selected: isSelected,
              color: colors[i],
              seed: s.label.hashCode % 100,
              onTap: () => setState(() {
                if (isSelected) _selectedSymptoms.remove(s.id);
                else _selectedSymptoms.add(s.id);
              }),
            );
          }).toList(),
        ),
        const SizedBox(height: 8),
      ]);
    }
    return widgets;
  }

  Widget _buildSummary() {
    final selectedLabels = Symptom.defaults
        .where((s) => _selectedSymptoms.contains(s.id))
        .map((s) => s.label)
        .toList();
    final hasAnyInput = _faceBytes != null || _tongueBytes != null || selectedLabels.isNotEmpty;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('诊断就绪', style: SketchFonts.title(size: 24, color: AppTheme.ink)),
        const SizedBox(height: 16),
        _summaryRow('面部照片', _faceBytes != null ? '已拍摄' : '未拍摄', _faceBytes != null),
        _summaryRow('舌苔照片', _tongueBytes != null ? '已拍摄' : '未拍摄', _tongueBytes != null),
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 10),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('症状选择', style: SketchFonts.body(size: 14, color: AppTheme.ink, weight: FontWeight.w600)),
                    const SizedBox(height: 6),
                    if (selectedLabels.isEmpty)
                      Text('尚未选择症状', style: SketchFonts.body(size: 12, color: AppTheme.secondaryText))
                    else
                      Wrap(
                        spacing: 6,
                        runSpacing: 6,
                        children: selectedLabels
                            .map((label) => SketchChip(
                                  label: label,
                                  selected: true,
                                  color: AppTheme.excalGreen,
                                  seed: label.hashCode % 100,
                                ))
                            .toList(),
                      ),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              Icon(
                selectedLabels.isNotEmpty ? CupertinoIcons.check_mark_circled : CupertinoIcons.circle,
                size: 16,
                color: selectedLabels.isNotEmpty ? AppTheme.excalGreen : AppTheme.secondaryText.withValues(alpha: 0.4),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        SketchCard(
          seed: 333,
          borderColor: hasAnyInput ? AppTheme.excalGreen : AppTheme.excalOrange,
          fillColor: hasAnyInput ? AppTheme.excalGreen.withValues(alpha: 0.08) : AppTheme.excalOrange.withValues(alpha: 0.08),
          strokeWidth: 1.5,
          cornerRadius: 12,
          padding: const EdgeInsets.all(14),
          child: Row(
            children: [
              Icon(
                hasAnyInput ? CupertinoIcons.info : CupertinoIcons.exclamationmark_triangle_fill,
                size: 18,
                color: hasAnyInput ? AppTheme.excalGreen : AppTheme.excalOrange,
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  hasAnyInput
                      ? 'AI 将综合望诊与症状分析，生成专属修复蓝图'
                      : '请至少完成一项：拍摄照片 或 选择症状',
                  style: SketchFonts.body(size: 13, color: AppTheme.ink, weight: FontWeight.w600),
                ),
              ),
            ],
          ),
        ),
        if (_errorMessage != null) ...[
          const SizedBox(height: 16),
          SketchCard(
            seed: 334,
            borderColor: AppTheme.excalRed,
            fillColor: AppTheme.excalRed.withValues(alpha: 0.06),
            strokeWidth: 1.5,
            cornerRadius: 12,
            padding: const EdgeInsets.all(14),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(CupertinoIcons.exclamationmark_triangle_fill, size: 18, color: AppTheme.excalRed),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(_errorMessage!, style: SketchFonts.body(size: 12, color: AppTheme.excalRed, height: 1.4)),
                ),
              ],
            ),
          ),
        ],
      ],
    );
  }

  Widget _summaryRow(String label, String value, bool ok) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: SketchFonts.body(size: 14, color: AppTheme.ink, weight: FontWeight.w600)),
          Row(
            children: [
              Text(value, style: SketchFonts.body(size: 13, color: ok ? AppTheme.excalGreen : AppTheme.secondaryText, weight: FontWeight.w700)),
              const SizedBox(width: 6),
              Icon(
                ok ? CupertinoIcons.check_mark_circled : CupertinoIcons.circle,
                size: 14,
                color: ok ? AppTheme.excalGreen : AppTheme.secondaryText.withValues(alpha: 0.4),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildBottomButton() {
    final isLast = _currentStep == _steps.length - 1;
    final selectedLabels = Symptom.defaults.where((s) => _selectedSymptoms.contains(s.id)).map((s) => s.label).toList();
    final hasAnyInput = _faceBytes != null || _tongueBytes != null || selectedLabels.isNotEmpty;
    final canProceed = isLast ? hasAnyInput : true;
    final disabled = _isLoading || !canProceed;

    return Column(
      mainAxisAlignment: MainAxisAlignment.end,
      children: [
        GestureDetector(
          onTap: _isLoading || !canProceed
              ? null
              : () {
                  if (isLast) {
                    _runDiagnosis();
                  } else {
                    setState(() => _currentStep++);
                  }
                },
          child: SketchCard(
            seed: 999,
            borderColor: disabled ? AppTheme.secondaryText : AppTheme.ink,
            fillColor: disabled ? AppTheme.secondaryText.withValues(alpha: 0.3) : AppTheme.ink,
            strokeWidth: 2.0,
            cornerRadius: 24,
            padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 24),
            withShadow: !disabled,
            child: Center(
              child: _isLoading
                  ? const CupertinoActivityIndicator(color: Color(0xFFFFFEF7))
                  : Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        if (isLast) ...[
                          const Icon(CupertinoIcons.bolt_fill, size: 16, color: Color(0xFFFFFEF7)),
                          const SizedBox(width: 8),
                        ],
                        Text(
                          isLast ? '生成修复蓝图' : '继续 · 下一步',
                          style: SketchFonts.body(
                            size: 16,
                            color: const Color(0xFFFFFEF7),
                            weight: FontWeight.w700,
                          ),
                        ),
                      ],
                    ),
            ),
          ),
        ),
        if (_currentStep > 0) ...[
          const SizedBox(height: 12),
          CupertinoButton(
            onPressed: _isLoading ? null : () => setState(() => _currentStep--),
            child: Text('上一步', style: SketchFonts.body(size: 13, color: AppTheme.secondaryText, weight: FontWeight.w600)),
          ),
        ],
      ],
    );
  }

  Future<void> _pickPhoto(String type) async {
    try {
      final XFile? photo = await _picker.pickImage(
        source: ImageSource.camera,
        maxWidth: 1024,
        maxHeight: 1024,
        imageQuality: 80,
      );
      if (photo != null) {
        final bytes = await photo.readAsBytes();
        setState(() {
          if (type == 'face') _faceBytes = bytes;
          else _tongueBytes = bytes;
        });
      }
    } catch (e) {
      // Web 环境不支持相机时，静默跳过
    }
  }

  Future<void> _runDiagnosis() async {
    final selectedLabels = Symptom.defaults.where((s) => _selectedSymptoms.contains(s.id)).map((s) => s.label).toList();
    final symptomsText = selectedLabels.join('、');
    final hasFace = _faceBytes != null;
    final hasTongue = _tongueBytes != null;

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final api = context.read<ApiService>();

    try {
      final result = await api.diagnose(
        symptoms: symptomsText.isEmpty ? '' : symptomsText,
        temperature: 28,
        humidity: 85,
        currentHour: DateTime.now().hour,
        imageBytes: _faceBytes ?? _tongueBytes,
        hasFacePhoto: hasFace,
        hasTonguePhoto: hasTongue,
      );
      if (mounted) {
        setState(() => _isLoading = false);
        Navigator.of(context).push(
          CupertinoPageRoute(
            builder: (context) => SyncBlueprintView(blueprint: result.blueprint),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        final mockBlueprint = _buildLocalBlueprint(selectedLabels, hasFace, hasTongue);
        setState(() {
          _isLoading = false;
          _errorMessage = '无法连接后端服务：${e.toString().split('\n').first}';
        });
        showCupertinoDialog(
          context: context,
          builder: (dialogContext) => CupertinoAlertDialog(
            title: const Text('已生成本地方案'),
            content: const Text('后端服务暂不可用。已为您生成基于规则的本地修复方案：'),
            actions: [
              CupertinoDialogAction(
                isDefaultAction: true,
                onPressed: () {
                  Navigator.of(dialogContext).pop();
                  Navigator.of(context).push(
                    CupertinoPageRoute(
                      builder: (context) => SyncBlueprintView(blueprint: mockBlueprint),
                    ),
                  );
                },
                child: const Text('查看本地方案'),
              ),
              CupertinoDialogAction(
                onPressed: () => Navigator.of(dialogContext).pop(),
                child: const Text('关闭'),
              ),
            ],
          ),
        );
      }
    }
  }

  String _buildLocalBlueprint(List<String> labels, bool hasFace, bool hasTongue) {
    final fire = labels.any((l) => l.contains('口干') || l.contains('爆痘') || l.contains('干涩') || l.contains('潮红'));
    final heart = labels.any((l) => l.contains('心跳') || l.contains('心悸') || l.contains('胸闷'));
    final spirit = labels.any((l) => l.contains('情绪') || l.contains('焦虑') || l.contains('失眠') || l.contains('入睡'));
    final kidney = labels.any((l) => l.contains('腰膝') || l.contains('记忆') || l.contains('注意力'));
    final spleen = labels.any((l) => l.contains('食欲') || l.contains('便秘') || l.contains('腹泻'));
    final qi = labels.any((l) => l.contains('头晕') || l.contains('疲惫') || l.contains('虚汗') || l.contains('晦暗'));

    final dominant = <String>[];
    if (fire) dominant.add('伤津耗液（阴虚火旺）');
    if (heart || spirit) dominant.add('伤心神');
    if (qi) dominant.add('伤气血');
    if (kidney) dominant.add('伤精（肾精亏虚）');
    if (spleen) dominant.add('伤脾（脾胃失和）');

    String spiritSection;
    if (labels.isNotEmpty) {
      final bulletFire = fire ? '  ● 阴虚火旺：口干舌燥、眼睛干涩、皮肤爆痘\n' : '';
      final bulletHeart = heart ? '  ● 心神不宁：心跳过快、心悸胸闷\n' : '';
      final bulletSpirit = spirit ? '  ● 神散不安：情绪焦虑、失眠难眠\n' : '';
      final bulletKidney = kidney ? '  ● 肾精亏虚：腰膝酸软、记忆力下降\n' : '';
      final bulletSpleen = spleen ? '  ● 脾胃失和：食欲不振、便秘腹泻\n' : '';
      final bulletQi = qi ? '  ● 气血不足：头晕萎靡、持续疲惫\n' : '';
      spiritSection = '根据症状「' + labels.join('、') + '」综合判断：\n' + bulletFire + bulletHeart + bulletSpirit + bulletKidney + bulletSpleen + bulletQi;
    } else {
      spiritSection = '暂未选择具体症状，建议结合望诊信息进行基础调理。';
    }

    String damageSection;
    if (dominant.isNotEmpty) {
      damageSection = '  ○ 主导伤损：' + dominant.join(' + ') + '\n  ○ 兼夹伤损：多脏腑同时受损，需综合调理';
    } else {
      damageSection = '症状信息较少，建议返回补充症状或拍摄照片';
    }

    return '# 1. 望诊分析\n\n'
        '## 面象诊断\n'
        '${hasFace ? "基于面部照片进行面诊分析：面色" + (fire ? "潮红" : "偏暗") + "、" + (qi ? "气血不足，精神倦怠" : "气血状态尚可") + "、" + (fire ? "虚火上炎之象明显" : "阴阳相对平衡") + "。" + (fire || kidney ? "眼部干涩、皮肤暗沉，津液亏虚。" : "") : "（未拍摄面部照片，跳过面诊）"}\n\n'
        '## 舌象诊断\n'
        '${hasTongue ? "基于舌苔照片进行舌诊分析：舌质" + (fire ? "偏红" : "淡红") + "、舌苔" + (spleen ? "厚腻（脾胃失和）" : "薄白") + "、舌下络脉" + (qi ? "偏暗（气血运行不畅）" : "正常") + "。" + (fire ? "舌尖红点明显，心火偏旺。" : "") : "（未拍摄舌苔照片，跳过舌诊）"}\n\n'
        '## 精气神评估\n'
        '$spiritSection\n\n'
        '# 2. 熬夜伤损判定\n'
        '$damageSection\n\n'
        '# 3. 熬夜紧急补救方案\n\n'
        '## 🌙 凌晨继续熬夜\n'
        '  ● 每45分钟起身活动3分钟：促进气血循环，避免久坐伤气\n'
        '  ● 饮用枸杞麦冬泡水（温）：滋阴润燥，缓解口干\n'
        '  ● 按揉合谷+内关穴：各1分钟，降火宁心\n'
        '  ● 避免甜食咖啡：加重湿热与心火\n\n'
        '## 😴 准备强行入睡\n'
        '  ● 22:00-22:30为最佳入睡窗口\n'
        '  ● 睡前30分钟远离屏幕：减少蓝光刺激褪黑素分泌\n'
        '  ● 泡脚10分钟（40°C温水）：引火下行，安神助眠\n'
        '  ● 按揉三阴交+涌泉：各3分钟，补肾养阴\n\n'
        '## ☀️ 次日早晨\n'
        '  ● 7:00起床后晒太阳10分钟：重置生物钟，提升阳气\n'
        '  ● 早餐：小米粥+红枣+鸡蛋：益气健脾，温补不燥\n'
        '  ● 午休20分钟（12:30-13:00）：补心安神，补充精力\n\n'
        '## 🧘 日常经络调理\n'
        '  ● 敲胆经（大腿外侧）：每侧5分钟，疏通胆气\n'
        '  ● 按揉太溪+复溜：补肾养阴，每日各2分钟\n'
        '  ● 艾灸足三里：每周2次，健脾益气\n'
        '  ● 推腹法：顺时针5分钟，促进消化\n\n'
        '# 4. 今夜复位窗口\n'
        '  ● 推荐睡眠时间：22:00 - 06:00（8小时）\n'
        '  ● 子午流注原理：23:00-01:00胆经当令需熟睡，01:00-03:00肝经当令宜深眠\n'
        '  ● 褪黑素节律：21:00后光线变暗开始分泌，23:00达到高峰\n'
        '  ● 说明：此方案为本地规则引擎生成。后端服务恢复后可获得AI个性化诊断。';
  }
}

/// 手绘风步骤圆点
class _SketchStepDot extends StatelessWidget {
  final int index;
  final bool active;
  final bool done;
  final int seed;

  const _SketchStepDot({
    required this.index,
    required this.active,
    required this.done,
    required this.seed,
  });

  @override
  Widget build(BuildContext context) {
    final color = done
        ? AppTheme.excalGreen
        : active
            ? AppTheme.ink
            : AppTheme.secondaryText;
    return SizedBox(
      width: 32,
      height: 32,
      child: Stack(
        alignment: Alignment.center,
        children: [
          CustomPaint(
            painter: _SketchStepDotPainter(color: color, fill: active || done, seed: seed),
            size: const Size(32, 32),
          ),
          Text(
            '$index',
            style: SketchFonts.numeric(
              size: 14,
              color: active || done ? const Color(0xFFFFFEF7) : AppTheme.secondaryText,
              weight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}

class _SketchStepDotPainter extends CustomPainter {
  final Color color;
  final bool fill;
  final int seed;

  _SketchStepDotPainter({required this.color, required this.fill, required this.seed});

  @override
  void paint(Canvas canvas, Size size) {
    if (fill) {
      final fillPaint = Paint()..color = color..style = PaintingStyle.fill;
      canvas.drawCircle(Offset(size.width / 2, size.height / 2), size.width / 2 - 2, fillPaint);
    }
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.8
      ..strokeCap = StrokeCap.round;

    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2 - 2;
    final rng = math.Random(seed);
    final segs = 28;
    final path = Path();
    for (int i = 0; i <= segs; i++) {
      final a = (i / segs) * math.pi * 2;
      final r = radius + (rng.nextDouble() - 0.5) * 1.0;
      final x = center.dx + r * math.cos(a);
      final y = center.dy + r * math.sin(a);
      if (i == 0) {
        path.moveTo(x, y);
      } else {
        path.lineTo(x, y);
      }
    }
    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant _SketchStepDotPainter old) =>
      old.color != color || old.fill != fill || old.seed != seed;
}
