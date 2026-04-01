'use client'

import { useEffect, useState } from 'react'
import { useStore } from '@/store'
import { RefreshCw, ArrowLeft, ExternalLink, Maximize2, Copy, Check } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

export default function PreviewPage() {
  const { previewUrl, previewPort } = useStore()
  const [key, setKey] = useState(0)
  const [copied, setCopied] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleCopyUrl = () => {
    if (previewUrl) {
      navigator.clipboard.writeText(previewUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (!mounted) {
    return (
      <div className="h-screen flex items-center justify-center bg-black">
        <Image src="/logopng.png" alt="OpenCode" width={48} height={48} className="rounded-xl animate-pulse" />
      </div>
    )
  }

  if (!previewUrl) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-black text-white gap-6">
        <Image src="/logopng.png" alt="OpenCode" width={64} height={64} className="rounded-2xl" />
        <div className="text-center space-y-2">
          <h1 className="text-xl font-semibold">No preview available</h1>
          <p className="text-neutral-400 text-sm max-w-md">
            Go back to the editor and ask the AI to build something. The preview will appear here automatically when your project is running.
          </p>
        </div>
        <Link
          href="/app"
          className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg font-medium text-sm hover:bg-neutral-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Editor
        </Link>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-black">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-neutral-900 border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <Link
            href="/app"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Editor</span>
          </Link>

          <div className="h-5 w-px bg-neutral-700" />

          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm text-neutral-300 font-medium">Live Preview</span>
          </div>
        </div>

        {/* URL bar */}
        <div className="flex-1 max-w-xl mx-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-800 rounded-lg border border-neutral-700">
            <span className="text-xs text-green-400 font-mono">●</span>
            <span className="text-xs font-mono text-neutral-400 truncate flex-1">
              localhost:{previewPort}
            </span>
            <button
              onClick={handleCopyUrl}
              className="p-1 hover:bg-neutral-700 rounded transition-colors"
              title="Copy URL"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 text-neutral-500" />}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setKey(k => k + 1)}
            className="p-2 hover:bg-neutral-800 rounded-lg transition-colors text-neutral-400 hover:text-white"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 hover:bg-neutral-800 rounded-lg transition-colors text-neutral-400 hover:text-white"
            title="Open in new tab"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Iframe - full page */}
      <div className="flex-1">
        <iframe
          key={key}
          src={previewUrl}
          className="w-full h-full border-0 bg-white"
          title="Project Preview"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
        />
      </div>
    </div>
  )
}
