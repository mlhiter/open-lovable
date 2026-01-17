import { inngest } from './client'
import { createAgent, anthropic, createTool, createNetwork } from '@inngest/agent-kit'
import { Sandbox } from 'e2b'
import { getSandbox, lastAssistantTextMessageContent } from './utils'
import z from 'zod'
import { PROMPT } from '@/prompt'

export const helloWorld = inngest.createFunction(
  { id: 'hello-world' },
  { event: 'test/hello.world' },
  async ({ event, step }) => {
    const sandboxId = await step.run('get-sandbox-id', async () => {
      const sandbox = await Sandbox.create('vibe-nextjs-mlhier')
      return sandbox.sandboxId
    })

    const codeAgent = createAgent({
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
          handler: async ({ files }, { step, network }) => {
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

    const network = createNetwork({
      name: 'coding-agent-network',
      agents: [codeAgent],
      maxIter: 15,
      router: async ({ network }) => {
        const summary = network.state.data.summary
        if (summary) {
          return
        }
        return codeAgent
      },
    })

    const result = await network.run(event.data.value)

    const sandboxUrl = await step.run('get-sandbox-url', async () => {
      const sandbox = await getSandbox(sandboxId)
      const host = sandbox.getHost(3000)
      return `http://${host}`
    })

    return { url: sandboxUrl, title: 'Fragment', files: result.state.data.files, summary: result.state.data.summary }
  }
)
