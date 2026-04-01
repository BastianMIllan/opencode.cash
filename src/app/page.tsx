'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { 
  Terminal, Code, FileText, Zap, Globe, Lock, 
  ChevronRight, Github, Play, ArrowRight, 
  Sparkles, Box, Command, Cpu, Moon, Sun,
  Check, ExternalLink, BookOpen, Unlock, Users, GitBranch, Compass
} from 'lucide-react'

// X (Twitter) logo component
function XLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

const providers = [
  { name: 'OpenAI', models: 'GPT-4o, GPT-4o-mini, o1' },
  { name: 'Anthropic', models: 'Claude 4, Claude 3.5 Sonnet' },
  { name: 'DeepSeek', models: 'DeepSeek-V3, Coder' },
  { name: 'Google', models: 'Gemini 2.0 Flash/Pro' },
  { name: 'Groq', models: 'Llama 3.3 70B' },
  { name: 'Mistral', models: 'Mistral Large, Codestral' },
  { name: 'Together AI', models: 'Llama, Qwen, Mixtral' },
  { name: 'OpenRouter', models: '200+ models' },
  { name: 'Ollama', models: 'Local models (free)' },
]

const features = [
  {
    icon: Terminal,
    title: 'Full Terminal Access',
    description: 'Run any command — npm, git, node, python. The AI executes real shell commands in a sandboxed environment.'
  },
  {
    icon: FileText,
    title: 'File System Control',
    description: 'Read, write, and edit files. Create entire projects from scratch. The AI sees and modifies your code directly.'
  },
  {
    icon: Code,
    title: 'Intelligent Code Editing',
    description: 'Targeted edits with search and replace. No more copy-pasting — the AI makes precise changes to your codebase.'
  },
  {
    icon: Globe,
    title: 'Live Preview',
    description: 'See your work instantly. When you run a server, a live preview appears right in the app.'
  },
  {
    icon: Zap,
    title: 'Multi-Step Reasoning',
    description: 'The AI plans, executes, and iterates. It reads files, makes changes, runs tests, and fixes errors automatically.'
  },
  {
    icon: Lock,
    title: 'Your Keys, Your Data',
    description: 'API keys stored locally in your browser. We never see or store your credentials. Full privacy.'
  },
]

const tools = [
  { name: 'bash', desc: 'Execute terminal commands' },
  { name: 'read_file', desc: 'Read file contents' },
  { name: 'write_file', desc: 'Create or overwrite files' },
  { name: 'edit_file', desc: 'Make targeted edits' },
  { name: 'glob', desc: 'Find files by pattern' },
  { name: 'grep', desc: 'Search in files' },
  { name: 'list_directory', desc: 'Browse folders' },
  { name: 'think', desc: 'Step-by-step reasoning' },
]

function AnimatedGradient() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-white/5 to-transparent rounded-full blur-3xl animate-pulse" />
      <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-white/5 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
    </div>
  )
}

function CodeDemo() {
  const [step, setStep] = useState(0)
  
  useEffect(() => {
    const interval = setInterval(() => {
      setStep(s => (s + 1) % 4)
    }, 2500)
    return () => clearInterval(interval)
  }, [])

  const steps = [
    { tool: 'think', text: 'Planning the project structure...' },
    { tool: 'write_file', text: 'Creating package.json' },
    { tool: 'write_file', text: 'Writing App.jsx component' },
    { tool: 'bash', text: 'npm install && npm run dev' },
  ]

  return (
    <div className="bg-black/50 backdrop-blur-xl rounded-2xl border border-white/10 p-6 font-mono text-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-3 h-3 rounded-full bg-red-500" />
        <div className="w-3 h-3 rounded-full bg-yellow-500" />
        <div className="w-3 h-3 rounded-full bg-green-500" />
        <span className="ml-2 text-white/50 text-xs">OpenCode</span>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded bg-white/10 flex items-center justify-center flex-shrink-0">
            <span className="text-xs text-white">You</span>
          </div>
          <p className="text-white/80">Build a React todo app with Tailwind</p>
        </div>
        
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded bg-white flex items-center justify-center flex-shrink-0">
            <span className="text-xs text-black font-bold">O</span>
          </div>
          <div className="space-y-2 flex-1">
            {steps.slice(0, step + 1).map((s, i) => (
              <div 
                key={i} 
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-500 ${
                  i === step 
                    ? 'bg-white/10 border-white/20' 
                    : 'bg-white/5 border-white/5'
                }`}
              >
                <Terminal className="w-4 h-4 text-green-400" />
                <span className="text-white/60 text-xs">{s.tool}</span>
                <span className="text-white/40">→</span>
                <span className="text-white/80 text-xs">{s.text}</span>
                {i < step && <Check className="w-4 h-4 text-green-400 ml-auto" />}
                {i === step && <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse ml-auto" />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LandingPage() {
  const [isDark, setIsDark] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme === 'light') {
      setIsDark(false)
      document.documentElement.classList.remove('dark')
    } else {
      document.documentElement.classList.add('dark')
    }
  }, [])

  const toggleTheme = () => {
    setIsDark(!isDark)
    if (!isDark) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center">
          <span className="text-black font-bold text-xl">O</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="w-full px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <Image src="/logo.png" alt="OpenCode" width={32} height={32} className="rounded-xl sm:w-10 sm:h-10 dark:invert-0 invert" />
            <span className="font-semibold text-lg sm:text-xl">OpenCode</span>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/discover"
              className="flex items-center gap-2 text-muted hover:text-foreground transition-colors"
            >
              <Compass className="w-5 h-5" />
              <span className="hidden sm:inline">Discover</span>
            </Link>

            <Link
              href="/docs"
              className="flex items-center gap-2 text-muted hover:text-foreground transition-colors"
            >
              <BookOpen className="w-5 h-5" />
              <span className="hidden sm:inline">Docs</span>
            </Link>
            
            <a 
              href="https://github.com/BastianMIllan/opencode.cash"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-2 text-muted hover:text-foreground transition-colors"
            >
              <Github className="w-5 h-5" />
              <span className="hidden sm:inline">Source</span>
            </a>
            
            <a 
              href="https://x.com/opencodecash"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-2 text-muted hover:text-foreground transition-colors"
            >
              <XLogo className="w-4 h-4" />
              <span className="hidden sm:inline">@opencodecash</span>
            </a>
            
            <button
              onClick={toggleTheme}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center hover:bg-accent transition-colors"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            
            <Link
              href="/app"
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-foreground text-background rounded-xl text-sm sm:text-base font-medium hover:opacity-90 transition-opacity"
            >
              <span className="hidden sm:inline">Launch App</span>
              <span className="sm:hidden">Launch</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 min-h-screen flex items-center justify-center pt-20 overflow-hidden">
        <AnimatedGradient />
        
        <div className="max-w-7xl mx-auto px-6 py-20 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent border border-border rounded-full text-sm">
              <Unlock className="w-4 h-4" />
              <span>Claude Code leaked. We rebuilt it.</span>
            </div>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight">
              The agent they
              <br />
              didn't want you
              <br />
              <span className="text-muted">to have</span>
            </h1>
            
            <p className="text-xl text-muted max-w-lg">
              Anthropic built Claude Code for $200/month. Someone leaked the architecture. 
              We made it free, open source, and compatible with <strong className="text-foreground">any LLM</strong>.
            </p>
            
            <div className="flex flex-wrap gap-4">
              <Link
                href="/app"
                className="flex items-center gap-3 px-8 py-4 bg-foreground text-background rounded-2xl font-medium text-lg hover:opacity-90 transition-opacity"
              >
                <Play className="w-5 h-5" />
                Start Building
              </Link>
              
              <a
                href="https://github.com/BastianMIllan/opencode.cash"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-8 py-4 border border-border rounded-2xl font-medium text-lg hover:bg-accent transition-colors"
              >
                <Github className="w-5 h-5" />
                View Source
              </a>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 pt-4 text-sm text-muted">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span>No sign-up required</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span>Bring your own API key</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span>100% client-side</span>
              </div>
            </div>
          </div>
          
          <div className="hidden lg:block">
            <CodeDemo />
          </div>
        </div>
        
        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronRight className="w-6 h-6 rotate-90 text-muted" />
        </div>
      </section>

      {/* The Story Section */}
      <section className="py-32 border-t border-border bg-gradient-to-b from-accent/30 to-transparent">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent rounded-full text-sm mb-6">
              <BookOpen className="w-4 h-4" />
              <span>The Story</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold mb-6">
              How we got here
            </h2>
          </div>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-8 top-0 bottom-0 w-px bg-border hidden md:block" />
            
            <div className="space-y-12">
              {/* Event 1 */}
              <div className="relative flex gap-8 items-start">
                <div className="hidden md:flex w-16 h-16 rounded-2xl bg-foreground items-center justify-center flex-shrink-0 z-10">
                  <Unlock className="w-8 h-8 text-background" />
                </div>
                <div className="flex-1 p-8 rounded-3xl border border-border bg-background">
                  <div className="text-sm text-muted mb-2">The Leak</div>
                  <h3 className="text-2xl font-bold mb-4">Claude Code's architecture exposed</h3>
                  <p className="text-muted leading-relaxed">
                    In early 2025, Anthropic released Claude Code — a revolutionary AI coding agent 
                    that could actually execute code, manage files, and run terminal commands. 
                    It was locked to Claude models only. Then, someone reverse-engineered the tool 
                    definitions and agentic loop architecture. The secret was out: Claude Code's power 
                    came from a clever system of tool calls, not magic.
                  </p>
                </div>
              </div>

              {/* Event 2 */}
              <div className="relative flex gap-8 items-start">
                <div className="hidden md:flex w-16 h-16 rounded-2xl bg-foreground items-center justify-center flex-shrink-0 z-10">
                  <GitBranch className="w-8 h-8 text-background" />
                </div>
                <div className="flex-1 p-8 rounded-3xl border border-border bg-background">
                  <div className="text-sm text-muted mb-2">OpenClaude</div>
                  <h3 className="text-2xl font-bold mb-4">The community rebuilt it</h3>
                  <p className="text-muted leading-relaxed mb-4">
                    The <a href="https://github.com/BastianMIllan/opencode.cash" target="_blank" rel="noopener noreferrer" className="text-foreground underline hover:no-underline">OpenClaude repository</a> emerged — 
                    a faithful recreation of Claude Code that works with any OpenAI-compatible API. 
                    Same tools (Bash, FileRead, FileWrite, Edit, Glob, Grep), same agentic loop, 
                    same multi-step reasoning. But now you could use it with GPT-4, DeepSeek, 
                    Llama, Mistral — any model that supports function calling.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {['Bash', 'FileRead', 'FileWrite', 'Edit', 'Glob', 'Grep', 'Think'].map(tool => (
                      <span key={tool} className="px-3 py-1 bg-accent rounded-full text-xs font-mono">{tool}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Event 3 */}
              <div className="relative flex gap-8 items-start">
                <div className="hidden md:flex w-16 h-16 rounded-2xl bg-foreground items-center justify-center flex-shrink-0 z-10">
                  <Users className="w-8 h-8 text-background" />
                </div>
                <div className="flex-1 p-8 rounded-3xl border border-border bg-background">
                  <div className="text-sm text-muted mb-2">OpenCode</div>
                  <h3 className="text-2xl font-bold mb-4">We made it accessible to everyone</h3>
                  <p className="text-muted leading-relaxed">
                    OpenClaude was powerful, but it required CLI setup, environment configuration, 
                    and technical know-how. We took that codebase and built <strong className="text-foreground">OpenCode</strong> — 
                    a web app where anyone can use the full agentic experience. Just add your API key 
                    and start building. The AI writes code, runs commands, creates files, and iterates 
                    until your project works. All in your browser via WebContainers. No installation. 
                    No sign-up. Full power.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-16 text-center">
            <a
              href="https://github.com/BastianMIllan/opencode.cash"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-muted hover:text-foreground transition-colors"
            >
              <Github className="w-5 h-5" />
              <span>View the OpenClaude repository</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 border-t border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl sm:text-5xl font-bold mb-6">
              Everything Claude Code does
              <br />
              <span className="text-muted">with any model</span>
            </h2>
            <p className="text-xl text-muted max-w-2xl mx-auto">
              Full agentic capabilities — not just chat. The AI can read your codebase, 
              make changes, run commands, and iterate until it works.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <div 
                key={i}
                className="group p-8 rounded-3xl border border-border bg-accent/30 hover:bg-accent/50 transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-2xl bg-foreground/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tools Section */}
      <section className="py-32 border-t border-border bg-accent/20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl sm:text-5xl font-bold mb-6">
                Real tools,
                <br />
                real execution
              </h2>
              <p className="text-xl text-muted mb-8">
                Not a simulation. Every tool call executes in a real WebContainer — 
                a full Node.js environment running in your browser.
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                {tools.map((tool, i) => (
                  <div 
                    key={i}
                    className="flex items-center gap-3 p-4 rounded-xl bg-background border border-border"
                  >
                    <Command className="w-5 h-5 text-muted" />
                    <div>
                      <div className="font-mono text-sm font-medium">{tool.name}</div>
                      <div className="text-xs text-muted">{tool.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-3xl blur-3xl" />
              <div className="relative bg-black rounded-3xl p-8 border border-white/10">
                <pre className="text-sm text-white/80 overflow-x-auto">
                  <code>{`// AI executes real commands
> npm init -y
> npm install express
> cat index.js

const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(3000);

> node index.js
Server running on port 3000 ✓`}</code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Providers Section */}
      <section className="py-32 border-t border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-6">
              Works with any LLM
            </h2>
            <p className="text-xl text-muted max-w-2xl mx-auto">
              OpenAI, DeepSeek, Groq, Together, OpenRouter, or run locally with Ollama.
              Any OpenAI-compatible API works.
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {providers.map((provider, i) => (
              <div 
                key={i}
                className="p-6 rounded-2xl border border-border bg-accent/30 text-center hover:border-foreground/30 transition-colors"
              >
                <div className="font-semibold mb-1">{provider.name}</div>
                <div className="text-sm text-muted">{provider.models}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-32 border-t border-border bg-accent/20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-6">
              How it works
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Add Your API Key',
                description: 'Bring your own key from OpenAI, DeepSeek, Groq, or any compatible provider. Stored locally in your browser.',
                icon: Lock
              },
              {
                step: '02',
                title: 'Describe What to Build',
                description: 'Tell the AI what you want — a website, API, tool, anything. It will plan and execute the work.',
                icon: Sparkles
              },
              {
                step: '03',
                title: 'Watch It Build',
                description: 'The AI creates files, runs commands, installs packages, and iterates. Preview your app live in the browser.',
                icon: Box
              },
            ].map((item, i) => (
              <div key={i} className="relative">
                <div className="mb-8">
                  <div className="flex items-end gap-4 mb-6">
                    <span className="text-7xl font-bold text-foreground/10 leading-none">{item.step}</span>
                    <div className="w-12 h-12 rounded-xl bg-foreground flex items-center justify-center mb-1">
                      <item.icon className="w-6 h-6 text-background" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-semibold mb-4">{item.title}</h3>
                  <p className="text-muted">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 border-t border-border">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent rounded-full text-sm mb-8">
            <Cpu className="w-4 h-4" />
            <span>Powered by WebContainers</span>
          </div>
          
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
            Start building now
          </h2>
          
          <p className="text-xl text-muted mb-12 max-w-2xl mx-auto">
            No installation. No sign-up. Just add your API key and start coding 
            with the most powerful AI coding assistant.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/app"
              className="flex items-center gap-3 px-10 py-5 bg-foreground text-background rounded-2xl font-medium text-lg hover:opacity-90 transition-opacity"
            >
              <Play className="w-5 h-5" />
              Launch OpenCode
            </Link>
            
            <a
              href="https://github.com/BastianMIllan/opencode.cash"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-10 py-5 border border-border rounded-2xl font-medium text-lg hover:bg-accent transition-colors"
            >
              <ExternalLink className="w-5 h-5" />
              OpenClaude Repo
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt="OpenCode" width={32} height={32} className="rounded-lg dark:invert-0 invert" />
              <span className="font-medium">OpenCode</span>
            </div>
            
            <p className="text-sm text-muted text-center">
              Built on{' '}
              <a 
                href="https://github.com/BastianMIllan/opencode.cash"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground"
              >
                OpenClaude
              </a>
              {' '}— Claude Code with OpenAI-compatible API support.
            </p>
            
            <div className="flex items-center gap-4">
              <Link
                href="/docs"
                className="text-muted hover:text-foreground transition-colors"
              >
                <BookOpen className="w-5 h-5" />
              </Link>
              <a 
                href="https://github.com/BastianMIllan/opencode.cash"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted hover:text-foreground transition-colors"
              >
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
