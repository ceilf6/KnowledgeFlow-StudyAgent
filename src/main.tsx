import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { resolveSystemTheme, type ThemeId } from './store/settingsStore'
import './index.css'
import './styles/app.css'

/**
 * 主题防闪烁（FOUC prevention）：
 * 在 React 渲染前同步读取 localStorage 中的主题偏好并写入 <html data-theme>。
 * 若用户选择 'system' 或无记录，则按 prefers-color-scheme 解析。
 * 必须同步执行，否则首帧会以 :root 默认（obsidian）渲染后跳变。
 *
 * matchMedia 解析统一走 resolveSystemTheme()，与 App.tsx 运行时逻辑共享同一段防护。
 */
;(function applyInitialTheme() {
  try {
    const raw = localStorage.getItem('kf-settings')
    const stored = raw ? (JSON.parse(raw).state?.theme as ThemeId | undefined) : undefined
    const theme = stored || 'system'
    const resolved = theme === 'system' ? resolveSystemTheme() : theme
    document.documentElement.setAttribute('data-theme', resolved)
  } catch {
    document.documentElement.setAttribute('data-theme', 'obsidian')
  }
})()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
