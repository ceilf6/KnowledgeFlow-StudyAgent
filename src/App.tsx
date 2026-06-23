import { useEffect } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import StudyPage from './pages/StudyPage'
import PlansPage from './pages/PlansPage'
import PracticePage from './pages/PracticePage'
import ResourcesPage from './pages/ResourcesPage'
import SettingsPage from './pages/SettingsPage'
import { useSettingsStore, resolveTheme } from './store/settingsStore'

/**
 * 主题副作用 hook：
 * - 订阅 store 中的 theme（含 'system'）
 * - 将解析后的 ResolvedTheme 写入 <html data-theme>
 * - 当 theme === 'system' 时，监听 prefers-color-scheme 变化实时跟随
 *
 * matchMedia 防护与 settingsStore.resolveSystemTheme() 保持一致：
 * 不支持 matchMedia 的环境回退到 obsidian，不抛错。
 */
function useThemeEffect() {
  const theme = useSettingsStore((s) => s.theme)

  useEffect(() => {
    const root = document.documentElement
    const apply = () => {
      root.setAttribute('data-theme', resolveTheme(theme))
    }
    apply()

    if (theme !== 'system') return
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    mql.addEventListener('change', apply)
    return () => mql.removeEventListener('change', apply)
  }, [theme])
}

export default function App() {
  useThemeEffect()
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/study" element={<StudyPage />} />
        <Route path="/plans" element={<PlansPage />} />
        <Route path="/practice" element={<PracticePage />} />
        <Route path="/resources" element={<ResourcesPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </HashRouter>
  )
}
