import { WebContainer } from '@webcontainer/api'
import { useStore, FileNode } from '@/store'

let webcontainerInstance: WebContainer | null = null

export type WorkspaceSnapshot = Record<string, string>

export async function bootWebContainer(): Promise<WebContainer> {
  if (webcontainerInstance) return webcontainerInstance

  const { setIsBooting, setBootError, setWebcontainer, setIsReady, setPreviewUrl, setPreviewPort, setShowPreview } = useStore.getState()
  
  setIsBooting(true)
  setBootError(null)

  try {
    webcontainerInstance = await WebContainer.boot()
    setWebcontainer(webcontainerInstance)
    
    // Listen for server-ready events (when user runs a dev server)
    webcontainerInstance.on('server-ready', (port: number, url: string) => {
      console.log(`Server ready on port ${port}: ${url}`)
      setPreviewUrl(url)
      setPreviewPort(port)
      setShowPreview(true)
    })
    
    // Set up initial workspace files
    await webcontainerInstance.mount({
      'package.json': {
        file: {
          contents: JSON.stringify({
            name: 'workspace',
            type: 'module',
            scripts: {
              start: 'node index.js',
              dev: 'node --watch index.js'
            },
            dependencies: {}
          }, null, 2)
        }
      },
      'README.md': {
        file: {
          contents: `# Workspace

Welcome to OpenCode! This is your AI-powered coding environment.

## Getting Started

Ask the AI to help you:
- Create files and folders
- Write and edit code
- Run commands
- Install packages
- Debug issues

The AI has full access to this workspace and can run any npm/Node.js commands.
`
        }
      },
      'index.js': {
        file: {
          contents: `// Your code here
console.log('Hello from OpenCode!');
`
        }
      }
    })

    setIsBooting(false)
    setIsReady(true)
    
    return webcontainerInstance
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to boot WebContainer'
    setBootError(message)
    setIsBooting(false)
    throw error
  }
}

export function getWebContainer(): WebContainer | null {
  return webcontainerInstance
}

export async function listDirectory(wc: WebContainer, path: string = '/'): Promise<FileNode[]> {
  const entries = await wc.fs.readdir(path, { withFileTypes: true })
  const nodes: FileNode[] = []

  for (const entry of entries) {
    const fullPath = path === '/' ? `/${entry.name}` : `${path}/${entry.name}`
    
    if (entry.isDirectory()) {
      // Skip node_modules for performance
      if (entry.name === 'node_modules') {
        nodes.push({
          name: entry.name,
          path: fullPath,
          type: 'directory',
          children: []
        })
      } else {
        const children = await listDirectory(wc, fullPath)
        nodes.push({
          name: entry.name,
          path: fullPath,
          type: 'directory',
          children
        })
      }
    } else {
      // Hide internal files
      if (entry.name === '.static-server.cjs') continue
      nodes.push({
        name: entry.name,
        path: fullPath,
        type: 'file'
      })
    }
  }

  // Sort: directories first, then files, alphabetically
  return nodes.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'directory' ? -1 : 1
    return a.name.localeCompare(b.name)
  })
}

export async function readFile(wc: WebContainer, path: string): Promise<string> {
  try {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`
    return await wc.fs.readFile(normalizedPath, 'utf-8')
  } catch {
    return ''
  }
}

export async function writeFile(wc: WebContainer, path: string, content: string): Promise<void> {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  await wc.fs.writeFile(normalizedPath, content)
}

export async function deleteFile(wc: WebContainer, path: string): Promise<void> {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  await wc.fs.rm(normalizedPath, { recursive: true })
}

export async function createDirectory(wc: WebContainer, path: string): Promise<void> {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  await wc.fs.mkdir(normalizedPath, { recursive: true })
}

export async function snapshotWorkspace(wc: WebContainer, path: string = '/'): Promise<WorkspaceSnapshot> {
  const entries = await wc.fs.readdir(path, { withFileTypes: true })
  const snapshot: WorkspaceSnapshot = {}

  for (const entry of entries) {
    if (entry.name === 'node_modules') continue

    const fullPath = path === '/' ? `/${entry.name}` : `${path}/${entry.name}`

    if (entry.isDirectory()) {
      Object.assign(snapshot, await snapshotWorkspace(wc, fullPath))
    } else {
      snapshot[fullPath] = await wc.fs.readFile(fullPath, 'utf-8')
    }
  }

  return snapshot
}

export async function restoreWorkspace(wc: WebContainer, snapshot: WorkspaceSnapshot): Promise<void> {
  const rootEntries = await wc.fs.readdir('/', { withFileTypes: true })

  for (const entry of rootEntries) {
    if (entry.name === 'node_modules') continue
    await wc.fs.rm(`/${entry.name}`, { recursive: true })
  }

  const paths = Object.keys(snapshot).sort((a, b) => a.localeCompare(b))

  for (const path of paths) {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`
    const directory = normalizedPath.split('/').slice(0, -1).join('/') || '/'

    if (directory !== '/') {
      await wc.fs.mkdir(directory, { recursive: true })
    }

    await wc.fs.writeFile(normalizedPath, snapshot[path])
  }
}

export async function spawnShell(
  wc: WebContainer,
  onOutput: (data: string) => void
): Promise<{ 
  write: (data: string) => void
  resize: (cols: number, rows: number) => void 
}> {
  const process = await wc.spawn('jsh', {
    terminal: {
      cols: 80,
      rows: 24
    }
  })

  process.output.pipeTo(new WritableStream({
    write(data) {
      onOutput(data)
    }
  }))

  const writer = process.input.getWriter()
  
  return {
    write: (data: string) => {
      writer.write(data)
    },
    resize: (cols: number, rows: number) => {
      process.resize({ cols, rows })
    }
  }
}
