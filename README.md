# OpenCode

<p align="center">
  <img src="Banner.png" alt="OpenCode Banner" width="100%" />
</p>

<p align="center">
  <strong>Built from the leaked architecture of Anthropic's Claude Code. Open-source. Any LLM. Runs in your browser.</strong>
</p>

<p align="center">
  <a href="https://opencode.cash">Live Demo</a> •
  <a href="#the-leak">The Story</a> •
  <a href="#features">Features</a> •
  <a href="#quickstart">Quickstart</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#supported-providers">Providers</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript" />
  <img src="https://img.shields.io/badge/WebContainers-API-orange?style=flat-square" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" />
</p>

---

## The Leak

On March 31, 2026, Anthropic's **Claude Code** — a $200/month AI coding agent locked exclusively to Claude models — had its internal architecture exposed. The tool definitions, the agentic loop, the system prompt structure, the harness that wired everything together — all of it became public knowledge overnight.

The dev community realized the truth: **Claude Code's power didn't come from magic. It came from a clever system of tool calls, a well-designed agent loop, and a structured execution harness.**

We took that leaked blueprint and did what Anthropic never would: **we rebuilt it as a free, open-source, bring-your-own-key platform that works with any LLM.**

OpenCode is the result.

---

## Features

### 🛠️ Full Agentic Tool System
The same architecture that powered Claude Code — rebuilt from scratch. The agent can:
- **Read, write, and edit files** with precise string replacement
- **Execute shell commands** via bash with full terminal access
- **Search codebases** with glob patterns and grep
- **Create and delete** files and directories
- **Think** through complex problems with a dedicated reasoning tool

### 🌐 Runs Entirely in the Browser
Powered by [WebContainers](https://webcontainers.io/), the entire Node.js runtime runs in your browser tab. No server required. No Docker. No SSH. Full file system, package manager, and process execution — all client-side.

### 🔀 Any LLM, Any Provider
Not locked to one vendor. Bring your own API key and use:

| Provider | Models |
|----------|--------|
| **Anthropic** | Claude Sonnet 4, Claude Opus 4, Claude Haiku |
| **OpenAI** | GPT-4o, GPT-4 Turbo, o1-preview, o1-mini |
| **DeepSeek** | DeepSeek Chat, DeepSeek Coder, DeepSeek Reasoner |
| **Google** | Gemini 2.0 Flash, Gemini 2.0 Pro (via OpenRouter) |
| **Groq** | Llama 3.3 70B, Mixtral 8x7B |
| **Mistral** | Mistral Large, Codestral |
| **Together AI** | Llama 3.3 70B, Qwen 2.5 72B |
| **OpenRouter** | 200+ models from any provider |
| **Ollama** | Any local model — Llama, Mistral, CodeLlama |
| **LM Studio** | Any local GGUF model |

### 💻 Professional IDE Experience
- **Monaco Editor** — the same editor that powers VS Code
- **File Explorer** — full tree view with create, delete, rename
- **Integrated Terminal** — xterm.js with full shell access
- **Live Preview** — floating, draggable browser window with hot reload
- **Multi-tab editing** — open and switch between multiple files

### 🔐 Auth & Persistence
- **X (Twitter) OAuth** — sign in with your X account
- **Project Save/Load** — save your entire workspace to the cloud, load it later
- **Multi-Project Management** — switch between projects with one click
- **API Key Storage** — keys stored in the database tied to your account (encrypted)

### 🎯 Inline Model Switching
Switch models on the fly from the chat input — no settings menu needed. If you pick a model for a provider you haven't added a key for, a popup prompts you immediately.

---

## Quickstart

### Prerequisites
- Node.js 18+
- npm or yarn

### 1. Clone the repository

```bash
git clone https://github.com/bastianmillan/opencode.git
cd opencode
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

```bash
cp .env.example .env
```

Fill in your `.env`:

```env
# Database (Prisma Postgres or any PostgreSQL)
DATABASE_URL="your-database-url"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-a-random-secret"

# Twitter/X OAuth 2.0
TWITTER_CLIENT_ID="your-client-id"
TWITTER_CLIENT_SECRET="your-client-secret"
```

### 4. Push database schema

```bash
npx prisma db push
npx prisma generate
```

### 5. Run the development server

```bash
npm run dev
```

### 6. Open [http://localhost:3000](http://localhost:3000)

Select a model, enter your API key, and start building.

---

## Architecture

```
opencode/
├── prisma/
│   └── schema.prisma          # User, Project, ApiKey models
├── public/
│   └── logo.png
├── src/
│   ├── app/
│   │   ├── page.tsx            # Landing page
│   │   ├── app/page.tsx        # Main IDE workspace
│   │   ├── login/page.tsx      # X OAuth login
│   │   ├── preview/page.tsx    # Full-screen preview
│   │   └── api/
│   │       ├── auth/           # NextAuth endpoints
│   │       ├── keys/           # API key CRUD (per user)
│   │       └── projects/       # Project CRUD (per user)
│   ├── components/
│   │   ├── Chat.tsx            # Agent chat interface
│   │   ├── CodeEditor.tsx      # Monaco editor wrapper
│   │   ├── FileExplorer.tsx    # File tree sidebar
│   │   ├── ModelSelector.tsx   # Inline model switcher + key popup
│   │   ├── Preview.tsx         # Floating browser preview
│   │   ├── Settings.tsx        # Full settings modal
│   │   └── Terminal.tsx        # xterm.js terminal
│   ├── lib/
│   │   ├── auth.ts             # NextAuth config (Twitter OAuth 2.0)
│   │   ├── prisma.ts           # Prisma client singleton
│   │   ├── webcontainer.ts     # WebContainer lifecycle + file ops
│   │   └── tools/
│   │       ├── index.ts        # Tool definitions (10 tools)
│   │       ├── executor.ts     # Tool execution engine
│   │       └── agent.ts        # Agent loop + LLM integration
│   └── store/
│       └── index.ts            # Zustand global state
└── README.md
```

### The Agent Loop

The core of OpenCode is a recursive agent loop — the same pattern leaked from Claude Code:

1. **User sends a message** → appended to conversation history
2. **LLM receives** the full history + system prompt + tool definitions
3. **LLM responds** with either text or tool calls
4. **Tool executor** runs each tool against the WebContainer
5. **Results** are fed back to the LLM as tool results
6. **Loop repeats** until the LLM responds with pure text (no more tool calls)

This is the exact harness architecture that made Claude Code powerful — except OpenCode runs it with **any model**, not just Claude.

### Tool Definitions

| Tool | Description |
|------|-------------|
| `bash` | Execute shell commands with timeout control |
| `read_file` | Read file contents with optional line ranges |
| `write_file` | Create or overwrite files |
| `edit_file` | Surgical string replacement in existing files |
| `list_directory` | List directory contents recursively |
| `glob` | Find files matching glob patterns |
| `grep` | Search file contents with regex |
| `create_directory` | Create directories (recursive) |
| `delete` | Delete files or directories |
| `think` | Internal reasoning scratchpad |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript 5 |
| **Runtime** | WebContainers API (in-browser Node.js) |
| **Editor** | Monaco Editor |
| **Terminal** | xterm.js |
| **State** | Zustand |
| **Auth** | NextAuth v4 + Twitter/X OAuth 2.0 |
| **Database** | PostgreSQL via Prisma 5 |
| **LLM SDKs** | @anthropic-ai/sdk (native) + OpenAI SDK (compatible) |
| **Styling** | Tailwind CSS |
| **Deployment** | Vercel |

---

## How It's Different

| Feature | Claude Code | Cursor | OpenCode |
|---------|------------|--------|----------|
| **Price** | $200/month | $20/month | **Free** |
| **Models** | Claude only | Limited | **Any LLM** |
| **Open Source** | No | No | **Yes** |
| **Runs in Browser** | No | No | **Yes** |
| **Self-Hostable** | No | No | **Yes** |
| **Bring Your Own Key** | No | Partial | **Yes** |

---

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import in [Vercel](https://vercel.com)
3. Add environment variables
4. Deploy

The app requires the `Cross-Origin-Embedder-Policy` and `Cross-Origin-Opener-Policy` headers for WebContainers. These are configured in `next.config.js`.

---

## Ownership / Disclaimer

- This project is **not affiliated with, endorsed by, or maintained by Anthropic**.
- OpenCode is a clean-room reimplementation inspired by the publicly exposed architecture of Claude Code.
- No proprietary source code from Anthropic was used in this project.
- All code in this repository is original work.

---

## License

MIT — do whatever you want with it.

---

<p align="center">
  <strong>The leak was the blueprint. OpenCode is the product.</strong>
</p>

<p align="center">
  <a href="https://opencode.cash">opencode.cash</a> •
  <a href="https://x.com/opencodecash">@opencodecash</a>
</p>
