import { useState } from 'react'
import AppLayout from '../components/AppLayout'
import { useSettingsStore, PROVIDER_PRESETS, type AIProvider } from '../store/settingsStore'

export default function SettingsPage() {
  const { provider, apiKey, baseURL, model, setProvider, setApiKey, setBaseURL, setModel, applyPreset, isConfigured } =
    useSettingsStore()
  const [showKey, setShowKey] = useState(false)
  const [saved, setSaved] = useState(false)

  const handlePresetChange = (id: AIProvider) => {
    const preset = PROVIDER_PRESETS.find((p) => p.id === id)
    if (preset) {
      applyPreset(preset)
      setProvider(id)
    }
  }

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const currentPreset = PROVIDER_PRESETS.find((p) => p.id === provider)

  return (
    <AppLayout>
      <div style={{ marginBottom: '32px' }}>
        <div className="section-label">设置</div>
        <h1 className="section-title" style={{ fontSize: '2.2rem', marginBottom: '8px' }}>
          AI 模型配置
        </h1>
        <p className="section-desc" style={{ margin: 0 }}>
          配置你的 AI 模型，解锁完整的智能学习能力。所有数据仅存储在本地浏览器。
        </p>
      </div>

      {/* 当前状态 */}
      <div className="app-card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="section-label" style={{ marginBottom: '8px' }}>当前状态</div>
            <div style={{ fontSize: '1.1rem', color: '#f0ece4' }}>
              {isConfigured() ? '✅ 已就绪' : '⚠️ 未配置'}
            </div>
            <div style={{ color: '#9a958c', fontSize: '0.9rem', marginTop: '4px' }}>
              {currentPreset?.label}
              {provider !== 'demo' && model ? ` · ${model}` : ''}
            </div>
          </div>
          {provider === 'demo' && (
            <span className="badge badge-demo">演示模式</span>
          )}
        </div>
      </div>

      {/* 提供商选择 */}
      <div className="app-card" style={{ marginBottom: '24px' }}>
        <div className="app-field">
          <label className="app-label">AI 服务商</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            {PROVIDER_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handlePresetChange(preset.id)}
                style={{
                  padding: '20px',
                  background: provider === preset.id ? 'rgba(212, 168, 83, 0.08)' : '#0a0a0f',
                  border: provider === preset.id ? '1px solid #d4a853' : '1px solid rgba(212, 168, 83, 0.12)',
                  borderRadius: '14px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.3s ease',
                }}
              >
                <div style={{ fontWeight: 600, color: provider === preset.id ? '#d4a853' : '#f0ece4', marginBottom: '6px' }}>
                  {preset.label}
                </div>
                <div style={{ fontSize: '0.82rem', color: '#9a958c', lineHeight: 1.5 }}>
                  {preset.hint}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 非 demo 模式显示配置项 */}
        {provider !== 'demo' && (
          <>
            <div className="app-field">
              <label className="app-label">API Key</label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <input
                  className="app-input"
                  type={showKey ? 'text' : 'password'}
                  placeholder="sk-..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
                <button
                  className="btn-ghost"
                  style={{ flexShrink: 0, whiteSpace: 'nowrap' }}
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? '隐藏' : '显示'}
                </button>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#5c584f', marginTop: '8px' }}>
                🔒 API Key 仅存储在你浏览器的 localStorage 中，不会上传到任何服务器。
              </div>
            </div>

            <div className="app-field">
              <label className="app-label">API Base URL</label>
              <input
                className="app-input"
                type="text"
                placeholder="https://api.openai.com/v1"
                value={baseURL}
                onChange={(e) => setBaseURL(e.target.value)}
              />
            </div>

            <div className="app-field">
              <label className="app-label">模型名称</label>
              <input
                className="app-input"
                type="text"
                placeholder="gpt-4o-mini"
                value={model}
                onChange={(e) => setModel(e.target.value)}
              />
              <div style={{ fontSize: '0.8rem', color: '#5c584f', marginTop: '8px' }}>
                推荐模型：gpt-4o-mini（性价比高）/ gpt-4o（效果最好）/ deepseek-chat（国内友好）
              </div>
            </div>
          </>
        )}

        {/* 保存按钮 */}
        <button className="btn-primary" onClick={handleSave}>
          {saved ? '已保存 ✓' : '保存配置'}
        </button>
      </div>

      {/* 安全提示 */}
      <div className="app-card" style={{ borderColor: 'rgba(245, 158, 11, 0.2)' }}>
        <div className="section-label" style={{ color: '#f59e0b', marginBottom: '12px' }}>安全说明</div>
        <ul style={{ color: '#9a958c', fontSize: '0.88rem', lineHeight: 1.8, paddingLeft: '20px' }}>
          <li>本产品为纯前端应用，所有数据存储在浏览器本地（localStorage）。</li>
          <li>API Key 仅用于直接从你的浏览器调用 AI 服务，不经过任何中间服务器。</li>
          <li>请勿在公共电脑上保存 API Key。</li>
          <li>演示模式下，AI 回复为预置示例内容，仅支持「递归」「HTTP 协议」「光合作用」三个话题。</li>
        </ul>
      </div>
    </AppLayout>
  )
}
