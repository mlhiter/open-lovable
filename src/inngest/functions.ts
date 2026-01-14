import { inngest } from "./client";
import { createAgent, openai } from '@inngest/agent-kit';

const dbaAgent = createAgent({
  name: 'Database administrator',
  description: 'Provides expert support for managing PostgreSQL databases',
  system:
    'You are a PostgreSQL expert database administrator. ' +
    'You only provide answers to questions related to PostgreSQL database schema, indexes, and extensions.',
  model: openai({
    model: 'claude-sonnet-4-5-20250929',
    baseUrl: process.env.OPENAI_API_BASE_URL,
  }),
});
export const helloWorld = inngest.createFunction(
  { id: "hello-world" },
  { event: "test/hello.world" },
  async ({ event, step }) => {
   const {output} = await dbaAgent.run(
      `Answer the question: ${event.data.value}`,
    );

    console.log("Agent output:", output);

    return { success:'ok' };
  },
);