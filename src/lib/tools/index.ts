// OpenCode Tools - The agentic tool system
// These are the tools the AI can use to interact with the codebase

export interface Tool {
  name: string
  description: string
  parameters: {
    type: 'object'
    properties: Record<string, {
      type: string
      description: string
      enum?: string[]
    }>
    required: string[]
  }
}

export const tools: Tool[] = [
  {
    name: 'bash',
    description: 'Execute a bash command in the terminal. Use this for running scripts, installing packages, git operations, and any shell commands. The command runs in a persistent shell session.',
    parameters: {
      type: 'object',
      properties: {
        command: {
          type: 'string',
          description: 'The bash command to execute'
        },
        timeout: {
          type: 'number',
          description: 'Timeout in milliseconds (default: 30000)'
        }
      },
      required: ['command']
    }
  },
  {
    name: 'read_file',
    description: 'Read the contents of a file at the specified path. Use this to examine code, configuration files, or any text file.',
    parameters: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'The path to the file to read (relative to workspace root)'
        },
        start_line: {
          type: 'number',
          description: 'Start reading from this line (1-indexed, optional)'
        },
        end_line: {
          type: 'number',
          description: 'Stop reading at this line (1-indexed, optional)'
        }
      },
      required: ['path']
    }
  },
  {
    name: 'write_file',
    description: 'Write content to a file. Creates the file if it does not exist, or overwrites if it does. Use this for creating new files or completely replacing file contents.',
    parameters: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'The path to the file to write'
        },
        content: {
          type: 'string',
          description: 'The content to write to the file'
        }
      },
      required: ['path', 'content']
    }
  },
  {
    name: 'edit_file',
    description: 'Make a targeted edit to a file by replacing a specific string with new content. The old_string must match exactly (including whitespace and indentation). Use this for modifying existing code.',
    parameters: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'The path to the file to edit'
        },
        old_string: {
          type: 'string',
          description: 'The exact string to find and replace (must match exactly)'
        },
        new_string: {
          type: 'string',
          description: 'The string to replace old_string with'
        }
      },
      required: ['path', 'old_string', 'new_string']
    }
  },
  {
    name: 'list_directory',
    description: 'List files and directories at the specified path. Returns names with / suffix for directories.',
    parameters: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'The directory path to list (default: "/")'
        }
      },
      required: []
    }
  },
  {
    name: 'glob',
    description: 'Find files matching a glob pattern. Use this to discover files in the codebase.',
    parameters: {
      type: 'object',
      properties: {
        pattern: {
          type: 'string',
          description: 'The glob pattern to match (e.g., "**/*.ts", "src/**/*.js")'
        }
      },
      required: ['pattern']
    }
  },
  {
    name: 'grep',
    description: 'Search for a pattern in files. Returns matching lines with file paths and line numbers.',
    parameters: {
      type: 'object',
      properties: {
        pattern: {
          type: 'string',
          description: 'The search pattern (regex supported)'
        },
        path: {
          type: 'string',
          description: 'Directory or file to search in (default: "/")'
        },
        include: {
          type: 'string',
          description: 'Glob pattern to filter files (e.g., "*.ts")'
        }
      },
      required: ['pattern']
    }
  },
  {
    name: 'create_directory',
    description: 'Create a new directory at the specified path. Creates parent directories if needed.',
    parameters: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'The path of the directory to create'
        }
      },
      required: ['path']
    }
  },
  {
    name: 'delete',
    description: 'Delete a file or directory. Use with caution.',
    parameters: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'The path to delete'
        }
      },
      required: ['path']
    }
  },
  {
    name: 'think',
    description: 'Use this tool to think through complex problems step by step. This helps with planning, debugging, and reasoning about code.',
    parameters: {
      type: 'object',
      properties: {
        thought: {
          type: 'string',
          description: 'Your detailed thought process'
        }
      },
      required: ['thought']
    }
  }
]

// Convert to OpenAI function format
export function getOpenAITools() {
  return tools.map(tool => ({
    type: 'function' as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters
    }
  }))
}

// Convert to Anthropic tool format
export function getAnthropicTools() {
  return tools.map(tool => ({
    name: tool.name,
    description: tool.description,
    input_schema: tool.parameters
  }))
}
