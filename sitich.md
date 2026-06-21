markdown_content = """# JetLag Sync (时差修复局) - 前端视觉与交互设计规范文档 (.md)

本规范专为 **JetLag Sync (时差修复局)** 移动客户端开发定制，旨在 Android 平台上完美复刻 **Apple Health (苹果健康)** 的极简冷淡科技风。前端采用 **Flutter (Dart)** 框架进行组件化开发。

---

## 一、 设计哲学与视觉基调 (Design Systems)

### 1. 色彩规范 (Color Palette)
为了实现苹果标志性的高级质感，采用高对比度、低饱和度的色彩搭配，并支持暗黑模式。

| 颜色类别 | 颜色名称 | Hex 编码 | 适用场景 |
| :--- | :--- | :--- | :--- |
| **背景色** | 纯白背景 (Light) | `#FFFFFF` | 日间模式主背景 |
| | 极致暗夜 (Dark) | `#0B0F19` | 暗黑模式主背景 |
| **卡片/容器** | 灰阶浅卡片 (Light)| `#F1F5F9` | 日间模式模块容器、输入框 |
| | 钛金深卡片 (Dark) | `#1E293B` | 暗黑模式模块容器 |
| **主文本** | 墨黑 (Light) | `#0F172A` | 日间模式一级标题、正文 |
| | 纯白 (Dark) | `#F8FAFC` | 暗黑模式一级标题、正文 |
| **次文本** | 烟灰 | `#64748B` | 时间戳、副标题、说明文字 |
| **状态/激活** | 时差警报 (Amber) | `#F59E0B` | 亚健康状态、时差失衡警告 |
| | 节律同步 (Sage) | `#10B981` | 身体状态良好、修复成功 |

### 2. 动效与质感 (Aesthetics)
* **圆角规范**：全屏统一采用 Apple 风格的连续圆角（平滑圆角），卡片圆角标准为 `24.0`，按钮/胶囊圆角为 `16.0` 或全面屏胶囊 `borderRadius.circular(30)`。
* **毛玻璃效果 (Glassmorphism)**：在顶部状态栏与底部导航栏，使用 `BackdropFilter` 实现高斯模糊（Sigma: 10.0），背景色带透明度（如 `White.withOpacity(0.8)`）。
* **字体字重**：主标题粗体（`FontWeight.w700` 或 `w800`），正文适中（`FontWeight.w400`），避免使用任何花哨的中文字体，保持系统默认的干净黑体。

---

## 二、 核心页面结构与组件规范 (Screen Specifications)

### 1. Dashboard (主仪表盘 - 时差雷达)
* **页面定位**：用户晨起或熬夜后的首屏，快速展示当前空间环境与身体时差状态。
* **核心视觉组件**：
  * **状态顶栏 (Header Widget)**：
    * 左侧大标题：`“早上好，修仙者”`（字号 `26pt`，`w700`）。
    * 右侧副标题：`“当前生理时区：🇺🇸 纽约时间 (滞后 5 小时)”`（字号 `12pt`，琥珀色 `#F59E0B`）。
  * **时差钟盘 (Chrono-Clock Widget)**：
    * 一个极简的圆形进度环，展示中医十二时辰与现代时间的映射。
    * 当前高亮：`“11:00 - 13:00 [心经当令]”`。
    * 下方伴随提示：`“心火旺盛，宜小憩 15 分钟修复出汗症状”`。
  * **环境感知网格 (Environment Grid)**：
    * 2x2 的极简网格卡片（无边框，带微弱阴影或浅色底）。
    * 展示项：`[🌡️ 温度: 28°C]`、`[💧 湿度: 85% - 湿气重]`、`[💨 空气: 优]`、`[☀️ 紫外线: 弱]`。
  * **状态快速勾选流 (Quick-Select Capsules)**：
    * 横向滚动的 `ListView`，由苹果风的胶囊状 Chip 组成。
    * 包含：`[🥵 手脚冒虚汗]`、`[😵 头晕萎靡]`、`[👁️ 眼睛干涩]`、`[💓 心跳过快]`。
    * 交互：点击切换选中状态，激活时背景变为浅琥珀色，边框加粗。
  * **核心行动按钮 (Hero Action Button)**：
    * 底部固定或悬浮的巨大胶囊按钮。
    * 文本：`“一键开启 Vibe Check 修复”`。

### 2. Vibe Check (视觉感知 - 相机扫描)
* **页面定位**：调用前置/后置摄像头，进行多模态大模型的视觉输入。
* **核心视觉组件**：
  * **全面屏取景框 (Camera Viewfinder)**：
    * 占满屏幕 70% 的圆角安全区域。
    * 中央带有一个类似 Face ID 的**高科技扫描引导圈**（细线条，呼吸灯动效）。
  * **模式切换器 (Toggle Segment)**：
    * 仿 iOS 的 `CupertinoSlidingSegmentedControl`。
    * 选项：`[ 👅 智能望诊 (面色/舌苔) ]` 与 `[ 📸 环境扫描 (桌面/空间) ]`。
  * **动态分析遮罩 (Scan Animation Overlay)**：
    * 当用户按下快门后，取景框出现一条从上到下循环扫描的激光线（淡绿色或淡蓝色）。
    * 下方文字滚动：`“正在解析面部疲劳向量...”` -> ``“正在检测黑眼圈深度...”`。

### 3. Sync Blueprint (修复蓝图 - 状态修复报告)
* **页面定位**：展示由后端 Node.js 调取 DeepSeek API 后返回的专属个性化调理方案。
* **核心视觉组件**：
  * **诊断总览卡片 (Diagnostic Summary Card)**：
    * 顶部显示 Vision AI 抓取到的特征，如：`“面色萎靡、舌红少苔、结合当地 85% 高湿度环境”`。
  * **“时差修复”协议流 (The Sync Protocol)**：
    * 垂直排列的卡片流，具有极强的可读性，段落间距 `16pt`。
    * **卡片 A · 紧急能量补给 (Bio-Hack)**：`“⚠️ 停止饮用冰美式。立即饮用一杯温热生姜水，以收敛手脚虚汗。”`
    * **卡片 B · 经络疏通 (Acupressure)**：文字配合一张干净的穴位示意图，提示`“按压少冲穴、神门穴 3 分钟，引导心火下行。”`
    * **卡片 C · 睡眠窗口 (Sleep Window)**：一个类似 iPhone 闹钟的线性时间轴，标红今晚的`最佳入睡窗口：22:30 - 23:00`。

### 4. Chrono-Analytics (数据日志 - 时差统计)
* **页面定位**：长期作息修复成果的可视化看板。
* **核心视觉组件**：
  * **时差热力图 (Flight Log / Heatmap)**：
    * 类似于 GitHub 贡献图或 Apple Fitness 环，用绿、黄、橙三色方块代表过去一个月每天的作息同步率。绿色越多，代表回归正常作息天数越多。
  * **Vibe 状态趋势线 (Trend Line Chart)**：
    * 极简折线图（无繁杂的网格背景线），展示“精力值”和“虚汗频次”的下降曲线。

---

## 三、 Flutter (Dart) 关键 UI 组件映射表

在将此设计输入给 **Trae Solo** 阶段时，可直接指导其使用以下组件进行苹果风复刻：

| 页面元素 | 推荐 Flutter 核心组件 (Widget) | 关键样式属性 (Style Attributes) |
| :--- | :--- | :--- |
| **整体导航** | `CupertinoTabScaffold` + `CupertinoTabBar` | `backgroundColor: CupertinoColors.systemBackground.withOpacity(0.8)` |
| **顶部大标题**| `Text("...", style: CupertinoTheme.of(context).textTheme.navLargeTitleTextStyle)` | `fontSize: 28, fontWeight: FontWeight.bold` |
| **系统卡片** | `Container` + `BoxDecoration` | `borderRadius: BorderRadius.circular(24)`, `color: CupertinoColors.systemGroupedBackground` |
| **滑动切换** | `CupertinoSlidingSegmentedControl<int>` | 用于切换面部/环境扫描模式 |
| **胶囊状态按钮** | `FilterChip` 或自定义 `GestureDetector` | `padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8)`, `shape: Stamp` |
| **弹窗与对话**| `showCupertinoModalPopup` | 展开一键修复输入框时的半屏抽屉效果 |

---

## 四、 下一步交互联动数据结构 (Data Flow Interface)

为了前后端分离开发，前端页面设计时需预留以下 **状态变量 (State Variables)**，以便下一阶段在 Trae 中与 Node.js 后端无缝对接：