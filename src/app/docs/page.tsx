'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowLeft, Terminal, FileText, Code, Globe, Zap, Lock,
  ChevronRight, ChevronDown, Search, BookOpen, Cpu, Box,
  Wrench, GitBranch, Layers, Shield, Rocket, Sun, Moon,
  ExternalLink, Github, Copy, Check, Brain, FolderOpen
} from 'lucide-react'

function XLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

// Animated section wrapper
function AnimatedSection({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay)
          observer.unobserve(entry.target)
        }
      },
      { threshold: 0.1 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [delay])

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}
    >
      {children}
    </div>
  )
}

// Collapsible section
function Collapsible({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-accent/50 transition-colors text-left"
      >
        <span className="font-medium">{title}</span>
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <div className={`transition-all duration-300 overflow-hidden ${isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-5 pb-5 pt-1">
          {children}
        </div>
      </div>
    </div>
  )
}

// Code block with copy
function CodeBlock({ code, language = 'bash' }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative group rounded-xl overflow-hidden border border-border bg-black">
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 text-xs text-white/40">
        <span>{language}</span>
        <button onClick={handleCopy} className="flex items-center gap-1 hover:text-white/70 transition-colors">
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-sm text-white/80 font-mono leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  )
}

// Table of contents items
const tocSections = [
  { id: 'overview', label: 'Overview' },
  { id: 'the-leak', label: 'The Leak' },
  { id: 'getting-started', label: 'Getting Started' },
  { id: 'features', label: 'Features' },
  { id: 'tools', label: 'Agent Tools' },
  { id: 'providers', label: 'Supported Providers' },
  { id: 'architecture', label: 'Architecture' },
  { id: 'self-hosting', label: 'Self-Hosting' },
  { id: 'faq', label: 'FAQ' },
]

export default function DocsPage() {
  const [isDark, setIsDark] = useState(true)
  const [activeSection, setActiveSection] = useState('overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    document.documentElement.classList.add('dark')
    setIsDark(true)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      const sections = tocSections.map(s => ({
        id: s.id,
        el: document.getElementById(s.id),
      }))
      
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = sections[i].el
        if (el && el.getBoundingClientRect().top <= 120) {
          setActiveSection(sections[i].id)
          break
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const toggleTheme = () => {
    const next = !isDark
    setIsDark(next)
    document.documentElement.classList.toggle('dark', next)
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

  const filteredSections = searchQuery
    ? tocSections.filter(s => s.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : tocSections

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <Image src="/logo.png" alt="OpenCode" width={32} height={32} className="rounded-lg dark:invert-0 invert" />
              <span className="font-semibold">OpenCode</span>
            </Link>
            <span className="text-border">/</span>
            <span className="text-muted text-sm font-medium">Documentation</span>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://github.com/BastianMIllan/opencode.cash"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted hover:text-foreground transition-colors"
            >
              <Github className="w-5 h-5" />
            </a>
            <button
              onClick={toggleTheme}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-accent transition-colors"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <Link
              href="/app"
              className="flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Launch App
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 pt-20 flex gap-8">
        {/* Sidebar - Table of Contents */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <div className="sticky top-24 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search docs..."
                className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-lg bg-background focus:border-foreground/30 transition-colors"
              />
            </div>

            <nav className="space-y-1">
              {filteredSections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className={`block px-3 py-2 text-sm rounded-lg transition-all duration-200 ${
                    activeSection === section.id
                      ? 'bg-accent text-foreground font-medium'
                      : 'text-muted hover:text-foreground hover:bg-accent/50'
                  }`}
                >
                  {section.label}
                </a>
              ))}
            </nav>

            <div className="pt-4 border-t border-border">
              <a
                href="https://github.com/BastianMIllan/opencode.cash"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 text-sm text-muted hover:text-foreground transition-colors"
              >
                <Github className="w-4 h-4" />
                View on GitHub
                <ExternalLink className="w-3 h-3 ml-auto" />
              </a>
              <a
                href="https://x.com/opencodecash"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 text-sm text-muted hover:text-foreground transition-colors"
              >
                <XLogo className="w-4 h-4" />
                @opencodecash
                <ExternalLink className="w-3 h-3 ml-auto" />
              </a>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 pb-32 pt-8">
          {/* Overview */}
          <section id="overview" className="mb-20">
            <AnimatedSection>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-foreground flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-background" />
                </div>
                <h1 className="text-4xl font-bold">Documentation</h1>
              </div>
              <p className="text-lg text-muted mt-4 max-w-2xl">
                OpenCode is a free, open-source, browser-based agentic coding IDE. Built from the leaked 
                architecture of Anthropic&apos;s Claude Code — rebuilt to work with <strong className="text-foreground">any LLM provider</strong>.
              </p>
            </AnimatedSection>

            <AnimatedSection delay={100} className="mt-8">
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-xl border border-border bg-accent/30 hover:bg-accent/50 transition-colors">
                  <Zap className="w-5 h-5 mb-3 text-foreground" />
                  <h3 className="font-medium mb-1">Agent-Powered</h3>
                  <p className="text-sm text-muted">AI reads, writes, and executes code autonomously using 10 built-in tools.</p>
                </div>
                <div className="p-5 rounded-xl border border-border bg-accent/30 hover:bg-accent/50 transition-colors">
                  <Globe className="w-5 h-5 mb-3 text-foreground" />
                  <h3 className="font-medium mb-1">Browser-Native</h3>
                  <p className="text-sm text-muted">Full Node.js runtime via WebContainers. No server, no Docker, no SSH.</p>
                </div>
                <div className="p-5 rounded-xl border border-border bg-accent/30 hover:bg-accent/50 transition-colors">
                  <Layers className="w-5 h-5 mb-3 text-foreground" />
                  <h3 className="font-medium mb-1">Any LLM</h3>
                  <p className="text-sm text-muted">Anthropic, OpenAI, DeepSeek, Groq, Mistral, Ollama, and 200+ more.</p>
                </div>
              </div>
            </AnimatedSection>
          </section>

          {/* The Leak */}
          <section id="the-leak" className="mb-20">
            <AnimatedSection>
              <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                <GitBranch className="w-7 h-7" />
                The Leak
              </h2>
              <div className="p-6 rounded-2xl border border-border bg-accent/20 space-y-4">
                <p className="text-muted leading-relaxed">
                  In March 2026, Anthropic&apos;s <strong className="text-foreground">Claude Code</strong> — a $200/month AI coding agent — 
                  had its internal architecture exposed. The tool definitions, the agentic loop structure, the system prompt 
                  engineering, and the harness that wired everything together became public knowledge.
                </p>
                <p className="text-muted leading-relaxed">
                  The revelation was simple: Claude Code&apos;s power didn&apos;t come from a proprietary breakthrough. 
                  It came from a <strong className="text-foreground">well-designed system of tool calls</strong>, a recursive agent loop, 
                  and carefully structured execution — patterns that could work with <em>any</em> sufficiently capable language model.
                </p>
                <p className="text-muted leading-relaxed">
                  OpenCode is a clean-room reimplementation of that architecture. No proprietary code was used. 
                  We studied the exposed patterns and rebuilt them from scratch — then made them work with every major 
                  LLM provider, not just Claude.
                </p>
                <div className="pt-2">
                  <p className="text-sm font-medium italic">
                    &quot;The leak was the blueprint. OpenCode is the product.&quot;
                  </p>
                </div>
              </div>
            </AnimatedSection>
          </section>

          {/* Getting Started */}
          <section id="getting-started" className="mb-20">
            <AnimatedSection>
              <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                <Rocket className="w-7 h-7" />
                Getting Started
              </h2>
            </AnimatedSection>

            <div className="space-y-6">
              <AnimatedSection delay={50}>
                <h3 className="text-xl font-semibold mb-3">Use Instantly (Hosted)</h3>
                <p className="text-muted mb-4">
                  The fastest way to start. No installation required.
                </p>
                <div className="flex gap-3">
                  <Link
                    href="/app"
                    className="inline-flex items-center gap-2 px-5 py-3 bg-foreground text-background rounded-xl font-medium hover:opacity-90 transition-opacity"
                  >
                    <Zap className="w-4 h-4" />
                    Launch OpenCode
                  </Link>
                </div>
                <ol className="mt-4 space-y-2 text-muted text-sm">
                  <li className="flex items-start gap-2"><span className="font-mono text-foreground">1.</span> Open the app</li>
                  <li className="flex items-start gap-2"><span className="font-mono text-foreground">2.</span> Select a model from the selector below the chat input</li>
                  <li className="flex items-start gap-2"><span className="font-mono text-foreground">3.</span> Enter your API key when prompted</li>
                  <li className="flex items-start gap-2"><span className="font-mono text-foreground">4.</span> Start asking the AI to build things</li>
                </ol>
              </AnimatedSection>

              <AnimatedSection delay={100}>
                <h3 className="text-xl font-semibold mb-3">Self-Host (Local)</h3>
                <p className="text-muted mb-4">
                  Run your own instance. Full control.
                </p>
                <CodeBlock
                  language="bash"
                  code={`git clone https://github.com/BastianMIllan/opencode.cash.git
cd opencode.cash
npm install
cp .env.example .env
# Edit .env with your database and auth credentials
npx prisma db push
npx prisma generate
npm run dev`}
                />
                <p className="text-sm text-muted mt-3">
                  Open <code className="px-1.5 py-0.5 bg-accent rounded text-foreground text-xs">http://localhost:3000</code> and you&apos;re live.
                </p>
              </AnimatedSection>
            </div>
          </section>

          {/* Features */}
          <section id="features" className="mb-20">
            <AnimatedSection>
              <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                <Cpu className="w-7 h-7" />
                Features
              </h2>
            </AnimatedSection>

            <div className="grid sm:grid-cols-2 gap-4">
              {[
                {
                  icon: Terminal,
                  title: 'Full Terminal Access',
                  desc: 'Execute any shell command — npm, git, node, python. The AI runs real commands in a sandboxed WebContainer environment.',
                },
                {
                  icon: FileText,
                  title: 'File System Control',
                  desc: 'Read, write, and edit files. Create entire project structures from scratch. The AI sees and modifies your code directly.',
                },
                {
                  icon: Code,
                  title: 'Monaco Code Editor',
                  desc: 'The same editor powering VS Code. Syntax highlighting, multi-tab editing, and full language support built in.',
                },
                {
                  icon: Globe,
                  title: 'Live Preview',
                  desc: 'A floating, draggable browser window that shows your running app. When the AI starts a server, preview appears automatically.',
                },
                {
                  icon: Brain,
                  title: 'Multi-Step Reasoning',
                  desc: 'The agent plans, executes, and iterates. It reads files, makes changes, runs tests, and fixes errors in a loop.',
                },
                {
                  icon: FolderOpen,
                  title: 'Project Management',
                  desc: 'Save, load, and switch between projects. Your work persists across sessions when signed in with X.',
                },
                {
                  icon: Lock,
                  title: 'Bring Your Own Key',
                  desc: 'Your API keys, your models, your choice. Keys are stored securely — in your browser locally or encrypted in the database if signed in.',
                },
                {
                  icon: Layers,
                  title: 'Any LLM Provider',
                  desc: 'Switch between Anthropic, OpenAI, DeepSeek, Groq, Mistral, Together, OpenRouter, Ollama, and more — right from the chat input.',
                },
              ].map((feature, i) => (
                <AnimatedSection key={feature.title} delay={i * 50}>
                  <div className="p-5 rounded-xl border border-border hover:border-foreground/20 transition-all duration-300 h-full">
                    <feature.icon className="w-5 h-5 mb-3 text-muted" />
                    <h3 className="font-semibold mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted leading-relaxed">{feature.desc}</p>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </section>

          {/* Agent Tools */}
          <section id="tools" className="mb-20">
            <AnimatedSection>
              <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                <Wrench className="w-7 h-7" />
                Agent Tools
              </h2>
              <p className="text-muted mb-6">
                The agent has access to 10 tools — the same pattern reverse-engineered from Claude Code&apos;s leaked architecture.
                Each tool call is displayed in real-time in the chat interface.
              </p>
            </AnimatedSection>

            <AnimatedSection delay={50}>
              <div className="border border-border rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-accent/50 border-b border-border">
                      <th className="text-left px-5 py-3 font-semibold">Tool</th>
                      <th className="text-left px-5 py-3 font-semibold">Description</th>
                      <th className="text-left px-5 py-3 font-semibold hidden sm:table-cell">Key Arguments</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: 'bash', desc: 'Execute shell commands with timeout control', args: 'command, timeout' },
                      { name: 'read_file', desc: 'Read file contents with optional line ranges', args: 'path, start_line, end_line' },
                      { name: 'write_file', desc: 'Create or overwrite files completely', args: 'path, content' },
                      { name: 'edit_file', desc: 'Precise string replacement in existing files', args: 'path, old_string, new_string' },
                      { name: 'list_directory', desc: 'List directory contents', args: 'path' },
                      { name: 'glob', desc: 'Find files matching glob patterns', args: 'pattern' },
                      { name: 'grep', desc: 'Search file contents with regex', args: 'pattern, path, include' },
                      { name: 'create_directory', desc: 'Create directories recursively', args: 'path' },
                      { name: 'delete', desc: 'Delete files or directories', args: 'path' },
                      { name: 'think', desc: 'Internal reasoning scratchpad for complex tasks', args: 'thought' },
                    ].map((tool, i) => (
                      <tr key={tool.name} className={`border-b border-border/50 hover:bg-accent/30 transition-colors ${i % 2 === 0 ? '' : 'bg-accent/10'}`}>
                        <td className="px-5 py-3 font-mono text-foreground font-medium">{tool.name}</td>
                        <td className="px-5 py-3 text-muted">{tool.desc}</td>
                        <td className="px-5 py-3 text-muted font-mono text-xs hidden sm:table-cell">{tool.args}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </AnimatedSection>
          </section>

          {/* Supported Providers */}
          <section id="providers" className="mb-20">
            <AnimatedSection>
              <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                <Box className="w-7 h-7" />
                Supported Providers
              </h2>
              <p className="text-muted mb-6">
                OpenCode works with any OpenAI-compatible API, plus native Anthropic SDK support for Claude models.
                Switch providers instantly from the inline model selector — no restart needed.
              </p>
            </AnimatedSection>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { name: 'Anthropic', icon: '◈', models: ['Claude Sonnet 4', 'Claude Opus 4', 'Claude Haiku'], note: 'Native SDK — best tool calling support' },
                { name: 'OpenAI', icon: '◉', models: ['GPT-4o', 'GPT-4o Mini', 'GPT-4 Turbo', 'o1-preview'], note: 'Full OpenAI API support' },
                { name: 'DeepSeek', icon: '◆', models: ['DeepSeek Chat', 'DeepSeek Coder', 'DeepSeek Reasoner'], note: 'High-quality at low cost' },
                { name: 'Google (via OpenRouter)', icon: '◇', models: ['Gemini 2.0 Flash', 'Gemini 2.0 Pro'], note: 'Google models via OpenRouter' },
                { name: 'Groq', icon: '⚡', models: ['Llama 3.3 70B', 'Llama 3.1 8B', 'Mixtral 8x7B'], note: 'Ultra-fast inference' },
                { name: 'Mistral', icon: '▣', models: ['Mistral Large', 'Codestral'], note: 'European AI lab' },
                { name: 'Together AI', icon: '▢', models: ['Llama 3.3 70B', 'Qwen 2.5 72B'], note: 'Open-source model hosting' },
                { name: 'OpenRouter', icon: '◎', models: ['200+ models from any provider'], note: 'Universal model gateway' },
                { name: 'Ollama', icon: '⊙', models: ['Any local model'], note: 'Run models on your machine — free' },
              ].map((provider, i) => (
                <AnimatedSection key={provider.name} delay={i * 40}>
                  <div className="p-5 rounded-xl border border-border hover:border-foreground/20 transition-all duration-300 h-full">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg">{provider.icon}</span>
                      <h3 className="font-semibold">{provider.name}</h3>
                    </div>
                    <div className="space-y-1 mb-3">
                      {provider.models.map((m) => (
                        <div key={m} className="text-sm text-muted font-mono flex items-center gap-1.5">
                          <ChevronRight className="w-3 h-3" />
                          {m}
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted italic">{provider.note}</p>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </section>

          {/* Architecture */}
          <section id="architecture" className="mb-20">
            <AnimatedSection>
              <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                <Layers className="w-7 h-7" />
                Architecture
              </h2>
              <p className="text-muted mb-6">
                The core of OpenCode is a recursive agent loop — the exact pattern exposed in the Claude Code leak.
              </p>
            </AnimatedSection>

            <AnimatedSection delay={50}>
              <div className="p-6 rounded-2xl border border-border bg-accent/20 mb-8">
                <h3 className="font-semibold mb-4">The Agent Loop</h3>
                <div className="flex flex-col sm:flex-row items-center gap-3 text-sm">
                  {[
                    { step: '1', label: 'User Message' },
                    { step: '2', label: 'LLM + Tools' },
                    { step: '3', label: 'Tool Execution' },
                    { step: '4', label: 'Results → LLM' },
                    { step: '5', label: 'Loop or Reply' },
                  ].map((item, i) => (
                    <div key={item.step} className="flex items-center gap-3">
                      <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-background">
                        <span className="w-6 h-6 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-bold">{item.step}</span>
                        <span className="font-medium whitespace-nowrap">{item.label}</span>
                      </div>
                      {i < 4 && <ChevronRight className="w-4 h-4 text-muted hidden sm:block" />}
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted mt-4">
                  The loop continues until the LLM responds with pure text (no tool calls). This allows the agent to 
                  plan multi-step tasks, execute them, verify results, and self-correct — all autonomously.
                </p>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={100}>
              <h3 className="text-xl font-semibold mb-3">Tech Stack</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  { label: 'Framework', value: 'Next.js 14 (App Router)' },
                  { label: 'Language', value: 'TypeScript 5' },
                  { label: 'Runtime', value: 'WebContainers API' },
                  { label: 'Editor', value: 'Monaco Editor' },
                  { label: 'Terminal', value: 'xterm.js' },
                  { label: 'State', value: 'Zustand' },
                  { label: 'Auth', value: 'NextAuth v4 + X OAuth 2.0' },
                  { label: 'Database', value: 'PostgreSQL via Prisma 5' },
                  { label: 'LLM SDKs', value: 'Anthropic SDK + OpenAI SDK' },
                  { label: 'Styling', value: 'Tailwind CSS' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border/50">
                    <span className="text-sm text-muted w-24 flex-shrink-0">{item.label}</span>
                    <span className="text-sm font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
            </AnimatedSection>

            <AnimatedSection delay={150} className="mt-8">
              <h3 className="text-xl font-semibold mb-3">Project Structure</h3>
              <CodeBlock
                language="text"
                code={`opencode/
├── prisma/schema.prisma          # User, Project, ApiKey models
├── public/logo.png
├── src/
│   ├── app/
│   │   ├── page.tsx              # Landing page
│   │   ├── app/page.tsx          # Main IDE workspace
│   │   ├── docs/page.tsx         # Documentation
│   │   ├── login/page.tsx        # X OAuth login
│   │   ├── preview/page.tsx      # Full-screen preview
│   │   └── api/
│   │       ├── auth/             # NextAuth endpoints
│   │       ├── keys/             # API key CRUD (per user)
│   │       └── projects/         # Project CRUD (per user)
│   ├── components/
│   │   ├── Chat.tsx              # Agent chat interface
│   │   ├── CodeEditor.tsx        # Monaco editor wrapper
│   │   ├── FileExplorer.tsx      # File tree sidebar
│   │   ├── ModelSelector.tsx     # Inline model switcher
│   │   ├── Preview.tsx           # Floating browser preview
│   │   └── Terminal.tsx          # xterm.js terminal
│   ├── lib/
│   │   ├── auth.ts               # NextAuth config
│   │   ├── webcontainer.ts       # WebContainer lifecycle
│   │   └── tools/
│   │       ├── index.ts          # Tool definitions (10 tools)
│   │       ├── executor.ts       # Tool execution engine
│   │       └── agent.ts          # Agent loop + LLM calls
│   └── store/index.ts            # Zustand global state
└── README.md`}
              />
            </AnimatedSection>
          </section>

          {/* Self-Hosting */}
          <section id="self-hosting" className="mb-20">
            <AnimatedSection>
              <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                <Shield className="w-7 h-7" />
                Self-Hosting
              </h2>
              <p className="text-muted mb-6">
                OpenCode is fully self-hostable. Deploy to Vercel, Render, Railway, or any Node.js hosting platform.
              </p>
            </AnimatedSection>

            <div className="space-y-4">
              <AnimatedSection delay={50}>
                <Collapsible title="Prerequisites" defaultOpen>
                  <ul className="space-y-2 text-sm text-muted">
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Node.js 18 or higher</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> A PostgreSQL database (Prisma Postgres, Neon, Supabase, etc.)</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> X/Twitter Developer App (for OAuth — optional)</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> npm or yarn</li>
                  </ul>
                </Collapsible>
              </AnimatedSection>

              <AnimatedSection delay={100}>
                <Collapsible title="Environment Variables">
                  <div className="space-y-3 text-sm">
                    <div className="grid grid-cols-[140px_1fr] gap-2">
                      {[
                        { key: 'DATABASE_URL', desc: 'PostgreSQL connection string for Prisma' },
                        { key: 'NEXTAUTH_URL', desc: 'Your app\'s public URL (e.g., https://opencode.cash)' },
                        { key: 'NEXTAUTH_SECRET', desc: 'Random secret for signing session tokens' },
                        { key: 'TWITTER_CLIENT_ID', desc: 'X OAuth 2.0 Client ID (optional — for user auth)' },
                        { key: 'TWITTER_CLIENT_SECRET', desc: 'X OAuth 2.0 Client Secret (optional — for user auth)' },
                      ].map((env) => (
                        <div key={env.key} className="contents">
                          <code className="px-2 py-1 bg-accent rounded text-xs font-mono text-foreground">{env.key}</code>
                          <span className="text-muted py-1">{env.desc}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-muted text-xs mt-2">
                      X OAuth is optional. Without it, users can still use the app — API keys will be stored locally in the browser instead of the database.
                    </p>
                  </div>
                </Collapsible>
              </AnimatedSection>

              <AnimatedSection delay={150}>
                <Collapsible title="Deploy to Vercel">
                  <div className="space-y-3 text-sm text-muted">
                    <ol className="space-y-2">
                      <li><strong className="text-foreground">1.</strong> Push to GitHub</li>
                      <li><strong className="text-foreground">2.</strong> Import the repo in Vercel</li>
                      <li><strong className="text-foreground">3.</strong> Add all environment variables</li>
                      <li><strong className="text-foreground">4.</strong> Set Build Command: <code className="px-1.5 py-0.5 bg-accent rounded text-xs text-foreground">npm install; npx prisma generate; npm run build</code></li>
                      <li><strong className="text-foreground">5.</strong> Deploy</li>
                    </ol>
                    <p className="text-xs">
                      The app configures <code className="px-1 py-0.5 bg-accent rounded text-foreground">Cross-Origin-Embedder-Policy</code> and <code className="px-1 py-0.5 bg-accent rounded text-foreground">Cross-Origin-Opener-Policy</code> headers 
                      in <code className="px-1 py-0.5 bg-accent rounded text-foreground">next.config.js</code> — required for WebContainers.
                    </p>
                  </div>
                </Collapsible>
              </AnimatedSection>

              <AnimatedSection delay={200}>
                <Collapsible title="Deploy to Render">
                  <div className="space-y-3 text-sm text-muted">
                    <ol className="space-y-2">
                      <li><strong className="text-foreground">1.</strong> Create a new Web Service on Render</li>
                      <li><strong className="text-foreground">2.</strong> Connect your GitHub repo</li>
                      <li><strong className="text-foreground">3.</strong> Language: Node</li>
                      <li><strong className="text-foreground">4.</strong> Build Command: <code className="px-1.5 py-0.5 bg-accent rounded text-xs text-foreground">npm install; npx prisma generate; npm run build</code></li>
                      <li><strong className="text-foreground">5.</strong> Start Command: <code className="px-1.5 py-0.5 bg-accent rounded text-xs text-foreground">npm run start</code></li>
                      <li><strong className="text-foreground">6.</strong> Add environment variables and deploy</li>
                    </ol>
                  </div>
                </Collapsible>
              </AnimatedSection>
            </div>
          </section>

          {/* FAQ */}
          <section id="faq" className="mb-20">
            <AnimatedSection>
              <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                <Search className="w-7 h-7" />
                FAQ
              </h2>
            </AnimatedSection>

            <div className="space-y-3">
              {[
                {
                  q: 'Is this actually built from Claude Code\'s leaked source?',
                  a: 'No proprietary source code was used. OpenCode is a clean-room reimplementation based on the publicly exposed architecture — the tool definitions, agent loop pattern, and harness structure. All code is original.',
                },
                {
                  q: 'What\'s the best model to use?',
                  a: 'Claude Sonnet 4 (Anthropic) gives the best tool-calling performance. GPT-4o (OpenAI) is a strong alternative. For budget-friendly options, DeepSeek Chat or Llama 3.3 70B via Groq work well.',
                },
                {
                  q: 'Are my API keys safe?',
                  a: 'If you\'re not signed in, keys are stored only in your browser\'s localStorage — never sent to our servers. If you sign in with X, keys are stored encrypted in the database tied to your account for cross-session persistence.',
                },
                {
                  q: 'Does the code actually run in my browser?',
                  a: 'Yes. OpenCode uses WebContainers by StackBlitz — a full Node.js runtime that runs entirely in your browser tab. Files, npm packages, and shell commands all execute client-side.',
                },
                {
                  q: 'Can I use local models (Ollama)?',
                  a: 'Yes. Select Ollama from the model selector and make sure Ollama is running on your machine (localhost:11434). No API key needed.',
                },
                {
                  q: 'Is this free?',
                  a: 'OpenCode itself is completely free and open source. You only pay for the LLM API tokens you use with your own API keys.',
                },
                {
                  q: 'Can I self-host this?',
                  a: 'Absolutely. Clone the repo, set up your environment variables, and deploy anywhere that runs Node.js. See the Self-Hosting section above.',
                },
              ].map((item, i) => (
                <AnimatedSection key={i} delay={i * 40}>
                  <Collapsible title={item.q}>
                    <p className="text-sm text-muted leading-relaxed">{item.a}</p>
                  </Collapsible>
                </AnimatedSection>
              ))}
            </div>
          </section>

          {/* Bottom CTA */}
          <AnimatedSection>
            <div className="text-center py-12 border-t border-border">
              <h2 className="text-2xl font-bold mb-3">Ready to build?</h2>
              <p className="text-muted mb-6">Pick a model, add your key, and start coding with AI.</p>
              <div className="flex items-center justify-center gap-4">
                <Link
                  href="/app"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-foreground text-background rounded-xl font-medium hover:opacity-90 transition-opacity"
                >
                  <Zap className="w-4 h-4" />
                  Launch OpenCode
                </Link>
                <a
                  href="https://github.com/BastianMIllan/opencode.cash"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 border border-border rounded-xl font-medium hover:bg-accent transition-colors"
                >
                  <Github className="w-4 h-4" />
                  GitHub
                </a>
              </div>
            </div>
          </AnimatedSection>
        </main>
      </div>
    </div>
  )
}
