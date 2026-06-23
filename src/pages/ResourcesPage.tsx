import { useState, useRef } from 'react'
import AppLayout from '../components/AppLayout'
import { useStudyStore, type ResourceItem } from '../store/studyStore'

export default function ResourcesPage() {
  const { addStudyTime, resources, addResource, updateResource, deleteResource } = useStudyStore()
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  const handleFiles = async (files: FileList | null) => {
    if (!files) return
    for (const file of Array.from(files)) {
      // 文本类文件读取内容
      if (file.type.startsWith('text/') || file.name.match(/\.(txt|md|json|csv|js|ts|py|html|css)$/i)) {
        try {
          const content = await file.text()
          addResource({
            name: file.name,
            type: file.type || 'unknown',
            size: file.size,
            content,
            status: 'readable',
          })
        } catch {
          addResource({
            name: file.name,
            type: file.type || 'unknown',
            size: file.size,
            status: 'uploaded',
          })
        }
      } else {
        // 模拟可读化处理
        const id = addResource({
          name: file.name,
          type: file.type || 'unknown',
          size: file.size,
          status: 'processing',
        })
        setTimeout(() => {
          updateResource(id, {
            status: 'readable',
            content: `[可读化处理完成] 文件名：${file.name}\n类型：${file.type}\n大小：${formatSize(file.size)}\n\n（演示模式：实际产品中，PDF/图片会通过 OCR 提取文本，视频会通过 ASR 转写）`,
          })
        }, 1500)
      }
    }
    addStudyTime(0)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  return (
    <AppLayout>
      <div style={{ marginBottom: '32px' }}>
        <div className="section-label">资源管理</div>
        <h1 className="section-title" style={{ fontSize: '2.2rem', marginBottom: '8px' }}>
          资料可读化
        </h1>
        <p className="section-desc" style={{ margin: 0 }}>
          上传学习资料，自动转换为 AI 可读格式。支持文本、Markdown、代码文件直接读取；PDF/图片/视频模拟 OCR/ASR 处理。
        </p>
      </div>

      {/* 上传区 */}
      <div
        className="app-card"
        style={{
          marginBottom: '24px',
          border: dragging ? '2px dashed #d4a853' : '2px dashed rgba(212, 168, 83, 0.2)',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
        }}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          style={{ display: 'none' }}
          onChange={(e) => handleFiles(e.target.files)}
        />
        <div style={{ fontSize: '3rem', marginBottom: '16px', opacity: 0.5 }}>📁</div>
        <div style={{ color: '#f0ece4', fontSize: '1.1rem', fontWeight: 500, marginBottom: '8px' }}>
          点击或拖拽文件到此处上传
        </div>
        <div style={{ color: '#9a958c', fontSize: '0.88rem' }}>
          支持：TXT / MD / JSON / CSV / 代码文件（直接读取）· PDF / 图片 / 视频（模拟可读化）
        </div>
      </div>

      {/* 资源列表 */}
      {resources.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📂</div>
          <div className="empty-state-title">还没有上传资料</div>
          <div className="empty-state-desc">
            上传你的学习资料，系统会自动转换为 AI 可读格式，方便后续学习引用。
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {resources.map((r: ResourceItem) => (
            <div key={r.id} className="app-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <div style={{ color: '#f0ece4', fontWeight: 600, fontSize: '1rem', marginBottom: '4px' }}>
                    {r.name}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#5c584f' }}>
                    {r.type} · {formatSize(r.size)} · {new Date(r.createdAt).toLocaleString('zh-CN')}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {r.status === 'processing' && (
                    <span className="badge badge-learning">
                      <span className="loading-dots" style={{ marginRight: '4px' }}>
                        <span></span><span></span><span></span>
                      </span>
                      处理中
                    </span>
                  )}
                  {r.status === 'readable' && (
                    <span className="badge badge-mastered">可读</span>
                  )}
                  {r.status === 'uploaded' && (
                    <span className="badge badge-active">已上传</span>
                  )}
                  <button
                    className="btn-ghost"
                    style={{ padding: '4px 12px', fontSize: '0.8rem' }}
                    onClick={() => deleteResource(r.id)}
                  >
                    删除
                  </button>
                </div>
              </div>
              {r.content && r.status === 'readable' && (
                <pre
                  style={{
                    background: '#08080d',
                    border: '1px solid rgba(212, 168, 83, 0.12)',
                    borderRadius: '12px',
                    padding: '16px',
                    overflowX: 'auto',
                    fontSize: '0.85rem',
                    color: '#c9c4ba',
                    lineHeight: 1.6,
                    maxHeight: '300px',
                    overflowY: 'auto',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {r.content}
                </pre>
              )}
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  )
}
