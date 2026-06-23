# 主题系统设计（Theme System Design）

**日期**：2026-06-23
**状态**：Draft
**类型**：Design System Architecture Adjustment

## 1. 背景与动机

KnowledgeFlow 当前采用单一"黑金奢华编辑风"主题：深黑底 `#0a0a0f` + 金色 `#d4a853` + Playfair Display。所有颜色硬编码于 `src/index.css` 与 `src/styles/app.css`，无 CSS 变量、无主题切换能力。

**学习效率视角的三个问题**：

1. **长时间阅读疲劳**：学习场景下用户会停留 30 分钟以上盯着 Markdown 正文（StudyPage chat-content），高对比黑金适合品牌着陆页的"惊艳感"，但加速视疲劳。
2. **环境光不适配**：学习者白天明亮教室与晚上昏暗宿舍共用同一界面。
3. **缺乏个性化归属**：无法调整主题会削弱"这是我的学习空间"的持续使用意愿。

## 2. 目标

- 提供 3 套精心设计的预设主题，覆盖夜间/阅读/白天三场景。
- 全站支持主题切换（含着陆页）。
- 首次访问跟随系统 `prefers-color-scheme`，用户手动切换后记住偏好。
- 保留黑金作为默认品牌主题，不稀释品牌识别。

## 3. 非目标

- 不做"调色板自由切换"（红绿蓝紫），避免稀释品牌与增加心智负担。
- 不做用户自定义颜色导入/导出。
- 不引入 CSS-in-JS 运行时主题引擎，保持纯 CSS 变量方案。

## 4. 主题定义

### 4.1 Obsidian（默认·现状保留）

夜间/品牌展示场景。完全保留当前黑金配色。

| Token | 值 | 用途 |
|-------|-----|------|
| `--bg-deep` | `#0a0a0f` | 页面底色 |
| `--bg-surface` | `#12121a` | 卡片底 |
| `--bg-elevated` | `#1a1a26` | 悬浮元素 |
| `--bg-input` | `#0a0a0f` | 输入框底 |
| `--bg-code` | `#08080d` | 代码块底 |
| `--gold-primary` | `#d4a853` | 主强调 |
| `--gold-light` | `#e8c878` | 次强调 |
| `--gold-dim` | `#8a6d2b` | 弱化强调 |
| `--teal-accent` | `#2dd4bf` | 用户消息/已掌握 |
| `--teal-deep` | `#0d9488` | — |
| `--text-primary` | `#f0ece4` | 正文 |
| `--text-body` | `#c9c4ba` | Markdown 正文 |
| `--text-secondary` | `#9a958c` | 次要文字 |
| `--text-muted` | `#5c584f` | 弱化文字 |
| `--border-gold` | `rgba(212, 168, 83, 0.12)` | 金色描边 |
| `--border-gold-strong` | `rgba(212, 168, 83, 0.25)` | 强描边 |
| `--grain-opacity` | `0.04` | 噪点强度 |

### 4.2 Parchment（米黄纸·阅读优化）

长时间阅读/白天柔和场景。模拟旧书纸质感。

| Token | 值 |
|-------|-----|
| `--bg-deep` | `#f5f0e6` |
| `--bg-surface` | `#ede5d3` |
| `--bg-elevated` | `#e3d9c2` |
| `--bg-input` | `#fbf7ee` |
| `--bg-code` | `#e8dfc9` |
| `--gold-primary` | `#8a5a1f` |
| `--gold-light` | `#a87328` |
| `--gold-dim` | `#6b4415` |
| `--teal-accent` | `#0d7d72` |
| `--teal-deep` | `#0a5e56` |
| `--text-primary` | `#3d2f1f` |
| `--text-body` | `#5a4a35` |
| `--text-secondary` | `#7a6a55` |
| `--text-muted` | `#9a8a75` |
| `--border-gold` | `rgba(138, 90, 31, 0.18)` |
| `--border-gold-strong` | `rgba(138, 90, 31, 0.35)` |
| `--grain-opacity` | `0.06` |

### 4.3 Daylight（清亮白·强光环境）

强光环境/偏好浅色场景。保留金色作品牌锚点。

| Token | 值 |
|-------|-----|
| `--bg-deep` | `#fafafa` |
| `--bg-surface` | `#ffffff` |
| `--bg-elevated` | `#f4f4f5` |
| `--bg-input` | `#ffffff` |
| `--bg-code` | `#f4f4f5` |
| `--gold-primary` | `#a87328` |
| `--gold-light` | `#c89548` |
| `--gold-dim` | `#8a5a1f` |
| `--teal-accent` | `#0d9488` |
| `--teal-deep` | `#0a766c` |
| `--text-primary` | `#1a1a1a` |
| `--text-body` | `#3a3a3a` |
| `--text-secondary` | `#6a6a6a` |
| `--text-muted` | `#9a9a9a` |
| `--border-gold` | `rgba(168, 115, 40, 0.18)` |
| `--border-gold-strong` | `rgba(168, 115, 40, 0.35)` |
| `--grain-opacity` | `0.03` |

## 5. 技术方案

### 5.1 CSS 变量架构

在 `src/index.css` 顶部定义 `:root`（默认 Obsidian）与 `[data-theme="parchment"]`、`[data-theme="daylight"]` 三个选择器块，每个块覆盖全部 token 变量。

所有现有硬编码颜色（`#0a0a0f`、`#d4a853`、`rgba(212, 168, 83, 0.12)` 等）替换为 `var(--token-name)`。

### 5.2 Tailwind 集成

`tailwind.config.js` 的 `colors` 字段从硬编码值改为 `rgb(var(--token-rgb) / <alpha-value>)` 形式，或直接引用 CSS 变量字符串。考虑到当前 Tailwind 类使用较少（项目以自定义 CSS 类为主），采用直接字符串引用 `'var(--bg-deep)'` 即可。

### 5.3 状态管理

`settingsStore` 增加：

```ts
type ThemeId = 'obsidian' | 'parchment' | 'daylight' | 'system'
theme: ThemeId          // 'system' 表示跟随系统
resolvedTheme: ThemeId  // 实际解析后的主题（不含 'system'）
setTheme: (theme: ThemeId) => void
```

`'system'` 在 store 内部解析为 `obsidian` 或 `daylight`（基于 `prefers-color-scheme`）。持久化 `theme` 字段。

### 5.4 主题应用

在 `App.tsx` 中通过 `useEffect` 监听 `theme` 变化，将 `data-theme` 属性写到 `document.documentElement`。同时监听 `prefers-color-scheme` 变化（当 `theme === 'system'` 时重新解析）。

为避免首屏闪烁（FOUC），在 `main.tsx` 中插入一段同步脚本，在 React 渲染前从 localStorage 读取 `kf-settings` 并设置 `data-theme`。

### 5.5 切换器 UI

`ThemeSwitcher` 组件：3 段式 segmented control（Obsidian / Parchment / Daylight），含一个"跟随系统"选项。放置于：
- `AppNav`（应用内导航栏，右侧）
- `Nav`（着陆页导航栏，右侧）

样式遵循现有 `.btn-ghost` 风格，使用图标 + 文字。

## 6. 兼容性与迁移

- 现有所有页面无需改动业务逻辑，仅样式 token 替换。
- `SettingsPage` 等内联 `style={{ color: '#f0ece4' }}` 需替换为 `var(--text-primary)`。
- `tailwind.config.js` 中 `animation` / `keyframes` 不变。

## 7. 验收标准

1. 三套主题切换时无视觉断裂，所有页面颜色一致变化。
2. 刷新页面后主题保持，无 FOUC。
3. 首次访问（无 localStorage）时，深色系统→Obsidian，浅色系统→Daylight。
4. `prefers-color-scheme` 变化时（且 `theme === 'system'`），主题实时跟随。
5. 现有黑金视觉与切换前像素级一致（Obsidian 主题）。
