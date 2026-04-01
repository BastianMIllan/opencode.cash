'use client'

import { useStore } from '@/store'
import { X, ExternalLink, RefreshCw, Maximize2, Minimize2 } from 'lucide-react'
import { useState } from 'react'

export default function Preview() {
  const { previewUrl, previewPort, showPreview, setShowPreview } = useStore()
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [key, setKey] = useState(0) // For refreshing iframe

  if (!showPreview || !previewUrl) return null

  const handleRefresh = () => {
    setKey(k => k + 1)
  }

  const handleOpenExternal = () => {
    window.open(previewUrl, '_blank')
  }

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50' : 'border-t border-border'} bg-background flex flex-col`}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-accent/30">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm font-medium">Preview</span>
          <span className="text-xs text-muted font-mono">:{previewPort}</span>
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={handleRefresh}
            className="p-1.5 hover:bg-accent rounded transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleOpenExternal}
            className="p-1.5 hover:bg-accent rounded transition-colors"
            title="Open in new tab"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 hover:bg-accent rounded transition-colors"
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setShowPreview(false)}
            className="p-1.5 hover:bg-accent rounded transition-colors"
            title="Close preview"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* URL bar */}
      <div className="px-3 py-1.5 border-b border-border bg-background">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-accent rounded-lg">
          <span className="text-xs font-mono text-muted truncate flex-1">{previewUrl}</span>
        </div>
      </div>
      
      {/* Iframe */}
      <div className={`flex-1 ${isFullscreen ? 'h-full' : 'h-80'}`}>
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
