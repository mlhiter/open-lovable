import { inngest } from './client'
import { createAgent, anthropic, createTool, createNetwork, Tool, Message, createState } from '@inngest/agent-kit'
import { Sandbox } from 'e2b'
import { getSandbox, lastAssistantTextMessageContent } from './utils'
import z from 'zod'
import { FRAGMENT_TITLE_PROMPT, PROMPT, RESPONSE_PROMPT } from '@/prompt'
import prisma from '@/lib/db'
import { parseAgentOutput } from '@/lib/utils'

interface AgentState {
  summary: string
  files: { [path: string]: string }
}

export const codeAgentFunction = inngest.createFunction(
  { id: 'code-agent' },
  { event: 'code-agent/run' },
  async ({ event, step }) => {
    const sandboxId = await step.run('get-sandbox-id', async () => {
      const sandbox = await Sandbox.create('vibe-nextjs-mlhier')
      await sandbox.setTimeout(60_000 * 10 * 2)
      return sandbox.sandboxId
    })

    const previousMessages = await step.run('get-previous-messages', async () => {
      const formattedMessages: Message[] = []
      const messages = await prisma.message.findMany({
        where: {
          projectId: event.data.projectId,
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      for (const message of messages) {
        formattedMessages.push({
          type: 'text',
          role: message.role === 'USER' ? 'user' : 'assistant',
          content: message.content,
        })
      }

      return formattedMessages
    })

    const state = createState<AgentState>(
      {
        summary: '',
        files: {},
      },
      {
        messages: previousMessages,
      }
    )

    const codeAgent = createAgent<AgentState>({
      name: 'code-agent',
      description: 'An expert coding agent',
      system: PROMPT,
      model: anthropic({
        model: 'claude-sonnet-4-5-20250929',
        baseUrl: process.env.ANTHROPIC_API_BASE_URL,
        defaultParameters: {
          temperature: 0.1,
          max_tokens: 32000,
        },
      }),
      tools: [
        createTool({
          name: 'terminal',
          description: 'Execute commands in the terminal',
          parameters: z.object({
            command: z.string(),
          }),
          handler: async ({ command }, { step }) => {
            return await step?.run('terminal', async () => {
              const buffers = { stdout: '', stderr: '' }

              try {
                const sandbox = await getSandbox(sandboxId)
                const result = await sandbox.commands.run(command, {
                  onStdout: (data) => {
                    buffers.stdout += data
                  },
                  onStderr: (data) => {
                    buffers.stderr += data
                  },
                })
                return result.stdout
              } catch (e) {
                console.error(`Command failed: ${e}\nstout:${buffers.stdout}\nstderr:${buffers.stderr}`)
                return `Command failed: ${e}\nstout:${buffers.stdout}\nstderr:${buffers.stderr}`
              }
            })
          },
        }),
        createTool({
          name: 'createOrUpdateFiles',
          description: 'Create or update files in the sandbox',
          parameters: z.object({
            files: z.array(
              z.object({
                path: z.string(),
                content: z.string(),
              })
            ),
          }),
          handler: async ({ files }, { step, network }: Tool.Options<AgentState>) => {
            const newFiles = await step?.run('createOrUpdateFiles', async () => {
              try {
                const updatedFiles = network.state.data.files || {}
                const sandbox = await getSandbox(sandboxId)
                for (const file of files) {
                  await sandbox.files.write(file.path, file.content)
                  updatedFiles[file.path] = file.content
                }
                return updatedFiles
              } catch (e) {
                console.error(`Failed to create or update files: ${e}`)
                return `Failed to create or update files: ${e}`
              }
            })

            if (typeof newFiles === 'object') {
              network.state.data.files = newFiles
            }
          },
        }),
        createTool({
          name: 'readFiles',
          description: 'Read files from the sandbox',
          parameters: z.object({
            files: z.array(z.string()),
          }),
          handler: async ({ files }, { step }) => {
            return await step?.run('readFiles', async () => {
              try {
                const sandbox = await getSandbox(sandboxId)
                const contents = []
                for (const file of files) {
                  const content = await sandbox.files.read(file)
                  contents.push({ path: file, content })
                }
                return JSON.stringify(contents)
              } catch (e) {
                return 'Error' + e
              }
            })
          },
        }),
      ],
      lifecycle: {
        onResponse: async ({ result, network }) => {
          const lastAssistantTextMessageText = lastAssistantTextMessageContent(result)

          if (lastAssistantTextMessageText && network) {
            if (lastAssistantTextMessageText.includes('<task_summary>')) {
              network.state.data.summary = lastAssistantTextMessageText
            }
          }
          return result
        },
      },
    })

    const network = createNetwork<AgentState>({
      name: 'coding-agent-network',
      agents: [codeAgent],
      maxIter: 15,
      defaultState: state,
      router: async ({ network }) => {
        const summary = network.state.data.summary
        if (summary) {
          return
        }
        return codeAgent
      },
    })

    const result = await network.run(event.data.value, {
      state: state,
    })

    const fragmentTitleGenerator = createAgent<AgentState>({
      name: 'fragment-title-generator',
      description: 'An expert fragment title generator',
      system: FRAGMENT_TITLE_PROMPT,
      model: anthropic({
        model: 'claude-haiku-4-5-20251001',
        baseUrl: process.env.ANTHROPIC_API_BASE_URL,
        defaultParameters: {
          temperature: 0.1,
          max_tokens: 32000,
        },
      }),
    })

    const responseGenerator = createAgent<AgentState>({
      name: 'response-generator',
      description: 'An expert response generator',
      system: RESPONSE_PROMPT,
      model: anthropic({
        model: 'claude-haiku-4-5-20251001',
        baseUrl: process.env.ANTHROPIC_API_BASE_URL,
        defaultParameters: {
          temperature: 0.1,
          max_tokens: 32000,
        },
      }),
    })

    const { output: fragmentTitleOutput } = await fragmentTitleGenerator.run(result.state.data.summary)
    const { output: responseOutput } = await responseGenerator.run(result.state.data.summary)

    const isError = !result.state.data.summary || Object.keys(result.state.data.files || {}).length === 0

    const sandboxUrl = await step.run('get-sandbox-url', async () => {
      const sandbox = await getSandbox(sandboxId)
      const host = sandbox.getHost(3000)
      return `http://${host}`
    })

    await step.run('save-result', async () => {
      if (isError) {
        return await prisma.message.create({
          data: {
            projectId: event.data.projectId,
            content: 'Something went wrong.Please try again.',
            role: 'ASSISTANT',
            type: 'ERROR',
          },
        })
      }
      return await prisma.message.create({
        data: {
          projectId: event.data.projectId,
          content: parseAgentOutput(responseOutput),
          role: 'ASSISTANT',
          type: 'RESULT',
          fragment: {
            create: {
              sandboxUrl: sandboxUrl,
              title: parseAgentOutput(fragmentTitleOutput),
              files: result.state.data.files,
            },
          },
        },
      })
    })

    return { url: sandboxUrl, title: 'Fragment', files: result.state.data.files, summary: result.state.data.summary }
  }
)
