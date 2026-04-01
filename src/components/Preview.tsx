'use client'

import { useStore } from '@/store'
import { X, ExternalLink, RefreshCw, Maximize2, Minimize2, Minus, GripHorizontal } from 'lucide-react'
import { useState, useRef, useCallback, useEffect } from 'react'
import Link from 'next/link'

type WindowState = 'normal' | 'minimized' | 'fullscreen'

export default function Preview() {
  const { previewUrl, previewPort, showPreview, setShowPreview } = useStore()
  const [windowState, setWindowState] = useState<WindowState>('normal')
  const [key, setKey] = useState(0)
  const [position, setPosition] = useState({ x: -1, y: -1 })
  const [size, setSize] = useState({ w: 520, h: 400 })
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const dragOffset = useRef({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  // Initialize position to bottom-right on first render
  useEffect(() => {
    if (position.x === -1 && position.y === -1) {
      setPosition({
        x: window.innerWidth - size.w - 24,
        y: window.innerHeight - size.h - 24
      })
    }
  }, [position, size])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (windowState === 'fullscreen') return
    setIsDragging(true)
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    }
    e.preventDefault()
  }, [position, windowState])

  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    if (windowState === 'fullscreen') return
    setIsResizing(true)
    dragOffset.current = {
      x: e.clientX,
      y: e.clientY
    }
    e.preventDefault()
    e.stopPropagation()
  }, [windowState])

  useEffect(() => {
    if (!isDragging && !isResizing) return

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: Math.max(0, Math.min(window.innerWidth - 200, e.clientX - dragOffset.current.x)),
          y: Math.max(0, Math.min(window.innerHeight - 60, e.clientY - dragOffset.current.y))
        })
      }
      if (isResizing) {
        const dx = e.clientX - dragOffset.current.x
        const dy = e.clientY - dragOffset.current.y
        setSize(prev => ({
          w: Math.max(320, prev.w + dx),
          h: Math.max(240, prev.h + dy)
        }))
        dragOffset.current = { x: e.clientX, y: e.clientY }
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      setIsResizing(false)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, isResizing])

  if (!showPreview || !previewUrl) return null

  // Minimized: small pill at bottom-right
  if (windowState === 'minimized') {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setWindowState('normal')}
          className="flex items-center gap-2 px-4 py-2 bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl hover:bg-neutral-800 transition-colors"
        >
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm font-medium text-white">Preview</span>
          <span className="text-xs text-neutral-400 font-mono">:{previewPort}</span>
        </button>
      </div>
    )
  }

  // Fullscreen
  if (windowState === 'fullscreen') {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-neutral-900">
        <BrowserChrome
          port={previewPort}
          onRefresh={() => setKey(k => k + 1)}
          onMinimize={() => setWindowState('minimized')}
          onMaximize={() => setWindowState('normal')}
          onClose={() => setShowPreview(false)}
          isFullscreen
          onDragStart={handleMouseDown}
        />
        <div className="flex-1">
          <iframe
            key={key}
            src={previewUrl}
            className="w-full h-full border-0 bg-white"
            title="Preview"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
          />
        </div>
      </div>
    )
  }

  // Normal floating window
  return (
    <div
      ref={containerRef}
      className="fixed z-50 flex flex-col rounded-xl overflow-hidden shadow-2xl border border-neutral-700 bg-neutral-900"
      style={{
        left: position.x,
        top: position.y,
        width: size.w,
        height: size.h,
        userSelect: isDragging || isResizing ? 'none' : 'auto'
      }}
    >
      <BrowserChrome
        port={previewPort}
        onRefresh={() => setKey(k => k + 1)}
        onMinimize={() => setWindowState('minimized')}
        onMaximize={() => setWindowState('fullscreen')}
        onClose={() => setShowPreview(false)}
        isFullscreen={false}
        onDragStart={handleMouseDown}
      />
      <div className="flex-1 relative">
        <iframe
          key={key}
          src={previewUrl}
          className="w-full h-full border-0 bg-white"
          title="Preview"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
          style={{ pointerEvents: isDragging || isResizing ? 'none' : 'auto' }}
        />
      </div>
      {/* Resize handle */}
      <div
        onMouseDown={handleResizeMouseDown}
        className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
        style={{ background: 'linear-gradient(135deg, transparent 50%, rgba(255,255,255,0.15) 50%)' }}
      />
    </div>
  )
}

// Browser chrome bar component
function BrowserChrome({
  port,
  onRefresh,
  onMinimize,
  onMaximize,
  onClose,
  isFullscreen,
  onDragStart
}: {
  port: number | null
  onRefresh: () => void
  onMinimize: () => void
  onMaximize: () => void
  onClose: () => void
  isFullscreen: boolean
  onDragStart: (e: React.MouseEvent) => void
}) {
  return (
    <div className="flex flex-col flex-shrink-0">
      {/* Title bar with traffic lights */}
      <div
        className="flex items-center justify-between px-3 py-2 bg-neutral-800 cursor-move"
        onMouseDown={onDragStart}
      >
        <div className="flex items-center gap-1.5">
          <button onClick={onClose} className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-400 transition-colors" title="Close" />
          <button onClick={onMinimize} className="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-400 transition-colors" title="Minimize" />
          <button onClick={onMaximize} className="w-3 h-3 rounded-full bg-green-500 hover:bg-green-400 transition-colors" title={isFullscreen ? 'Restore' : 'Fullscreen'} />
        </div>

        <div className="flex items-center gap-2 flex-1 mx-4">
          <div className="flex items-center gap-2 px-3 py-1 bg-neutral-700/60 rounded-md flex-1 max-w-sm mx-auto">
            <span className="text-[10px] text-green-400">●</span>
            <span className="text-xs font-mono text-neutral-400 truncate">localhost:{port}</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button onClick={onRefresh} className="p-1 hover:bg-neutral-700 rounded transition-colors text-neutral-400 hover:text-white" title="Refresh">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <Link href="/preview" target="_blank" className="p-1 hover:bg-neutral-700 rounded transition-colors text-neutral-400 hover:text-white" title="Open in new tab">
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  )
}
