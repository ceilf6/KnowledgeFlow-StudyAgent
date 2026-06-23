/**
 * AI API 客户端 — OpenAI 兼容接口
 * 支持流式输出，用户自带 API Key
 */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface AIConfig {
  apiKey: string
  baseURL: string
  model: string
}

/**
 * 流式调用 AI 接口
 * @param messages 消息列表
 * @param config AI 配置
 * @param onChunk 每收到一段文本时的回调
 * @param signal 取消信号
 */
export async function streamChat(
  messages: ChatMessage[],
  config: AIConfig,
  onChunk: (chunk: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  const response = await fetch(`${config.baseURL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      stream: true,
      temperature: 0.7,
    }),
    signal,
  })

  if (!response.ok) {
    const errText = await response.text().catch(() => '')
    throw new Error(`API 请求失败 (${response.status})：${errText.slice(0, 200)}`)
  }

  if (!response.body) {
    throw new Error('API 返回了空的响应体')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let fullText = ''
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || !trimmed.startsWith('data:')) continue
      const data = trimmed.slice(5).trim()
      if (data === '[DONE]') continue

      try {
        const json = JSON.parse(data)
        const delta = json.choices?.[0]?.delta?.content
        if (delta) {
          fullText += delta
          onChunk(delta)
        }
      } catch {
        // 忽略解析错误的行
      }
    }
  }

  return fullText
}
