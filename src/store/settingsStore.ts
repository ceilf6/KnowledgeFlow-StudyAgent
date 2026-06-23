/**
 * 设置 Store — API Key、模型配置、主题
 * 使用 zustand persist 中间件持久化到 localStorage
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type AIProvider = 'openai' | 'deepseek' | 'custom' | 'demo'

/** 用户可选择的主题标识；'system' 表示跟随系统偏好 */
export type ThemeId = 'obsidian' | 'parchment' | 'daylight' | 'system'

/** 实际解析后的主题（不含 'system'） */
export type ResolvedTheme = 'obsidian' | 'parchment' | 'daylight'

export interface ProviderPreset {
  id: AIProvider
  label: string
  baseURL: string
  model: string
  hint: string
}

export const PROVIDER_PRESETS: ProviderPreset[] = [
  {
    id: 'demo',
    label: '演示模式（无需 API Key）',
    baseURL: '',
    model: '',
    hint: '使用预置示例内容体验产品功能，无需配置。适合快速了解平台能力。',
  },
  {
    id: 'openai',
    label: 'OpenAI',
    baseURL: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
    hint: '使用 OpenAI 官方 API。需要 api.openai.com 的访问权限。',
  },
  {
    id: 'deepseek',
    label: 'DeepSeek',
    baseURL: 'https://api.deepseek.com/v1',
    model: 'deepseek-chat',
    hint: '使用 DeepSeek API，国内访问友好，性价比高。',
  },
  {
    id: 'custom',
    label: '自定义（OpenAI 兼容）',
    baseURL: '',
    model: '',
    hint: '任何兼容 OpenAI Chat Completions 接口的服务。',
  },
]

/** 主题选项元数据，供切换器 UI 渲染 */
export interface ThemeOption {
  id: ThemeId
  label: string
  icon: string
  hint: string
}

export const THEME_OPTIONS: ThemeOption[] = [
  { id: 'system', label: '系统', icon: '◐', hint: '跟随系统偏好' },
  { id: 'obsidian', label: '黑曜', icon: '●', hint: '黑金奢华·夜间' },
  { id: 'parchment', label: '羊皮纸', icon: '◑', hint: '米黄纸·长时间阅读' },
  { id: 'daylight', label: '日光', icon: '○', hint: '清亮白·强光环境' },
]

/**
 * 根据系统 prefers-color-scheme 解析主题。
 * 深色系统 → obsidian；浅色系统 → daylight。
 * SSR / 不支持 matchMedia 时回退到 obsidian。
 */
export function resolveSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined' || !window.matchMedia) return 'obsidian'
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'obsidian'
    : 'daylight'
}

/** 将 ThemeId 解析为实际生效的 ResolvedTheme */
export function resolveTheme(theme: ThemeId): ResolvedTheme {
  return theme === 'system' ? resolveSystemTheme() : theme
}

interface SettingsState {
  provider: AIProvider
  apiKey: string
  baseURL: string
  model: string
  theme: ThemeId
  setProvider: (provider: AIProvider) => void
  setApiKey: (key: string) => void
  setBaseURL: (url: string) => void
  setModel: (model: string) => void
  setTheme: (theme: ThemeId) => void
  applyPreset: (preset: ProviderPreset) => void
  isConfigured: () => boolean
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      provider: 'demo',
      apiKey: '',
      baseURL: '',
      model: '',
      theme: 'system',
      setProvider: (provider) => set({ provider }),
      setApiKey: (apiKey) => set({ apiKey }),
      setBaseURL: (baseURL) => set({ baseURL }),
      setModel: (model) => set({ model }),
      setTheme: (theme) => set({ theme }),
      applyPreset: (preset) =>
        set({
          provider: preset.id,
          baseURL: preset.baseURL,
          model: preset.model,
        }),
      isConfigured: () => {
        const { provider, apiKey, baseURL, model } = get()
        if (provider === 'demo') return true
        return Boolean(apiKey && baseURL && model)
      },
    }),
    { name: 'kf-settings' },
  ),
)
