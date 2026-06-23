import { markdownToHtml } from '../lib/markdown'

interface MarkdownViewProps {
  content: string
  className?: string
}

export default function MarkdownView({ content, className }: MarkdownViewProps) {
  const html = markdownToHtml(content)
  return (
    <div
      className={`md-body ${className || ''}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
