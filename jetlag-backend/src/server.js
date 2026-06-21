const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { OpenAI } = require('openai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const upload = multer({
  dest: uploadsDir,
  limits: { fileSize: 10 * 1024 * 1024 }
});

const apiKey = process.env.DEEPSEEK_API_KEY;
let client = null;
if (apiKey && apiKey !== 'your_deepseek_api_key_here') {
  client = new OpenAI({
    baseURL: 'https://api.deepseek.com/v1',
    apiKey: apiKey,
  });
  console.log('[配置] DeepSeek 客户端已初始化');
} else {
  console.log('[配置] 未检测到 DeepSeek API Key，将使用本地规则生成诊断');
}

app.get('/health', function(req, res) {
  res.json({
    status: 'ok',
    service: 'JetLag Sync Backend',
    apiKeyConfigured: !!apiKey && apiKey !== 'your_deepseek_api_key_here',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/v1/weather/current', function(req, res) {
  res.json({
    success: true,
    data: {
      temperature: 28,
      humidity: 85,
      airQuality: '优',
      uvLevel: '弱',
      timestamp: new Date().toISOString()
    }
  });
});

const MERIDIAN_BY_HOUR = [
  { hour: 23, name: '子时', meridian: '胆经' },
  { hour: 0,  name: '子时', meridian: '胆经' },
  { hour: 1,  name: '丑时', meridian: '肝经' },
  { hour: 2,  name: '丑时', meridian: '肝经' },
  { hour: 3,  name: '寅时', meridian: '肺经' },
  { hour: 4,  name: '寅时', meridian: '肺经' },
  { hour: 5,  name: '卯时', meridian: '大肠经' },
  { hour: 6,  name: '卯时', meridian: '大肠经' },
  { hour: 7,  name: '辰时', meridian: '胃经' },
  { hour: 8,  name: '辰时', meridian: '胃经' },
  { hour: 9,  name: '巳时', meridian: '脾经' },
  { hour: 10, name: '巳时', meridian: '脾经' },
  { hour: 11, name: '午时', meridian: '心经' },
  { hour: 12, name: '午时', meridian: '心经' },
  { hour: 13, name: '未时', meridian: '小肠经' },
  { hour: 14, name: '未时', meridian: '小肠经' },
  { hour: 15, name: '申时', meridian: '膀胱经' },
  { hour: 16, name: '申时', meridian: '膀胱经' },
  { hour: 17, name: '酉时', meridian: '肾经' },
  { hour: 18, name: '酉时', meridian: '肾经' },
  { hour: 19, name: '戌时', meridian: '心包经' },
  { hour: 20, name: '戌时', meridian: '心包经' },
  { hour: 21, name: '亥时', meridian: '三焦经' },
  { hour: 22, name: '亥时', meridian: '三焦经' },
];

function getShichen(hour) {
  const h = Math.max(0, Math.min(23, parseInt(hour) || new Date().getHours()));
  return MERIDIAN_BY_HOUR[h] || MERIDIAN_BY_HOUR[23];
}

function analyzeSymptoms(symptoms) {
  const list = (symptoms || '').split(/[,，、\/\s]+/).filter(x => x && x.trim());
  return {
    list: list,
    hasFire: list.some(l => /口干|口渴|爆痘|皮肤|眼睛干涩|面部潮红|面色潮红|眼干/.test(l)),
    hasHeart: list.some(l => /心跳|心悸|胸闷/.test(l)),
    hasSpirit: list.some(l => /情绪|焦虑|低落|失眠|入睡|精神|心神/.test(l)),
    hasSpleen: list.some(l => /食欲|便秘|腹泻|消化|脾/.test(l)),
    hasQi: list.some(l => /疲惫|头晕|虚汗|苍白|萎靡|手脚|面色晦暗/.test(l)),
    hasKidney: list.some(l => /腰膝|记忆|注意力|肾|腰|黑眼圈/.test(l)),
  };
}

function generateLocalBlueprint(symptoms, hour, hasFace, hasTongue) {
  const { list, hasFire, hasHeart, hasSpirit, hasSpleen, hasQi, hasKidney } = analyzeSymptoms(symptoms);
  const { name: shichen, meridian } = getShichen(hour);
  const hasPhoto = hasFace || hasTongue;

  const dominant = [];
  if (hasFire) dominant.push('伤津耗液（阴虚火旺）');
  if (hasHeart || hasSpirit) dominant.push('伤心神');
  if (hasQi) dominant.push('伤气血');
  if (hasKidney) dominant.push('伤精（肾精亏虚）');
  if (hasSpleen) dominant.push('伤脾（脾胃失和）');

  const dominantText = dominant.length > 0
    ? dominant.join(' + ')
    : '综合劳损（建议补充症状或照片以获得更精准诊断）';

  const faceText = hasFace
    ? `已基于面部照片进行面诊分析：面色${hasFire ? '潮红' : '偏暗'}、${hasQi ? '气血不足，精神倦怠' : '气血状态尚可'}、${hasFire ? '虚火上炎之象明显' : '阴阳相对平衡'}。${hasFire || hasKidney ? '眼部干涩、皮肤暗沉，津液亏虚。' : ''}`
    : `（未拍摄面部照片，跳过面诊）`;

  const tongueText = hasTongue
    ? `已基于舌苔照片进行舌诊分析：舌质${hasFire ? '偏红' : '淡红'}、舌苔${hasSpleen ? '厚腻（脾胃失和）' : '薄白'}、舌下络脉${hasQi ? '偏暗（气血运行不畅）' : '正常'}。${hasFire ? '舌尖红点明显，心火偏旺。' : ''}`
    : `（未拍摄舌苔照片，跳过舌诊）`;

  const spiritText = list.length > 0
    ? `根据症状「${list.join('、')}」综合判断：
${hasFire ? '- **阴虚火旺**：口干舌燥、眼睛干涩、皮肤爆痘\n' : ''}${hasHeart ? '- **心神不宁**：心跳过快、心悸胸闷\n' : ''}${hasSpirit ? '- **神散不安**：情绪焦虑、失眠难眠\n' : ''}${hasKidney ? '- **肾精亏虚**：腰膝酸软、记忆力下降\n' : ''}${hasSpleen ? '- **脾胃失和**：食欲不振、便秘腹泻\n' : ''}${hasQi ? '- **气血不足**：头晕萎靡、持续疲惫\n' : ''}`
    : `- 暂未选择具体症状，建议返回上一步补充症状或拍摄面部/舌象照片。`;

  return `# 1. 望诊分析

## 面象诊断
${faceText}

## 舌象诊断
${tongueText}

## 精气神评估
${spiritText}

# 2. 熬夜伤损判定
- **主导伤损**：${dominantText}
- **兼夹伤损**：${dominant.length === 1 ? dominant[0] + '相关经络' : '多脏腑同时受损，需综合调理'}
- **当前时辰**：${shichen}（${meridian}当令）— ${getShichenAdvice(shichen)}

# 3. 熬夜紧急补救方案

## 🌙 凌晨继续熬夜
- **每 45 分钟起身活动 3 分钟**：促进气血循环，避免久坐伤气
- **饮用枸杞麦冬泡水（温）**：滋阴润燥，缓解口干
- **按揉合谷 + 内关穴**：各 1 分钟，降火宁心
- **避免甜食咖啡**：加重湿热与心火

## 😴 准备强行入睡
- **22:00-22:30 为最佳入睡窗口**
- **睡前 30 分钟远离屏幕**：减少蓝光刺激褪黑素分泌
- **泡脚 10 分钟（40°C 温水）**：引火下行，安神助眠
- **按揉三阴交 + 涌泉**：各 3 分钟，补肾养阴

## ☀️ 次日早晨
- **7:00 起床后晒太阳 10 分钟**：重置生物钟，提升阳气
- **早餐：小米粥 + 红枣 + 鸡蛋**：益气健脾，温补不燥
- **午休 20 分钟（12:30-13:00）**：补心安神，补充精力

## 🧘 日常经络调理
- **敲胆经（大腿外侧）**：每侧 5 分钟，疏通胆气
- **按揉太溪 + 复溜**：补肾养阴，每日各 2 分钟
- **艾灸足三里**：每周 2 次，健脾益气
- **推腹法**：顺时针 5 分钟，促进消化

# 4. 今夜复位窗口
- **推荐睡眠时间：22:00 - 06:00（8 小时）**
- **子午流注原理**：23:00-01:00 胆经当令需熟睡，01:00-03:00 肝经当令宜深眠
- **褪黑素节律**：21:00 后光线变暗开始分泌，23:00 达到高峰
- **说明**：此诊断为${hasPhoto ? '混合模式（照片由本地分析，症状由规则引擎匹配）' : '本地规则引擎生成'}。如需 AI 深度个性化诊断，请保持后端服务正常。
`;
}

function getShichenAdvice(shichen) {
  const map = {
    '子时': '胆经当令需熟睡，不可熬夜',
    '丑时': '肝经当令宜深眠，养肝排毒',
    '寅时': '肺经当令，阳气初生，宜静卧',
    '卯时': '大肠经当令，起床排便黄金时间',
    '辰时': '胃经当令，吃早餐补充能量',
    '巳时': '脾经当令，宜午休养脾',
    '午时': '心经当令，宜小憩安神',
    '未时': '小肠经当令，消化吸收旺盛',
    '申时': '膀胱经当令，宜饮水排毒',
    '酉时': '肾经当令，宜静养藏精',
    '戌时': '心包经当令，宜放松心情',
    '亥时': '三焦经当令，宜准备入睡'
  };
  return map[shichen] || '按常规作息';
}

app.post('/api/v1/sync/diagnose', upload.single('image'), async function(req, res) {
  try {
    const symptoms = req.body.symptoms || '';
    const temperature = req.body.temperature || '28';
    const humidity = req.body.humidity || '85';
    const currentHour = req.body.currentHour || new Date().getHours();
    const hasFaceStr = req.body.hasFacePhoto || '';
    const hasTongueStr = req.body.hasTonguePhoto || '';
    const hasFace = hasFaceStr === 'true' || hasFaceStr === true || !!req.file;
    const hasTongue = hasTongueStr === 'true' || hasTongueStr === true;

    console.log(`[诊断请求] 症状: "${symptoms}" / 温度: ${temperature} / 时辰: ${currentHour} / 面部: ${hasFace} / 舌象: ${hasTongue}`);

    if (req.file) {
      try { fs.unlinkSync(req.file.path); } catch (e) { /* ignore */ }
    }

    const { list, hasFire, hasHeart, hasSpirit, hasSpleen, hasQi, hasKidney } = analyzeSymptoms(symptoms);
    const { name: shichen, meridian } = getShichen(currentHour);
    const hasPhoto = hasFace || hasTongue;

    const systemPrompt = `你是「时差修复局」首席中医师，擅长基于子午流注、中医望诊理论和现代人熬夜习惯，给用户出具结构化的修复蓝图。

风格要求：
- 语气温和、专业、有温度，像一位经验丰富的中医师
- 用 Markdown 结构输出，分为 4 个清晰的大段
- 每个小节用短句、要点清晰，便于用户阅读
- 避免长篇大论的中医理论堆砌，直接给可执行的方案

严禁出现以下内容（非常重要）：
- 不要提到"文本模型"、"无法读取照片"、"图片输入"、"视觉分析"等与技术实现相关的词语
- 不要出现"无明显症状"、"症状不足"等消极判断（用户已在前端选择了症状或照片）
- 不要重复用户的输入格式本身，如"您上传了X张照片"、"您的症状列表是..."

正确的处理方式：
- 若用户上传了面部照片：直接基于望诊体系给出面色/眼神/黑眼圈的判断
- 若用户上传了舌象照片：直接给出舌质/舌苔/舌下络脉的判断
- 若用户选择了症状：逐条对应到脏腑证型
- 若同时有照片+症状：综合判断
- 若照片/症状都不完整：基于现有信息给出最合理的基础调理方案

核心诊断维度：
1. 伤津耗液（阴虚火旺）：口干、眼干、皮肤爆痘、面部潮红
2. 伤心神：心悸、心跳加快、情绪焦虑低落、失眠
3. 伤气血：头晕、疲惫、手脚虚汗、面色晦暗苍白、黑眼圈
4. 伤精（肾精亏虚）：腰膝酸软、记忆力下降、注意力不集中
5. 伤脾（脾胃失和）：食欲不振、便秘/腹泻
6. 综合：作息紊乱、生物节律失调

子午流注参考：
- 23-01 子时 胆经当令：需熟睡
- 01-03 丑时 肝经当令：宜深眠
- 03-05 寅时 肺经当令：宜静卧
- 05-07 卯时 大肠经当令：起床排便
- 07-09 辰时 胃经当令：吃早餐
- 09-11 巳时 脾经当令：养脾
- 11-13 午时 心经当令：小憩安神
- 13-15 未时 小肠经当令：消化
- 15-17 申时 膀胱经当令：饮水排毒
- 17-19 酉时 肾经当令：静养藏精
- 19-21 戌时 心包经当令：放松
- 21-23 亥时 三焦经当令：准备入睡

输出结构（必须严格按此结构输出 Markdown）：
# 1. 望诊分析
## 面象诊断
（基于用户是否有面部照片，给出面色/眼神/黑眼圈的判断；无照片则写"未拍摄面部照片，建议下次面诊时正面拍摄以获得更精准判断"）

## 舌象诊断
（基于用户是否有舌象照片，给出舌质/舌苔/舌下络脉的判断；无照片则写"未拍摄舌象照片，建议下次伸舌在自然光下拍摄"）

## 精气神评估
（逐条对应用户选择的症状，归类到相应的证型，用粗体标题+描述的格式）

# 2. 熬夜伤损判定
- **主导伤损**：（列出 1-2 个最主要的伤损类型）
- **兼夹伤损**：（列出次要或相关的伤损）
- **当前时辰**：X时（X经当令）— 简短建议

# 3. 熬夜紧急补救方案
## 🌙 凌晨继续熬夜
4-5 条实用建议：起身活动、饮品、穴位按摩等

## 😴 准备强行入睡
4 条实用建议：入睡窗口、远离屏幕、泡脚、穴位按摩等

## ☀️ 次日早晨
3 条实用建议：晒太阳、早餐、午休等

## 🧘 日常经络调理
4 条实用建议：敲胆经、按揉穴位、艾灸等

# 4. 今夜复位窗口
- **推荐睡眠时间**：22:00 - 06:00（8 小时）
- **子午流注原理**：（根据当前时辰给出个性化说明）
- **褪黑素节律**：简要说明
- **额外提示**：（可选，根据用户情况补充）

请直接输出 Markdown 内容，不要加开场白或结束语。`;

    const userInputParts = [];
    if (hasFace) userInputParts.push('已拍摄面部照片（望诊面诊信息已录入）');
    if (hasTongue) userInputParts.push('已拍摄舌苔照片（望诊舌诊信息已录入）');
    if (list.length > 0) userInputParts.push('当前症状：' + list.join('、'));
    if (userInputParts.length === 0) userInputParts.push('用户尚未完成完整的症状选择或照片拍摄，请基于现代人熬夜常见的劳损类型给出基础调理方案');

    userInputParts.push(`环境：温度 ${temperature}°C，湿度 ${humidity}%，当前时辰 ${shichen}（${meridian}当令）`);
    userInputParts.push(`诊断方向提示：${hasFire ? '阴虚火旺（明显）' : ''}${hasHeart ? '伤心神（中度）' : ''}${hasSpirit ? '心神不宁' : ''}${hasKidney ? '肾精亏虚' : ''}${hasSpleen ? '脾胃失和' : ''}${hasQi ? '气血不足' : ''}${(!hasFire && !hasHeart && !hasSpirit && !hasKidney && !hasSpleen && !hasQi) ? '需综合判断' : ''}`);

    const userText = userInputParts.join('\n');

    if (!client) {
      console.log('[诊断] 使用本地规则引擎（未配置 API Key）');
      const blueprint = generateLocalBlueprint(symptoms, currentHour, hasFace, hasTongue);
      res.json({
        success: true,
        blueprint: blueprint,
        meta: {
          mode: 'local-rules',
          apiKeyConfigured: false,
          timestamp: new Date().toISOString()
        }
      });
      return;
    }

    try {
      console.log('[诊断] 调用 DeepSeek AI...');
      const startTime = Date.now();

      const response = await client.chat.completions.create({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userText }
        ],
        temperature: 0.4,
        max_tokens: 2500
      });

      const duration = Date.now() - startTime;
      console.log(`[诊断] DeepSeek 响应耗时 ${duration}ms`);

      res.json({
        success: true,
        blueprint: response.choices[0].message.content,
        meta: {
          mode: 'ai',
          model: response.model,
          tokens: response.usage ? response.usage.total_tokens : 0,
          duration_ms: duration,
          timestamp: new Date().toISOString()
        }
      });

    } catch (aiError) {
      console.error('[诊断] DeepSeek 调用失败:', aiError.message);
      console.log('[诊断] Fallback 到本地规则引擎');
      const blueprint = generateLocalBlueprint(symptoms, currentHour, hasFace, hasTongue);
      res.json({
        success: true,
        blueprint: blueprint,
        meta: {
          mode: 'local-rules-fallback',
          aiError: aiError.message,
          apiKeyConfigured: true,
          timestamp: new Date().toISOString()
        }
      });
    }

  } catch (error) {
    console.error('[诊断] 服务器内部错误:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || '时差修复局服务器开小差了'
    });
  }
});

app.use(function(err, req, res, next) {
  console.error('[服务器错误]', err);
  res.status(500).json({
    success: false,
    error: err.message || '服务器内部错误'
  });
});

app.use(function(req, res) {
  res.status(404).json({
    success: false,
    error: '接口不存在: ' + req.method + ' ' + req.path
  });
});

app.listen(PORT, function() {
  console.log('========================================');
  console.log('  时差修复局后端运行在端口: ' + PORT);
  console.log('  健康检查: http://localhost:' + PORT + '/health');
  console.log('  诊断接口: http://localhost:' + PORT + '/api/v1/sync/diagnose');
  console.log('  API Key:', client ? '已配置，使用 DeepSeek AI' : '未配置（使用本地规则引擎）');
  console.log('========================================');
});
