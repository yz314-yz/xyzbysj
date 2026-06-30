export const DEFAULT_MODEL_NAME = 'Qwen/Qwen2.5-VL-3B-Instruct';
export const REQUEST_TIMEOUT_MS = 45 * 1000;
export const CONFIG_TIMEOUT_MS = 8 * 1000;
export const ACCEPTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
export const ACCEPTED_IMAGE_INPUT = 'image/jpeg,image/png,image/webp';

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

export function createEmptyResult(modelName = DEFAULT_MODEL_NAME) {
  return {
    mode: 'local-rules',
    engineStatus: {
      rules: {
        enabled: true,
        provider: '本地规则引擎',
        active: true,
        role: '根据症状、采集项和子午流注生成体质方向与七日养生计划。',
      },
      vision: {
        provider: 'Qwen2.5-VL',
        model: modelName,
        configured: false,
        active: false,
        baseURL: '',
        fallbackReason: '等待上传图像后启用 Qwen2.5-VL；未采集图像时仅展示本地规则结果。',
      },
    },
    disclaimer: 'AI 分析仅供学术展示与日常养生参考，不能替代执业医师诊断、治疗或处方。',
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
    qwenVision: null,
    sevenDayPlan: [],
  };
}

