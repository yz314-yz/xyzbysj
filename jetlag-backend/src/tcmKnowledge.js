const symptoms = [
  { id: 'dry_mouth', label: '口干咽燥', patterns: ['yinDeficiency', 'heartFire'] },
  { id: 'eye_dry', label: '眼干涩', patterns: ['yinDeficiency', 'liverConstraint'] },
  { id: 'acne', label: '面部痘痘或潮红', patterns: ['heartFire', 'dampHeat'] },
  { id: 'fatigue', label: '疲倦乏力', patterns: ['qiBloodDeficiency', 'spleenDeficiency'] },
  { id: 'cold_limbs', label: '手脚偏凉', patterns: ['qiBloodDeficiency', 'yangDeficiency'] },
  { id: 'palpitation', label: '心悸胸闷', patterns: ['heartSpirit', 'qiBloodDeficiency'] },
  { id: 'insomnia', label: '入睡困难或多梦', patterns: ['heartSpirit', 'yinDeficiency'] },
  { id: 'anxiety', label: '焦虑烦躁', patterns: ['heartSpirit', 'liverConstraint'] },
  { id: 'poor_appetite', label: '食欲不振', patterns: ['spleenDeficiency'] },
  { id: 'bloating', label: '腹胀便秘', patterns: ['spleenDeficiency', 'dampHeat'] },
  { id: 'back_sore', label: '腰膝酸软', patterns: ['kidneyEssence'] },
  { id: 'memory', label: '注意力下降', patterns: ['kidneyEssence', 'heartSpirit'] },
  { id: 'sweat', label: '虚汗或易出汗', patterns: ['qiBloodDeficiency', 'yinDeficiency'] },
  { id: 'bitter', label: '口苦口黏', patterns: ['dampHeat', 'liverConstraint'] },
];

const patternMeta = {
  yinDeficiency: {
    name: '阴液不足，虚火偏扰',
    short: '偏向津液耗伤，常见口干、眼干、舌红少津。',
    care: '养阴生津，减少辛辣煎炸和连续熬夜。',
    foods: ['银耳百合羹', '山药小米粥', '莲子麦冬茶', '梨汤少糖'],
    exercise: ['八段锦“两手托天理三焦”', '慢走 25 分钟', '腹式呼吸 8 分钟'],
  },
  heartFire: {
    name: '心火偏旺，神志不宁',
    short: '偏向心烦、痘痘、入睡困难，熬夜后更明显。',
    care: '清心安神，夜间减少屏幕刺激。',
    foods: ['莲子百合粥', '绿豆陈皮汤', '苦瓜鸡蛋少油', '淡竹叶代茶饮'],
    exercise: ['内关穴按揉', '站桩 10 分钟', '睡前肩颈放松'],
  },
  heartSpirit: {
    name: '心神失养，睡眠节律紊乱',
    short: '偏向焦虑、心悸、多梦，常与久思、熬夜有关。',
    care: '养心安神，固定入睡仪式。',
    foods: ['桂圆莲子粥', '酸枣仁小米粥', '红枣山药羹', '温牛奶少量'],
    exercise: ['五禽戏鸟伸', '睡前拉伸 12 分钟', '神门穴按揉'],
  },
  qiBloodDeficiency: {
    name: '气血不足，推动无力',
    short: '偏向疲倦、面色少华、手脚无力或虚汗。',
    care: '健脾益气，避免空腹咖啡和过度运动。',
    foods: ['黄芪红枣粥', '山药胡萝卜鸡汤', '黑芝麻糊', '南瓜小米粥'],
    exercise: ['八段锦“调理脾胃须单举”', '饭后散步 15 分钟', '拍打足三里'],
  },
  spleenDeficiency: {
    name: '脾胃失和，运化偏弱',
    short: '偏向腹胀、食欲差、舌苔厚腻或大便不畅。',
    care: '护胃气，三餐定时，少冷饮甜腻。',
    foods: ['薏米赤小豆粥', '陈皮山楂水', '白扁豆山药饭', '萝卜炖牛腩少油'],
    exercise: ['摩腹 5 分钟', '太极云手', '提踵 30 次'],
  },
  dampHeat: {
    name: '湿热内蕴，清浊不分',
    short: '偏向口苦口黏、油腻、痘痘、舌苔黄腻。',
    care: '清利湿热，控制夜宵、酒精和油炸。',
    foods: ['冬瓜薏米汤', '绿豆百合汤', '荷叶粥', '芹菜木耳'],
    exercise: ['快走微汗 20 分钟', '敲胆经', '开合跳低强度 2 组'],
  },
  liverConstraint: {
    name: '肝郁气滞，疏泄不畅',
    short: '偏向烦躁、胸胁不舒、口苦、眼干。',
    care: '疏肝理气，安排户外光照和稳定情绪出口。',
    foods: ['玫瑰陈皮茶', '佛手瓜炒蛋', '菠菜猪肝汤少量', '荞麦面'],
    exercise: ['扩胸运动', '慢跑或骑行 20 分钟', '太冲穴按揉'],
  },
  kidneyEssence: {
    name: '肾精亏虚，恢复力下降',
    short: '偏向腰膝酸软、注意力下降、黑眼圈或久熬后难恢复。',
    care: '补肾藏精，优先保证深睡眠。',
    foods: ['黑豆核桃粥', '枸杞山药蒸蛋', '桑葚粥', '芝麻糊'],
    exercise: ['擦腰温肾 3 分钟', '八段锦“攒拳怒目增气力”', '静蹲 2 组'],
  },
  yangDeficiency: {
    name: '阳气不足，温煦偏弱',
    short: '偏向怕冷、手脚凉、精神不足。',
    care: '温阳护中，避免久坐受凉。',
    foods: ['生姜红枣水', '羊肉萝卜汤少量', '桂圆山药粥', '韭菜鸡蛋'],
    exercise: ['晨间晒背 10 分钟', '踮脚提肛', '八段锦全套'],
  },
};

const meridianClock = [
  { range: '23:00-01:00', name: '子时', meridian: '胆经', advice: '宜熟睡，帮助胆气生发。' },
  { range: '01:00-03:00', name: '丑时', meridian: '肝经', advice: '宜深睡，利于肝血收藏。' },
  { range: '03:00-05:00', name: '寅时', meridian: '肺经', advice: '宜安卧，避免早醒后立刻用脑。' },
  { range: '05:00-07:00', name: '卯时', meridian: '大肠经', advice: '宜起床饮温水，培养排便节律。' },
  { range: '07:00-09:00', name: '辰时', meridian: '胃经', advice: '宜吃温热早餐，保护胃气。' },
  { range: '09:00-11:00', name: '巳时', meridian: '脾经', advice: '宜专注工作，少甜腻冷饮。' },
  { range: '11:00-13:00', name: '午时', meridian: '心经', advice: '宜小憩 15-20 分钟，养心神。' },
  { range: '13:00-15:00', name: '未时', meridian: '小肠经', advice: '宜轻食慢行，帮助消化吸收。' },
  { range: '15:00-17:00', name: '申时', meridian: '膀胱经', advice: '宜补水伸展，疏通背部经络。' },
  { range: '17:00-19:00', name: '酉时', meridian: '肾经', advice: '宜收敛强度，避免过晚剧烈运动。' },
  { range: '19:00-21:00', name: '戌时', meridian: '心包经', advice: '宜放松交流，减少情绪内耗。' },
  { range: '21:00-23:00', name: '亥时', meridian: '三焦经', advice: '宜洗漱泡脚，准备入睡。' },
];

const sevenDayThemes = [
  ['清心降火', '莲子百合粥 + 清炒菠菜 + 冬瓜汤', '八段锦 15 分钟，内关穴各 1 分钟', '22:30 上床，睡前 30 分钟离屏'],
  ['健脾和胃', '山药小米粥 + 胡萝卜鸡丝 + 陈皮水', '饭后慢走 20 分钟，摩腹 5 分钟', '午休 20 分钟，晚餐七分饱'],
  ['疏肝理气', '荞麦面 + 佛手瓜炒蛋 + 玫瑰陈皮茶', '扩胸运动 3 组，太冲穴各 2 分钟', '21:30 后只做轻任务'],
  ['养阴生津', '银耳雪梨羹 + 莲藕排骨汤少油', '腹式呼吸 8 分钟，肩颈拉伸', '卧室保持微暗，避免辛辣夜宵'],
  ['益气养血', '黄芪红枣粥 + 山药蒸蛋 + 南瓜', '足三里按揉，慢走 25 分钟', '固定 7:00 起床晒太阳'],
  ['温肾藏精', '黑豆核桃粥 + 枸杞山药 + 温蔬菜', '擦腰温肾 3 分钟，静蹲 2 组', '23:00 前入睡，避免熬夜补偿性刷屏'],
  ['整合复盘', '清淡均衡餐，少油少糖，温水为主', '八段锦全套或太极云手 20 分钟', '记录睡眠、食欲、精神三项变化'],
];

module.exports = { symptoms, patternMeta, meridianClock, sevenDayThemes };
