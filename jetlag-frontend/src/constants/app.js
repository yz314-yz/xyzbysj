export const DEFAULT_MODEL_NAME = 'Qwen/Qwen2.5-VL-3B-Instruct';
export const INFERENCE_MODE_PUBLIC = 'public-free';
export const INFERENCE_MODE_OFFLINE_QWEN = 'offline-qwen';
export const REQUEST_TIMEOUT_MS = 45 * 1000;
export const CONFIG_TIMEOUT_MS = 8 * 1000;
export const ACCEPTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
export const ACCEPTED_IMAGE_INPUT = 'image/jpeg,image/png,image/webp';

export const inferenceModeOptions = [
  {
    id: INFERENCE_MODE_PUBLIC,
    label: '公网体验',
    title: '公网免费体验版',
    shortLabel: '浏览器识别 + 规则',
    description: '图片在访客浏览器内提取轻量特征，提交时只发送结构化结果。',
  },
  {
    id: INFERENCE_MODE_OFFLINE_QWEN,
    label: '离线增强',
    title: '离线增强演示版',
    shortLabel: '本机 Qwen2.5-VL',
    description: '仅在答辩电脑或已安装完整模型的电脑上调用本地 Qwen2.5-VL。',
  },
];

export const MERIDIAN_TABLE = [
  { range: '23:00-01:00', name: '子时', meridian: '胆经', advice: '宜熟睡养胆气' },
  { range: '01:00-03:00', name: '丑时', meridian: '肝经', advice: '深睡利肝血收藏' },
  { range: '03:00-05:00', name: '寅时', meridian: '肺经', advice: '安卧避早醒用脑' },
  { range: '05:00-07:00', name: '卯时', meridian: '大肠经', advice: '饮温水培养排便' },
  { range: '07:00-09:00', name: '辰时', meridian: '胃经', advice: '温热早餐护胃气' },
  { range: '09:00-11:00', name: '巳时', meridian: '脾经', advice: '专注工作少甜腻' },
  { range: '11:00-13:00', name: '午时', meridian: '心经', advice: '小憩 15 分钟养心' },
  { range: '13:00-15:00', name: '未时', meridian: '小肠经', advice: '轻食慢行助消化' },
  { range: '15:00-17:00', name: '申时', meridian: '膀胱经', advice: '补水伸展通背部' },
  { range: '17:00-19:00', name: '酉时', meridian: '肾经', advice: '收敛强度养肾精' },
  { range: '19:00-21:00', name: '戌时', meridian: '心包经', advice: '放松交流减内耗' },
  { range: '21:00-23:00', name: '亥时', meridian: '三焦经', advice: '泡脚准备入睡' },
];

export function getMeridian(hour) {
  return MERIDIAN_TABLE[Math.floor(((Number(hour) + 1) % 24) / 2)] || MERIDIAN_TABLE[0];
}

export const fallbackSymptomOptions = [
  { id: 'dry_mouth', label: '口干咽燥' },
  { id: 'eye_dry', label: '眼干涩' },
  { id: 'acne', label: '面部痘痘或潮红' },
  { id: 'fatigue', label: '疲倦乏力' },
  { id: 'cold_limbs', label: '手脚偏凉' },
  { id: 'palpitation', label: '心悸胸闷' },
  { id: 'insomnia', label: '入睡困难或多梦' },
  { id: 'anxiety', label: '焦虑烦躁' },
  { id: 'poor_appetite', label: '食欲不振' },
  { id: 'bloating', label: '腹胀便秘' },
  { id: 'back_sore', label: '腰膝酸软' },
  { id: 'memory', label: '注意力下降' },
  { id: 'sweat', label: '虚汗或易出汗' },
  { id: 'bitter', label: '口苦口黏' },
];

export const emptyProfile = { age: '', gender: '', bedtime: '', wakeTime: '' };
export const emptyFiles = { tongue: null, face: null, palm: null };

export function createEmptyResult(modelName = DEFAULT_MODEL_NAME, inferenceMode = INFERENCE_MODE_PUBLIC) {
  const offlineMode = inferenceMode === INFERENCE_MODE_OFFLINE_QWEN;
  return {
    inferenceMode,
    mode: offlineMode ? 'offline-qwen25-vl-standby' : 'public-free-browser-rules',
    engineStatus: {
      rules: {
        enabled: true,
        provider: '规则引擎',
        active: true,
        role: '根据症状、浏览器特征和子午流注生成体质方向与七日养生计划。',
      },
      browserVision: {
        provider: '浏览器轻量识别',
        model: 'browser-lightweight-v1',
        configured: true,
        active: false,
        runtime: 'visitor-browser',
        role: '在访客浏览器内提取亮度、清晰度、颜色倾向等可观察特征。',
      },
      vision: {
        provider: 'Qwen2.5-VL',
        model: modelName,
        configured: false,
        active: false,
        requested: offlineMode,
        baseURL: '',
        fallbackReason: offlineMode
          ? '离线增强模式需连接本机 Qwen2.5-VL 服务。'
          : '公网体验版不调用服务端 Qwen2.5-VL。',
      },
    },
    disclaimer: '⚠️ AI 分析仅供学术参考，不作为医疗诊断。请咨询执业中医师。',
    observation: {
      tongue: '舌像待采集：建议在自然光下平拍，避免美颜和强滤镜。',
      face: '面相待采集：建议正脸、自然光、无遮挡拍摄。',
      palm: '手相待采集：建议掌心展开、光线均匀拍摄。',
    },
    selectedSymptoms: [],
    constitution: {
      primary: '等待生成评估',
      secondary: [],
      explanation: '请选择症状并按需上传图像，系统会生成体质方向与七日养生计划。',
      confidence: 0,
      primaryCare: '',
    },
    meridian: { name: '', meridian: '', range: '', advice: '' },
    immediateActions: ['尚未生成方案。请先完成症状选择、基础信息或图像采集。'],
    localVision: null,
    qwenVision: null,
    sevenDayPlan: [],
  };
}

