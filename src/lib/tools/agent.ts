// Agent - The agentic loop that powers OpenCode
// This handles the conversation with tool calling

import { WebContainer } from '@webcontainer/api'
import { ToolExecutor, ToolResult } from './executor'
import { getOpenAITools, tools } from './index'

export interface Message {
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string | null
  tool_calls?: ToolCall[]
  tool_call_id?: string
  name?: string
}

export interface ToolCall {
  id: string
  type: 'function'
  function: {
    name: string
    arguments: string
  }
}

export interface AgentConfig {
  apiKey: string
  baseUrl: string
  model: string
}

export interface StreamCallbacks {
  onToken: (token: string) => void
  onToolCallStart: (toolName: string, args: Record<string, unknown>) => void
  onToolCallEnd: (toolName: string, result: ToolResult) => void
  onError: (error: string) => void
  onComplete: () => void
}

const SYSTEM_PROMPT = `You are OpenCode, an expert AI coding assistant. You help users write, debug, and understand code.

You have access to a workspace with a file system and terminal. Use your tools to:
- Read and understand existing code
- Write new files and modify existing ones
- Run commands in the terminal
- Search for patterns in the codebase

IMPORTANT GUIDELINES:
1. Always read relevant files before making changes to understand the context
2. Make targeted edits using edit_file rather than rewriting entire files when possible
3. After writing code, consider if you need to install dependencies or run build commands
4. Explain what you're doing and why
5. When you encounter errors, analyze them carefully and fix the root cause
6. Use the think tool for complex problems that require step-by-step reasoning

You are running in a WebContainer environment (browser-based Node.js). Some limitations:
- No native binaries (use Node.js/npm packages instead)
- Shell is 'jsh' (a JavaScript shell implementation)
- File system is in-memory but persistent during the session

Be concise but thorough. Focus on solving the user's problem effectively.`

export class Agent {
  private config: AgentConfig
  private executor: ToolExecutor
  private messages: Message[] = []
  private abortController: AbortController | null = null

  constructor(config: AgentConfig, webcontainer: WebContainer) {
    this.config = config
    this.executor = new ToolExecutor(webcontainer)
    this.messages = [{ role: 'system', content: SYSTEM_PROMPT }]
  }

  async chat(userMessage: string, callbacks: StreamCallbacks): Promise<void> {
    this.abortController = new AbortController()
    
    // Add user message
    this.messages.push({ role: 'user', content: userMessage })

    try {
      await this.runAgentLoop(callbacks)
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        callbacks.onToken('\n\n*[Stopped]*')
      } else {
        callbacks.onError(error instanceof Error ? error.message : String(error))
      }
    } finally {
      this.abortController = null
      callbacks.onComplete()
    }
  }

  abort(): void {
    this.abortController?.abort()
  }

  clearHistory(): void {
    this.messages = [{ role: 'system', content: SYSTEM_PROMPT }]
  }

  private async runAgentLoop(callbacks: StreamCallbacks): Promise<void> {
    let iterations = 0
    const maxIterations = 20 // Prevent infinite loops

    while (iterations < maxIterations) {
      iterations++
      
      const response = await this.callLLM(callbacks)
      
      // If no tool calls, we're done
      if (!response.toolCalls || response.toolCalls.length === 0) {
        break
      }

      // Execute tool calls
      for (const toolCall of response.toolCalls) {
        if (this.abortController?.signal.aborted) {
          throw new DOMException('Aborted', 'AbortError')
        }

        const args = JSON.parse(toolCall.function.arguments)
        callbacks.onToolCallStart(toolCall.function.name, args)
        
        const result = await this.executor.execute(toolCall.function.name, args)
        callbacks.onToolCallEnd(toolCall.function.name, result)

        // Add tool result to messages
        this.messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          name: toolCall.function.name,
          content: result.success 
            ? result.output 
            : `Error: ${result.error}\n${result.output}`
        })
      }
    }

    if (iterations >= maxIterations) {
      callbacks.onToken('\n\n*[Reached maximum iterations]*')
    }
  }

  private async callLLM(callbacks: StreamCallbacks): Promise<{ content: string; toolCalls: ToolCall[] }> {
    const url = `${this.config.baseUrl}/chat/completions`
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`
    }

    // Add OpenRouter specific headers
    if (this.config.baseUrl.includes('openrouter.ai')) {
      headers['HTTP-Referer'] = 'https://opencode.app'
      headers['X-Title'] = 'OpenCode'
    }

    const body = {
      model: this.config.model,
      messages: this.messages.map(m => {
        if (m.role === 'tool') {
          return {
            role: 'tool',
            tool_call_id: m.tool_call_id,
            content: m.content
          }
        }
        if (m.tool_calls) {
          return {
            role: 'assistant',
            content: m.content,
            tool_calls: m.tool_calls
          }
        }
        return { role: m.role, content: m.content }
      }),
      tools: getOpenAITools(),
      tool_choice: 'auto',
      stream: true,
      max_tokens: 4096,
      temperature: 0.7,
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: this.abortController?.signal
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorMessage = `API Error: ${response.status}`
      try {
        const errorJson = JSON.parse(errorText)
        errorMessage = errorJson.error?.message || errorJson.message || errorMessage
      } catch {
        errorMessage = errorText.slice(0, 200) || errorMessage
      }
      throw new Error(errorMessage)
    }

    // Process SSE stream
    const reader = response.body?.getReader()
    if (!reader) throw new Error('No response body')

    const decoder = new TextDecoder()
    let content = ''
    const toolCalls: ToolCall[] = []
    const toolCallsInProgress: Map<number, { id: string; name: string; arguments: string }> = new Map()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      const lines = chunk.split('\n')

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        
        const data = line.slice(6)
        if (data === '[DONE]') continue

        try {
          const parsed = JSON.parse(data)
          const delta = parsed.choices?.[0]?.delta

          if (!delta) continue

          // Handle content
          if (delta.content) {
            content += delta.content
            callbacks.onToken(delta.content)
          }

          // Handle tool calls
          if (delta.tool_calls) {
            for (const tc of delta.tool_calls) {
              const index = tc.index ?? 0
              
              if (tc.id) {
                // New tool call
                toolCallsInProgress.set(index, {
                  id: tc.id,
                  name: tc.function?.name || '',
                  arguments: tc.function?.arguments || ''
                })
              } else {
                // Continuing tool call
                const existing = toolCallsInProgress.get(index)
                if (existing) {
                  if (tc.function?.name) {
                    existing.name += tc.function.name
                  }
                  if (tc.function?.arguments) {
                    existing.arguments += tc.function.arguments
                  }
                }
              }
            }
          }
        } catch {
          // Skip invalid JSON
        }
      }
    }

    // Finalize tool calls
    Array.from(toolCallsInProgress.values()).forEach((tc) => {
      toolCalls.push({
        id: tc.id,
        type: 'function',
        function: {
          name: tc.name,
          arguments: tc.arguments
        }
      })
    })

    // Add assistant message to history
    const assistantMessage: Message = {
      role: 'assistant',
      content: content || null
    }
    if (toolCalls.length > 0) {
      assistantMessage.tool_calls = toolCalls
    }
    this.messages.push(assistantMessage)

    return { content, toolCalls }
  }
}
