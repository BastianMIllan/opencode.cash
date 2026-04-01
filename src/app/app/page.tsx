'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { Settings as SettingsIcon, Github, Moon, Sun, PanelLeftClose, PanelLeft, Terminal as TerminalIcon, Loader2, AlertCircle, Play, Home, User, LogOut, Save, FolderOpen, Trash2, Download, ExternalLink, X, Plus, BookOpen, MessageSquare, FileCode, Files, Compass, Eye, EyeOff, GitFork } from 'lucide-react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import Image from 'next/image'
import { useStore, loadStoredConfig } from '@/store'
import { bootWebContainer, listDirectory, restoreWorkspace, snapshotWorkspace, WorkspaceSnapshot } from '@/lib/webcontainer'
import Settings from '@/components/Settings'
import FileExplorer from '@/components/FileExplorer'
import Preview from '@/components/Preview'

interface SavedProject {
  id: string
  name: string
  description: string | null
  isPublic: boolean
  tags: string[]
  files?: WorkspaceSnapshot
  createdAt: string
  updatedAt: string
}

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
  const { data: session, status } = useSession()
  const { 
    config, setConfig, 
    isSettingsOpen, setIsSettingsOpen,
    isBooting, isReady, bootError,
    webcontainer,
    sidebarCollapsed, setSidebarCollapsed,
    rightPanelCollapsed, setRightPanelCollapsed,
    setFiles,
    currentFile,
    setCurrentFile,
    setFileContent,
    activePanel, setActivePanel,
    showPreview, setShowPreview, previewUrl, previewPort,
    clearMessages
  } = useStore()
  
  const [mounted, setMounted] = useState(false)
  const [isDark, setIsDark] = useState(true)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [projects, setProjects] = useState<SavedProject[]>([])
  const [isProjectsOpen, setIsProjectsOpen] = useState(false)
  const [projectsLoading, setProjectsLoading] = useState(false)
  const [projectError, setProjectError] = useState<string | null>(null)
  const [projectStatus, setProjectStatus] = useState<string | null>(null)
  const [activeProject, setActiveProject] = useState<{ id: string; name: string; isPublic: boolean } | null>(null)
  const [mobileTab, setMobileTab] = useState<'chat' | 'files' | 'editor' | 'terminal'>('chat')
  const [discoveryToggling, setDiscoveryToggling] = useState(false)

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

  const handleNewProject = useCallback(async () => {
    if (!webcontainer || !isReady) return
    
    if (activeProject) {
      if (!window.confirm('Start a new project? Unsaved changes will be lost.')) return
    }

    // Reset workspace to defaults
    await restoreWorkspace(webcontainer, {
      '/package.json': JSON.stringify({ name: 'workspace', type: 'module', scripts: { start: 'node index.js', dev: 'node --watch index.js' }, dependencies: {} }, null, 2),
      '/README.md': '# Workspace\n\nWelcome to OpenCode! Ask the AI to help you build something.\n',
      '/index.js': '// Your code here\nconsole.log(\'Hello from OpenCode!\');\n'
    })
    const tree = await listDirectory(webcontainer)
    setFiles(tree)
    setCurrentFile(null)
    setFileContent('')
    setRightPanelCollapsed(true)
    setActiveProject(null)
    setShowPreview(false)
    clearMessages()
  }, [webcontainer, isReady, activeProject, setFiles, setCurrentFile, setFileContent, setRightPanelCollapsed, setShowPreview])

  const fetchProjects = useCallback(async () => {
    if (!session) return

    setProjectsLoading(true)
    setProjectError(null)

    try {
      const response = await fetch('/api/projects')
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error || 'Failed to fetch projects')
      }

      const data = await response.json()
      setProjects(data)
    } catch (error) {
      setProjectError(error instanceof Error ? error.message : 'Failed to fetch projects')
    } finally {
      setProjectsLoading(false)
    }
  }, [session])

  const handleSaveProject = useCallback(async () => {
    if (!session) {
      setShowUserMenu(false)
      return
    }

    if (!webcontainer || !isReady) {
      setProjectError('Workspace is still booting. Try again in a moment.')
      return
    }

    setShowUserMenu(false)

    // If there's an active project, update it directly
    if (activeProject) {
      setProjectsLoading(true)
      setProjectError(null)
      setProjectStatus('Saving...')

      try {
        const files = await snapshotWorkspace(webcontainer)
        const response = await fetch(`/api/projects/${activeProject.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ files }),
        })

        if (!response.ok) {
          const data = await response.json().catch(() => null)
          throw new Error(data?.error || 'Failed to save project')
        }

        setProjectStatus(`Saved "${activeProject.name}"`)
        setTimeout(() => setProjectStatus(null), 3000)
      } catch (error) {
        setProjectError(error instanceof Error ? error.message : 'Failed to save project')
      } finally {
        setProjectsLoading(false)
      }
      return
    }

    // No active project — create new
    const name = window.prompt('Project name')?.trim()
    if (!name) return

    setProjectsLoading(true)
    setProjectError(null)
    setProjectStatus('Saving project...')

    try {
      const files = await snapshotWorkspace(webcontainer)
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          files,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error || 'Failed to save project')
      }

      const saved = await response.json()
      setActiveProject({ id: saved.id, name: saved.name, isPublic: saved.isPublic || false })
      setProjectStatus(`Saved "${name}"`)
      setTimeout(() => setProjectStatus(null), 3000)
      await fetchProjects()
    } catch (error) {
      setProjectError(error instanceof Error ? error.message : 'Failed to save project')
      setProjectStatus(null)
    } finally {
      setProjectsLoading(false)
    }
  }, [fetchProjects, isReady, session, webcontainer, activeProject])

  const handleOpenProjects = useCallback(async () => {
    setShowUserMenu(false)
    setIsProjectsOpen(true)
    await fetchProjects()
  }, [fetchProjects])

  const handleLoadProject = useCallback(async (projectId: string) => {
    if (!webcontainer || !isReady) {
      setProjectError('Workspace is still booting. Try again in a moment.')
      return
    }

    setProjectsLoading(true)
    setProjectError(null)
    setProjectStatus('Loading project...')

    try {
      const response = await fetch(`/api/projects/${projectId}`)
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error || 'Failed to load project')
      }

      const project = await response.json() as SavedProject
      const snapshot = (project.files || {}) as WorkspaceSnapshot

      await restoreWorkspace(webcontainer, snapshot)
      const tree = await listDirectory(webcontainer)

      setFiles(tree)
      setCurrentFile(null)
      setFileContent('')
      setRightPanelCollapsed(true)
      setActiveProject({ id: project.id, name: project.name, isPublic: project.isPublic || false })
      setIsProjectsOpen(false)
      setProjectStatus(`Loaded "${project.name}"`)
      setTimeout(() => setProjectStatus(null), 3000)
    } catch (error) {
      setProjectError(error instanceof Error ? error.message : 'Failed to load project')
      setProjectStatus(null)
    } finally {
      setProjectsLoading(false)
    }
  }, [isReady, setCurrentFile, setFileContent, setFiles, setRightPanelCollapsed, webcontainer])

  const handleDeleteProject = useCallback(async (projectId: string) => {
    if (!window.confirm('Delete this project?')) return

    setProjectsLoading(true)
    setProjectError(null)

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error || 'Failed to delete project')
      }

      // If we deleted the active project, clear it
      if (activeProject?.id === projectId) {
        setActiveProject(null)
      }

      await fetchProjects()
    } catch (error) {
      setProjectError(error instanceof Error ? error.message : 'Failed to delete project')
    } finally {
      setProjectsLoading(false)
    }
  }, [fetchProjects, activeProject])

  const handleToggleDiscovery = useCallback(async () => {
    if (!activeProject || !session) return
    
    setDiscoveryToggling(true)
    try {
      const newState = !activeProject.isPublic
      const res = await fetch(`/api/projects/${activeProject.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublic: newState }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || 'Failed to update')
      }

      setActiveProject({ ...activeProject, isPublic: newState })
      setProjectStatus(newState ? 'Live on Discover' : 'Removed from Discover')
      setTimeout(() => setProjectStatus(null), 3000)
    } catch (error) {
      setProjectError(error instanceof Error ? error.message : 'Failed to toggle discovery')
    } finally {
      setDiscoveryToggling(false)
    }
  }, [activeProject, session])

  if (!mounted) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Image src="/logopng.png" alt="OpenCode" width={64} height={64} className="mx-auto rounded-2xl" />
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
            className="w-8 h-8 hidden md:flex items-center justify-center rounded-lg hover:bg-accent transition-colors"
           title={sidebarCollapsed ? 'Show files' : 'Hide files'}
          >
            {sidebarCollapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
          
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Image src="/logo.png" alt="OpenCode" width={28} height={28} className="rounded-lg dark:invert-0 invert" />
            <span className="font-semibold hidden sm:block">OpenCode</span>
          </Link>
          
          {/* Status + Active Project */}
          <div className="hidden sm:flex items-center gap-2 px-2 py-1 rounded-full text-xs">
            {isBooting && (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                <span className="text-muted">Booting...</span>
              </>
            )}
          </div>

          {/* Project indicator */}
          {session && (
            <div className="hidden sm:flex items-center gap-1 ml-1">
              <span className="text-xs text-muted">/</span>
              <button
                onClick={handleOpenProjects}
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs hover:bg-accent transition-colors"
                title="Switch project"
              >
                <FolderOpen className="w-3 h-3 text-muted" />
                <span className="font-medium max-w-[120px] truncate">
                  {activeProject ? activeProject.name : 'Untitled'}
                </span>
                {activeProject?.isPublic && (
                  <span className="flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    LIVE
                  </span>
                )}
              </button>
              {projectStatus && (
                <span className="text-xs text-green-500 animate-pulse">{projectStatus}</span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* Preview button - shows when server is running */}
          {previewUrl && (
            <div className="flex items-center gap-1 mr-1 sm:mr-2">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className={`flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-l-lg text-sm font-medium transition-all ${
                  showPreview 
                    ? 'bg-green-500 text-white' 
                    : 'bg-green-500/20 text-green-500 border border-green-500/30'
                }`}
                title={showPreview ? 'Hide preview' : 'Show preview'}
              >
                <Play className="w-3 h-3" />
                <span className="hidden sm:inline">Preview</span>
              </button>
              <a
                href="/preview"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center px-2 py-1.5 rounded-r-lg text-sm font-medium transition-all bg-green-500/20 text-green-500 border border-l-0 border-green-500/30 hover:bg-green-500/30"
                title="Open full preview in new tab"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
          
          {session && !config && (
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-foreground text-background rounded-lg text-sm font-medium hover:opacity-90 transition-opacity mr-2"
            >
              Add API Key
            </button>
          )}
          
          <Link
            href="/"
            className="w-8 h-8 rounded-lg hidden sm:flex items-center justify-center hover:bg-accent transition-colors"
            title="Back to home"
          >
            <Home className="w-4 h-4" />
          </Link>

          <Link
            href="/discover"
            className="w-8 h-8 rounded-lg hidden sm:flex items-center justify-center hover:bg-accent transition-colors"
            title="Discover"
          >
            <Compass className="w-4 h-4" />
          </Link>

          <Link
            href="/docs"
            className="w-8 h-8 rounded-lg hidden sm:flex items-center justify-center hover:bg-accent transition-colors"
            title="Documentation"
          >
            <BookOpen className="w-4 h-4" />
          </Link>
          
          <a
            href="https://github.com/BastianMIllan/opencode.cash"
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 h-8 rounded-lg hidden sm:flex items-center justify-center hover:bg-accent transition-colors"
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
          
          {session && (
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-accent transition-colors"
              title="Settings"
            >
              <SettingsIcon className="w-4 h-4" />
            </button>
          )}

          {/* User Menu */}
          {session ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-accent transition-colors overflow-hidden"
                title={session.user?.name || 'Account'}
              >
                {session.user?.image ? (
                  <img 
                    src={session.user.image} 
                    alt={session.user.name || ''} 
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <User className="w-4 h-4" />
                )}
              </button>
              
              {showUserMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-56 bg-background border border-border rounded-xl shadow-xl z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-border">
                      <p className="font-medium truncate">{session.user?.name}</p>
                      <p className="text-sm text-muted truncate">{session.user?.email}</p>
                    </div>
                    <div className="p-2">
                      <button
                        onClick={handleSaveProject}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-accent transition-colors text-left"
                      >
                        <Save className="w-4 h-4" />
                        Save Project
                      </button>
                      <button
                        onClick={handleOpenProjects}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-accent transition-colors text-left"
                      >
                        <FolderOpen className="w-4 h-4" />
                        My Projects
                      </button>
                      <hr className="my-2 border-border" />
                      {activeProject && (
                        <button
                          onClick={() => { setShowUserMenu(false); handleToggleDiscovery() }}
                          disabled={discoveryToggling}
                          className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-accent transition-colors text-left"
                        >
                          {activeProject.isPublic ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          {discoveryToggling ? 'Updating...' : activeProject.isPublic ? 'Hide from Discover' : 'Go Live on Discover'}
                        </button>
                      )}
                      <Link
                        href="/discover"
                        onClick={() => setShowUserMenu(false)}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-accent transition-colors text-left"
                      >
                        <Compass className="w-4 h-4" />
                        Discover
                      </Link>
                      <hr className="my-2 border-border" />
                      <button 
                        onClick={() => signOut()}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-accent transition-colors text-left text-red-500"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-2 px-3 py-1.5 bg-foreground text-background rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Sign In
            </Link>
          )}
        </div>
      </header>

      {/* Main Content - Desktop */}
      <div className="flex-1 hidden md:flex overflow-hidden">
        {/* Left Sidebar - File Explorer */}
        {!sidebarCollapsed && (
          <div className="w-56 flex-shrink-0 border-r border-border flex flex-col">
            <FileExplorer />
            {/* Preview shortcut in sidebar */}
            {previewUrl && (
              <button
                onClick={() => setShowPreview(true)}
                className="mx-2 mb-2 flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-green-500/10 text-green-500 border border-green-500/20 hover:bg-green-500/20 transition-colors"
              >
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="font-medium">Preview</span>
                <span className="text-xs text-green-400/60 font-mono ml-auto">:{previewPort}</span>
              </button>
            )}
          </div>
        )}

        {/* Center - Chat */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 overflow-hidden">
            <Chat />
          </div>
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

      {/* Main Content - Mobile */}
      <div className="flex-1 flex flex-col md:hidden overflow-hidden">
        <div className="flex-1 overflow-hidden">
          {mobileTab === 'chat' && <Chat />}
          {mobileTab === 'files' && (
            <div className="h-full flex flex-col">
              <FileExplorer />
              {previewUrl && (
                <button
                  onClick={() => setShowPreview(true)}
                  className="mx-2 mb-2 flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-green-500/10 text-green-500 border border-green-500/20 hover:bg-green-500/20 transition-colors"
                >
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="font-medium">Preview</span>
                  <span className="text-xs text-green-400/60 font-mono ml-auto">:{previewPort}</span>
                </button>
              )}
            </div>
          )}
          {mobileTab === 'editor' && (
            currentFile ? <CodeEditor /> : (
              <div className="h-full flex items-center justify-center text-muted text-sm">
                <p>Select a file from Files tab to edit</p>
              </div>
            )
          )}
          {mobileTab === 'terminal' && <Terminal />}
        </div>

        {/* Bottom Tab Bar */}
        <div className="flex items-center border-t border-border bg-background safe-bottom">
          {[
            { id: 'chat' as const, icon: MessageSquare, label: 'Chat' },
            { id: 'files' as const, icon: Files, label: 'Files' },
            { id: 'editor' as const, icon: FileCode, label: 'Editor' },
            { id: 'terminal' as const, icon: TerminalIcon, label: 'Terminal' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setMobileTab(tab.id)}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 transition-colors ${
                mobileTab === tab.id
                  ? 'text-foreground'
                  : 'text-muted'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {isProjectsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsProjectsOpen(false)}
          />
          <div className="relative w-full max-w-2xl max-h-[90vh] rounded-2xl border border-border bg-background shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between border-b border-border px-4 sm:px-6 py-3 sm:py-4">
              <div>
                <h2 className="text-lg font-semibold">My Projects</h2>
                <p className="text-sm text-muted">
                  {activeProject ? (
                    <>Working on <span className="text-foreground font-medium">{activeProject.name}</span></>
                  ) : (
                    'Switch between your saved projects'
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setIsProjectsOpen(false); handleNewProject() }}
                  className="rounded-lg px-3 py-2 text-sm border border-border hover:bg-accent transition-colors flex items-center gap-2"
                >
                  <span>+</span> New Project
                </button>
                <button
                  onClick={() => setIsProjectsOpen(false)}
                  className="rounded-lg p-2 text-sm hover:bg-accent transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="max-h-[70vh] overflow-y-auto p-4">
              {projectError && (
                <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {projectError}
                </div>
              )}

              {projectsLoading ? (
                <div className="flex items-center justify-center py-12 text-sm text-muted">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading projects...
                </div>
              ) : projects.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border px-6 py-12 text-center">
                  <FolderOpen className="w-8 h-8 mx-auto text-muted mb-3" />
                  <p className="text-sm text-muted">No saved projects yet.</p>
                  <p className="text-xs text-muted mt-1">Save your current workspace to get started.</p>
                  <button
                    onClick={() => { setIsProjectsOpen(false); handleSaveProject() }}
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    <Save className="w-4 h-4" />
                    Save Current Project
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {projects.map((project) => {
                    const isActive = activeProject?.id === project.id
                    return (
                      <div
                        key={project.id}
                        className={`group flex items-center gap-4 rounded-xl border px-4 py-3 transition-colors cursor-pointer hover:bg-accent/50 ${
                          isActive
                            ? 'border-green-500/40 bg-green-500/5'
                            : 'border-border'
                        }`}
                        onClick={() => !isActive && handleLoadProject(project.id)}
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          isActive ? 'bg-green-500/20 text-green-500' : 'bg-accent text-muted'
                        }`}>
                          <FolderOpen className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate font-medium">{project.name}</p>
                            {isActive && (
                              <span className="flex-shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-500">
                                Active
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 text-xs text-muted">
                            Updated {new Date(project.updatedAt).toLocaleDateString()} at {new Date(project.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!isActive && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleLoadProject(project.id) }}
                              className="p-2 rounded-lg hover:bg-accent transition-colors text-muted hover:text-foreground"
                              title="Load project"
                            >
                              <Download className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteProject(project.id) }}
                            className="p-2 rounded-lg hover:bg-red-500/10 transition-colors text-muted hover:text-red-400"
                            title="Delete project"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {projects.length > 0 && (
              <div className="border-t border-border px-6 py-3 flex items-center justify-between">
                <span className="text-xs text-muted">{projects.length} project{projects.length !== 1 ? 's' : ''}</span>
                <button
                  onClick={() => { setIsProjectsOpen(false); handleSaveProject() }}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-foreground text-background hover:opacity-90 transition-opacity"
                >
                  <Save className="w-3 h-3" />
                  {activeProject ? 'Save Changes' : 'Save as New'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Settings Modal */}
      <Settings />

      {/* Floating Preview Window */}
      <Preview />
    </div>
  )
}
