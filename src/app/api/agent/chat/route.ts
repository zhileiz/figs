import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { prompt } from './prompt';
import { countNodes, countEdges, runCypherQuery, getKGSchemas } from './tools';
import { AISDKExporter } from 'langsmith/vercel';

export const maxDuration = 30;

function errorHandler(error: unknown) {
  if (error == null) {
    return 'unknown error';
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return JSON.stringify(error);
}

export async function POST(req: Request) {
  const { messages, systemPrompt } = await req.json();

  const stream = streamText({
    model: openai('gpt-4o'),
    maxSteps: 20, // Allow multiple steps for reasoning and tool use
    messages,
    system: systemPrompt || prompt,
    tools: {
      countNodes: countNodes,
      countEdges: countEdges,
      runCypherQuery: runCypherQuery,
      getKGSchemas: getKGSchemas,
    },
    experimental_telemetry: AISDKExporter.getSettings(),
  });

  // Convert the stream to a proper Response object
  return stream.toDataStreamResponse({
    getErrorMessage: errorHandler,
  });
}