import 'package:flutter/cupertino.dart';
import 'package:jetlag_sync/models/symptom.dart';
import 'package:jetlag_sync/theme/app_theme.dart';

class SymptomChips extends StatelessWidget {
  final List<Symptom> symptoms;
  final Set<String> selected;
  final void Function(String) onToggle;

  const SymptomChips({
    super.key,
    required this.symptoms,
    required this.selected,
    required this.onToggle,
  });

  Map<String, List<Symptom>> get _grouped {
    final Map<String, List<Symptom>> map = {};
    for (final s in symptoms) {
      map.putIfAbsent(s.category, () => []).add(s);
    }
    return map;
  }

  @override
  Widget build(BuildContext context) {
    final groups = _grouped;
    final categoryOrder = ['伤津耗液', '伤气血', '伤心神', '伤精', '伤脾', '全身'];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: categoryOrder.where((c) => groups.containsKey(c)).expand((category) {
        final items = groups[category]!;
        return [
          Padding(
            padding: const EdgeInsets.only(bottom: 8, top: 12),
            child: Row(
              children: [
                Container(
                  width: 4,
                  height: 12,
                  decoration: BoxDecoration(
                    color: _categoryColor(category),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                const SizedBox(width: 6),
                Text(
                  _categoryLabel(category),
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.secondaryText.withValues(alpha: 0.8),
                    letterSpacing: 0.05,
                  ),
                ),
              ],
            ),
          ),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: items.map((symptom) {
              final isSelected = selected.contains(symptom.id);
              return GestureDetector(
                onTap: () => onToggle(symptom.id),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  curve: Curves.easeOut,
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: isSelected
                        ? _categoryColor(category).withValues(alpha: 0.15)
                        : AppTheme.cardSurface,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                      color: isSelected ? _categoryColor(category) : AppTheme.outlineVariant,
                      width: 1,
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(symptom.emoji, style: const TextStyle(fontSize: 13)),
                      const SizedBox(width: 5),
                      Text(
                        symptom.label,
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: isSelected ? _categoryColor(category) : AppTheme.primaryText,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            }).toList(),
          ),
        ];
      }).toList(),
    );
  }

  String _categoryLabel(String cat) {
    const map = {
      '伤津耗液': '熬夜伤津 · 口干火旺',
      '伤气血': '熬夜伤气 · 血虚失养',
      '伤心神': '熬夜伤心 · 神不守舍',
      '伤精': '熬夜伤精 · 肾精亏虚',
      '伤脾': '熬夜伤脾 · 运化失常',
      '全身': '全身反应',
    };
    return map[cat] ?? cat;
  }

  Color _categoryColor(String cat) {
    const map = {
      '伤津耗液': Color(0xFFE8853A),
      '伤气血': Color(0xFFDC2626),
      '伤心神': Color(0xFF7C3AED),
      '伤精': Color(0xFF059669),
      '伤脾': Color(0xFFD97706),
      '全身': Color(0xFF64748B),
    };
    return map[cat] ?? AppTheme.secondaryText;
  }
}
