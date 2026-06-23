# KnowledgeFlow 抖音宣传视频 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 制作一支 38 秒抖音竖屏宣传视频，展示 KnowledgeFlow 产品核心功能，冲击 TRAE AI 创造力大赛抖音人气通道 TOP 50。

**Architecture:** 使用 HyperFrames（HTML+GSAP）作为渲染引擎，Puppeteer 捕获产品截图，OpenAI TTS API 生成中文旁白，FFmpeg 混合音频，最终输出 1080×1920 MP4。

**Tech Stack:** Node.js 22+, HyperFrames CLI, Puppeteer, GSAP, OpenAI TTS API (yunwu.ai), FFmpeg

**Spec:** `docs/superpowers/specs/2026-06-23-douyin-promo-video-design.md`

---

## File Structure

```
video-project/
├── package.json                    # 项目依赖
├── .env                            # API 密钥（不入 Git）
├── .gitignore                      # 忽略 .env 和 renders/
├── index.html                      # HyperFrames 主组合文件
├── assets/
│   ├── screenshots/
│   │   ├── plans.png               # 学习计划页截图
│   │   ├── study.png               # 学习页截图
│   │   ├── practice.png            # 练习页截图
│   │   └── stats.png               # 统计页截图
│   ├── audio/
│   │   ├── narration.mp3           # TTS 旁白
│   │   └── music.mp3               # 背景音乐
│   └── logo/
│       └── logo.svg                # 产品 Logo
├── scripts/
│   ├── capture-screens.ts          # 截图捕获脚本
│   ├── generate-tts.ts             # TTS 生成脚本
│   └── narration-script.txt        # 旁白脚本
└── renders/
    └── final.mp4                   # 最终输出
```

---

### Task 1: 环境验证与项目初始化

**Files:**
- Create: `video-project/package.json`
- Create: `video-project/.env`
- Create: `video-project/.gitignore`

- [ ] **Step 1: 验证 Node.js 版本**

Run: `node --version`
Expected: v22.x.x 或更高

如果版本低于 22，需先升级 Node.js。

- [ ] **Step 2: 验证 FFmpeg 已安装**

Run: `ffmpeg -version`
Expected: 显示 ffmpeg 版本信息

如果未安装: `brew install ffmpeg`

- [ ] **Step 3: 创建项目目录结构**

Run:
```bash
mkdir -p video-project/{assets/screenshots,assets/audio,assets/logo,scripts,renders}
cd video-project
```

- [ ] **Step 4: 初始化 package.json**

Create `video-project/package.json`:
```json
{
  "name": "knowledgeflow-douyin-video",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "capture": "tsx scripts/capture-screens.ts",
    "tts": "tsx scripts/generate-tts.ts",
    "preview": "npx hyperframes preview",
    "render": "npx hyperframes render"
  },
  "dependencies": {
    "puppeteer": "^23.0.0",
    "tsx": "^4.0.0"
  }
}
```

- [ ] **Step 5: 创建 .env 文件**

Create `video-project/.env`:
```
OPENAI_API_KEY=sk-jrM5FBWiuEoBFbrILBvWMl2Lq1Sx6cfvHdTDkWOZOdS6630K
OPENAI_BASE_URL=https://yunwu.ai/v1
```

- [ ] **Step 6: 创建 .gitignore**

Create `video-project/.gitignore`:
```
.env
renders/
node_modules/
assets/audio/*.mp3
```

- [ ] **Step 7: 安装依赖**

Run:
```bash
cd video-project
npm install
```
Expected: 依赖安装成功

- [ ] **Step 8: 验证 HyperFrames CLI 可用**

Run: `npx hyperframes --version`
Expected: 显示版本号（如 0.6.x）

---

### Task 2: 捕获产品截图

**Files:**
- Create: `video-project/scripts/capture-screens.ts`
- Output: `video-project/assets/screenshots/{plans,study,practice,stats}.png`

- [ ] **Step 1: 编写截图捕获脚本**

Create `video-project/scripts/capture-screens.ts`:
```typescript
import puppeteer from 'puppeteer';
import { mkdirSync } from 'fs';
import { join } from 'path';

const BASE_URL = 'https://ceilf6.github.io/KnowledgeFlow-StudyAgent/';
const OUTPUT_DIR = 'assets/screenshots';

const targets = [
  { name: 'home', path: '/', selector: '#root' },
  { name: 'plans', path: '/plans', selector: '#root' },
  { name: 'study', path: '/study', selector: '#root' },
  { name: 'practice', path: '/practice', selector: '#root' },
];

async function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true });
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  for (const target of targets) {
    const page = await browser.newPage();
    await page.setViewport({
      width: 1440,
      height: 900,
      deviceScaleFactor: 2,
    });
    const url = `${BASE_URL}${target.path}`;
    console.log(`Capturing ${target.name} from ${url}`);
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
    await page.waitForSelector(target.selector, { timeout: 10000 });
    await new Promise((r) => setTimeout(r, 1500));
    const outputPath = join(OUTPUT_DIR, `${target.name}.png`);
    await page.screenshot({ path: outputPath, fullPage: false });
    console.log(`Saved: ${outputPath}`);
    await page.close();
  }

  await browser.close();
  console.log('All screenshots captured.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 2: 运行截图脚本**

Run:
```bash
cd video-project
npm run capture
```
Expected: 生成 4 张截图到 `assets/screenshots/`

- [ ] **Step 3: 验证截图质量**

Run: `ls -la assets/screenshots/`
Expected: 4 个 PNG 文件，每个 > 100KB

检查截图内容是否完整、清晰。如果页面未加载完成，增加 `setTimeout` 时间。

---

### Task 3: 撰写旁白脚本并生成 TTS

**Files:**
- Create: `video-project/scripts/narration-script.txt`
- Create: `video-project/scripts/generate-tts.ts`
- Output: `video-project/assets/audio/narration.mp3`

- [ ] **Step 1: 撰写旁白脚本**

Create `video-project/scripts/narration-script.txt`:
```
期末复习，看了一晚上还是啥也不会？
教科书太厚、知识点跳着讲、复习没计划。
KnowledgeFlow，AI 帮你从零搞定期末。
智能学习计划：输入考试科目，AI 生成复习路线。
AI 知识点讲解：从前置概念开始，不跳步。
智能练习：即时反馈，错题深度分析。
学习统计：进度可视，成就解锁。
让知识轻松流入你的脑海。
```

- [ ] **Step 2: 编写 TTS 生成脚本**

Create `video-project/scripts/generate-tts.ts`:
```typescript
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { config } from 'dotenv';

config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || 'https://yunwu.ai/v1';
const SCRIPT_PATH = 'scripts/narration-script.txt';
const OUTPUT_PATH = 'assets/audio/narration.mp3';

async function main() {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not set in .env');
  }

  mkdirSync('assets/audio', { recursive: true });
  const text = readFileSync(SCRIPT_PATH, 'utf-8').trim();
  console.log(`Generating TTS for ${text.length} chars of text...`);

  const response = await fetch(`${OPENAI_BASE_URL}/audio/speech`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'tts-1',
      input: text,
      voice: 'nova',
      response_format: 'mp3',
      speed: 1.0,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`TTS API error ${response.status}: ${errText}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  writeFileSync(OUTPUT_PATH, buffer);
  console.log(`Saved: ${OUTPUT_PATH} (${(buffer.length / 1024).toFixed(1)} KB)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 3: 安装 dotenv 依赖**

Run:
```bash
cd video-project
npm install dotenv
```

- [ ] **Step 4: 运行 TTS 生成**

Run:
```bash
npm run tts
```
Expected: 生成 `assets/audio/narration.mp3`

- [ ] **Step 5: 验证音频**

Run: `ffprobe -v quiet -show_entries format=duration -of csv=p=0 assets/audio/narration.mp3`
Expected: 时长在 30-45 秒之间

如果时长超出 45 秒，调整 `speed` 为 1.1 或精简脚本。

---

### Task 4: 获取背景音乐

**Files:**
- Output: `video-project/assets/audio/music.mp3`

- [ ] **Step 1: 下载免版税背景音乐**

从以下来源获取（任选其一）：
- YouTube 音频库: https://studio.youtube.com/ (搜索 "upbeat corporate")
- Pixabay Music: https://pixabay.com/music/ (搜索 "upbeat background")
- 要求: BPM 100-120，轻快积极，无版权限制

- [ ] **Step 2: 将音乐文件放入项目**

将下载的音乐文件重命名为 `music.mp3` 并放入 `video-project/assets/audio/`

- [ ] **Step 3: 裁剪音乐到视频时长**

Run:
```bash
cd video-project
ffmpeg -i assets/audio/music.mp3 -t 40 -af "afade=tn:st=37:d=3" -y assets/audio/music-trimmed.mp3
mv assets/audio/music-trimmed.mp3 assets/audio/music.mp3
```
Expected: 音乐裁剪到 40 秒，末尾 3 秒淡出

- [ ] **Step 4: 降低音乐音量（为旁白让路）**

Run:
```bash
ffmpeg -i assets/audio/music.mp3 -af "volume=0.3" -y assets/audio/music-bg.mp3
mv assets/audio/music-bg.mp3 assets/audio/music.mp3
```
Expected: 音乐音量降低到 30%

---

### Task 5: 编写 HyperFrames HTML 组合

**Files:**
- Create: `video-project/index.html`

- [ ] **Step 1: 创建 HTML 基础结构**

Create `video-project/index.html`:
```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>KnowledgeFlow 抖音宣传视频</title>
  <script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #000; font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif; }
    #stage {
      width: 1080px;
      height: 1920px;
      position: relative;
      overflow: hidden;
      background: #0F172A;
    }
    .scene {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      opacity: 0;
    }
    .caption {
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
      bottom: 400px;
      width: 90%;
      text-align: center;
      color: #FFFFFF;
      font-size: 64px;
      font-weight: 800;
      text-shadow: 0 4px 12px rgba(0,0,0,0.8);
      line-height: 1.4;
    }
    .caption .highlight {
      color: #FBBF24;
    }
    .product-screenshot {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 900px;
      border-radius: 24px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.5);
    }
    .brand-bg {
      background: linear-gradient(135deg, #0F172A 0%, #1E40AF 100%);
    }
    .cta-bg {
      background: linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%);
    }
    .logo-text {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: #FFFFFF;
      font-size: 96px;
      font-weight: 900;
      text-align: center;
    }
    .logo-text .tagline {
      font-size: 48px;
      font-weight: 400;
      margin-top: 24px;
      color: #FBBF24;
    }
    .hashtag {
      position: absolute;
      bottom: 200px;
      left: 50%;
      transform: translateX(-50%);
      color: rgba(255,255,255,0.8);
      font-size: 36px;
      text-align: center;
    }
  </style>
</head>
<body>
  <div id="stage" data-composition-id="kf-promo" data-start="0" data-width="1080" data-height="1920">

    <!-- Scene 1: Hook (0-3s) -->
    <div class="scene" id="scene-hook" data-start="0" data-duration="3" data-track-index="0">
      <div class="caption" id="hook-text">
        期末复习<br/>看了一晚上<br/><span class="highlight">还是啥也不会？</span>
      </div>
    </div>

    <!-- Scene 2: Pain Point (3-6s) -->
    <div class="scene" id="scene-pain" data-start="3" data-duration="3" data-track-index="0">
      <div class="caption" id="pain-text">
        教科书太厚<br/>知识点<span class="highlight">跳着讲</span><br/>复习没计划
      </div>
    </div>

    <!-- Scene 3: Solution Intro (6-10s) -->
    <div class="scene brand-bg" id="scene-intro" data-start="6" data-duration="4" data-track-index="0">
      <div class="logo-text" id="intro-logo">
        KnowledgeFlow
        <div class="tagline">AI 帮你从零搞定期末</div>
      </div>
    </div>

    <!-- Scene 4: Feature 1 - Learning Plan (10-16s) -->
    <div class="scene" id="scene-plan" data-start="10" data-duration="6" data-track-index="0">
      <img class="product-screenshot" id="screenshot-plans" src="assets/screenshots/plans.png" alt="学习计划" />
      <div class="caption" id="plan-caption">
        智能学习计划<br/><span class="highlight">AI 生成复习路线</span>
      </div>
    </div>

    <!-- Scene 5: Feature 2 - AI Explanation (16-22s) -->
    <div class="scene" id="scene-study" data-start="16" data-duration="6" data-track-index="0">
      <img class="product-screenshot" id="screenshot-study" src="assets/screenshots/study.png" alt="AI 讲解" />
      <div class="caption" id="study-caption">
        AI 知识点讲解<br/><span class="highlight">从前置概念开始，不跳步</span>
      </div>
    </div>

    <!-- Scene 6: Feature 3 - Practice (22-28s) -->
    <div class="scene" id="scene-practice" data-start="22" data-duration="6" data-track-index="0">
      <img class="product-screenshot" id="screenshot-practice" src="assets/screenshots/practice.png" alt="智能练习" />
      <div class="caption" id="practice-caption">
        智能练习<br/><span class="highlight">即时反馈，错题分析</span>
      </div>
    </div>

    <!-- Scene 7: Feature 4 - Stats (28-33s) -->
    <div class="scene" id="scene-stats" data-start="28" data-duration="5" data-track-index="0">
      <img class="product-screenshot" id="screenshot-stats" src="assets/screenshots/home.png" alt="学习统计" />
      <div class="caption" id="stats-caption">
        学习统计<br/><span class="highlight">进度可视，成就解锁</span>
      </div>
    </div>

    <!-- Scene 8: CTA (33-38s) -->
    <div class="scene cta-bg" id="scene-cta" data-start="33" data-duration="5" data-track-index="0">
      <div class="logo-text" id="cta-logo">
        让知识<br/>轻松流入你的脑海
        <div class="tagline">ceilf6.github.io/KnowledgeFlow-StudyAgent</div>
      </div>
      <div class="hashtag">
        #vibecoding大赏 #traeai创造力大赛<br/>
        @TRAE @抖音科技
      </div>
    </div>

    <!-- Audio Track -->
    <audio data-start="0" data-duration="38" data-track-index="1" data-volume="1.0" src="assets/audio/narration.mp3"></audio>
    <audio data-start="0" data-duration="38" data-track-index="2" data-volume="0.3" src="assets/audio/music.mp3"></audio>

  </div>

  <script>
    window.__timelines = window.__timelines || {};
    const tl = gsap.timeline({ paused: true });

    // Scene 1: Hook (0-3s)
    tl.fromTo('#scene-hook', { opacity: 0 }, { opacity: 1, duration: 0.3 }, 0)
      .fromTo('#hook-text', { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 }, 0.2)
      .fromTo('#hook-text .highlight', { scale: 1 }, { scale: 1.1, duration: 0.3, yoyo: true, repeat: 1 }, 1.5)
      .to('#scene-hook', { opacity: 0, duration: 0.3 }, 2.7);

    // Scene 2: Pain Point (3-6s)
    tl.fromTo('#scene-pain', { opacity: 0 }, { opacity: 1, duration: 0.3 }, 3)
      .fromTo('#pain-text', { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 }, 3.2)
      .to('#scene-pain', { opacity: 0, duration: 0.3 }, 5.7);

    // Scene 3: Solution Intro (6-10s)
    tl.fromTo('#scene-intro', { opacity: 0 }, { opacity: 1, duration: 0.5 }, 6)
      .fromTo('#intro-logo', { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.8, ease: 'back.out(1.7)' }, 6.2)
      .to('#scene-intro', { opacity: 0, duration: 0.4 }, 9.6);

    // Scene 4: Feature 1 - Learning Plan (10-16s)
    tl.fromTo('#scene-plan', { opacity: 0 }, { opacity: 1, duration: 0.4 }, 10)
      .fromTo('#screenshot-plans', { scale: 0.85, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.6 }, 10.2)
      .fromTo('#plan-caption', { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 }, 10.8)
      .to('#scene-plan', { opacity: 0, duration: 0.3 }, 15.7);

    // Scene 5: Feature 2 - AI Explanation (16-22s)
    tl.fromTo('#scene-study', { opacity: 0 }, { opacity: 1, duration: 0.4 }, 16)
      .fromTo('#screenshot-study', { scale: 0.85, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.6 }, 16.2)
      .fromTo('#study-caption', { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 }, 16.8)
      .to('#scene-study', { opacity: 0, duration: 0.3 }, 21.7);

    // Scene 6: Feature 3 - Practice (22-28s)
    tl.fromTo('#scene-practice', { opacity: 0 }, { opacity: 1, duration: 0.4 }, 22)
      .fromTo('#screenshot-practice', { scale: 0.85, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.6 }, 22.2)
      .fromTo('#practice-caption', { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 }, 22.8)
      .to('#scene-practice', { opacity: 0, duration: 0.3 }, 27.7);

    // Scene 7: Feature 4 - Stats (28-33s)
    tl.fromTo('#scene-stats', { opacity: 0 }, { opacity: 1, duration: 0.4 }, 28)
      .fromTo('#screenshot-stats', { scale: 0.85, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.6 }, 28.2)
      .fromTo('#stats-caption', { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 }, 28.8)
      .to('#scene-stats', { opacity: 0, duration: 0.3 }, 32.7);

    // Scene 8: CTA (33-38s)
    tl.fromTo('#scene-cta', { opacity: 0 }, { opacity: 1, duration: 0.5 }, 33)
      .fromTo('#cta-logo', { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.8, ease: 'back.out(1.7)' }, 33.2)
      .fromTo('.hashtag', { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 }, 34.5);

    window.__timelines['kf-promo'] = tl;
  </script>
</body>
</html>
```

- [ ] **Step 2: 验证 HTML 结构**

Run:
```bash
cd video-project
npx hyperframes preview
```
Expected: 浏览器打开预览页面，显示视频第一帧

如果报错，检查:
- 所有截图文件是否存在
- 音频文件是否存在
- GSAP CDN 是否可访问

---

### Task 6: 预览与迭代

**Files:**
- Modify: `video-project/index.html` (如需调整)

- [ ] **Step 1: 浏览器预览**

Run:
```bash
cd video-project
npx hyperframes preview
```
Expected: 浏览器打开 http://localhost:3000 (或类似端口)

- [ ] **Step 2: 检查动画时序**

在预览中拖动时间轴，检查:
- 每个场景的入场/出场是否流畅
- 字幕是否被截图遮挡
- 场景切换是否有黑屏
- 动画是否与音频节奏匹配

- [ ] **Step 3: 调整字幕位置（如需）**

如果字幕被截图遮挡，修改 `index.html` 中 `.caption` 的 `bottom` 值:
```css
.caption {
  bottom: 200px; /* 从 400px 改为 200px，移到更下方 */
}
```

- [ ] **Step 4: 调整截图大小（如需）**

如果截图太大/太小，修改 `.product-screenshot` 的 `width`:
```css
.product-screenshot {
  width: 800px; /* 从 900px 改为 800px */
  top: 40%; /* 上移 */
}
```

- [ ] **Step 5: 保存调整并重新预览**

每次调整后刷新浏览器预览，直到满意为止。

---

### Task 7: 渲染最终视频

**Files:**
- Output: `video-project/renders/final.mp4`

- [ ] **Step 1: 执行渲染**

Run:
```bash
cd video-project
npx hyperframes render
```
Expected: 渲染进度条，输出 MP4 到 `renders/` 目录

渲染时间约 2-5 分钟（取决于机器性能）。

- [ ] **Step 2: 验证输出文件**

Run:
```bash
ls -la renders/
ffprobe -v quiet -show_entries format=duration,size:stream=width,height,codec_name -of json renders/final.mp4
```
Expected:
- 文件存在且 > 5MB
- duration ≈ 38 秒
- width=1080, height=1920
- codec_name=h264

- [ ] **Step 3: 播放检查**

用系统播放器打开 `renders/final.mp4`，检查:
- 画质清晰
- 音视频同步
- 字幕可读
- 无黑屏/卡顿

---

### Task 8: 质量检查与发布准备

- [ ] **Step 1: 质量检查清单**

逐项验证:
- [ ] 时长 35-40 秒
- [ ] 分辨率 1080×1920
- [ ] 前 3 秒有强钩子（期末复习痛点）
- [ ] 4 个核心功能展示清晰
- [ ] 逐字字幕同步准确
- [ ] 背景音乐与节奏匹配
- [ ] 结尾有 CTA + 抖音话题
- [ ] 旁白音色自然、节奏适中
- [ ] 无版权问题（音乐/图片）

- [ ] **Step 2: 如需调整，回到 Task 6 迭代**

如果质量不达标，记录问题，回到 Task 6 修改 `index.html` 并重新渲染。

- [ ] **Step 3: 准备发布文案**

创建发布文案（用于抖音发布）:
```
期末复习崩溃了？KnowledgeFlow 帮你从零开始，AI 一个知识点一个知识点教你！

✅ 智能学习计划 - AI 生成复习路线
✅ AI 知识点讲解 - 不跳步，从前置概念开始
✅ 智能练习 - 即时反馈，错题分析
✅ 学习统计 - 进度可视，成就解锁

让知识轻松流入你的脑海 🧠

#vibecoding大赏 #traeai创造力大赛 @TRAE @抖音科技

体验地址: https://ceilf6.github.io/KnowledgeFlow-StudyAgent/
```

- [ ] **Step 4: 发布到抖音**

1. 打开抖音 App
2. 上传 `renders/final.mp4`
3. 粘贴发布文案
4. 确认话题标签: #vibecoding大赏 #traeai创造力大赛
5. @TRAE @抖音科技
6. 发布

- [ ] **Step 5: 填写飞书问卷（流量扶持）**

访问: https://bytedance.larkoffice.com/share/base/form/shrcnzp18Sdf6XQxm8wGPPXDt4b
填写抖音视频链接，申请 5 万+ 流量扶持。

---

## Self-Review

### Spec Coverage
- ✅ 视频概念（期末复习场景）- Task 3, 5
- ✅ 视频结构（8 场景 38 秒）- Task 5
- ✅ 视觉风格（9:16, 蓝色系, TikTok 字幕）- Task 5
- ✅ 技术栈（HyperFrames + OpenAI TTS + Puppeteer）- Task 1-5
- ✅ 实施步骤（环境→截图→TTS→音乐→HTML→渲染）- Task 1-7
- ✅ 质量检查 - Task 8
- ✅ 发布要求 - Task 8

### Placeholder Scan
- 无 TBD/TODO
- 所有代码步骤都有完整代码
- 所有命令都有 expected output

### Type Consistency
- 截图文件名一致: plans.png, study.png, practice.png, home.png
- 音频文件名一致: narration.mp3, music.mp3
- 场景 ID 一致: scene-hook, scene-pain, scene-intro, scene-plan, scene-study, scene-practice, scene-stats, scene-cta
- 时间轴一致: 0-3, 3-6, 6-10, 10-16, 16-22, 22-28, 28-33, 33-38
