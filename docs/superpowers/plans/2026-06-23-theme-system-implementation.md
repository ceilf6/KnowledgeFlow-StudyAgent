# 主题系统实现计划（Theme System Implementation Plan）

**日期**：2026-06-23
**关联 Spec**：`docs/superpowers/specs/2026-06-23-theme-system-design.md`

## 实施顺序

### Phase 1：CSS 变量层（基础设施）

**文件**：`src/index.css`

1. 在 `@layer base` 之前新增 `:root`、`[data-theme="parchment"]`、`[data-theme="daylight"]` 三个变量定义块，覆盖 spec 第 4 节全部 token。
2. 将 `body`、`::selection`、所有 `@layer components` 内的硬编码颜色替换为 `var(--token)`。
3. 噪点 overlay 的 `opacity` 改为 `var(--grain-opacity)`。

**文件**：`src/styles/app.css`

4. 将所有 `#0a0a0f`、`#12121a`、`#1a1a26`、`#d4a853`、`#e8c878`、`#8a6d2b`、`#2dd4bf`、`#f0ece4`、`#c9c4ba`、`#9a958c`、`#5c584f`、`rgba(212, 168, 83, ...)`、`rgba(45, 212, 191, ...)` 替换为对应 `var(--token)`。

### Phase 2：Tailwind 配置

**文件**：`tailwind.config.js`

5. `colors` 字段值改为 `'var(--bg-deep)'` 等字符串引用（保持键名不变，向后兼容）。

### Phase 3：状态层

**文件**：`src/store/settingsStore.ts`

6. 新增 `ThemeId` 类型、`theme` / `resolvedTheme` 状态、`setTheme` action。
7. `persist` 配置不变（`name: 'kf-settings'`），新增字段自动持久化。
8. 新增 `resolveSystemTheme()` 工具函数：`window.matchMedia('(prefers-color-scheme: dark)').matches ? 'obsidian' : 'daylight'`。

### Phase 4：主题应用

**文件**：`src/main.tsx`

9. 在 `createRoot().render()` 之前插入同步初始化脚本：从 `localStorage.getItem('kf-settings')` 解析 `theme`，若为 `'system'` 或不存在则调用 `resolveSystemTheme()`，将结果写入 `document.documentElement.dataset.theme`。

**文件**：`src/App.tsx`

10. 新增 `useThemeEffect()` hook：订阅 `useSettingsStore` 的 `theme`，在 `useEffect` 中计算 `resolvedTheme` 并写 `data-theme`；同时监听 `matchMedia('(prefers-color-scheme: dark)')` 的 `change` 事件，当 `theme === 'system'` 时重新解析。

### Phase 5：切换器组件

**文件**：`src/components/ThemeSwitcher.tsx`（新建）

11. 实现 4 选项 segmented control：系统 / Obsidian / Parchment / Daylight。
12. 样式使用现有 `.btn-ghost` 派生，紧凑型布局，适配导航栏。
13. 当前选中项高亮（`.active` 态）。

### Phase 6：导航栏集成

**文件**：`src/components/AppNav.tsx`、`src/components/Nav.tsx`

14. 在两个导航栏右侧加入 `<ThemeSwitcher />`。
15. 调整 `nav-bar` / `app-nav` 的 flex 布局，确保切换器与现有链接对齐。

### Phase 7：内联样式清理

**文件**：`src/pages/SettingsPage.tsx` 及其他含内联颜色的页面

16. 将 `style={{ color: '#f0ece4' }}` 等内联硬编码替换为 `var(--text-primary)` 等。
17. 扫描 `src/pages/*.tsx` 与 `src/components/*.tsx` 中的 `#` 开头颜色字面量，统一替换。

### Phase 8：验证

18. `npm run build` 通过。
19. `npm run quality:precommit` 通过（若可用）。
20. 启动 dev server 人工验证三套主题切换、刷新持久化、系统跟随。

## 风险与回滚

- **风险**：CSS 变量替换遗漏导致某元素颜色异常。
- **缓解**：Obsidian 主题的 token 值与原硬编码完全一致，替换后视觉应像素级不变；若有差异即为遗漏点。
- **回滚**：所有改动集中在 CSS 变量层，回滚只需还原 `index.css` / `app.css` 两个文件即可恢复原状。

## 不在本次范围

- 不修改 `animation` / `keyframes`。
- 不调整字体（Playfair Display + DM Sans 三套主题共用）。
- 不引入新的依赖包。
