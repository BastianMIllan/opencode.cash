'use client'

import { useState, useEffect } from 'react'
import { Settings as SettingsIcon, Github, Moon, Sun, PanelLeftClose, PanelLeft, Terminal as TerminalIcon, MessageSquare, Loader2, AlertCircle, Play, Home } from 'lucide-react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useStore, loadStoredConfig } from '@/store'
import { bootWebContainer } from '@/lib/webcontainer'
import Settings from '@/components/Settings'
import FileExplorer from '@/components/FileExplorer'
import Preview from '@/components/Preview'

// Dynamic imports
const Chat = dynamic(() => import('@/components/Chat'), { 
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin" />
    </div>
  )
})

const Terminal = dynamic(() => import('@/components/Terminal'), { 
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center bg-black">
      <div className="text-white text-sm">Loading terminal...</div>
    </div>
  )
})

const CodeEditor = dynamic(() => import('@/components/CodeEditor'), { 
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin" />
    </div>
  )
})

export default function AppPage() {
  const { 
    config, setConfig, 
    isSettingsOpen, setIsSettingsOpen,
    isBooting, isReady, bootError,
    sidebarCollapsed, setSidebarCollapsed,
    rightPanelCollapsed, setRightPanelCollapsed,
    currentFile,
    activePanel, setActivePanel,
    showPreview, setShowPreview, previewUrl
  } = useStore()
  
  const [mounted, setMounted] = useState(false)
  const [isDark, setIsDark] = useState(true)

  useEffect(() => {
    setMounted(true)
    
    // Load stored config
    const storedConfig = loadStoredConfig()
    if (storedConfig) {
      setConfig(storedConfig)
    }
    
    // Load theme
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme === 'light') {
      setIsDark(false)
      document.documentElement.classList.remove('dark')
    } else {
      setIsDark(true)
      document.documentElement.classList.add('dark')
    }

    // Boot WebContainer
    bootWebContainer().catch(console.error)
  }, [setConfig])

  const toggleTheme = () => {
    const newTheme = !isDark
    setIsDark(newTheme)
    if (newTheme) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  if (!mounted) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-foreground flex items-center justify-center mx-auto">
            <span className="text-background font-bold text-2xl">O</span>
          </div>
          <Loader2 className="w-6 h-6 animate-spin mx-auto" />
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-3 py-2 border-b border-border bg-background z-10">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-accent transition-colors"
           title={sidebarCollapsed ? 'Show files' : 'Hide files'}
          >
            {sidebarCollapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
          
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-7 h-7 rounded-lg bg-foreground flex items-center justify-center">
              <span className="text-background font-bold text-xs">O</span>
            </div>
            <span className="font-semibold hidden sm:block">OpenCode</span>
          </Link>
          
          {/* Status */}
          <div className="hidden sm:flex items-center gap-2 px-2 py-1 rounded-full text-xs">
            {isBooting && (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                <span className="text-muted">Booting...</span>
              </>
            )}
            {bootError && (
              <>
                <AlertCircle className="w-3 h-3 text-red-500" />
                <span className="text-red-500">Error</span>
              </>
            )}
            {isReady && config && (
              <>
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <span className="text-muted font-mono">{config.model}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Preview button - shows when server is running */}
          {previewUrl && (
            <button
              onClick={() => setShowPreview(!showPreview)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all mr-2 ${
                showPreview 
                  ? 'bg-green-500 text-white' 
                  : 'bg-green-500/20 text-green-500 border border-green-500/30'
              }`}
              title={showPreview ? 'Hide preview' : 'Show preview'}
            >
              <Play className="w-3 h-3" />
              Preview
            </button>
          )}
          
          {!config && (
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-foreground text-background rounded-lg text-sm font-medium hover:opacity-90 transition-opacity mr-2"
            >
              Add API Key
            </button>
          )}
          
          <Link
            href="/"
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-accent transition-colors"
            title="Back to home"
          >
            <Home className="w-4 h-4" />
          </Link>
          
          <a
            href="https://gitlawb.com/node/repos/z6MkqDnb/openclaude"
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-accent transition-colors"
            title="View source"
          >
            <Github className="w-4 h-4" />
          </a>
          
          <button
            onClick={toggleTheme}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-accent transition-colors"
            title={isDark ? 'Light mode' : 'Dark mode'}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-accent transition-colors"
            title="Settings"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - File Explorer */}
        {!sidebarCollapsed && (
          <div className="w-56 flex-shrink-0 border-r border-border">
            <FileExplorer />
          </div>
        )}

        {/* Center - Chat + Preview */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 overflow-hidden">
            <Chat />
          </div>
          {/* Preview Panel - shows when a server is running */}
          <Preview />
        </div>

        {/* Right Sidebar - Editor/Terminal */}
        {!rightPanelCollapsed && currentFile && (
          <div className="w-[45%] flex-shrink-0 border-l border-border flex flex-col">
            <div className="flex items-center border-b border-border bg-accent/30">
              <button
                onClick={() => setActivePanel('chat')}
                className={`flex items-center gap-2 px-4 py-2 text-sm border-b-2 transition-colors ${
                  activePanel === 'chat'
                    ? 'border-foreground text-foreground'
                    : 'border-transparent text-muted hover:text-foreground'
                }`}
              >
                Editor
              </button>
              <button
                onClick={() => setActivePanel('terminal')}
                className={`flex items-center gap-2 px-4 py-2 text-sm border-b-2 transition-colors ${
                  activePanel === 'terminal'
                    ? 'border-foreground text-foreground'
                    : 'border-transparent text-muted hover:text-foreground'
                }`}
              >
                <TerminalIcon className="w-3 h-3" />
                Terminal
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              {activePanel === 'chat' ? <CodeEditor /> : <Terminal />}
            </div>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      <Settings />
    </div>
  )
}
