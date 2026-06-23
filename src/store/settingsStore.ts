/**
 * 设置 Store — API Key、模型配置
 * 使用 zustand persist 中间件持久化到 localStorage
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type AIProvider = 'openai' | 'deepseek' | 'custom' | 'demo'

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

interface SettingsState {
  provider: AIProvider
  apiKey: string
  baseURL: string
  model: string
  setProvider: (provider: AIProvider) => void
  setApiKey: (key: string) => void
  setBaseURL: (url: string) => void
  setModel: (model: string) => void
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
      setProvider: (provider) => set({ provider }),
      setApiKey: (apiKey) => set({ apiKey }),
      setBaseURL: (baseURL) => set({ baseURL }),
      setModel: (model) => set({ model }),
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
