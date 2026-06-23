/**
 * 极简 Markdown 渲染器
 * 支持：标题、段落、列表、代码块、行内代码、加粗、引用、分隔线、表格
 */

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function renderInline(text: string): string {
  return escapeHtml(text)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
}

export function markdownToHtml(md: string): string {
  const lines = md.split('\n')
  let html = ''
  let inCodeBlock = false
  let codeBuffer: string[] = []
  let codeLang = ''
  let inList = false
  let listType: 'ul' | 'ol' = 'ul'
  let inTable = false
  let tableBuffer: string[] = []

  const flushList = () => {
    if (inList) {
      html += `</${listType}>`
      inList = false
    }
  }

  const flushTable = () => {
    if (inTable && tableBuffer.length > 0) {
      const rows = tableBuffer.map((row) =>
        row
          .split('|')
          .map((c) => c.trim())
          .filter((c) => c && !c.match(/^[-:]+$/)),
      )
      const isHeader = tableBuffer[0].includes('|')
      if (isHeader && rows.length >= 1) {
        html += '<table><thead><tr>'
        rows[0].forEach((cell) => {
          html += `<th>${renderInline(cell)}</th>`
        })
        html += '</tr></thead><tbody>'
        rows.slice(1).forEach((row) => {
          html += '<tr>'
          row.forEach((cell) => {
            html += `<td>${renderInline(cell)}</td>`
          })
          html += '</tr>'
        })
        html += '</tbody></table>'
      }
      inTable = false
      tableBuffer = []
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // 代码块
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        html += `<pre><code class="language-${codeLang}">${escapeHtml(codeBuffer.join('\n'))}</code></pre>`
        inCodeBlock = false
        codeBuffer = []
        codeLang = ''
      } else {
        flushList()
        flushTable()
        inCodeBlock = true
        // 对 fence 语言做白名单过滤，只保留 [a-z0-9-]，防止属性注入
        const rawLang = line.trim().slice(3).trim()
        codeLang = rawLang.replace(/[^a-z0-9-]/gi, '').slice(0, 20)
      }
      continue
    }
    if (inCodeBlock) {
      codeBuffer.push(line)
      continue
    }

    // 表格
    if (line.includes('|') && line.trim().startsWith('|')) {
      flushList()
      inTable = true
      tableBuffer.push(line.trim())
      continue
    } else if (inTable) {
      flushTable()
    }

    // 分隔线
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      flushList()
      html += '<hr />'
      continue
    }

    // 标题
    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/)
    if (headingMatch) {
      flushList()
      const level = headingMatch[1].length
      html += `<h${level}>${renderInline(headingMatch[2])}</h${level}>`
      continue
    }

    // 引用
    if (line.trim().startsWith('> ')) {
      flushList()
      html += `<blockquote>${renderInline(line.trim().slice(2))}</blockquote>`
      continue
    }

    // 有序列表
    const olMatch = line.match(/^\s*(\d+)\.\s+(.*)$/)
    if (olMatch) {
      if (!inList || listType !== 'ol') {
        flushList()
        html += '<ol>'
        inList = true
        listType = 'ol'
      }
      html += `<li>${renderInline(olMatch[2])}</li>`
      continue
    }

    // 无序列表
    const ulMatch = line.match(/^\s*[-*]\s+(.*)$/)
    if (ulMatch) {
      if (!inList || listType !== 'ul') {
        flushList()
        html += '<ul>'
        inList = true
        listType = 'ul'
      }
      html += `<li>${renderInline(ulMatch[1])}</li>`
      continue
    }

    // 空行
    if (line.trim() === '') {
      flushList()
      continue
    }

    // 普通段落
    flushList()
    html += `<p>${renderInline(line)}</p>`
  }

  // 收尾
  if (inCodeBlock) {
    html += `<pre><code>${escapeHtml(codeBuffer.join('\n'))}</code></pre>`
  }
  flushList()
  flushTable()

  return html
}
