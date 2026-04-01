import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/components/AuthProvider'

export const metadata: Metadata = {
  title: 'OpenCode - AI Coding Agent in Your Browser',
  description: 'Claude Code leaked. We rebuilt it. Use the full agentic coding experience with any LLM — OpenAI, DeepSeek, Groq, Ollama, and 200+ models.',
  metadataBase: new URL('https://opencode.cash'),
  openGraph: {
    title: 'OpenCode - The Agent They Didn\'t Want You to Have',
    description: 'Claude Code leaked. We rebuilt it. Full terminal access, file editing, multi-step reasoning — with any LLM.',
    url: 'https://opencode.cash',
    siteName: 'OpenCode',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OpenCode - AI Coding Agent in Your Browser',
    description: 'Claude Code leaked. We rebuilt it. Use any LLM.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" 
          rel="stylesheet" 
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const theme = localStorage.getItem('theme');
                if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
