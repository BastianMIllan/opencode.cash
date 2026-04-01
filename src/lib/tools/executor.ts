// Tool Executor - Executes tools against WebContainer
import { WebContainer } from '@webcontainer/api'

export interface ToolResult {
  success: boolean
  output: string
  error?: string
}

export class ToolExecutor {
  private wc: WebContainer
  private shellWriter: WritableStreamDefaultWriter<string> | null = null

  constructor(webcontainer: WebContainer) {
    this.wc = webcontainer
  }

  async execute(toolName: string, args: Record<string, unknown>): Promise<ToolResult> {
    try {
      switch (toolName) {
        case 'bash':
          return await this.executeBash(args.command as string, args.timeout as number)
        case 'read_file':
          return await this.readFile(args.path as string, args.start_line as number, args.end_line as number)
        case 'write_file':
          return await this.writeFile(args.path as string, args.content as string)
        case 'edit_file':
          return await this.editFile(args.path as string, args.old_string as string, args.new_string as string)
        case 'list_directory':
          return await this.listDirectory(args.path as string || '/')
        case 'glob':
          return await this.glob(args.pattern as string)
        case 'grep':
          return await this.grep(args.pattern as string, args.path as string, args.include as string)
        case 'create_directory':
          return await this.createDirectory(args.path as string)
        case 'delete':
          return await this.delete(args.path as string)
        case 'think':
          return { success: true, output: `Thought: ${args.thought}` }
        default:
          return { success: false, output: '', error: `Unknown tool: ${toolName}` }
      }
    } catch (error) {
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  private async executeBash(command: string, timeout: number = 30000): Promise<ToolResult> {
    return new Promise(async (resolve) => {
      let output = ''
      let timedOut = false
      
      const timeoutId = setTimeout(() => {
        timedOut = true
        resolve({
          success: false,
          output,
          error: `Command timed out after ${timeout}ms`
        })
      }, timeout)

      try {
        // Split command into parts
        const parts = command.split(' ')
        const cmd = parts[0]
        const args = parts.slice(1)
        
        const process = await this.wc.spawn(cmd, args)
        
        process.output.pipeTo(new WritableStream({
          write(data) {
            output += data
          }
        }))

        const exitCode = await process.exit
        
        if (!timedOut) {
          clearTimeout(timeoutId)
          resolve({
            success: exitCode === 0,
            output: output || '(no output)',
            error: exitCode !== 0 ? `Exit code: ${exitCode}` : undefined
          })
        }
      } catch (error) {
        if (!timedOut) {
          clearTimeout(timeoutId)
          resolve({
            success: false,
            output,
            error: error instanceof Error ? error.message : String(error)
          })
        }
      }
    })
  }

  private async readFile(path: string, startLine?: number, endLine?: number): Promise<ToolResult> {
    try {
      const normalizedPath = path.startsWith('/') ? path : `/${path}`
      const content = await this.wc.fs.readFile(normalizedPath, 'utf-8')
      
      if (startLine || endLine) {
        const lines = content.split('\n')
        const start = (startLine || 1) - 1
        const end = endLine || lines.length
        const sliced = lines.slice(start, end)
        
        // Add line numbers
        const numbered = sliced.map((line, i) => `${start + i + 1}: ${line}`).join('\n')
        return { success: true, output: numbered }
      }
      
      return { success: true, output: content }
    } catch (error) {
      return {
        success: false,
        output: '',
        error: `Failed to read file: ${error instanceof Error ? error.message : String(error)}`
      }
    }
  }

  private async writeFile(path: string, content: string): Promise<ToolResult> {
    try {
      const normalizedPath = path.startsWith('/') ? path : `/${path}`
      
      // Create parent directories if needed
      const parts = normalizedPath.split('/')
      if (parts.length > 2) {
        const dir = parts.slice(0, -1).join('/')
        await this.wc.fs.mkdir(dir, { recursive: true })
      }
      
      await this.wc.fs.writeFile(normalizedPath, content)
      
      const lines = content.split('\n').length
      return {
        success: true,
        output: `Successfully wrote ${lines} lines to ${path}`
      }
    } catch (error) {
      return {
        success: false,
        output: '',
        error: `Failed to write file: ${error instanceof Error ? error.message : String(error)}`
      }
    }
  }

  private async editFile(path: string, oldString: string, newString: string): Promise<ToolResult> {
    try {
      const normalizedPath = path.startsWith('/') ? path : `/${path}`
      const content = await this.wc.fs.readFile(normalizedPath, 'utf-8')
      
      if (!content.includes(oldString)) {
        return {
          success: false,
          output: '',
          error: `Could not find the exact string to replace. Make sure old_string matches exactly (including whitespace).`
        }
      }
      
      const occurrences = content.split(oldString).length - 1
      if (occurrences > 1) {
        return {
          success: false,
          output: '',
          error: `Found ${occurrences} occurrences of the string. Please provide more context to make the match unique.`
        }
      }
      
      const newContent = content.replace(oldString, newString)
      await this.wc.fs.writeFile(normalizedPath, newContent)
      
      return {
        success: true,
        output: `Successfully edited ${path}`
      }
    } catch (error) {
      return {
        success: false,
        output: '',
        error: `Failed to edit file: ${error instanceof Error ? error.message : String(error)}`
      }
    }
  }

  private async listDirectory(path: string): Promise<ToolResult> {
    try {
      const normalizedPath = path.startsWith('/') ? path : `/${path}`
      const entries = await this.wc.fs.readdir(normalizedPath, { withFileTypes: true })
      
      const listing = entries
        .map(entry => entry.isDirectory() ? `${entry.name}/` : entry.name)
        .sort((a, b) => {
          const aIsDir = a.endsWith('/')
          const bIsDir = b.endsWith('/')
          if (aIsDir !== bIsDir) return aIsDir ? -1 : 1
          return a.localeCompare(b)
        })
        .join('\n')
      
      return {
        success: true,
        output: listing || '(empty directory)'
      }
    } catch (error) {
      return {
        success: false,
        output: '',
        error: `Failed to list directory: ${error instanceof Error ? error.message : String(error)}`
      }
    }
  }

  private async glob(pattern: string): Promise<ToolResult> {
    // Simple glob implementation using recursive directory listing
    const matches: string[] = []
    
    const walk = async (dir: string) => {
      try {
        const entries = await this.wc.fs.readdir(dir, { withFileTypes: true })
        
        for (const entry of entries) {
          const fullPath = dir === '/' ? `/${entry.name}` : `${dir}/${entry.name}`
          
          if (entry.isDirectory()) {
            // Skip node_modules and hidden directories
            if (entry.name !== 'node_modules' && !entry.name.startsWith('.')) {
              await walk(fullPath)
            }
          } else {
            // Simple pattern matching
            if (this.matchGlob(fullPath, pattern)) {
              matches.push(fullPath)
            }
          }
        }
      } catch {
        // Skip directories we can't read
      }
    }
    
    await walk('/')
    
    return {
      success: true,
      output: matches.length > 0 ? matches.join('\n') : 'No matches found'
    }
  }

  private matchGlob(path: string, pattern: string): boolean {
    // Convert glob pattern to regex
    const regexPattern = pattern
      .replace(/\*\*/g, '{{DOUBLESTAR}}')
      .replace(/\*/g, '[^/]*')
      .replace(/{{DOUBLESTAR}}/g, '.*')
      .replace(/\?/g, '.')
      .replace(/\./g, '\\.')
    
    const regex = new RegExp(`^/?${regexPattern}$`)
    return regex.test(path)
  }

  private async grep(pattern: string, path: string = '/', include?: string): Promise<ToolResult> {
    const results: string[] = []
    const regex = new RegExp(pattern, 'gi')
    
    const searchFile = async (filePath: string) => {
      try {
        const content = await this.wc.fs.readFile(filePath, 'utf-8')
        const lines = content.split('\n')
        
        lines.forEach((line, index) => {
          if (regex.test(line)) {
            results.push(`${filePath}:${index + 1}: ${line.trim()}`)
          }
        })
      } catch {
        // Skip files we can't read
      }
    }

    const walk = async (dir: string) => {
      try {
        const entries = await this.wc.fs.readdir(dir, { withFileTypes: true })
        
        for (const entry of entries) {
          const fullPath = dir === '/' ? `/${entry.name}` : `${dir}/${entry.name}`
          
          if (entry.isDirectory()) {
            if (entry.name !== 'node_modules' && !entry.name.startsWith('.')) {
              await walk(fullPath)
            }
          } else {
            // Check include pattern
            if (!include || this.matchGlob(entry.name, include)) {
              await searchFile(fullPath)
            }
          }
        }
      } catch {
        // Skip directories we can't read
      }
    }

    const normalizedPath = path.startsWith('/') ? path : `/${path}`
    
    try {
      const stat = await this.wc.fs.readFile(normalizedPath, 'utf-8')
      // It's a file
      await searchFile(normalizedPath)
    } catch {
      // It's a directory
      await walk(normalizedPath)
    }
    
    return {
      success: true,
      output: results.length > 0 
        ? results.slice(0, 50).join('\n') + (results.length > 50 ? `\n... and ${results.length - 50} more matches` : '')
        : 'No matches found'
    }
  }

  private async createDirectory(path: string): Promise<ToolResult> {
    try {
      const normalizedPath = path.startsWith('/') ? path : `/${path}`
      await this.wc.fs.mkdir(normalizedPath, { recursive: true })
      return { success: true, output: `Created directory: ${path}` }
    } catch (error) {
      return {
        success: false,
        output: '',
        error: `Failed to create directory: ${error instanceof Error ? error.message : String(error)}`
      }
    }
  }

  private async delete(path: string): Promise<ToolResult> {
    try {
      const normalizedPath = path.startsWith('/') ? path : `/${path}`
      await this.wc.fs.rm(normalizedPath, { recursive: true })
      return { success: true, output: `Deleted: ${path}` }
    } catch (error) {
      return {
        success: false,
        output: '',
        error: `Failed to delete: ${error instanceof Error ? error.message : String(error)}`
      }
    }
  }
}
