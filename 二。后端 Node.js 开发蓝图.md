# JetLag Sync - 后端 Node.js 开发蓝图

## 一、项目初始化

### 1.1 创建项目结构

```bash
cd jetlag-backend
npm init -y
```

### 1.2 安装核心依赖

```bash
npm install express multer axios dotenv cors
```

| 依赖 | 用途 |
|------|------|
| express | Web 框架 |
| multer | 接收安卓上传的望诊照片 |
| axios | 调用 DeepSeek API |
| dotenv | 管理 API 密钥 |
| cors | 跨域资源共享 |

### 1.3 项目结构

```
jetlag-backend/
├── src/
│   ├── controllers/
│   │   ├── aiController.js
│   │   └── weatherController.js
│   ├── routes/
│   │   ├── aiRoutes.js
│   │   └── weatherRoutes.js
│   ├── middleware/
│   │   └── uploadMiddleware.js
│   ├── services/
│   │   └── deepseekService.js
│   └── server.js
├── uploads/           # 临时存放上传图片
├── .env               # 环境变量
├── .gitignore
└── package.json
```

---

## 二、环境变量配置

创建 `.env` 文件：

```env
DEEPSEEK_API_KEY=your_deepseek_api_key_here
PORT=3000
NODE_ENV=development
```

创建 `.gitignore`：

```gitignore
node_modules/
.env
uploads/*
!uploads/.gitkeep
```

---

## 三、核心模块实现

### 3.1 DeepSeek 服务 (services/deepseekService.js)

```javascript
const axios = require('axios');

class DeepseekService {
  constructor() {
    this.apiKey = process.env.DEEPSEEK_API_KEY;
    this.baseUrl = 'https://api.deepseek.com/v1';
  }

  /**
   * 面色/舌苔分析
   * @param {string} imageBase64 - 图片 Base64 编码
   * @param {object} envData - 环境数据
   * @returns {Promise<object>} 诊断结果
   */
  async analyzeFace(imageBase64, envData) {
    const prompt = this.buildDiagnosisPrompt(envData);

    const response = await axios.post(
      `${this.baseUrl}/chat/completions`,
      {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`
                }
              }
            ]
          }
        ],
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return this.parseDiagnosisResponse(response.data);
  }

  /**
   * 构建诊断提示词
   */
  buildDiagnosisPrompt(envData) {
    return `你是中医面诊专家。请根据用户的面色照片结合环境数据进行分析。

环境数据：
- 温度：${envData?.temperature || '未知'}°C
- 湿度：${envData?.humidity || '未知'}%
- 空气质量：${envData?.airQuality || '未知'}
- 紫外线：${envData?.uvLevel || '未知'}

请返回以下格式的 JSON（仅返回 JSON，不要其他内容）：
{
  "summary": "面色描述和初步诊断",
  "findings": ["症状1", "症状2", "症状3"],
  "meridianState": "当前经络状态",
  "recommendations": ["建议1", "建议2"]
}`;
  }

  /**
   * 解析诊断响应
   */
  parseDiagnosisResponse(data) {
    const content = data.choices[0].message.content;
    // 提取 JSON 部分
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('无法解析诊断响应');
  }

  /**
   * 生成修复方案
   * @param {object} diagnosis - 诊断结果
   * @param {array} symptoms - 用户选择的症状
   */
  async generateSyncPlan(diagnosis, symptoms) {
    const prompt = `基于以下诊断结果和用户症状，生成个性化修复方案。

诊断结果：${diagnosis.summary}
发现项：${diagnosis.findings.join(', ')}
经络状态：${diagnosis.meridianState}

用户症状：${symptoms.join(', ')}

请生成 3 个修复协议卡片：
1. BIO-HACK（紧急能量补给）
2. ACUPRESSURE（经络疏通）
3. SLEEP（睡眠窗口）

返回格式 JSON：
{
  "protocols": [
    {
      "type": "BIO-HACK",
      "title": "协议标题",
      "description": "详细描述",
      "priority": "HIGH/MEDIUM/LOW",
      "actionItems": ["具体行动项"]
    }
  ]
}`;
    // ... 调用 DeepSeek API
  }
}

module.exports = new DeepseekService();
```

### 3.2 上传中间件 (middleware/uploadMiddleware.js)

```javascript
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 确保 uploads 目录存在
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `face-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('仅支持 JPG/PNG 格式图片'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

module.exports = upload;
```

### 3.3 AI 控制器 (controllers/aiController.js)

```javascript
const deepseekService = require('../services/deepseekService');
const upload = require('../middleware/uploadMiddleware');
const fs = require('fs');
const path = require('path');

class AiController {
  /**
   * 上传并分析望诊照片
   * POST /api/ai/analyze
   */
  async analyze(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: '请上传望诊照片'
        });
      }

      // 读取图片并转为 Base64
      const imagePath = req.file.path;
      const imageBuffer = fs.readFileSync(imagePath);
      const imageBase64 = imageBuffer.toString('base64');

      // 解析环境数据
      const envData = req.body.envData ? JSON.parse(req.body.envData) : {};

      // 调用 DeepSeek 分析
      const result = await deepseekService.analyzeFace(imageBase64, envData);

      // 清理临时文件
      fs.unlinkSync(imagePath);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('AI 分析失败:', error);
      res.status(500).json({
        success: false,
        error: 'AI 分析失败，请稍后重试'
      });
    }
  }

  /**
   * 生成修复方案
   * POST /api/ai/sync-plan
   */
  async generateSyncPlan(req, res) {
    try {
      const { diagnosis, symptoms } = req.body;

      if (!diagnosis) {
        return res.status(400).json({
          success: false,
          error: '缺少诊断结果'
        });
      }

      const result = await deepseekService.generateSyncPlan(diagnosis, symptoms || []);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('生成修复方案失败:', error);
      res.status(500).json({
        success: false,
        error: '生成修复方案失败'
      });
    }
  }
}

module.exports = new AiController();
```

### 3.4 天气控制器 (controllers/weatherController.js)

```javascript
const axios = require('axios');

class WeatherController {
  constructor() {
    // 可使用 OpenWeatherMap 或其他天气 API
    this.weatherApiKey = process.env.WEATHER_API_KEY;
  }

  /**
   * 获取当前环境数据
   * GET /api/weather/current?lat=40.7128&lon=-74.0060
   */
  async getCurrentWeather(req, res) {
    try {
      const { lat, lon } = req.query;

      if (!lat || !lon) {
        return res.status(400).json({
          success: false,
          error: '缺少经纬度参数'
        });
      }

      // 模拟数据（实际项目可接入真实 API）
      const data = await this.fetchWeatherData(parseFloat(lat), parseFloat(lon));

      res.json({
        success: true,
        data
      });
    } catch (error) {
      console.error('获取天气数据失败:', error);
      res.status(500).json({
        success: false,
        error: '获取天气数据失败'
      });
    }
  }

  /**
   * 获取天气数据
   */
  async fetchWeatherData(lat, lon) {
    // 实际项目中接入 OpenWeatherMap API
    // const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${this.weatherApiKey}&units=metric`);

    // 模拟返回
    return {
      temperature: 28,
      humidity: 85,
      airQuality: '优',
      uvLevel: '弱',
      stressLevel: this.calculateStress(28, 85, '优', '弱')
    };
  }

  /**
   * 计算环境压力指数
   */
  calculateStress(temp, humidity, airQuality, uv) {
    let score = 0;

    if (temp > 30 || temp < 10) score += 2;
    if (humidity > 80) score += 2;
    if (airQuality !== '优') score += 1;
    if (uv === '强') score += 1;

    if (score <= 2) return 'LOW';
    if (score <= 4) return 'MEDIUM';
    return 'HIGH';
  }
}

module.exports = new WeatherController();
```

### 3.5 路由定义

**routes/aiRoutes.js**：
```javascript
const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const upload = require('../middleware/uploadMiddleware');

router.post('/analyze', upload.single('image'), aiController.analyze);
router.post('/sync-plan', aiController.generateSyncPlan);

module.exports = router;
```

**routes/weatherRoutes.js**：
```javascript
const express = require('express');
const router = express.Router();
const weatherController = require('../controllers/weatherController');

router.get('/current', weatherController.getCurrentWeather);

module.exports = router;
```

### 3.6 服务入口 (server.js)

```javascript
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const aiRoutes = require('./routes/aiRoutes');
const weatherRoutes = require('./routes/weatherRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 静态文件
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 路由
app.use('/api/ai', aiRoutes);
app.use('/api/weather', weatherRoutes);

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({
    success: false,
    error: err.message || '服务器内部错误'
  });
});

app.listen(PORT, () => {
  console.log(`JetLag Backend 运行于 http://localhost:${PORT}`);
});
```

---

## 四、API 测试

### 4.1 使用 curl 测试

**健康检查**：
```bash
curl http://localhost:3000/health
```

**上传图片分析**：
```bash
curl -X POST http://localhost:3000/api/ai/analyze \
  -F "image=@/path/to/photo.jpg" \
  -F "envData={\"temperature\":28,\"humidity\":85}"
```

**生成修复方案**：
```bash
curl -X POST http://localhost:3000/api/ai/sync-plan \
  -H "Content-Type: application/json" \
  -d '{
    "diagnosis": {
      "summary": "面色萎靡、舌红少苔",
      "findings": ["湿气重", "心火旺"],
      "meridianState": "心经当令"
    },
    "symptoms": ["手脚冒虚汗", "头晕萎靡"]
  }'
```

**获取天气数据**：
```bash
curl "http://localhost:3000/api/weather/current?lat=40.7128&lon=-74.0060"
```

### 4.2 使用 Thunder Client / Postman

创建 Collection：`JetLag Backend`

添加请求并保存，方便后续调试。

---

## 五、完整启动命令

```bash
# 1. 进入后端目录
cd jetlag-backend

# 2. 初始化项目
npm init -y

# 3. 安装依赖
npm install express multer axios dotenv cors

# 4. 配置环境变量
# 编辑 .env 文件，填入 DEEPSEEK_API_KEY

# 5. 创建目录结构
mkdir -p src/controllers src/routes src/middleware src/services uploads

# 6. 启动服务
npm start
# 或开发模式（自动重启）
npx nodemon src/server.js
```

---

## 六、注意事项

1. **API 密钥安全**：`.env` 文件切勿提交到版本控制
2. **图片清理**：上传的图片分析后会自动删除，节省存储空间
3. **错误处理**：所有异步操作都需要 try-catch 包裹
4. **跨域配置**：前端运行在不同端口，需要正确配置 CORS
5. **文件大小限制**：当前限制 10MB，如需调整修改 `uploadMiddleware.js`

---

*文档版本：1.0*
*最后更新：2026-06-19*
