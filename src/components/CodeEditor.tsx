'use client'

import { useCallback, useEffect } from 'react'
import Editor from '@monaco-editor/react'
import { useStore } from '@/store'
import { writeFile, getWebContainer } from '@/lib/webcontainer'
import { X, Save } from 'lucide-react'

function getLanguageFromPath(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase()
  const languageMap: Record<string, string> = {
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    py: 'python',
    rb: 'ruby',
    go: 'go',
    rs: 'rust',
    java: 'java',
    cpp: 'cpp',
    c: 'c',
    h: 'c',
    hpp: 'cpp',
    css: 'css',
    scss: 'scss',
    less: 'less',
    html: 'html',
    htm: 'html',
    xml: 'xml',
    json: 'json',
    yaml: 'yaml',
    yml: 'yaml',
    md: 'markdown',
    sql: 'sql',
    sh: 'shell',
    bash: 'shell',
    zsh: 'shell',
    dockerfile: 'dockerfile',
    gitignore: 'plaintext',
    env: 'plaintext',
    txt: 'plaintext',
  }
  return languageMap[ext || ''] || 'plaintext'
}

export default function CodeEditor() {
  const { currentFile, fileContent, setFileContent, setCurrentFile, webcontainer } = useStore()
  
  const handleChange = useCallback((value: string | undefined) => {
    if (value !== undefined) {
      setFileContent(value)
    }
  }, [setFileContent])

  const handleSave = useCallback(async () => {
    if (!currentFile || !webcontainer) return
    
    try {
      await writeFile(webcontainer, currentFile, fileContent)
    } catch (error) {
      console.error('Failed to save:', error)
    }
  }, [currentFile, fileContent, webcontainer])

  // Keyboard shortcut for save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleSave])

  if (!currentFile) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="text-4xl">📝</div>
          <p className="text-muted">Select a file to edit</p>
        </div>
      </div>
    )
  }

  const language = getLanguageFromPath(currentFile)
  const fileName = currentFile.split('/').pop()

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Tab bar */}
      <div className="flex items-center justify-between px-2 py-1 border-b border-border bg-accent/50">
        <div className="flex items-center gap-2">
          <span className="text-sm font-mono">{fileName}</span>
          <span className="text-xs text-muted">{currentFile}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleSave}
            className="flex items-center gap-1 px-2 py-1 text-xs hover:bg-accent rounded transition-colors"
            title="Save (Ctrl+S)"
          >
            <Save className="w-3 h-3" />
            Save
          </button>
          <button
            onClick={() => {
              setCurrentFile(null)
              setFileContent('')
            }}
            className="p-1 hover:bg-accent rounded transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1">
        <Editor
          height="100%"
          language={language}
          value={fileContent}
          onChange={handleChange}
          theme="vs-dark"
          options={{
            fontSize: 14,
            fontFamily: '"JetBrains Mono", Consolas, monospace',
            minimap: { enabled: false },
            scrollbar: {
              verticalScrollbarSize: 8,
              horizontalScrollbarSize: 8,
            },
            lineNumbers: 'on',
            renderLineHighlight: 'line',
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            smoothScrolling: true,
            padding: { top: 10, bottom: 10 },
            wordWrap: 'on',
            tabSize: 2,
            insertSpaces: true,
            automaticLayout: true,
          }}
        />
      </div>
    </div>
  )
}
