import { useState, useRef } from 'react'
import AppLayout from '../components/AppLayout'
import MarkdownView from '../components/MarkdownView'
import { useSettingsStore } from '../store/settingsStore'
import { useStudyStore } from '../store/studyStore'
import { streamChat, type ChatMessage } from '../lib/ai'
import { PRACTICE_SYSTEM_PROMPT } from '../lib/prompts'

const DEMO_QUESTIONS = `## 第 1 题（概念理解）
递归函数必须包含以下哪个要素？

A. 循环语句
B. 终止条件（基线条件）
C. 全局变量
D. 数组参数

---
## 第 2 题（简单应用）
以下递归函数 \`countdown(n)\` 的作用是什么？如果调用 \`countdown(3)\`，输出是什么？

\`\`\`
function countdown(n) {
  if (n <= 0) {
    console.log("完成")
    return
  }
  console.log(n)
  countdown(n - 1)
}
\`\`\`

---
## 第 3 题（综合提升）
请写一个递归函数 \`sum(n)\`，计算 1 + 2 + 3 + ... + n 的值。要求：
1. 写出终止条件
2. 写出递归关系
3. 调用 \`sum(5)\` 应该返回 15`

/**
 * 从批改回复中解析得分
 * 只匹配明确的最终总分字段，避免误匹配正文中的"第 1 题…1 分"等
 * 支持格式："总分：2"、"最终得分：2"、"最终评分：2/3"、"得分：2/3"
 * 解析失败时返回 -1（调用方据此决定是否写入记录）
 */
function parseScore(text: string, total: number): number {
  // 只匹配明确的"总分|最终得分|最终评分"前缀，避免误匹配正文数字
  const totalMatch = text.match(/(?:总分|最终得分|最终评分|最终分数)[：:]\s*(\d+)/)
  if (totalMatch) {
    const score = parseInt(totalMatch[1], 10)
    if (score >= 0 && score <= total) return score
  }
  // 尝试匹配 "X/total" 格式（只取最后一行附近的匹配，避免正文中的分数）
  const lines = text.split('\n')
  const lastLines = lines.slice(-5).join('\n')
  const slashMatch = lastLines.match(new RegExp(`(\\d+)\\s*\\/\\s*${total}`))
  if (slashMatch) {
    const score = parseInt(slashMatch[1], 10)
    if (score >= 0 && score <= total) return score
  }
  // 尝试匹配最后一行的 "得分：X" 格式
  const scoreMatch = lastLines.match(/(?:得分|分数|评分)[：:]\s*(\d+)/)
  if (scoreMatch) {
    const score = parseInt(scoreMatch[1], 10)
    if (score >= 0 && score <= total) return score
  }
  return -1
}

export default function PracticePage() {
  const { provider, apiKey, baseURL, model, isConfigured } = useSettingsStore()
  const { addPractice, practices } = useStudyStore()

  const [topic, setTopic] = useState('')
  const [questions, setQuestions] = useState('')
  const [answers, setAnswers] = useState('')
  const [userAnswer, setUserAnswer] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState('')
  const abortRef = useRef<AbortController | null>(null)

  const handleGenerate = async () => {
    if (!topic.trim() || loading) return
    setError('')
    setLoading(true)
    setQuestions('')
    setAnswers('')
    setUserAnswer('')
    // 单一 controller 贯穿整个请求生命周期
    const myController = new AbortController()
    abortRef.current = myController
    const signal = myController.signal

    if (provider === 'demo' || !isConfigured()) {
      try {
        let acc = ''
        for (let i = 0; i < DEMO_QUESTIONS.length; i += 5) {
          if (signal.aborted) break
          acc += DEMO_QUESTIONS.slice(i, i + 5)
          setQuestions(acc)
          await new Promise((r) => setTimeout(r, 10))
        }
      } finally {
        if (abortRef.current === myController) abortRef.current = null
        setLoading(false)
      }
      return
    }

    try {
      const messages: ChatMessage[] = [
        { role: 'system', content: PRACTICE_SYSTEM_PROMPT },
        { role: 'user', content: `请针对以下知识点出 3 道练习题：\n\n${topic}` },
      ]
      let fullText = ''
      await streamChat(
        messages,
        { apiKey, baseURL, model },
        (chunk) => {
          fullText += chunk
          setQuestions(fullText)
        },
        signal,
      )
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // 用户主动取消，保留已生成内容
      } else {
        setError(err instanceof Error ? err.message : '生成失败')
      }
    } finally {
      if (abortRef.current === myController) abortRef.current = null
      setLoading(false)
    }
  }

  const handleCheck = async () => {
    if (!userAnswer.trim() || checking) return
    setError('')

    // 单一 controller 贯穿整个批改生命周期
    const myController = new AbortController()
    abortRef.current = myController
    const signal = myController.signal

    if (provider === 'demo' || !isConfigured()) {
      setChecking(true)
      const demoFeedback = `## 答案解析

### 第 1 题
**正确答案：B. 终止条件（基线条件）**

解析：递归函数必须有终止条件，否则会无限调用自己导致栈溢出。循环、全局变量、数组参数都不是递归的必要条件。

### 第 2 题
\`countdown(3)\` 的作用是从 n 倒数到 1，然后输出"完成"。

执行过程：
\`\`\`
countdown(3) → 输出 3 → countdown(2)
countdown(2) → 输出 2 → countdown(1)
countdown(1) → 输出 1 → countdown(0)
countdown(0) → 输出 "完成" → return
\`\`\`

最终输出：3, 2, 1, 完成

### 第 3 题
参考答案：
\`\`\`
function sum(n) {
  // 终止条件
  if (n <= 0) return 0
  // 递归关系：sum(n) = n + sum(n-1)
  return n + sum(n - 1)
}
\`\`\`

\`sum(5) = 5 + sum(4) = 5 + 4 + sum(3) = ... = 5+4+3+2+1+0 = 15\` ✓

---
**评分参考**：第 1 题答对计 1 分，第 2 题答对执行过程计 1 分，第 3 题写出正确函数计 1 分。满分 3 分。
**总分：2/3**（示例评分，实际得分由 AI 根据你的作答判定）`
      try {
        let acc = ''
        for (let i = 0; i < demoFeedback.length; i += 5) {
          if (signal.aborted) break
          acc += demoFeedback.slice(i, i + 5)
          setAnswers(acc)
          await new Promise((r) => setTimeout(r, 10))
        }
        // demo 模式写入一条带 demo 标记的练习记录，历史面板可见但不污染统计
        if (!signal.aborted) {
          const demoScore = parseScore(demoFeedback, 3)
          addPractice({ topic: `[示例] ${topic}`, total: 3, correct: demoScore >= 0 ? demoScore : 2, demo: true })
        }
      } finally {
        if (abortRef.current === myController) abortRef.current = null
        setChecking(false)
      }
      return
    }

    setChecking(true)
    try {
      const messages: ChatMessage[] = [
        {
          role: 'system',
          content:
            '你是 KnowledgeFlow 的练习批改助手。根据用户答案给出解析和评分。用 Markdown 格式输出每道题的正确答案、解析，最后给出总分。',
        },
        { role: 'user', content: `题目：\n${questions}\n\n我的答案：\n${userAnswer}` },
      ]
      let fullText = ''
      await streamChat(
        messages,
        { apiKey, baseURL, model },
        (chunk) => {
          fullText += chunk
          setAnswers(fullText)
        },
        signal,
      )
      // 解析真实得分，失败时不写入记录避免污染统计
      const score = parseScore(fullText, 3)
      if (score >= 0) {
        addPractice({ topic, total: 3, correct: score })
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // 用户主动取消批改，保留已生成内容
      } else {
        setError(err instanceof Error ? err.message : '批改失败')
      }
    } finally {
      if (abortRef.current === myController) abortRef.current = null
      setChecking(false)
    }
  }

  return (
    <AppLayout>
      <div style={{ marginBottom: '32px' }}>
        <div className="section-label">练习测试</div>
        <h1 className="section-title" style={{ fontSize: '2.2rem', marginBottom: '8px' }}>
          AI 出题与即时反馈
        </h1>
        <p className="section-desc" style={{ margin: 0 }}>
          输入知识点，AI 生成 3 道练习题（概念+应用+综合）。作答后 AI 批改并给出解析。
        </p>
      </div>

      {/* 出题区 */}
      <div className="app-card" style={{ marginBottom: '24px' }}>
        <div className="app-field" style={{ marginBottom: '16px' }}>
          <label className="app-label">练习知识点</label>
          <div style={{ display: 'flex', gap: '12px' }}>
            <input
              className="app-input"
              placeholder="比如：递归 / HTTP 协议 / 光合作用"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={loading}
            />
            {loading ? (
              <button className="btn-ghost" onClick={() => abortRef.current?.abort()}>
                停止
              </button>
            ) : (
              <button className="btn-primary" onClick={handleGenerate} disabled={!topic.trim()}>
                出题 →
              </button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="app-card" style={{ borderColor: 'rgba(239, 68, 68, 0.3)', color: '#f87171', marginBottom: '24px' }}>
          {error}
        </div>
      )}

      {/* 题目 */}
      {questions && (
        <div className="app-card" style={{ marginBottom: '24px' }}>
          <div className="section-label" style={{ marginBottom: '16px' }}>练习题</div>
          <MarkdownView content={questions} />
        </div>
      )}

      {/* 作答区 */}
      {questions && !loading && (
        <div className="app-card" style={{ marginBottom: '24px' }}>
          <div className="app-field">
            <label className="app-label">你的答案（写出每道题的解答）</label>
            <textarea
              className="app-textarea"
              style={{ minHeight: '200px' }}
              placeholder="在这里写下你的答案…"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              disabled={checking}
            />
          </div>
          {checking ? (
            <button className="btn-ghost" onClick={() => abortRef.current?.abort()}>
              停止批改
            </button>
          ) : (
            <button className="btn-primary" onClick={handleCheck} disabled={!userAnswer.trim()}>
              提交批改 →
            </button>
          )}
        </div>
      )}

      {/* 批改结果 */}
      {answers && (
        <div className="app-card" style={{ marginBottom: '24px', borderColor: 'rgba(45, 212, 191, 0.25)' }}>
          <div className="section-label" style={{ marginBottom: '16px', color: '#2dd4bf' }}>批改结果</div>
          <MarkdownView content={answers} />
        </div>
      )}

      {/* 练习记录 */}
      {practices.length > 0 && (
        <div className="app-card">
          <div className="section-label" style={{ marginBottom: '16px' }}>练习记录（{practices.length}）</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {practices.map((p) => (
              <div
                key={p.id}
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
                  <div style={{ color: '#f0ece4', fontWeight: 500 }}>{p.topic}</div>
                  <div style={{ fontSize: '0.8rem', color: '#5c584f', marginTop: '4px' }}>
                    {new Date(p.createdAt).toLocaleString('zh-CN')}
                  </div>
                </div>
                <span className="badge badge-active">
                  {p.correct}/{p.total} 正确
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </AppLayout>
  )
}
