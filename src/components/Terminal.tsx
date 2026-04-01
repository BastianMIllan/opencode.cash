'use client'

import { useEffect, useRef, useCallback } from 'react'
import { Terminal as XTerm } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { useStore } from '@/store'
import { spawnShell, bootWebContainer } from '@/lib/webcontainer'
import '@xterm/xterm/css/xterm.css'

export default function Terminal() {
  const terminalRef = useRef<HTMLDivElement>(null)
  const xtermRef = useRef<XTerm | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const shellRef = useRef<{ write: (data: string) => void; resize: (cols: number, rows: number) => void } | null>(null)
  const { webcontainer, isReady } = useStore()
  const initializedRef = useRef(false)

  const initTerminal = useCallback(async () => {
    if (!terminalRef.current || initializedRef.current) return
    initializedRef.current = true

    // Create xterm instance
    const xterm = new XTerm({
      theme: {
        background: '#000000',
        foreground: '#ffffff',
        cursor: '#ffffff',
        cursorAccent: '#000000',
        selectionBackground: '#ffffff40',
        black: '#000000',
        red: '#ff5555',
        green: '#50fa7b',
        yellow: '#f1fa8c',
        blue: '#bd93f9',
        magenta: '#ff79c6',
        cyan: '#8be9fd',
        white: '#f8f8f2',
        brightBlack: '#6272a4',
        brightRed: '#ff6e6e',
        brightGreen: '#69ff94',
        brightYellow: '#ffffa5',
        brightBlue: '#d6acff',
        brightMagenta: '#ff92df',
        brightCyan: '#a4ffff',
        brightWhite: '#ffffff'
      },
      fontFamily: '"JetBrains Mono", Consolas, monospace',
      fontSize: 14,
      lineHeight: 1.2,
      cursorBlink: true,
      cursorStyle: 'block',
      allowProposedApi: true
    })

    const fitAddon = new FitAddon()
    xterm.loadAddon(fitAddon)
    xterm.open(terminalRef.current)
    fitAddon.fit()

    xtermRef.current = xterm
    fitAddonRef.current = fitAddon

    // Welcome message
    xterm.writeln('\x1b[1;37m╔══════════════════════════════════════════════════════════╗\x1b[0m')
    xterm.writeln('\x1b[1;37m║\x1b[0m                    \x1b[1;36mOpenCode\x1b[0m                              \x1b[1;37m║\x1b[0m')
    xterm.writeln('\x1b[1;37m║\x1b[0m       Use any LLM — OpenAI, Gemini, DeepSeek, Ollama      \x1b[1;37m║\x1b[0m')
    xterm.writeln('\x1b[1;37m╚══════════════════════════════════════════════════════════╝\x1b[0m')
    xterm.writeln('')
    xterm.writeln('\x1b[90mBooting WebContainer...\x1b[0m')

    try {
      const wc = await bootWebContainer()
      
      xterm.writeln('\x1b[32m✓ WebContainer ready\x1b[0m')
      xterm.writeln('')

      // Spawn shell
      const shell = await spawnShell(wc, (data: string) => {
        xterm.write(data)
      })
      shellRef.current = shell

      // Handle terminal input
      xterm.onData((data) => {
        shell.write(data)
      })

      // Handle resize
      xterm.onResize(({ cols, rows }) => {
        shell.resize(cols, rows)
      })

    } catch (error) {
      xterm.writeln(`\x1b[31m✗ Failed to boot: ${error instanceof Error ? error.message : 'Unknown error'}\x1b[0m`)
      xterm.writeln('')
      xterm.writeln('\x1b[33mNote: WebContainers require cross-origin isolation headers.\x1b[0m')
      xterm.writeln('\x1b[33mMake sure to add the required headers to your server.\x1b[0m')
    }

    // Handle window resize
    const handleResize = () => {
      if (fitAddonRef.current) {
        fitAddonRef.current.fit()
      }
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  useEffect(() => {
    initTerminal()
    
    return () => {
      if (xtermRef.current) {
        xtermRef.current.dispose()
        xtermRef.current = null
      }
      initializedRef.current = false
    }
  }, [initTerminal])

  // Re-fit on container resize
  useEffect(() => {
    const observer = new ResizeObserver(() => {
      if (fitAddonRef.current) {
        fitAddonRef.current.fit()
      }
    })
    
    if (terminalRef.current) {
      observer.observe(terminalRef.current)
    }
    
    return () => observer.disconnect()
  }, [])

  return (
    <div 
      ref={terminalRef} 
      className="w-full h-full bg-black p-2"
      style={{ minHeight: '300px' }}
    />
  )
}
