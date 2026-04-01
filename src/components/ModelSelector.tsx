'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Key, Eye, EyeOff, X, Zap, Check } from 'lucide-react'
import { useStore, ApiConfig } from '@/store'
import { useSession } from 'next-auth/react'

interface ProviderDef {
  id: string
  name: string
  baseUrl: string
  requiresKey: boolean
  models: string[]
  placeholder: string
  icon: string
}

const providers: ProviderDef[] = [
  {
    id: 'anthropic',
    name: 'Anthropic',
    baseUrl: 'https://api.anthropic.com',
    requiresKey: true,
    models: ['claude-sonnet-4-6', 'claude-haiku-4-5', 'claude-opus-4-6', 'claude-sonnet-4-20250514'],
    placeholder: 'sk-ant-...',
    icon: '◈',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    requiresKey: true,
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'o1-preview', 'o1-mini'],
    placeholder: 'sk-...',
    icon: '◉',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    requiresKey: true,
    models: ['deepseek-chat', 'deepseek-coder', 'deepseek-reasoner'],
    placeholder: 'sk-...',
    icon: '◆',
  },
  {
    id: 'google',
    name: 'Google (OpenRouter)',
    baseUrl: 'https://openrouter.ai/api/v1',
    requiresKey: true,
    models: ['google/gemini-2.0-flash', 'google/gemini-2.0-pro'],
    placeholder: 'sk-or-...',
    icon: '◇',
  },
  {
    id: 'groq',
    name: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    requiresKey: true,
    models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'],
    placeholder: 'gsk_...',
    icon: '⚡',
  },
  {
    id: 'mistral',
    name: 'Mistral',
    baseUrl: 'https://api.mistral.ai/v1',
    requiresKey: true,
    models: ['mistral-large-latest', 'mistral-medium-latest', 'codestral-latest'],
    placeholder: '...',
    icon: '▣',
  },
  {
    id: 'together',
    name: 'Together AI',
    baseUrl: 'https://api.together.xyz/v1',
    requiresKey: true,
    models: ['meta-llama/Llama-3.3-70B-Instruct-Turbo', 'Qwen/Qwen2.5-72B-Instruct-Turbo'],
    placeholder: '...',
    icon: '▢',
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    requiresKey: true,
    models: ['openai/gpt-4o', 'anthropic/claude-3.5-sonnet', 'meta-llama/llama-3.3-70b-instruct'],
    placeholder: 'sk-or-...',
    icon: '◎',
  },
  {
    id: 'ollama',
    name: 'Ollama (Local)',
    baseUrl: 'http://localhost:11434/v1',
    requiresKey: false,
    models: ['llama3.3:70b', 'llama3.2:3b', 'mistral', 'codellama', 'deepseek-coder'],
    placeholder: '',
    icon: '⊙',
  },
]

function getProviderForModel(model: string): ProviderDef | undefined {
  return providers.find((p) => p.models.includes(model))
}

// Store keys in memory keyed by provider
type KeyCache = Record<string, { apiKey: string; baseUrl?: string }>

export default function ModelSelector() {
  const { config, setConfig } = useStore()
  const { data: session } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const [showKeyPopup, setShowKeyPopup] = useState(false)
  const [pendingModel, setPendingModel] = useState<string | null>(null)
  const [pendingProvider, setPendingProvider] = useState<ProviderDef | null>(null)
  const [keyInput, setKeyInput] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [saving, setSaving] = useState(false)
  const [keyCache, setKeyCache] = useState<KeyCache>({})
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Load keys from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('opencode-keys')
    if (stored) {
      try {
        setKeyCache(JSON.parse(stored))
      } catch { /* ignore */ }
    }
  }, [])

  // Load keys from DB if logged in
  useEffect(() => {
    if (session?.user?.id) {
      loadKeysFromDB()
    }
  }, [session?.user?.id])

  // Close dropdown on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const loadKeysFromDB = async () => {
    try {
      const res = await fetch('/api/keys')
      if (res.ok) {
        const keys = await res.json()
        // For each key from DB, fetch the full key
        for (const k of keys) {
          const fullRes = await fetch(`/api/keys/${k.provider}`)
          if (fullRes.ok) {
            const full = await fullRes.json()
            setKeyCache((prev) => {
              const updated = {
                ...prev,
                [k.provider]: { apiKey: full.apiKey, baseUrl: full.baseUrl || undefined },
              }
              localStorage.setItem('opencode-keys', JSON.stringify(updated))
              return updated
            })
          }
        }
      }
    } catch {
      // silently fail — use localStorage cache
    }
  }

  const hasKeyForProvider = (providerId: string): boolean => {
    return !!keyCache[providerId]?.apiKey
  }

  const selectModel = (model: string, provider: ProviderDef) => {
    const cached = keyCache[provider.id]
    
    if (provider.requiresKey && !cached?.apiKey) {
      // No key — show popup
      setPendingModel(model)
      setPendingProvider(provider)
      setKeyInput('')
      setShowKeyPopup(true)
      setIsOpen(false)
      return
    }

    // Has key — switch immediately
    const newConfig: ApiConfig = {
      provider: provider.id,
      apiKey: cached?.apiKey || '',
      baseUrl: cached?.baseUrl || provider.baseUrl,
      model,
    }
    setConfig(newConfig)
    setIsOpen(false)
  }

  const handleSaveKey = async () => {
    if (!keyInput.trim() || !pendingProvider || !pendingModel) return
    setSaving(true)

    const newCache = {
      ...keyCache,
      [pendingProvider.id]: { apiKey: keyInput.trim() },
    }
    setKeyCache(newCache)
    localStorage.setItem('opencode-keys', JSON.stringify(newCache))

    // Save to DB if logged in
    if (session?.user?.id) {
      try {
        await fetch('/api/keys', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider: pendingProvider.id,
            apiKey: keyInput.trim(),
          }),
        })
      } catch {
        // saved locally at least
      }
    }

    // Now activate the model
    const newConfig: ApiConfig = {
      provider: pendingProvider.id,
      apiKey: keyInput.trim(),
      baseUrl: pendingProvider.baseUrl,
      model: pendingModel,
    }
    setConfig(newConfig)

    setSaving(false)
    setShowKeyPopup(false)
    setPendingModel(null)
    setPendingProvider(null)
    setKeyInput('')
  }

  const currentModel = config?.model || 'Select model'
  const currentProvider = config ? providers.find((p) => p.id === config.provider) : null

  return (
    <>
      {/* Inline selector */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted hover:text-foreground transition-colors rounded-lg hover:bg-accent/50"
        >
          {currentProvider && (
            <span className="text-xs opacity-60">{currentProvider.icon}</span>
          )}
          <span className="font-mono">{currentModel}</span>
          <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute bottom-full left-0 mb-2 w-80 bg-background border border-border rounded-xl shadow-2xl z-50 max-h-96 overflow-y-auto">
            {providers.map((provider) => (
              <div key={provider.id}>
                {/* Provider header */}
                <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted font-medium border-b border-border/50 bg-accent/30 sticky top-0">
                  <span>{provider.icon}</span>
                  <span>{provider.name}</span>
                  {provider.requiresKey && hasKeyForProvider(provider.id) && (
                    <Check className="w-3 h-3 text-green-500 ml-auto" />
                  )}
                  {provider.requiresKey && !hasKeyForProvider(provider.id) && (
                    <Key className="w-3 h-3 text-yellow-500 ml-auto" />
                  )}
                </div>
                {/* Models */}
                {provider.models.map((model) => (
                  <button
                    key={model}
                    onClick={() => selectModel(model, provider)}
                    className={`w-full px-4 py-2 text-left text-sm font-mono hover:bg-accent transition-colors flex items-center gap-2 ${
                      config?.model === model && config?.provider === provider.id
                        ? 'bg-accent text-foreground'
                        : 'text-foreground/80'
                    }`}
                  >
                    <span className="truncate flex-1">{model}</span>
                    {config?.model === model && config?.provider === provider.id && (
                      <Zap className="w-3 h-3 text-green-500 flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* API Key Popup */}
      {showKeyPopup && pendingProvider && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => {
              setShowKeyPopup(false)
              setPendingModel(null)
              setPendingProvider(null)
            }}
          />
          <div className="relative bg-background border border-border rounded-2xl w-full max-w-md mx-4 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-lg">
                  {pendingProvider.icon}
                </div>
                <div>
                  <h3 className="font-semibold">{pendingProvider.name} API Key</h3>
                  <p className="text-xs text-muted">Required to use {pendingModel}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowKeyPopup(false)
                  setPendingModel(null)
                  setPendingProvider(null)
                }}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-accent transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted">API Key</label>
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveKey()
                    }}
                    placeholder={pendingProvider.placeholder}
                    className="w-full px-4 py-3 pr-12 border border-border rounded-xl bg-background hover:border-foreground/30 focus:border-foreground transition-colors font-mono text-sm"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <p className="text-xs text-muted">
                {session?.user
                  ? 'Your key will be encrypted and stored with your account.'
                  : 'Sign in with X to save keys across sessions. Keys are stored locally for now.'}
              </p>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-5 border-t border-border">
              <button
                onClick={() => {
                  setShowKeyPopup(false)
                  setPendingModel(null)
                  setPendingProvider(null)
                }}
                className="px-4 py-2 text-sm text-muted hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveKey}
                disabled={!keyInput.trim() || saving}
                className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  keyInput.trim() && !saving
                    ? 'bg-foreground text-background hover:opacity-90'
                    : 'bg-accent text-muted cursor-not-allowed'
                }`}
              >
                {saving ? 'Saving...' : 'Save & Use Model'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
