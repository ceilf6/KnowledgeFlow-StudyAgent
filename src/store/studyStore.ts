/**
 * 学习记录 Store — 学习会话、已学知识点、练习记录
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface StudyMessage {
  role: 'user' | 'assistant'
  content: string
  ts: number
}

export interface StudySession {
  id: string
  topic: string
  messages: StudyMessage[]
  createdAt: number
  updatedAt: number
}

export interface LearnedNode {
  topic: string
  status: 'learning' | 'mastered' | 'review'
  learnedAt: number
}

export interface PracticeRecord {
  id: string
  topic: string
  total: number
  correct: number
  createdAt: number
  demo?: boolean
}

export interface ResourceItem {
  id: string
  name: string
  type: string
  size: number
  content?: string
  status: 'uploaded' | 'processing' | 'readable'
  createdAt: number
}

interface StudyState {
  sessions: StudySession[]
  learned: LearnedNode[]
  practices: PracticeRecord[]
  resources: ResourceItem[]
  totalStudyTime: number // 秒

  createSession: (topic: string) => string
  getSession: (id: string) => StudySession | undefined
  addMessage: (sessionId: string, message: StudyMessage) => void
  updateSessionMessages: (sessionId: string, messages: StudyMessage[]) => void
  deleteSession: (id: string) => void

  markLearned: (topic: string, status: LearnedNode['status']) => void
  addPractice: (record: Omit<PracticeRecord, 'id' | 'createdAt'>) => void
  addStudyTime: (seconds: number) => void

  addResource: (resource: Omit<ResourceItem, 'id' | 'createdAt'>) => string
  updateResource: (id: string, patch: Partial<ResourceItem>) => void
  deleteResource: (id: string) => void

  getStats: () => {
    totalTopics: number
    mastered: number
    learning: number
    totalPractices: number
    avgScore: number
  }
}

export const useStudyStore = create<StudyState>()(
  persist(
    (set, get) => ({
      sessions: [],
      learned: [],
      practices: [],
      resources: [],
      totalStudyTime: 0,

      createSession: (topic) => {
        const id = `s_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
        const session: StudySession = {
          id,
          topic,
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }
        set((s) => ({ sessions: [session, ...s.sessions] }))
        return id
      },

      getSession: (id) => get().sessions.find((s) => s.id === id),

      addMessage: (sessionId, message) =>
        set((s) => ({
          sessions: s.sessions.map((sess) =>
            sess.id === sessionId
              ? {
                  ...sess,
                  messages: [...sess.messages, message],
                  updatedAt: Date.now(),
                }
              : sess,
          ),
        })),

      updateSessionMessages: (sessionId, messages) =>
        set((s) => ({
          sessions: s.sessions.map((sess) =>
            sess.id === sessionId
              ? { ...sess, messages, updatedAt: Date.now() }
              : sess,
          ),
        })),

      deleteSession: (id) =>
        set((s) => ({ sessions: s.sessions.filter((sess) => sess.id !== id) })),

      markLearned: (topic, status) =>
        set((s) => {
          const existing = s.learned.find((n) => n.topic === topic)
          if (existing) {
            return {
              learned: s.learned.map((n) =>
                n.topic === topic ? { ...n, status, learnedAt: Date.now() } : n,
              ),
            }
          }
          return {
            learned: [...s.learned, { topic, status, learnedAt: Date.now() }],
          }
        }),

      addPractice: (record) =>
        set((s) => ({
          practices: [
            { ...record, id: `p_${Date.now()}`, createdAt: Date.now() },
            ...s.practices,
          ],
        })),

      addStudyTime: (seconds) =>
        set((s) => ({ totalStudyTime: s.totalStudyTime + seconds })),

      addResource: (resource) => {
        const id = `r_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
        set((s) => ({
          resources: [{ ...resource, id, createdAt: Date.now() }, ...s.resources],
        }))
        return id
      },

      updateResource: (id, patch) =>
        set((s) => ({
          resources: s.resources.map((r) => (r.id === id ? { ...r, ...patch } : r)),
        })),

      deleteResource: (id) =>
        set((s) => ({ resources: s.resources.filter((r) => r.id !== id) })),

      getStats: () => {
        const { learned, practices } = get()
        const mastered = learned.filter((n) => n.status === 'mastered').length
        const learning = learned.filter((n) => n.status === 'learning').length
        // 排除 demo 记录，避免示例分数污染真实统计
        const realPractices = practices.filter((p) => !p.demo)
        const totalPractices = realPractices.length
        const avgScore =
          totalPractices > 0
            ? Math.round(
                (realPractices.reduce((sum, p) => sum + p.correct / p.total, 0) /
                  totalPractices) *
                  100,
              )
            : 0
        return {
          totalTopics: learned.length,
          mastered,
          learning,
          totalPractices,
          avgScore,
        }
      },
    }),
    { name: 'kf-study' },
  ),
)
