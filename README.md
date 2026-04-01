# OpenCode App

A beautiful, minimalistic web application that lets you use any LLM — OpenAI, Gemini, DeepSeek, Ollama, and 200+ models.

## Features

- **Multi-Provider Support**: Connect to OpenAI, Anthropic, DeepSeek, Google Gemini, Groq, Mistral, Together AI, OpenRouter, Ollama, LM Studio, and custom providers
- **Dark/Light Mode**: Clean black and white design with instant theme switching
- **Secure**: API keys stored locally in your browser — never sent to our servers
- **Real-time Streaming**: See responses as they're generated
- **Markdown Support**: Code highlighting, tables, lists, and more
- **Fully Responsive**: Works great on desktop and mobile

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Run the development server

```bash
npm run dev
```

### 3. Open [http://localhost:3000](http://localhost:3000)

### 4. Configure your API key

Click the settings icon and choose your provider. Enter your API key and select a model.

## Supported Providers

| Provider | Base URL | API Key Format |
|----------|----------|----------------|
| OpenAI | `https://api.openai.com/v1` | `sk-...` |
| Anthropic | `https://api.anthropic.com/v1` | `sk-ant-...` |
| DeepSeek | `https://api.deepseek.com/v1` | `sk-...` |
| Groq | `https://api.groq.com/openai/v1` | `gsk_...` |
| Mistral | `https://api.mistral.ai/v1` | `...` |
| Together AI | `https://api.together.xyz/v1` | `...` |
| OpenRouter | `https://openrouter.ai/api/v1` | `sk-or-...` |
| Ollama | `http://localhost:11434/v1` | Not required |
| LM Studio | `http://localhost:1234/v1` | Not required |

## Tech Stack

- **Framework**: Next.js 14
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Markdown**: react-markdown with remark-gfm

## Security

Your API keys are stored **only in your browser's localStorage**. They are:
- Never sent to our backend (except to proxy requests to the LLM API)
- Never logged or stored on any server
- Cleared when you click "Clear" in settings

## License

MIT
