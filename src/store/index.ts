import { create } from 'zustand'
import { WebContainer } from '@webcontainer/api'
import { Agent } from '@/lib/tools/agent'
import { ToolResult } from '@/lib/tools/executor'

export interface FileNode {
  name: string
  path: string
  type: 'file' | 'directory'
  children?: FileNode[]
}

export interface ApiConfig {
  provider: string
  apiKey: string
  baseUrl: string
  model: string
}

export interface ToolCallDisplay {
  id: string
  name: string
  args: Record<string, unknown>
  status: 'running' | 'success' | 'error'
  result?: ToolResult
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  toolCalls?: ToolCallDisplay[]
  timestamp: Date
}

interface AppState {
  // WebContainer
  webcontainer: WebContainer | null
  setWebcontainer: (wc: WebContainer) => void
  isBooting: boolean
  setIsBooting: (v: boolean) => void
  isReady: boolean
  setIsReady: (v: boolean) => void
  bootError: string | null
  setBootError: (e: string | null) => void

  // Agent
  agent: Agent | null
  setAgent: (a: Agent | null) => void

  // Chat
  messages: ChatMessage[]
  addMessage: (msg: ChatMessage) => void
  updateLastMessage: (update: Partial<ChatMessage>) => void
  appendToLastMessage: (content: string) => void
  addToolCallToLastMessage: (tc: ToolCallDisplay) => void
  updateToolCall: (id: string, update: Partial<ToolCallDisplay>) => void
  clearMessages: () => void
  isGenerating: boolean
  setIsGenerating: (v: boolean) => void

  // Files
  files: FileNode[]
  setFiles: (files: FileNode[]) => void
  currentFile: string | null
  setCurrentFile: (path: string | null) => void
  fileContent: string
  setFileContent: (content: string) => void
  openFiles: string[]
  addOpenFile: (path: string) => void
  removeOpenFile: (path: string) => void

  // Settings
  config: ApiConfig | null
  setConfig: (config: ApiConfig | null) => void
  isSettingsOpen: boolean
  setIsSettingsOpen: (v: boolean) => void

  // UI
  activePanel: 'chat' | 'terminal'
  setActivePanel: (p: 'chat' | 'terminal') => void
  sidebarCollapsed: boolean
  setSidebarCollapsed: (v: boolean) => void
  rightPanelCollapsed: boolean
  setRightPanelCollapsed: (v: boolean) => void
  
  // Preview
  previewUrl: string | null
  setPreviewUrl: (url: string | null) => void
  previewPort: number | null
  setPreviewPort: (port: number | null) => void
  showPreview: boolean
  setShowPreview: (v: boolean) => void
}

export const useStore = create<AppState>((set, get) => ({
  // WebContainer
  webcontainer: null,
  setWebcontainer: (wc) => set({ webcontainer: wc }),
  isBooting: true,
  setIsBooting: (v) => set({ isBooting: v }),
  isReady: false,
  setIsReady: (v) => set({ isReady: v }),
  bootError: null,
  setBootError: (e) => set({ bootError: e }),

  // Agent
  agent: null,
  setAgent: (a) => set({ agent: a }),

  // Chat
  messages: [],
  addMessage: (msg) => set((state) => ({ 
    messages: [...state.messages, msg] 
  })),
  updateLastMessage: (update) => set((state) => {
    const messages = [...state.messages]
    if (messages.length > 0) {
      messages[messages.length - 1] = { ...messages[messages.length - 1], ...update }
    }
    return { messages }
  }),
  appendToLastMessage: (content) => set((state) => {
    const messages = [...state.messages]
    if (messages.length > 0 && messages[messages.length - 1].role === 'assistant') {
      messages[messages.length - 1] = {
        ...messages[messages.length - 1],
        content: messages[messages.length - 1].content + content
      }
    }
    return { messages }
  }),
  addToolCallToLastMessage: (tc) => set((state) => {
    const messages = [...state.messages]
    if (messages.length > 0 && messages[messages.length - 1].role === 'assistant') {
      const lastMsg = messages[messages.length - 1]
      messages[messages.length - 1] = {
        ...lastMsg,
        toolCalls: [...(lastMsg.toolCalls || []), tc]
      }
    }
    return { messages }
  }),
  updateToolCall: (id, update) => set((state) => {
    const messages = [...state.messages]
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].toolCalls) {
        const idx = messages[i].toolCalls!.findIndex(tc => tc.id === id)
        if (idx !== -1) {
          messages[i] = {
            ...messages[i],
            toolCalls: messages[i].toolCalls!.map(tc => 
              tc.id === id ? { ...tc, ...update } : tc
            )
          }
          break
        }
      }
    }
    return { messages }
  }),
  clearMessages: () => {
    get().agent?.clearHistory()
    set({ messages: [] })
  },
  isGenerating: false,
  setIsGenerating: (v) => set({ isGenerating: v }),

  // Files
  files: [],
  setFiles: (files) => set({ files }),
  currentFile: null,
  setCurrentFile: (path) => set({ currentFile: path }),
  fileContent: '',
  setFileContent: (content) => set({ fileContent: content }),
  openFiles: [],
  addOpenFile: (path) => set((state) => ({
    openFiles: state.openFiles.includes(path) ? state.openFiles : [...state.openFiles, path]
  })),
  removeOpenFile: (path) => set((state) => ({
    openFiles: state.openFiles.filter(p => p !== path),
    currentFile: state.currentFile === path ? (state.openFiles[0] || null) : state.currentFile
  })),

  // Settings
  config: null,
  setConfig: (config) => {
    if (typeof window !== 'undefined' && config) {
      localStorage.setItem('opencode-config', JSON.stringify(config))
    }
    set({ config })
  },
  isSettingsOpen: false,
  setIsSettingsOpen: (v) => set({ isSettingsOpen: v }),

  // UI
  activePanel: 'chat',
  setActivePanel: (p) => set({ activePanel: p }),
  sidebarCollapsed: false,
  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
  rightPanelCollapsed: true,
  setRightPanelCollapsed: (v) => set({ rightPanelCollapsed: v }),
  
  // Preview
  previewUrl: null,
  setPreviewUrl: (url) => set({ previewUrl: url }),
  previewPort: null,
  setPreviewPort: (port) => set({ previewPort: port }),
  showPreview: false,
  setShowPreview: (v) => set({ showPreview: v }),
}))

// Deprecated model migrations
const MODEL_MIGRATIONS: Record<string, string> = {
  'claude-3-5-haiku-20241022': 'claude-haiku-4-5',
  'claude-3-5-haiku-latest': 'claude-haiku-4-5',
  'claude-3-5-sonnet-20241022': 'claude-sonnet-4-6',
  'claude-3-5-sonnet-latest': 'claude-sonnet-4-6',
  'claude-3-7-sonnet-20250219': 'claude-sonnet-4-20250514',
  'claude-3-opus-20240229': 'claude-opus-4-6',
}

// Load config from localStorage
export function loadStoredConfig(): ApiConfig | null {
  if (typeof window === 'undefined') return null
  const stored = localStorage.getItem('opencode-config')
  if (!stored) return null
  try {
    const config = JSON.parse(stored) as ApiConfig
    // Migrate deprecated models
    if (config.provider === 'anthropic' && config.model && MODEL_MIGRATIONS[config.model]) {
      config.model = MODEL_MIGRATIONS[config.model]
      localStorage.setItem('opencode-config', JSON.stringify(config))
    }
    return config
  } catch {
    return null
  }
}
