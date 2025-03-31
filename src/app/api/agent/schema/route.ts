import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { prompt } from './prompt';
import { createNodeSchema, 
  renameNodeSchema, 
  updateNodeSchema, 
  deleteNodeSchema, 
  getAllNodeSchemas, 
  retrieveNodeSchema,
  createEdgeSchema,
  renameEdgeSchema,
  updateEdgeSchema,
  deleteEdgeSchema,
  getAllEdgeSchemas,
  retrieveEdgeSchema
} from './tools';

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const stream = streamText({
    model: openai('gpt-4o'),
    maxSteps: 3, // Allow multiple steps for reasoning and tool use
    messages,
    system: prompt,
    tools: {
      createNodeSchema: createNodeSchema,
      renameNodeSchema: renameNodeSchema,
      updateNodeSchema: updateNodeSchema,
      deleteNodeSchema: deleteNodeSchema,
      getAllNodeSchemas: getAllNodeSchemas,
      retrieveNodeSchema: retrieveNodeSchema,
      createEdgeSchema: createEdgeSchema,
      renameEdgeSchema: renameEdgeSchema,
      updateEdgeSchema: updateEdgeSchema,
      deleteEdgeSchema: deleteEdgeSchema,
      getAllEdgeSchemas: getAllEdgeSchemas,
      retrieveEdgeSchema: retrieveEdgeSchema
    },
  });

  // Convert the stream to a proper Response object
  return stream.toDataStreamResponse();
}
