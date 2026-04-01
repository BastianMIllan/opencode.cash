'use client'

import { useState, useRef, useEffect, KeyboardEvent } from 'react'
import { Send, Square, RotateCcw, Trash2, Copy, Check, ChevronDown, ChevronRight, Terminal, FileText, FolderOpen, Search, Wrench, Loader2, CheckCircle, XCircle, Brain } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useStore, ChatMessage, ToolCallDisplay } from '@/store'
import { Agent } from '@/lib/tools/agent'

function generateId() {
  return Math.random().toString(36).substr(2, 9)
}

// Tool call display component
function ToolCallCard({ toolCall }: { toolCall: ToolCallDisplay }) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  const getToolIcon = (name: string) => {
    switch (name) {
      case 'bash': return <Terminal className="w-4 h-4" />
      case 'read_file': return <FileText className="w-4 h-4" />
      case 'write_file': return <FileText className="w-4 h-4" />
      case 'edit_file': return <FileText className="w-4 h-4" />
      case 'list_directory': return <FolderOpen className="w-4 h-4" />
      case 'glob': return <Search className="w-4 h-4" />
      case 'grep': return <Search className="w-4 h-4" />
      case 'think': return <Brain className="w-4 h-4" />
      default: return <Wrench className="w-4 h-4" />
    }
  }

  const getStatusIcon = () => {
    switch (toolCall.status) {
      case 'running': return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />
    }
  }

  const formatArgs = () => {
    if (toolCall.name === 'bash') {
      return toolCall.args.command as string
    }
    if (toolCall.name === 'read_file' || toolCall.name === 'write_file' || toolCall.name === 'edit_file') {
      return toolCall.args.path as string
    }
    if (toolCall.name === 'think') {
      return 'Thinking...'
    }
    return JSON.stringify(toolCall.args, null, 2)
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden my-2 bg-accent/30">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-accent/50 transition-colors"
      >
        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        {getToolIcon(toolCall.name)}
        <span className="font-mono text-sm font-medium">{toolCall.name}</span>
        <span className="text-muted text-sm truncate flex-1 text-left font-mono">
          {formatArgs()}
        </span>
        {getStatusIcon()}
      </button>
      
      {isExpanded && (
        <div className="border-t border-border">
          {/* Arguments */}
          <div className="px-3 py-2 bg-black/20">
            <div className="text-xs text-muted mb-1">Arguments:</div>
            <pre className="text-xs font-mono overflow-x-auto whitespace-pre-wrap">
              {JSON.stringify(toolCall.args, null, 2)}
            </pre>
          </div>
          
          {/* Result */}
          {toolCall.result && (
            <div className="px-3 py-2 border-t border-border">
              <div className="text-xs text-muted mb-1">
                {toolCall.result.success ? 'Output:' : 'Error:'}
              </div>
              <pre className={`text-xs font-mono overflow-x-auto whitespace-pre-wrap max-h-64 overflow-y-auto ${
                !toolCall.result.success ? 'text-red-400' : ''
              }`}>
                {toolCall.result.error || toolCall.result.output}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Message component
function MessageBubble({ message }: { message: ChatMessage }) {
  const [copied, setCopied] = useState(false)
  
  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (message.role === 'user') {
    return (
      <div className="flex justify-end mb-4">
        <div className="bg-foreground text-background rounded-2xl rounded-tr-sm px-4 py-3 max-w-[85%]">
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mb-4 group">
      <div className="relative">
        {/* Tool calls */}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="mb-2">
            {message.toolCalls.map((tc) => (
              <ToolCallCard key={tc.id} toolCall={tc} />
            ))}
          </div>
        )}
        
        {/* Content */}
        {message.content && (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          </div>
        )}
        
        {/* Empty state while generating */}
        {!message.content && (!message.toolCalls || message.toolCalls.length === 0) && (
          <div className="flex items-center gap-2 text-muted">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Thinking...</span>
          </div>
        )}
        
        {/* Copy button */}
        {message.content && (
          <button
            onClick={handleCopy}
            className="absolute -right-10 top-0 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-accent rounded-lg"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4 text-muted" />
            )}
          </button>
        )}
      </div>
    </div>
  )
}

export default function Chat() {
  const {
    messages, addMessage, appendToLastMessage, addToolCallToLastMessage, updateToolCall, clearMessages,
    isGenerating, setIsGenerating,
    agent, setAgent,
    webcontainer, isReady,
    config, setIsSettingsOpen
  } = useStore()
  
  const [input, setInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const agentRef = useRef<Agent | null>(null)

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Auto resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px'
    }
  }, [input])

  // Initialize agent when ready
  useEffect(() => {
    if (isReady && webcontainer && config && !agentRef.current) {
      const newAgent = new Agent({
        apiKey: config.apiKey,
        baseUrl: config.baseUrl,
        model: config.model
      }, webcontainer)
      agentRef.current = newAgent
      setAgent(newAgent)
    }
  }, [isReady, webcontainer, config, setAgent])

  // Update agent when config changes
  useEffect(() => {
    if (isReady && webcontainer && config) {
      const newAgent = new Agent({
        apiKey: config.apiKey,
        baseUrl: config.baseUrl,
        model: config.model
      }, webcontainer)
      agentRef.current = newAgent
      setAgent(newAgent)
    }
  }, [config, isReady, webcontainer, setAgent])

  const handleSubmit = async () => {
    if (!input.trim() || isGenerating) return
    
    if (!config) {
      setIsSettingsOpen(true)
      return
    }

    if (!agentRef.current) {
      setError('Agent not initialized. Please wait for WebContainer to boot.')
      return
    }

    const userMessage = input.trim()
    setInput('')
    setError(null)
    setIsGenerating(true)

    // Add user message
    addMessage({
      id: generateId(),
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    })

    // Add empty assistant message
    const assistantId = generateId()
    addMessage({
      id: assistantId,
      role: 'assistant',
      content: '',
      toolCalls: [],
      timestamp: new Date()
    })

    try {
      await agentRef.current.chat(userMessage, {
        onToken: (token) => {
          appendToLastMessage(token)
        },
        onToolCallStart: (name, args) => {
          addToolCallToLastMessage({
            id: generateId(),
            name,
            args,
            status: 'running'
          })
        },
        onToolCallEnd: (name, result) => {
          // Find the last running tool call with this name and update it
          const state = useStore.getState()
          const lastMessage = state.messages[state.messages.length - 1]
          if (lastMessage?.toolCalls) {
            const runningTC = [...lastMessage.toolCalls].reverse().find(
              tc => tc.name === name && tc.status === 'running'
            )
            if (runningTC) {
              updateToolCall(runningTC.id, {
                status: result.success ? 'success' : 'error',
                result
              })
            }
          }
        },
        onError: (err) => {
          setError(err)
        },
        onComplete: () => {
          setIsGenerating(false)
        }
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setIsGenerating(false)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleStop = () => {
    agentRef.current?.abort()
    setIsGenerating(false)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center">
            <div className="max-w-xl text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-foreground flex items-center justify-center mx-auto">
                <span className="text-background font-bold text-2xl">O</span>
              </div>
              <h1 className="text-3xl font-bold">OpenCode</h1>
              <p className="text-muted">
                AI coding assistant with full access to your workspace.
                I can read files, write code, run commands, and help you build.
              </p>
              
              {!config && (
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-foreground text-background rounded-xl font-medium hover:opacity-90 transition-opacity"
                >
                  Add API Key to Start →
                </button>
              )}
              
              {config && !isReady && (
                <div className="flex items-center justify-center gap-2 text-muted">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Booting workspace...</span>
                </div>
              )}
              
              {config && isReady && (
                <div className="pt-4 space-y-3">
                  <p className="text-sm text-muted">Try asking:</p>
                  <div className="grid gap-2">
                    {[
                      'Create a simple React counter component',
                      'Set up a new Express.js server',
                      'Show me what files are in this workspace',
                      'Write a function to validate email addresses',
                    ].map((suggestion, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setInput(suggestion)
                          textareaRef.current?.focus()
                        }}
                        className="p-3 border border-border rounded-lg text-left hover:bg-accent transition-colors text-sm"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            
            {error && (
              <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 mb-4">
                <XCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-border bg-background p-4">
        <div className="max-w-3xl mx-auto">
          {/* Action buttons */}
          {messages.length > 0 && (
            <div className="flex items-center gap-2 mb-3">
              {isGenerating ? (
                <button
                  onClick={handleStop}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-accent transition-colors"
                >
                  <Square className="w-3 h-3" />
                  Stop
                </button>
              ) : (
                <button
                  onClick={clearMessages}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted hover:text-foreground transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  Clear
                </button>
              )}
            </div>
          )}
          
          {/* Input */}
          <div className="relative flex items-end gap-3">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                !config 
                  ? 'Add your API key to start...' 
                  : !isReady 
                    ? 'Waiting for workspace...' 
                    : 'Ask me to write code, run commands, or help debug...'
              }
              disabled={!config || !isReady || isGenerating}
              rows={1}
              className="flex-1 resize-none px-4 py-3 border border-border rounded-xl bg-background hover:border-foreground/30 focus:border-foreground focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ maxHeight: '200px' }}
            />
            <button
              onClick={handleSubmit}
              disabled={!input.trim() || isGenerating || !config || !isReady}
              className={`flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-xl transition-all ${
                input.trim() && config && isReady && !isGenerating
                  ? 'bg-foreground text-background hover:opacity-90'
                  : 'bg-accent text-muted cursor-not-allowed'
              }`}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          
          <p className="text-xs text-muted text-center mt-3">
            OpenCode uses {config?.model || 'your model'} • Tools: bash, file read/write/edit, glob, grep
          </p>
        </div>
      </div>
    </div>
  )
}
