import { THEME_OPTIONS, useSettingsStore, type ThemeId } from '../store/settingsStore'

/**
 * 主题切换器 — 4 段式 segmented control
 * 系统 / 黑曜 / 羊皮纸 / 日光
 */
export default function ThemeSwitcher() {
  const theme = useSettingsStore((s) => s.theme)
  const setTheme = useSettingsStore((s) => s.setTheme)

  return (
    <div
      className="theme-switcher"
      role="radiogroup"
      aria-label="主题切换"
      title="切换主题"
    >
      {THEME_OPTIONS.map((opt) => (
        <button
          key={opt.id}
          type="button"
          role="radio"
          aria-checked={theme === opt.id}
          aria-label={`${opt.label} — ${opt.hint}`}
          title={`${opt.label} · ${opt.hint}`}
          className={`theme-switcher-btn ${theme === opt.id ? 'active' : ''}`}
          onClick={() => setTheme(opt.id as ThemeId)}
        >
          {opt.icon}
        </button>
      ))}
    </div>
  )
}
