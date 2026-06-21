# JetLag Sync (时差修复局) - Code Wiki

## 项目概述

JetLag Sync 是一款跨时区健康管理的移动应用，融合中医经络理论与现代环境数据监测，为用户提供个性化的时差修复方案。项目采用**前后端分离架构**，前端使用 Flutter 框架实现苹果风格的 UI，后端使用 Node.js 调用 DeepSeek AI 进行智能诊断。

**项目特色**：
- Apple Health 风格的极简冷淡科技风 UI 设计
- 多模态 AI 诊断（面色/舌苔分析 + 环境感知）
- 中医十二时辰经络理论与现代时间医学结合
- 环境数据实时聚合（温度、湿度、空气质量、紫外线）

---

## 目录结构

```
jetlag-sync/
├── jetlag-backend/           # 后端 Node.js 项目
│   ├── src/
│   │   ├── controllers/      # 业务逻辑控制器
│   │   │   ├── aiController.js    # AI 诊断逻辑
│   │   │   └── weatherController.js  # 天气数据聚合
│   │   ├── routes/           # API 路由定义
│   │   │   ├── aiRoutes.js
│   │   │   └── weatherRoutes.js
│   │   └── server.js         # 后端入口文件
│   ├── uploads/              # 安卓端上传的临时图片
│   ├── .env                  # 环境变量（DeepSeek API Key）
│   └── package.json
│
└── jetlag-frontend/          # 前端 Flutter 项目
    ├── android/              # Android 原生配置
    ├── lib/
    │   ├── models/           # 数据模型
    │   │   ├── health_metrics.dart
    │   │   ├── environmental_data.dart
    │   │   └── diagnosis_result.dart
    │   ├── services/         # 业务服务
    │   │   ├── api_service.dart       # HTTP 请求服务
    │   │   ├── camera_service.dart    # 相机调用服务
    │   │   └── sensor_service.dart    # 传感器数据服务
    │   ├── views/            # 页面视图
    │   │   ├── dashboard/          # 主仪表盘
    │   │   ├── vibe_check/         # 视觉扫描
    │   │   ├── sync_blueprint/     # 修复报告
    │   │   └── chrono_analytics/   # 数据统计
    │   └── main.dart         # 前端入口
    └── pubspec.yaml         # Flutter 依赖配置
```

---

## 技术栈

### 前端技术栈

| 类别 | 技术 | 说明 |
|------|------|------|
| 框架 | Flutter 3.x | 跨平台移动开发框架 |
| 语言 | Dart | Flutter 专用语言 |
| 状态管理 | Provider / Riverpod | 轻量级状态管理 |
| HTTP 客户端 | dio | RESTful API 请求 |
| 相机 | camera | 跨平台相机访问 |
| 传感器 | sensors_plus | 加速度计、陀螺仪等 |

### 后端技术栈

| 类别 | 技术 | 说明 |
|------|------|------|
| 运行时 | Node.js 18+ | 服务端 JavaScript 运行时 |
| 框架 | Express.js | 轻量级 Web 框架 |
| AI 集成 | DeepSeek API | 多模态大模型诊断 |
| 天气数据 | OpenWeatherMap API | 环境数据获取 |
| 文件上传 | multer | Multipart/form-data 处理 |

---

## 核心模块详解

### 1. 后端模块 (jetlag-backend)

#### 1.1 server.js - 后端入口

**职责**：应用启动、路由注册、中间件配置

```javascript
// 核心功能
- Express 应用初始化
- CORS 跨域配置
- JSON 请求体解析
- 静态文件服务 (uploads/)
- 路由挂载 (/api/ai, /api/weather)
- 端口监听
```

**环境变量 (.env)**：
```
DEEPSEEK_API_KEY=<DeepSeek API密钥>
PORT=3000
```

#### 1.2 AI 诊断模块 (controllers/aiController.js)

**职责**：处理图片上传、调用 DeepSeek API 进行健康诊断

**核心函数**：

| 函数名 | 功能 | 输入 | 输出 |
|--------|------|------|------|
| `analyzeFaceImage` | 面色/舌苔 AI 分析 | 图片文件 + 环境数据 | 诊断结果 JSON |
| `generateSyncPlan` | 生成个性化修复方案 | 诊断结果 + 用户症状 | 修复协议卡片列表 |

**API 端点**：
- `POST /api/ai/analyze` - 上传图片并获取 AI 诊断
- `POST /api/ai/sync-plan` - 生成修复计划

#### 1.3 天气聚合模块 (controllers/weatherController.js)

**职责**：聚合实时环境数据

**核心函数**：

| 函数名 | 功能 | 输入 | 输出 |
|--------|------|------|------|
| `getWeatherData` | 获取天气信息 | 经纬度坐标 | 温度/湿度/空气质量/紫外线 |
| `getEnvironmentalStress` | 计算环境压力指数 | 天气数据 | 压力等级评估 |

**API 端点**：
- `GET /api/weather/current` - 获取当前环境数据

---

### 2. 前端模块 (jetlag-frontend)

#### 2.1 数据模型 (models/)

**health_metrics.dart** - 健康指标模型
```dart
class HealthMetrics {
  final String meridianState;      // 当前经络状态 (如 "心经当令")
  final String timeSlot;           // 时辰 (如 "11:00 - 13:00")
  final int energyLevel;           // 精力值 (0-100)
  final int sweatFrequency;        // 虚汗频次
  final List<String> symptoms;     // 症状列表
}
```

**environmental_data.dart** - 环境数据模型
```dart
class EnvironmentalData {
  final double temperature;        // 温度 (°C)
  final int humidity;               // 湿度 (%)
  final String airQuality;          // 空气质量 (优/良/差)
  final String uvLevel;            // 紫外线强度 (弱/中/强)
  final String stressLevel;        // 压力等级
}
```

**diagnosis_result.dart** - 诊断结果模型
```dart
class DiagnosisResult {
  final String summary;            // 诊断摘要
  final List<String> findings;      // 发现项列表
  final List<SyncProtocol> protocols;  // 修复协议
}

class SyncProtocol {
  final String type;               // BIO-HACK / ACUPRESSURE / SLEEP
  final String title;              // 协议标题
  final String description;        // 详细描述
  final String priority;           // HIGH / MEDIUM / LOW
}
```

#### 2.2 服务层 (services/)

**api_service.dart** - API 请求服务
```dart
// 核心方法
Future<DiagnosisResult> analyzeImage(File image, EnvironmentalData env);
Future<List<SyncProtocol>> getSyncPlan(DiagnosisResult diagnosis);
Future<EnvironmentalData> fetchWeatherData(double lat, double lon);
```

**camera_service.dart** - 相机服务
```dart
// 核心方法
Future<CameraController> initializeCamera();
Future<File> captureImage();
Future<void> switchCamera();  // 前置/后置切换
```

**sensor_service.dart** - 传感器服务
```dart
// 核心方法
Stream<AccelerometerEvent> get accelerometerStream;
Stream<GyroscopeEvent> get gyroscopeStream;
// 用于检测用户姿态和活动状态
```

#### 2.3 视图层 (views/)

##### 2.3.1 Dashboard (主仪表盘)

**路由**：`/` 或 `/dashboard`

**核心组件**：

| 组件 | 说明 |
|------|------|
| `HeaderWidget` | 顶部状态栏：问候语 + 生理时区显示 |
| `ChronoClockWidget` | 时差钟盘：圆形进度环展示十二时辰映射 |
| `EnvironmentGrid` | 2x2 环境数据网格卡片 |
| `QuickSelectCapsules` | 横向滚动症状选择胶囊 |
| `HeroActionButton` | 底部悬浮的"一键 Vibe Check"按钮 |

**状态变量**：
```dart
String greeting;          // "早上好，Night Owl"
String physioTimezone;     // "当前生理时区：纽约时间 (滞后 5 小时)"
HealthMetrics? metrics;
EnvironmentalData? envData;
```

##### 2.3.2 Vibe Check (视觉扫描)

**路由**：`/vibe-check`

**核心组件**：

| 组件 | 说明 |
|------|------|
| `CameraViewfinder` | 全面屏取景框 (70% 屏幕占比) |
| `ScanAnimationOverlay` | 高科技扫描引导圈 + 呼吸灯动效 |
| `ModeToggleSegment` | 模式切换：智能望诊 / 环境扫描 |
| `ScanLaserAnimation` | 扫描激光线动画 |

**交互流程**：
1. 用户选择扫描模式（面色/环境）
2. 点击快门启动分析
3. 显示扫描动画和实时状态文字
4. 提交图片至后端获取诊断结果

##### 2.3.3 Sync Blueprint (修复蓝图)

**路由**：`/sync-blueprint`

**核心组件**：

| 组件 | 说明 |
|------|------|
| `DiagnosticSummaryCard` | Vision AI 诊断概览卡片 |
| `BioHackCard` | 紧急能量补给协议 |
| `AcupressureCard` | 经络疏通建议 + 穴位图 |
| `SleepWindowCard` | 睡眠窗口时间轴 |

**数据结构**：
```dart
DiagnosisResult {
  summary: "面色萎靡、舌红少苔、结合当地 85% 高湿度环境"
  findings: ["湿气重", "心火旺", "时差失衡"]
  protocols: [
    SyncProtocol(type: "BIO-HACK", title: "紧急能量补给", ...),
    SyncProtocol(type: "ACUPRESSURE", title: "经络疏通", ...),
    SyncProtocol(type: "SLEEP", title: "睡眠窗口", ...)
  ]
}
```

##### 2.3.4 Chrono-Analytics (数据统计)

**路由**：`/analytics`

**核心组件**：

| 组件 | 说明 |
|------|------|
| `FlightLogHeatmap` | GitHub 风格的节律热力图 |
| `VibeTrendChart` | 精力值/虚汗频次趋势折线图 |
| `AchievementWall` | 横向滚动的勋章墙 |
| `BentoStatsGrid` | 2x2 统计指标网格 |

---

## 依赖关系

### 前端依赖 (pubspec.yaml)

```yaml
dependencies:
  flutter:
    sdk: flutter
  cupertino_icons: ^1.0.6        # iOS 风格图标
  provider: ^6.1.1                # 状态管理
  dio: ^5.4.0                     # HTTP 客户端
  camera: ^0.10.5+9               # 相机访问
  sensors_plus: ^4.0.2            # 传感器
  geolocator: ^11.0.0             # 定位服务
  shared_preferences: ^2.2.2      # 本地存储
  fl_chart: ^0.66.0              # 图表组件
  google_fonts: ^6.1.0            # Inter 字体
```

### 后端依赖 (package.json)

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "multer": "^1.4.5-lts.1",
    "dotenv": "^16.4.1",
    "axios": "^1.6.5",
    "cors": "^2.8.5"
  }
}
```

---

## API 接口文档

### 基础信息

- **Base URL**: `http://localhost:3000`
- **Content-Type**: `application/json`
- **图片上传**: `multipart/form-data`

### 端点列表

#### 1. AI 诊断接口

```
POST /api/ai/analyze
```

**请求**：
```
FormData {
  image: File (必需)
  envData: JSON string (可选)
}
```

**响应**：
```json
{
  "success": true,
  "data": {
    "summary": "面色萎靡、舌红少苔",
    "findings": ["湿气重", "心火旺"],
    "confidence": 0.92
  }
}
```

#### 2. 修复方案接口

```
POST /api/ai/sync-plan
```

**请求**：
```json
{
  "diagnosis": { ... },
  "symptoms": ["手脚冒虚汗", "头晕萎靡"]
}
```

**响应**：
```json
{
  "success": true,
  "data": {
    "protocols": [
      {
        "type": "BIO-HACK",
        "title": "紧急能量补给",
        "description": "停止饮用冰美式...",
        "priority": "HIGH"
      }
    ]
  }
}
```

#### 3. 天气数据接口

```
GET /api/weather/current?lat=40.7128&lon=-74.0060
```

**响应**：
```json
{
  "success": true,
  "data": {
    "temperature": 28,
    "humidity": 85,
    "airQuality": "优",
    "uvLevel": "弱",
    "stressLevel": "HIGH"
  }
}
```

---

## 设计系统

### 色彩规范

| 用途 | 颜色名称 | Hex | 说明 |
|------|----------|-----|------|
| 背景 (亮色) | 纯白 | `#FFFFFF` | 日间模式主背景 |
| 背景 (暗色) | 极致暗夜 | `#0B0F19` | 暗黑模式主背景 |
| 卡片 | 灰阶浅卡 | `#F1F5F9` | 模块容器 |
| 主文本 | 墨黑 | `#0F172A` | 标题、正文 |
| 次文本 | 烟灰 | `#64748B` | 时间戳、说明 |
| 警告/亚健康 | 时差警报 | `#F59E0B` | Amber 色 |
| 良好/同步 | 节律同步 | `#10B981` | Sage 绿 |
| 深空色 | Deep Space | `#1E293B` | 暗色卡片 |

### 字体规范

| 层级 | 字号 | 字重 | 用途 |
|------|------|------|------|
| display-lg | 34px | 700 | 主标题 |
| headline-md | 24px | 600 | 页面标题 |
| headline-sm | 20px | 600 | 区块标题 |
| body-lg | 17px | 400 | 正文 |
| body-md | 15px | 400 | 次要正文 |
| label-caps | 12px | 600 | 标签/分类 |

### 圆角规范

| 元素 | 圆角值 |
|------|--------|
| 卡片容器 | 24px |
| 按钮/胶囊 | 16px 或全圆角 |
| 输入框 | 12px |
| 小元素 | 8px |

### 毛玻璃效果

```dart
BackdropFilter(
  blur: Sigma(10.0),
  child: Container(
    color: Colors.white.withOpacity(0.8),
  ),
)
```

---

## 项目运行方式

### 前置条件

- **前端**：Flutter SDK 3.x + Android Studio / Xcode
- **后端**：Node.js 18+
- **API Key**：DeepSeek API 密钥（配置于后端 .env）

### 后端启动

```bash
cd jetlag-backend

# 安装依赖
npm install

# 配置环境变量
# 编辑 .env 文件，填入 DEEPSEEK_API_KEY

# 启动服务
npm start
# 服务运行于 http://localhost:3000
```

### 前端启动

```bash
cd jetlag-frontend

# 获取依赖
flutter pub get

# 运行 debug 版本
flutter run

# 或构建 release APK
flutter build apk --release
```

### 目录规范

```
lib/
├── main.dart           # 入口文件
├── models/             # 数据模型
├── services/           # 业务服务层
├── views/              # 页面视图
│   ├── dashboard/
│   ├── vibe_check/
│   ├── sync_blueprint/
│   └── chrono_analytics/
└── widgets/             # 通用组件
```

---

## 核心流程

### 1. Vibe Check 完整流程

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  选择模式    │────▶│  拍摄图片    │────▶│  AI 分析    │
└─────────────┘     └─────────────┘     └─────────────┘
                                                │
                                                ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  应用修复    │◀────│  展示方案    │◀────│  生成协议    │
└─────────────┘     └─────────────┘     └─────────────┘
```

### 2. 环境数据采集流程

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  获取定位     │────▶│  请求天气API  │────▶│  计算压力指数 │
└──────────────┘     └──────────────┘     └──────────────┘
                                                  │
                                                  ▼
                                          ┌──────────────┐
                                          │  更新 Dashboard │
                                          └──────────────┘
```

---

## 注意事项

1. **API Key 安全**：DeepSeek API Key 仅存放于后端 .env 文件，切勿提交至版本控制
2. **图片上传**：uploads 目录用于临时存储，确保有足够磁盘空间
3. **权限申请**：前端需要相机、位置、传感器等权限
4. **暗黑模式**：设计系统已完整支持暗黑模式切换

---

*文档版本：1.0*
*最后更新：2026-06-19*
