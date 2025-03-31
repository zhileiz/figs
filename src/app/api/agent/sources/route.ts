import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { prompt } from './prompt';
import { AISDKExporter } from 'langsmith/vercel';
import { getCSVSchemaTool, sampleCSVData, createNodeInKGForCSV, getKGSchemas, createEdgesInKGForCSV } from './tools';
export const maxDuration = 30;

export async function POST(req: Request) {
  const res = await req.json();
  const { messages, file_name, file_url } = res;

  const stream = streamText({
    model: openai('gpt-4o'),
    maxSteps: 5,
    messages,
    system: prompt(file_name, file_url),
    tools: {
      get_CSV_schema: getCSVSchemaTool,
      get_KG_schemas: getKGSchemas,
      sample_CSV_data: sampleCSVData,
      create_node_in_KG_for_CSV: createNodeInKGForCSV,
      create_edges_in_KG_for_CSV: createEdgesInKGForCSV
    },
    experimental_telemetry: AISDKExporter.getSettings(),
  });

  // Convert the stream to a proper Response object
  return stream.toDataStreamResponse();
}
