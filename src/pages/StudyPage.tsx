import { useState, useRef, useEffect, useCallback } from 'react'
import AppLayout from '../components/AppLayout'
import MarkdownView from '../components/MarkdownView'
import { useSettingsStore } from '../store/settingsStore'
import { useStudyStore, type StudyMessage } from '../store/studyStore'
import { streamChat, type ChatMessage } from '../lib/ai'
import { getDemoResponse } from '../lib/demo'
import { STUDY_SYSTEM_PROMPT } from '../lib/prompts'

const SUGGESTED_TOPICS = ['递归', 'HTTP 协议', '光合作用', '闭包', '二分查找', '牛顿第一定律']

export default function StudyPage() {
  const { provider, apiKey, baseURL, model, isConfigured } = useSettingsStore()
  const { sessions, createSession, addMessage, markLearned } = useStudyStore()

  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [streamContent, setStreamContent] = useState('')
  const [error, setError] = useState('')
  const abortRef = useRef<AbortController | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const streamContentRef = useRef<string>('')

  const currentSession = currentSessionId
    ? sessions.find((s) => s.id === currentSessionId)
    : null

  const messages = currentSession?.messages || []

  // 自动滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, streamContent])

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || streaming) return
      setError('')

      // 创建或复用会话
      let sessionId = currentSessionId
      if (!sessionId) {
        sessionId = createSession(text.slice(0, 30))
        setCurrentSessionId(sessionId)
      }

      const userMsg: StudyMessage = { role: 'user', content: text, ts: Date.now() }
      addMessage(sessionId, userMsg)

      // 构建历史消息
      const history: ChatMessage[] = [
        { role: 'system', content: STUDY_SYSTEM_PROMPT },
      ]
      const session = useStudyStore.getState().sessions.find((s) => s.id === sessionId)
      if (session) {
        for (const m of session.messages) {
          history.push({ role: m.role, content: m.content })
        }
      }

      setInput('')
      setStreaming(true)
      setStreamContent('')
      streamContentRef.current = ''
      // 单一 controller 贯穿整个请求生命周期，避免 demo/real 分支各自创建导致 stop 失效
      const myController = new AbortController()
      abortRef.current = myController
      const signal = myController.signal

      // 演示模式或配置不完整时走 demo 兜底，避免直接调真实 API 失败
      if (provider === 'demo' || !isConfigured()) {
        const demoResp = getDemoResponse(text)
        if (!demoResp) {
          setStreaming(false)
          if (abortRef.current === myController) abortRef.current = null
          return
        }
        try {
          // 模拟流式输出，每步检查取消信号
          let acc = ''
          for (let i = 0; i < demoResp.length; i += 3) {
            if (signal.aborted) break
            acc += demoResp.slice(i, i + 3)
            setStreamContent(acc)
            streamContentRef.current = acc
            await new Promise((r) => setTimeout(r, 12))
          }
          // 如果被取消，保留已生成内容；否则保存完整内容
          const finalContent = signal.aborted ? acc : demoResp
          if (finalContent) {
            addMessage(sessionId, { role: 'assistant', content: finalContent, ts: Date.now() })
          }
          setStreamContent('')
          streamContentRef.current = ''
          if (!signal.aborted) markLearned(text.slice(0, 30), 'learning')
        } finally {
          if (abortRef.current === myController) abortRef.current = null
          setStreaming(false)
        }
        return
      }

      // 真实 API 调用
      try {
        // 用局部变量保存流式累计文本，避免闭包读取过期的 state
        let accText = ''
        await streamChat(
          history,
          { apiKey, baseURL, model },
          (chunk) => {
            accText += chunk
            setStreamContent(accText)
            streamContentRef.current = accText
          },
          signal,
        )
        addMessage(sessionId, { role: 'assistant', content: accText, ts: Date.now() })
        setStreamContent('')
        streamContentRef.current = ''
        markLearned(text.slice(0, 30), 'learning')
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          // 用户取消，从 ref 保存已生成内容（不依赖可能过期的 state）
          if (streamContentRef.current) {
            addMessage(sessionId, { role: 'assistant', content: streamContentRef.current, ts: Date.now() })
          }
        } else {
          setError(err instanceof Error ? err.message : 'AI 调用失败，请检查设置')
        }
        setStreamContent('')
        streamContentRef.current = ''
      } finally {
        if (abortRef.current === myController) abortRef.current = null
        setStreaming(false)
      }
    },
    [currentSessionId, streaming, provider, apiKey, baseURL, model, isConfigured, createSession, addMessage, markLearned, streamContent],
  )

  const handleSend = () => {
    sendMessage(input)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleStop = () => {
    abortRef.current?.abort()
  }

  const handleNewSession = () => {
    setCurrentSessionId(null)
    setStreamContent('')
    setError('')
  }

  return (
    <AppLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <div className="section-label">智能学习</div>
          <h1 className="section-title" style={{ fontSize: '2.2rem', marginBottom: '8px' }}>
            知识点讲解
          </h1>
          <p className="section-desc" style={{ margin: 0 }}>
            默认你是零基础。先补前置概念，再推进核心内容。每次只讲一个最小知识点。
          </p>
        </div>
        {currentSessionId && (
          <button className="btn-ghost" onClick={handleNewSession}>
            新对话
          </button>
        )}
      </div>

      {/* 历史会话 */}
      {sessions.length > 0 && !currentSessionId && (
        <div style={{ marginBottom: '32px' }}>
          <div className="section-label" style={{ marginBottom: '16px' }}>继续学习</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            {sessions.slice(0, 6).map((s) => (
              <button
                key={s.id}
                className="topic-chip"
                onClick={() => setCurrentSessionId(s.id)}
              >
                {s.topic}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 对话区 */}
      <div ref={scrollRef} style={{ maxHeight: 'calc(100vh - 360px)', overflowY: 'auto', marginBottom: '20px' }}>
        {messages.length === 0 && !streaming ? (
          <div className="empty-state">
            <div className="empty-state-icon">📖</div>
            <div className="empty-state-title">想学什么？</div>
            <div className="empty-state-desc">
              输入一个知识点，AI 会按「前置概念 → 核心定义 → 为什么重要 → 学习问法 → 答题模板 → 易错点 → 小练习」七步为你讲解。
              <br /><br />
              {provider === 'demo' ? '当前为演示模式，试试以下示例：' : '也可以试试以下话题：'}
            </div>
            <div className="topic-suggestions" style={{ justifyContent: 'center' }}>
              {SUGGESTED_TOPICS.map((topic) => (
                <button
                  key={topic}
                  className="topic-chip"
                  onClick={() => sendMessage(topic)}
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="chat-container">
            {messages.map((msg, i) => (
              <div key={i} className="chat-message">
                <div className={`chat-avatar ${msg.role === 'user' ? 'user' : 'ai'}`}>
                  {msg.role === 'user' ? '你' : 'AI'}
                </div>
                <div className="chat-bubble">
                  <div className="chat-bubble-role">
                    {msg.role === 'user' ? '学习者' : 'KnowledgeFlow'}
                  </div>
                  <div className={`chat-content ${msg.role === 'user' ? 'user-content' : ''}`}>
                    {msg.role === 'user' ? (
                      <p style={{ margin: 0, color: '#c9c4ba' }}>{msg.content}</p>
                    ) : (
                      <MarkdownView content={msg.content} />
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* 流式输出中 */}
            {streaming && (
              <div className="chat-message">
                <div className="chat-avatar ai">AI</div>
                <div className="chat-bubble">
                  <div className="chat-bubble-role">KnowledgeFlow</div>
                  <div className="chat-content">
                    {streamContent ? (
                      <MarkdownView content={streamContent} />
                    ) : (
                      <div className="loading-dots">
                        <span></span><span></span><span></span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 错误提示 */}
            {error && (
              <div className="chat-content" style={{ borderColor: 'rgba(239, 68, 68, 0.3)', color: '#f87171' }}>
                {error}
                <br />
                <button
                  className="btn-ghost"
                  style={{ marginTop: '12px', fontSize: '0.85rem' }}
                  onClick={() => { setError(''); }}
                >
                  重试
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 输入区 */}
      <div className="chat-input-area">
        <div className="chat-input-row">
          <textarea
            className="chat-input"
            placeholder="输入你想学的知识点，比如「什么是闭包」「HTTP 和 HTTPS 的区别」…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={streaming}
            rows={1}
          />
          {streaming ? (
            <button className="chat-send-btn" onClick={handleStop} title="停止生成">
              ■
            </button>
          ) : (
            <button
              className="chat-send-btn"
              onClick={handleSend}
              disabled={!input.trim()}
              title="发送"
            >
              →
            </button>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
