'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChevronRight, ChevronDown, File, Folder, FolderOpen, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { useStore, FileNode } from '@/store'
import { listDirectory, readFile, deleteFile, createDirectory, getWebContainer } from '@/lib/webcontainer'

interface FileTreeItemProps {
  node: FileNode
  depth: number
  onSelect: (path: string) => void
  selectedPath: string | null
  onDelete: (path: string) => void
}

function FileTreeItem({ node, depth, onSelect, selectedPath, onDelete }: FileTreeItemProps) {
  const [isOpen, setIsOpen] = useState(false)
  const isSelected = selectedPath === node.path

  const handleClick = () => {
    if (node.type === 'directory') {
      setIsOpen(!isOpen)
    } else {
      onSelect(node.path)
    }
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm(`Delete ${node.name}?`)) {
      onDelete(node.path)
    }
  }

  return (
    <div>
      <div
        className={`group flex items-center gap-1 px-2 py-1 cursor-pointer hover:bg-accent transition-colors ${
          isSelected ? 'bg-accent' : ''
        }`}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={handleClick}
      >
        {node.type === 'directory' ? (
          <>
            {isOpen ? (
              <ChevronDown className="w-3 h-3 text-muted flex-shrink-0" />
            ) : (
              <ChevronRight className="w-3 h-3 text-muted flex-shrink-0" />
            )}
            {isOpen ? (
              <FolderOpen className="w-4 h-4 text-muted flex-shrink-0" />
            ) : (
              <Folder className="w-4 h-4 text-muted flex-shrink-0" />
            )}
          </>
        ) : (
          <>
            <span className="w-3" />
            <File className="w-4 h-4 text-muted flex-shrink-0" />
          </>
        )}
        <span className="text-sm truncate flex-1">{node.name}</span>
        <button
          onClick={handleDelete}
          className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-all"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
      
      {node.type === 'directory' && isOpen && node.children && (
        <div>
          {node.children.map((child: FileNode) => (
            <FileTreeItem
              key={child.path}
              node={child}
              depth={depth + 1}
              onSelect={onSelect}
              selectedPath={selectedPath}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function FileExplorer() {
  const { files, setFiles, currentFile, setCurrentFile, setFileContent, webcontainer, isReady, setRightPanelCollapsed, addOpenFile } = useStore()
  const [isLoading, setIsLoading] = useState(false)
  const [newItemName, setNewItemName] = useState('')
  const [isCreating, setIsCreating] = useState<'file' | 'folder' | null>(null)

  const refreshFiles = useCallback(async () => {
    if (!webcontainer || !isReady) return
    
    setIsLoading(true)
    try {
      const tree = await listDirectory(webcontainer)
      setFiles(tree)
    } catch (error) {
      console.error('Failed to list directory:', error)
    }
    setIsLoading(false)
  }, [webcontainer, isReady, setFiles])

  useEffect(() => {
    if (isReady) {
      refreshFiles()
    }
  }, [isReady, refreshFiles])

  const handleSelectFile = async (path: string) => {
    if (!webcontainer) return
    
    setCurrentFile(path)
    addOpenFile(path)
    setRightPanelCollapsed(false)
    const content = await readFile(webcontainer, path)
    setFileContent(content)
  }

  const handleDeleteFile = async (path: string) => {
    if (!webcontainer) return
    
    try {
      await deleteFile(webcontainer, path)
      if (currentFile === path) {
        setCurrentFile(null)
        setFileContent('')
      }
      await refreshFiles()
    } catch (error) {
      console.error('Failed to delete:', error)
    }
  }

  const handleCreateNew = async () => {
    if (!webcontainer || !newItemName.trim()) return
    
    try {
      const path = `/${newItemName.trim()}`
      if (isCreating === 'folder') {
        await createDirectory(webcontainer, path)
      } else {
        const wc = getWebContainer()
        if (wc) {
          await wc.fs.writeFile(path, '')
        }
      }
      await refreshFiles()
      setNewItemName('')
      setIsCreating(null)
    } catch (error) {
      console.error('Failed to create:', error)
    }
  }

  return (
    <div className="h-full flex flex-col border-r border-border bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <span className="text-xs font-medium text-muted uppercase tracking-wide">Files</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsCreating(isCreating === 'file' ? null : 'file')}
            className="p-1 hover:bg-accent rounded transition-colors"
            title="New file"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsCreating(isCreating === 'folder' ? null : 'folder')}
            className="p-1 hover:bg-accent rounded transition-colors"
            title="New folder"
          >
            <Folder className="w-4 h-4" />
          </button>
          <button
            onClick={refreshFiles}
            disabled={isLoading}
            className="p-1 hover:bg-accent rounded transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* New item input */}
      {isCreating && (
        <div className="px-2 py-2 border-b border-border">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateNew()
                if (e.key === 'Escape') {
                  setIsCreating(null)
                  setNewItemName('')
                }
              }}
              placeholder={isCreating === 'folder' ? 'Folder name...' : 'File name...'}
              className="flex-1 text-sm px-2 py-1 border border-border rounded bg-background focus:border-foreground transition-colors"
              autoFocus
            />
          </div>
        </div>
      )}

      {/* File tree */}
      <div className="flex-1 overflow-y-auto py-1">
        {!isReady ? (
          <div className="flex items-center justify-center h-full">
            <span className="text-sm text-muted">Booting...</span>
          </div>
        ) : files.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <span className="text-sm text-muted">No files</span>
          </div>
        ) : (
          files.map((node: FileNode) => (
            <FileTreeItem
              key={node.path}
              node={node}
              depth={0}
              onSelect={handleSelectFile}
              selectedPath={currentFile}
              onDelete={handleDeleteFile}
            />
          ))
        )}
      </div>
    </div>
  )
}
