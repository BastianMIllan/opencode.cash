// Agent - The agentic loop that powers OpenCode
// This handles the conversation with tool calling

import { WebContainer } from '@webcontainer/api'
import Anthropic from '@anthropic-ai/sdk'
import { ToolExecutor, ToolResult } from './executor'
import { getOpenAITools, getAnthropicTools, tools } from './index'

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
  provider?: string
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

TOOL CALLING RULES (CRITICAL):
- Every tool call MUST include ALL required arguments in a single call.
- write_file requires BOTH "path" AND "content". Never call write_file without the full file content.
- edit_file requires "path", "old_string", AND "new_string". All three must be present.
- If a tool call returns an error about missing arguments, you MUST immediately retry with all required arguments.
- Never split a single tool operation across multiple calls — include everything in one call.

You are running in a WebContainer environment (browser-based Node.js). Some limitations:
- No native binaries (use Node.js/npm packages instead)
- Shell is 'jsh' (a JavaScript shell implementation)
- File system is in-memory but persistent during the session

Be concise but thorough. Focus on solving the user's problem effectively.`

const ANTHROPIC_MODEL_MIGRATIONS: Record<string, string> = {
  'claude-3-5-haiku-20241022': 'claude-haiku-4-5',
  'claude-3-5-haiku-latest': 'claude-haiku-4-5',
  'claude-3-5-sonnet-20241022': 'claude-sonnet-4-6',
  'claude-3-5-sonnet-latest': 'claude-sonnet-4-6',
  'claude-3-7-sonnet-20250219': 'claude-sonnet-4-20250514',
  'claude-3-opus-20240229': 'claude-opus-4-6',
}

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

  private isAnthropic(): boolean {
    return this.config.provider === 'anthropic' || this.config.baseUrl.includes('anthropic.com')
  }

  private getResolvedAnthropicModel(): string {
    return ANTHROPIC_MODEL_MIGRATIONS[this.config.model] || this.config.model
  }

  private async runAgentLoop(callbacks: StreamCallbacks): Promise<void> {
    let iterations = 0
    const maxIterations = 20 // Prevent infinite loops

    while (iterations < maxIterations) {
      iterations++
      
      const response = this.isAnthropic() 
        ? await this.callAnthropic(callbacks)
        : await this.callLLM(callbacks)
      
      // If no tool calls but we flagged a continuation, keep looping
      if (!response.toolCalls || response.toolCalls.length === 0) {
        if (response.shouldContinue) {
          continue
        }
        break
      }

      // Execute tool calls
      let allFailed = true
      for (const toolCall of response.toolCalls) {
        if (this.abortController?.signal.aborted) {
          throw new DOMException('Aborted', 'AbortError')
        }

        let args: Record<string, unknown>
        try {
          args = JSON.parse(toolCall.function.arguments)
        } catch {
          const result = {
            success: false,
            output: '',
            error: `Tool ${toolCall.function.name} received invalid JSON arguments. Please retry the tool call with valid JSON containing all required arguments.`
          }

          callbacks.onToolCallStart(toolCall.function.name, {})
          callbacks.onToolCallEnd(toolCall.function.name, result)

          this.messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            name: toolCall.function.name,
            content: `Error: ${result.error}`
          })
          continue
        }

        callbacks.onToolCallStart(toolCall.function.name, args)
        
        const result = await this.executor.execute(toolCall.function.name, args)
        callbacks.onToolCallEnd(toolCall.function.name, result)

        if (result.success) {
          allFailed = false
        }

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

      // If every tool call in this batch failed, nudge the model to retry properly
      if (allFailed && response.toolCalls.length > 0) {
        this.messages.push({
          role: 'user',
          content: 'Your previous tool call(s) failed because of missing or invalid arguments. Please carefully re-read the error messages and retry. Remember: write_file needs BOTH "path" and "content" arguments in a single call. The "content" argument must contain the complete file content.'
        })
      }
    }

    if (iterations >= maxIterations) {
      callbacks.onToken('\n\n*[Reached maximum iterations]*')
    }
  }

  private async callLLM(callbacks: StreamCallbacks): Promise<{ content: string; toolCalls: ToolCall[]; shouldContinue?: boolean }> {
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
      max_tokens: 16384,
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

  private async callAnthropic(callbacks: StreamCallbacks): Promise<{ content: string; toolCalls: ToolCall[]; shouldContinue?: boolean }> {
    const anthropic = new Anthropic({
      apiKey: this.config.apiKey,
      dangerouslyAllowBrowser: true
    })

    // Convert messages to Anthropic format
    type AnthropicContent = { type: 'text'; text: string } | { type: 'tool_use'; id: string; name: string; input: unknown } | { type: 'tool_result'; tool_use_id: string; content: string }
    const anthropicMessages: Array<{ role: 'user' | 'assistant'; content: string | AnthropicContent[] }> = []
    
    for (const msg of this.messages) {
      if (msg.role === 'system') continue // System is separate in Anthropic
      
      if (msg.role === 'user') {
        anthropicMessages.push({ role: 'user', content: msg.content || '' })
      } else if (msg.role === 'assistant') {
        if (msg.tool_calls && msg.tool_calls.length > 0) {
          const content: AnthropicContent[] = []
          if (msg.content) {
            content.push({ type: 'text', text: msg.content })
          }
          for (const tc of msg.tool_calls) {
            content.push({
              type: 'tool_use',
              id: tc.id,
              name: tc.function.name,
              input: JSON.parse(tc.function.arguments)
            })
          }
          anthropicMessages.push({ role: 'assistant', content })
        } else {
          anthropicMessages.push({ role: 'assistant', content: msg.content || '' })
        }
      } else if (msg.role === 'tool') {
        // Tool results in Anthropic are user messages with tool_result content
        const lastMsg = anthropicMessages[anthropicMessages.length - 1]
        if (lastMsg?.role === 'user' && Array.isArray(lastMsg.content)) {
          (lastMsg.content as AnthropicContent[]).push({
            type: 'tool_result',
            tool_use_id: msg.tool_call_id!,
            content: msg.content || ''
          })
        } else {
          anthropicMessages.push({
            role: 'user',
            content: [{
              type: 'tool_result',
              tool_use_id: msg.tool_call_id!,
              content: msg.content || ''
            }]
          })
        }
      }
    }

    let content = ''
    const toolCalls: ToolCall[] = []

    try {
      const stream = anthropic.messages.stream({
        model: this.getResolvedAnthropicModel(),
        max_tokens: 16384,
        system: SYSTEM_PROMPT,
        messages: anthropicMessages,
        tools: getAnthropicTools(),
      })

      for await (const event of stream) {
        if (this.abortController?.signal.aborted) {
          stream.abort()
          throw new DOMException('Aborted', 'AbortError')
        }

        if (event.type === 'content_block_delta') {
          const delta = event.delta as any
          if (delta.type === 'text_delta') {
            content += delta.text
            callbacks.onToken(delta.text)
          }
        }
      }

      // Get tool calls from the fully accumulated final message
      const finalMessage = await stream.finalMessage()
      
      // If the response was truncated, the tool input may be incomplete
      if (finalMessage.stop_reason === 'end_turn' || finalMessage.stop_reason === 'tool_use') {
        for (const block of finalMessage.content) {
          if (block.type === 'tool_use') {
            toolCalls.push({
              id: block.id,
              type: 'function',
              function: {
                name: block.name,
                arguments: JSON.stringify(block.input)
              }
            })
          }
        }
      } else if (finalMessage.stop_reason === 'max_tokens') {
        // Response was truncated — tool inputs are likely incomplete, don't execute them
        callbacks.onToken('\n\n*[Response was truncated — retrying with more space...]*')
        // Add a message asking the model to continue
        this.messages.push({
          role: 'assistant',
          content: content || null
        })
        this.messages.push({
          role: 'user', 
          content: 'Your response was cut off due to length limits. Please continue where you left off. If you were about to write a file, please call write_file with the complete content now.'
        })
        // Return empty to trigger another loop iteration
        return { content, toolCalls: [], shouldContinue: true }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw error
      }
      throw new Error(`Anthropic API Error: ${error instanceof Error ? error.message : String(error)}`)
    }

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
