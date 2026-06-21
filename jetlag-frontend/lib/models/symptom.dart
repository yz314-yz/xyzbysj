class Symptom {
  final String id;
  final String label;
  final String emoji;
  final String category;

  const Symptom({
    required this.id,
    required this.label,
    required this.emoji,
    required this.category,
  });

  static const List<Symptom> defaults = [
    // 伤津耗液
    Symptom(id: 'dry_mouth', label: '口干舌燥', emoji: '🥤', category: '伤津耗液'),
    Symptom(id: 'dry_eyes', label: '眼睛干涩', emoji: '👁️', category: '伤津耗液'),
    Symptom(id: 'acne', label: '爆痘/皮肤暗沉', emoji: '🥬', category: '伤津耗液'),
    // 伤气血
    Symptom(id: 'sweat', label: '手脚冒虚汗', emoji: '🥵', category: '伤气血'),
    Symptom(id: 'pale', label: '面色晦暗苍白', emoji: '😶‍🌫️', category: '伤气血'),
    Symptom(id: 'dark_eye', label: '黑眼圈眼袋', emoji: '🦅', category: '伤气血'),
    // 伤心神
    Symptom(id: 'heart_palp', label: '心跳过快', emoji: '💓', category: '伤心神'),
    Symptom(id: 'chest_palp', label: '心悸胸闷', emoji: '💔', category: '伤心神'),
    Symptom(id: 'anxiety', label: '情绪低落/焦虑', emoji: '😢', category: '伤心神'),
    // 伤精
    Symptom(id: 'waist_knee', label: '腰膝酸软', emoji: '🦵', category: '伤精'),
    Symptom(id: 'memory', label: '记忆力下降', emoji: '🧠', category: '伤精'),
    Symptom(id: 'focus', label: '注意力不集中', emoji: '🎯', category: '伤精'),
    // 伤脾
    Symptom(id: 'appetite', label: '食欲不振', emoji: '🍽️', category: '伤脾'),
    Symptom(id: 'digest', label: '便秘/腹泻', emoji: '💩', category: '伤脾'),
    // 全身
    Symptom(id: 'dizzy', label: '头晕萎靡', emoji: '😵', category: '全身'),
    Symptom(id: 'fatigue', label: '持续疲惫', emoji: '⚡', category: '全身'),
    Symptom(id: 'insomnia', label: '入睡困难', emoji: '🌙', category: '全身'),
  ];
}
