'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { 
  Search, Heart, Clock, TrendingUp, Tag, 
  ArrowLeft, Github, Moon, Sun, BookOpen,
  Loader2, ExternalLink, Compass, Code, GitFork
} from 'lucide-react'

interface DiscoverProject {
  id: string
  name: string
  description: string | null
  tags: string[]
  likesCount: number
  liked: boolean
  forkedFrom: string | null
  createdAt: string
  updatedAt: string
  user: {
    id: string
    name: string | null
    image: string | null
  }
}

function XLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

export default function DiscoverPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [projects, setProjects] = useState<DiscoverProject[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeTag, setActiveTag] = useState('')
  const [sort, setSort] = useState<'recent' | 'popular'>('recent')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [mounted, setMounted] = useState(false)
  const [isDark, setIsDark] = useState(true)
  const [forking, setForking] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme === 'light') {
      setIsDark(false)
    }
  }, [])

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

  const fetchProjects = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (activeTag) params.set('tag', activeTag)
      params.set('sort', sort)
      params.set('page', String(page))

      const res = await fetch(`/api/discover?${params}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setProjects(data.projects)
      setTotalPages(data.pages)
      setTotal(data.total)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [search, activeTag, sort, page])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  const handleLike = async (projectId: string) => {
    if (!session) return

    // Optimistic update
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          liked: !p.liked,
          likesCount: p.liked ? p.likesCount - 1 : p.likesCount + 1,
        }
      }
      return p
    }))

    try {
      await fetch(`/api/discover/${projectId}/like`, { method: 'POST' })
    } catch {
      // Revert on error
      fetchProjects()
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchProjects()
  }

  const handleFork = async (projectId: string) => {
    if (!session) return
    setForking(projectId)
    try {
      const res = await fetch(`/api/discover/${projectId}`, { method: 'POST' })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || 'Failed to fork')
      }
      router.push('/app')
    } catch (error) {
      console.error('Fork failed:', error)
    } finally {
      setForking(null)
    }
  }

  const popularTags = ['react', 'api', 'game', 'tool', 'website', 'node', 'python', 'ai']

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="w-full px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <Image src="/logo.png" alt="OpenCode" width={28} height={28} className="rounded-lg dark:invert-0 invert" />
              <span className="font-semibold hidden sm:block">OpenCode</span>
            </Link>
            <span className="text-border">/</span>
            <div className="flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-muted" />
              <span className="font-medium">Discover</span>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <Link
              href="/docs"
              className="w-8 h-8 rounded-lg hidden sm:flex items-center justify-center hover:bg-accent transition-colors"
              title="Docs"
            >
              <BookOpen className="w-4 h-4" />
            </Link>
            <a
              href="https://github.com/BastianMIllan/opencode.cash"
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-lg hidden sm:flex items-center justify-center hover:bg-accent transition-colors"
            >
              <Github className="w-4 h-4" />
            </a>
            <button
              onClick={toggleTheme}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-accent transition-colors"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <Link
              href="/app"
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-foreground text-background rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <Code className="w-4 h-4" />
              <span className="hidden sm:inline">Open App</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="border-b border-border bg-accent/30 pt-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">Discover</h1>
          <p className="text-muted text-lg max-w-xl mb-8">
            Explore projects built by the community. Get inspired, learn, and fork.
          </p>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex gap-2 max-w-xl">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search projects..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-foreground/20 transition-shadow"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 bg-foreground text-background rounded-xl font-medium hover:opacity-90 transition-opacity"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Filters */}
      <div className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center gap-3">
          {/* Sort */}
          <div className="flex items-center gap-1 bg-accent rounded-lg p-0.5">
            <button
              onClick={() => { setSort('recent'); setPage(1) }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                sort === 'recent' ? 'bg-background shadow-sm font-medium' : 'text-muted hover:text-foreground'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Recent
            </button>
            <button
              onClick={() => { setSort('popular'); setPage(1) }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                sort === 'popular' ? 'bg-background shadow-sm font-medium' : 'text-muted hover:text-foreground'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Popular
            </button>
          </div>

          <div className="w-px h-6 bg-border hidden sm:block" />

          {/* Tags */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <Tag className="w-3.5 h-3.5 text-muted" />
            {popularTags.map(tag => (
              <button
                key={tag}
                onClick={() => { setActiveTag(activeTag === tag ? '' : tag); setPage(1) }}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  activeTag === tag
                    ? 'bg-foreground text-background'
                    : 'bg-accent text-muted hover:text-foreground'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20">
            <Compass className="w-12 h-12 text-muted mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
            <p className="text-muted mb-6">
              {search || activeTag ? 'Try a different search or filter.' : 'Be the first to publish something.'}
            </p>
            <Link
              href="/app"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-foreground text-background rounded-xl font-medium hover:opacity-90 transition-opacity"
            >
              <Code className="w-4 h-4" />
              Start Building
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-muted">
                {total} project{total !== 1 ? 's' : ''}
                {activeTag && <> tagged <span className="text-foreground font-medium">#{activeTag}</span></>}
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map(project => (
                <div
                  key={project.id}
                  className="group border border-border rounded-2xl bg-background hover:border-foreground/20 transition-all overflow-hidden"
                >
                  {/* Card header with code pattern */}
                  <div className="h-32 bg-accent/50 relative overflow-hidden">
                    <div className="absolute inset-0 p-4 font-mono text-[10px] text-muted/40 leading-relaxed overflow-hidden">
                      {`const ${project.name.replace(/[^a-zA-Z]/g, '').toLowerCase() || 'app'} = require('./');\n// ${project.description?.slice(0, 60) || 'Built with OpenCode'}\nmodule.exports = { start() { ... } }`}
                    </div>
                    <div className="absolute bottom-3 left-4 flex gap-1.5">
                      {project.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="px-2 py-0.5 rounded-full bg-background/80 text-[10px] font-medium backdrop-blur-sm">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h3 className="font-semibold truncate">{project.name}</h3>
                        {project.forkedFrom && (
                          <p className="text-[10px] text-muted flex items-center gap-1 mt-0.5">
                            <GitFork className="w-3 h-3" /> Forked
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {project.description && (
                      <p className="text-sm text-muted line-clamp-2 mb-3">{project.description}</p>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <div className="flex items-center gap-2">
                        {project.user.image ? (
                          <img src={project.user.image} alt="" className="w-5 h-5 rounded-full" />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-accent" />
                        )}
                        <span className="text-xs text-muted truncate max-w-[100px]">{project.user.name || 'Anonymous'}</span>
                        <span className="text-xs text-muted">&middot;</span>
                        <span className="text-xs text-muted">{timeAgo(project.updatedAt)}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        {session && (
                          <button
                            onClick={(e) => { e.preventDefault(); handleFork(project.id) }}
                            disabled={forking === project.id}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-muted hover:text-foreground hover:bg-accent transition-colors"
                            title="Fork project"
                          >
                            {forking === project.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <GitFork className="w-3.5 h-3.5" />}
                          </button>
                        )}
                        <button
                          onClick={(e) => { e.preventDefault(); handleLike(project.id) }}
                          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-colors ${
                            project.liked
                              ? 'text-red-500 bg-red-500/10'
                              : 'text-muted hover:text-red-500 hover:bg-red-500/10'
                          }`}
                        >
                          <Heart className={`w-3.5 h-3.5 ${project.liked ? 'fill-current' : ''}`} />
                          {project.likesCount > 0 && <span>{project.likesCount}</span>}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                      page === p
                        ? 'bg-foreground text-background'
                        : 'hover:bg-accent text-muted'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="OpenCode" width={20} height={20} className="rounded dark:invert-0 invert" />
            <span className="text-sm text-muted">OpenCode Discover</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted">
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            <Link href="/app" className="hover:text-foreground transition-colors">App</Link>
            <Link href="/docs" className="hover:text-foreground transition-colors">Docs</Link>
            <a href="https://github.com/BastianMIllan/opencode.cash" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
