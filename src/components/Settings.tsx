'use client'

import { useState, useEffect } from 'react'
import { X, Check, ChevronDown, Trash2, Eye, EyeOff } from 'lucide-react'
import { useStore, ApiConfig } from '@/store'

interface Provider {
  id: string
  name: string
  baseUrl: string
  requiresKey: boolean
  models: string[]
  placeholder: string
}

const providers: Provider[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    requiresKey: true,
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo', 'o1-preview', 'o1-mini'],
    placeholder: 'sk-...',
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    baseUrl: 'https://api.anthropic.com',
    requiresKey: true,
    models: ['claude-sonnet-4-6', 'claude-haiku-4-5', 'claude-opus-4-6', 'claude-sonnet-4-20250514', 'claude-3-haiku-20240307'],
    placeholder: 'sk-ant-...',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    requiresKey: true,
    models: ['deepseek-chat', 'deepseek-coder', 'deepseek-reasoner'],
    placeholder: 'sk-...',
  },
  {
    id: 'google',
    name: 'Google (via OpenRouter)',
    baseUrl: 'https://openrouter.ai/api/v1',
    requiresKey: true,
    models: ['google/gemini-2.0-flash', 'google/gemini-2.0-pro', 'google/gemini-pro'],
    placeholder: 'sk-or-...',
  },
  {
    id: 'groq',
    name: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    requiresKey: true,
    models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'],
    placeholder: 'gsk_...',
  },
  {
    id: 'mistral',
    name: 'Mistral',
    baseUrl: 'https://api.mistral.ai/v1',
    requiresKey: true,
    models: ['mistral-large-latest', 'mistral-medium-latest', 'codestral-latest'],
    placeholder: '...',
  },
  {
    id: 'together',
    name: 'Together AI',
    baseUrl: 'https://api.together.xyz/v1',
    requiresKey: true,
    models: ['meta-llama/Llama-3.3-70B-Instruct-Turbo', 'Qwen/Qwen2.5-72B-Instruct-Turbo'],
    placeholder: '...',
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    requiresKey: true,
    models: ['openai/gpt-4o', 'anthropic/claude-3.5-sonnet', 'meta-llama/llama-3.3-70b-instruct'],
    placeholder: 'sk-or-...',
  },
  {
    id: 'ollama',
    name: 'Ollama (Local)',
    baseUrl: 'http://localhost:11434/v1',
    requiresKey: false,
    models: ['llama3.3:70b', 'llama3.2:3b', 'mistral', 'codellama', 'deepseek-coder', 'qwen2.5-coder'],
    placeholder: '',
  },
  {
    id: 'lmstudio',
    name: 'LM Studio (Local)',
    baseUrl: 'http://localhost:1234/v1',
    requiresKey: false,
    models: ['local-model'],
    placeholder: '',
  },
  {
    id: 'custom',
    name: 'Custom Provider',
    baseUrl: '',
    requiresKey: true,
    models: [],
    placeholder: '...',
  },
]

interface SettingsProps {
  isOpen?: boolean
}

export default function Settings({ isOpen: isOpenProp }: SettingsProps) {
  const { isSettingsOpen, setIsSettingsOpen, config, setConfig } = useStore()
  const isOpen = isOpenProp ?? isSettingsOpen
  
  const [selectedProvider, setSelectedProvider] = useState<Provider>(providers[0])
  const [apiKey, setApiKey] = useState('')
  const [customBaseUrl, setCustomBaseUrl] = useState('')
  const [selectedModel, setSelectedModel] = useState('')
  const [customModel, setCustomModel] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (config) {
      const provider = providers.find(p => p.id === config.provider) || providers[0]
      setSelectedProvider(provider)
      setApiKey(config.apiKey)
      setCustomBaseUrl(config.baseUrl !== provider.baseUrl ? config.baseUrl : '')
      if (provider.models.includes(config.model)) {
        setSelectedModel(config.model)
        setCustomModel('')
      } else {
        setSelectedModel('')
        setCustomModel(config.model)
      }
    }
  }, [config, isOpen])

  const handleProviderChange = (provider: Provider) => {
    setSelectedProvider(provider)
    setSelectedModel(provider.models[0] || '')
    setCustomModel('')
    setCustomBaseUrl('')
    setIsDropdownOpen(false)
  }

  const handleClose = () => {
    setIsSettingsOpen(false)
  }

  const handleSave = () => {
    const newConfig: ApiConfig = {
      provider: selectedProvider.id,
      apiKey: apiKey,
      baseUrl: customBaseUrl || selectedProvider.baseUrl,
      model: customModel || selectedModel,
    }
    
    setConfig(newConfig)
    setSaved(true)
    setTimeout(() => {
      setSaved(false)
      handleClose()
    }, 1000)
  }

  const handleClear = () => {
    setConfig(null)
    setApiKey('')
    setCustomBaseUrl('')
    setSelectedModel(selectedProvider.models[0] || '')
    setCustomModel('')
  }

  const isValid = () => {
    if (selectedProvider.requiresKey && !apiKey) return false
    if (selectedProvider.id === 'custom' && !customBaseUrl) return false
    if (!selectedModel && !customModel) return false
    return true
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative bg-background border border-border rounded-2xl w-full max-w-lg mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold">Settings</h2>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-accent transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
          {/* Info */}
          <div className="p-4 bg-accent rounded-xl text-sm">
            <p className="font-medium mb-1">OpenCode uses OpenAI-compatible APIs</p>
            <p className="text-muted">Works with OpenAI, DeepSeek, Groq, Together, OpenRouter, Ollama, and any OpenAI-compatible endpoint.</p>
          </div>
          
          {/* Provider Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted">Provider</label>
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full flex items-center justify-between px-4 py-3 border border-border rounded-xl hover:border-foreground/30 transition-colors bg-background"
              >
                <span>{selectedProvider.name}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-xl shadow-xl z-10 max-h-64 overflow-y-auto">
                  {providers.map((provider) => (
                    <button
                      key={provider.id}
                      onClick={() => handleProviderChange(provider)}
                      className={`w-full px-4 py-3 text-left hover:bg-accent transition-colors first:rounded-t-xl last:rounded-b-xl ${
                        selectedProvider.id === provider.id ? 'bg-accent' : ''
                      }`}
                    >
                      <span className="font-medium">{provider.name}</span>
                      {!provider.requiresKey && (
                        <span className="ml-2 text-xs text-muted">(No API key needed)</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* API Key */}
          {selectedProvider.requiresKey && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted">API Key</label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={selectedProvider.placeholder}
                  className="w-full px-4 py-3 pr-12 border border-border rounded-xl bg-background hover:border-foreground/30 focus:border-foreground transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
                >
                  {showKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-muted">
                Your API key is stored locally in your browser. Never shared.
              </p>
            </div>
          )}

          {/* Base URL (for custom provider or override) */}
          {(selectedProvider.id === 'custom' || selectedProvider.id === 'ollama' || selectedProvider.id === 'lmstudio') && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted">Base URL</label>
              <input
                type="text"
                value={customBaseUrl || selectedProvider.baseUrl}
                onChange={(e) => setCustomBaseUrl(e.target.value)}
                placeholder="https://api.example.com/v1"
                className="w-full px-4 py-3 border border-border rounded-xl bg-background hover:border-foreground/30 focus:border-foreground transition-colors"
              />
            </div>
          )}

          {/* Model Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted">Model</label>
            {selectedProvider.models.length > 0 ? (
              <div className="relative">
                <button
                  onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                  className="w-full flex items-center justify-between px-4 py-3 border border-border rounded-xl hover:border-foreground/30 transition-colors bg-background"
                >
                  <span className="font-mono text-sm">{customModel || selectedModel || 'Select a model'}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${isModelDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isModelDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-xl shadow-xl z-10 max-h-48 overflow-y-auto">
                    {selectedProvider.models.map((model) => (
                      <button
                        key={model}
                        onClick={() => {
                          setSelectedModel(model)
                          setCustomModel('')
                          setIsModelDropdownOpen(false)
                        }}
                        className={`w-full px-4 py-3 text-left hover:bg-accent transition-colors first:rounded-t-xl last:rounded-b-xl font-mono text-sm ${
                          selectedModel === model ? 'bg-accent' : ''
                        }`}
                      >
                        {model}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
            
            {/* Custom model input */}
            <input
              type="text"
              value={customModel}
              onChange={(e) => {
                setCustomModel(e.target.value)
                if (e.target.value) setSelectedModel('')
              }}
              placeholder="Or enter custom model name..."
              className="w-full px-4 py-3 border border-border rounded-xl bg-background hover:border-foreground/30 focus:border-foreground transition-colors font-mono text-sm"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-border">
          <button
            onClick={handleClear}
            className="flex items-center gap-2 px-4 py-2 text-muted hover:text-foreground transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear</span>
          </button>
          
          <button
            onClick={handleSave}
            disabled={!isValid()}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
              isValid()
                ? 'bg-foreground text-background hover:opacity-90'
                : 'bg-border text-muted cursor-not-allowed'
            }`}
          >
            {saved ? (
              <>
                <Check className="w-4 h-4" />
                <span>Saved!</span>
              </>
            ) : (
              <span>Save Configuration</span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
