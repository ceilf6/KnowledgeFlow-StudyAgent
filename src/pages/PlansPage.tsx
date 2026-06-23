import { useState, useRef } from 'react'
import AppLayout from '../components/AppLayout'
import MarkdownView from '../components/MarkdownView'
import { useSettingsStore } from '../store/settingsStore'
import { useStudyStore } from '../store/studyStore'
import { streamChat, type ChatMessage } from '../lib/ai'
import { PLAN_SYSTEM_PROMPT } from '../lib/prompts'

const DEMO_PLAN = `## 学习目标
掌握 JavaScript 闭包，理解其原理并能实际应用

## 知识路线

### 节点 1：变量作用域
- 简介：理解变量在什么范围内可以被访问
- 前置依赖：无
- 难度：⭐

### 节点 2：函数作用域与作用域链
- 简介：函数创建独立的作用域，内层可以访问外层变量
- 前置依赖：节点 1
- 难度：⭐⭐

### 节点 3：执行上下文与调用栈
- 简介：JavaScript 引擎如何管理函数的执行环境
- 前置依赖：节点 2
- 难度：⭐⭐

### 节点 4：闭包的定义
- 简介：函数与其词法环境的组合，让内层函数可以访问外层变量
- 前置依赖：节点 3
- 难度：⭐⭐

### 节点 5：闭包的常见应用
- 简介：模块化、回调、柯里化、防抖节流等
- 前置依赖：节点 4
- 难度：⭐⭐⭐

### 节点 6：闭包的陷阱与内存管理
- 简介：闭包导致的内存泄漏问题及解决方案
- 前置依赖：节点 5
- 难度：⭐⭐⭐

## 学习建议
1. 先彻底搞懂作用域，再学闭包，不要跳步。
2. 多写代码实验，用 console.log 观察变量访问。
3. 理解"闭包是函数+词法环境"这个定义，而不是死记"函数嵌套"。`

export default function PlansPage() {
  const { provider, apiKey, baseURL, model, isConfigured } = useSettingsStore()
  const { learned, markLearned } = useStudyStore()

  const [goal, setGoal] = useState('')
  const [plan, setPlan] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const abortRef = useRef<AbortController | null>(null)

  const handleGenerate = async () => {
    if (!goal.trim() || loading) return
    setError('')
    setLoading(true)
    setPlan('')
    // 单一 controller 贯穿整个请求生命周期，避免 demo/real 分支各自创建导致 stop 失效
    const myController = new AbortController()
    abortRef.current = myController
    const signal = myController.signal

    // 演示模式或配置不完整时走 demo 兜底
    if (provider === 'demo' || !isConfigured()) {
      try {
        let acc = ''
        for (let i = 0; i < DEMO_PLAN.length; i += 5) {
          if (signal.aborted) break
          acc += DEMO_PLAN.slice(i, i + 5)
          setPlan(acc)
          await new Promise((r) => setTimeout(r, 10))
        }
      } finally {
        // 只在 controller 仍属于当前请求时清理，避免清掉用户重试后新请求的 controller
        if (abortRef.current === myController) abortRef.current = null
        setLoading(false)
      }
      return
    }

    // 真实 API
    try {
      const messages: ChatMessage[] = [
        { role: 'system', content: PLAN_SYSTEM_PROMPT },
        { role: 'user', content: `请为以下学习目标生成知识路线：\n\n${goal}` },
      ]
      // 用局部变量保存流式累计文本，abort 时直接保留，不回写旧 plan
      let accText = ''
      await streamChat(
        messages,
        { apiKey, baseURL, model },
        (chunk) => {
          accText += chunk
          setPlan(accText)
        },
        signal,
      )
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // 用户主动取消，保留当前流式已生成内容（accText 已通过 setPlan 持续更新到 UI）
      } else {
        setError(err instanceof Error ? err.message : '生成失败，请检查设置')
      }
    } finally {
      if (abortRef.current === myController) abortRef.current = null
      setLoading(false)
    }
  }

  const handleStop = () => {
    // 只触发取消，不在这里设置 loading=false
    // 让当前请求的 finally 统一收尾，避免用户立刻重试时旧 finally 清掉新 controller
    abortRef.current?.abort()
  }

  const SUGGESTED_GOALS = ['JavaScript 闭包', 'React Hooks', '数据结构 - 树', '线性代数基础', 'Python 面向对象']

  return (
    <AppLayout>
      <div style={{ marginBottom: '32px' }}>
        <div className="section-label">学习计划</div>
        <h1 className="section-title" style={{ fontSize: '2.2rem', marginBottom: '8px' }}>
          知识路线规划
        </h1>
        <p className="section-desc" style={{ margin: 0 }}>
          输入学习目标，AI 自动反推知识路线。按知识点维度组织，不写时间安排噪音。
        </p>
      </div>

      {/* 输入区 */}
      <div className="app-card" style={{ marginBottom: '24px' }}>
        <div className="app-field" style={{ marginBottom: '16px' }}>
          <label className="app-label">学习目标</label>
          <textarea
            className="app-textarea"
            placeholder="比如：我想学会 JavaScript 闭包 / 我想准备数据结构面试 / 我想理解计算机网络…"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            disabled={loading}
          />
        </div>
        <div className="topic-suggestions" style={{ marginTop: '0', marginBottom: '20px' }}>
          {SUGGESTED_GOALS.map((g) => (
            <button
              key={g}
              className="topic-chip"
              onClick={() => setGoal(g)}
              disabled={loading}
            >
              {g}
            </button>
          ))}
        </div>
        {loading ? (
          <button className="btn-ghost" onClick={handleStop}>
            停止生成
          </button>
        ) : (
          <button className="btn-primary" onClick={handleGenerate} disabled={!goal.trim()}>
            生成知识路线 →
          </button>
        )}
      </div>

      {/* 错误 */}
      {error && (
        <div className="app-card" style={{ borderColor: 'rgba(239, 68, 68, 0.3)', color: '#f87171', marginBottom: '24px' }}>
          {error}
        </div>
      )}

      {/* 计划输出 */}
      {plan && (
        <div className="app-card" style={{ marginBottom: '24px' }}>
          <div className="section-label" style={{ marginBottom: '16px' }}>生成的知识路线</div>
          <MarkdownView content={plan} />
        </div>
      )}

      {/* 已学知识点 */}
      {learned.length > 0 && (
        <div className="app-card">
          <div className="section-label" style={{ marginBottom: '16px' }}>学习记录（{learned.length}）</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {learned.map((node, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px 20px',
                  background: '#0a0a0f',
                  borderRadius: '12px',
                  border: '1px solid rgba(212, 168, 83, 0.1)',
                }}
              >
                <div>
                  <div style={{ color: '#f0ece4', fontWeight: 500 }}>{node.topic}</div>
                  <div style={{ fontSize: '0.8rem', color: '#5c584f', marginTop: '4px' }}>
                    {new Date(node.learnedAt).toLocaleString('zh-CN')}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span className={`badge ${node.status === 'mastered' ? 'badge-mastered' : 'badge-learning'}`}>
                    {node.status === 'mastered' ? '已掌握' : '学习中'}
                  </span>
                  {node.status !== 'mastered' && (
                    <button
                      className="btn-ghost"
                      style={{ padding: '4px 12px', fontSize: '0.8rem' }}
                      onClick={() => markLearned(node.topic, 'mastered')}
                    >
                      标记掌握
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </AppLayout>
  )
}
