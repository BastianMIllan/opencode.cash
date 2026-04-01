'use client'

import { signIn } from 'next-auth/react'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Loader2, ArrowLeft } from 'lucide-react'

function XLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)

  const handleTwitterLogin = async () => {
    setIsLoading(true)
    await signIn('twitter', { callbackUrl: '/app' })
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="p-6">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Image src="/logo.png" alt="OpenCode" width={64} height={64} className="rounded-2xl dark:invert-0 invert" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Welcome to OpenCode</h1>
            <p className="text-muted">
              Sign in to save your projects and sync across devices
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleTwitterLogin}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-foreground text-background rounded-2xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <XLogo className="w-5 h-5" />
              )}
              Continue with X (Twitter)
            </button>

            <p className="text-center text-sm text-muted">
              By signing in, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>

          <div className="mt-8 p-4 bg-accent/50 rounded-xl border border-border">
            <p className="text-sm text-muted">
              <strong className="text-foreground">Note:</strong> You can use OpenCode without signing in. 
              Sign in is only needed to save and sync your projects.
            </p>
          </div>

          <div className="mt-6 text-center">
            <Link 
              href="/app" 
              className="text-sm text-muted hover:text-foreground transition-colors underline"
            >
              Continue without signing in
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
