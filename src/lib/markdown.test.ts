import { describe, it, expect } from 'vitest'
import { markdownToHtml } from './markdown'

describe('markdownToHtml', () => {
  it('renders plain text as paragraph', () => {
    const html = markdownToHtml('hello world')
    expect(html).toContain('<p>hello world</p>')
  })

  it('renders headings', () => {
    const html = markdownToHtml('## Title')
    expect(html).toContain('<h2>Title</h2>')
  })

  it('renders code blocks with sanitized language class', () => {
    const md = '```javascript\nconsole.log(1)\n```'
    const html = markdownToHtml(md)
    expect(html).toContain('language-javascript')
    expect(html).toContain('console.log(1)')
  })

  it('sanitizes malicious fence language to prevent attribute injection', () => {
    // 尝试注入 onclick 事件处理器
    const malicious = '```" onclick="alert(1)\ncode\n```'
    const html = markdownToHtml(malicious)
    // class 属性应只包含安全的字母数字和连字符，无引号/等号/空格/括号
    const classMatch = html.match(/class="language-([a-z0-9-]*)"/)
    expect(classMatch).toBeTruthy()
    expect(classMatch![1]).toMatch(/^[a-z0-9-]*$/)
    // 不应出现额外的事件处理器属性
    expect(html).not.toContain('onclick=')
    expect(html).not.toContain('alert(1)')
  })

  it('sanitizes fence language with special characters', () => {
    const md = '```python"><script>alert(1)</script>\ncode\n```'
    const html = markdownToHtml(md)
    expect(html).not.toContain('<script>')
    expect(html).not.toContain('alert(1)')
    expect(html).not.toContain('onclick=')
    // language class 应只包含字母数字和连字符
    const classMatch = html.match(/class="language-([a-z0-9-]*)"/)
    expect(classMatch).toBeTruthy()
    expect(classMatch![1]).toMatch(/^[a-z0-9-]*$/)
  })

  it('renders inline code', () => {
    const html = markdownToHtml('Use `const` keyword')
    expect(html).toContain('<code>const</code>')
  })

  it('renders bold text', () => {
    const html = markdownToHtml('**important**')
    expect(html).toContain('<strong>important</strong>')
  })

  it('renders unordered lists', () => {
    const html = markdownToHtml('- item 1\n- item 2')
    expect(html).toContain('<ul>')
    expect(html).toContain('<li>item 1</li>')
    expect(html).toContain('<li>item 2</li>')
  })

  it('renders blockquotes', () => {
    const html = markdownToHtml('> quoted text')
    expect(html).toContain('<blockquote>quoted text</blockquote>')
  })

  it('renders horizontal rules', () => {
    const html = markdownToHtml('---')
    expect(html).toContain('<hr />')
  })
})
