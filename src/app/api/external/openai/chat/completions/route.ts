// app/api/v1/chat/completions/route.ts
import { openai } from '@ai-sdk/openai';
import {
  CoreMessage,
  generateText,
  streamText,
//   TextStreamPart,
  FinishReason,
//   ToolCall,
//   ToolResult,
//   CoreToolMessage,
//   CoreAssistantMessage,
//   CoreUserMessage,
//   CoreSystemMessage,
} from 'ai';
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

// Define the expected request body schema based on OpenAI's documentation
// We'll keep it relatively simple for this example
const OpenAIChatCompletionRequestSchema = z.object({
  model: z.string(), // We'll use this to potentially select a model later, but primarily use our configured one
  messages: z.array(
    z.object({
      role: z.enum(['system', 'user', 'assistant', 'tool']),
      content: z.any(), // Allow string or complex content (for user messages)
      // Optional fields for tool calls/results if needed
      tool_call_id: z.string().optional(),
      name: z.string().optional(), // Corresponds to toolName
    }),
  ),
  stream: z.boolean().optional().default(false),
  temperature: z.number().optional(),
  top_p: z.number().optional(),
  max_tokens: z.number().optional(),
  stop: z.union([z.string(), z.array(z.string())]).optional(),
  presence_penalty: z.number().optional(),
  frequency_penalty: z.number().optional(),
  seed: z.number().optional(),
  // tools: z.any().optional(), // Add if you need tool support
  // tool_choice: z.any().optional(), // Add if you need tool support
});

// Helper function to map Vercel AI SDK finishReason to OpenAI finish_reason
function mapFinishReason(
  finishReason: FinishReason | undefined,
): 'stop' | 'length' | 'tool_calls' | 'content_filter' | 'error' | null {
  if (!finishReason) return null;
  switch (finishReason) {
    case 'stop':
      return 'stop';
    case 'length':
      return 'length';
    case 'tool-calls':
      return 'tool_calls';
    case 'content-filter':
      return 'content_filter';
    case 'error':
    case 'other':
    case 'unknown':
    default:
      return null; // Or map 'error' specifically if needed
  }
}

export async function POST(req: NextRequest) {
  try {
    const requestBody = await req.json();
    const validation = OpenAIChatCompletionRequestSchema.safeParse(requestBody);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: {
            message: 'Invalid request body',
            errors: validation.error.flatten().fieldErrors,
          },
        },
        { status: 400 },
      );
    }

    const {
      model: requestedModelId, // We might use this later if supporting multiple models
      messages,
      stream,
      temperature,
      top_p,
      max_tokens,
      stop,
      presence_penalty,
      frequency_penalty,
      seed,
      // tools, // Add if needed
      // tool_choice, // Add if needed
    } = validation.data;

    // --- Model Selection ---
    // For now, use a predefined model from environment variables.
    // You could add logic here to select different models based on `requestedModelId`.
    const modelName = process.env.OPENAI_MODEL_NAME || 'gpt-4o'; // Default to gpt-4o
    const model = openai(modelName, {
        // Add any default provider options here if needed
        // e.g., apiKey: process.env.SPECIFIC_KEY
    });

    // --- Map Parameters ---
    const options = {
      // messages: messages, // Directly pass validated messages, Vercel SDK should handle format
      // Vercel AI SDK expects CoreMessage[], ensure compatibility or map
      messages: messages as CoreMessage[], // Cast for now, may need mapping for complex cases like image URLs
      temperature,
      topP: top_p,
      maxTokens: max_tokens,
      stopSequences: Array.isArray(stop) ? stop : stop ? [stop] : undefined,
      presencePenalty: presence_penalty,
      frequencyPenalty: frequency_penalty,
      seed,
      // tools, // Pass mapped tools if needed
      // toolChoice, // Pass mapped toolChoice if needed
    };

    // --- Handle Request ---
    if (!stream) {
      // --- Blocking Response ---
      const result = await generateText({ model, ...options });

      const responseId = `chatcmpl-${uuidv4()}`;
      const created = Math.floor(Date.now() / 1000);
      const finish_reason = mapFinishReason(result.finishReason);

      const responsePayload = {
        id: responseId,
        object: 'chat.completion',
        created: created,
        model: model.modelId, // Use the actual model ID from the SDK instance
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant' as const,
              content: result.text,
              // Add tool_calls here if generated: result.toolCalls
            },
            finish_reason: finish_reason,
            // logprobs: null, // Add if available and needed
          },
        ],
        usage: {
          prompt_tokens: result.usage.promptTokens,
          completion_tokens: result.usage.completionTokens,
          total_tokens: result.usage.totalTokens,
        },
        // system_fingerprint: null, // Add if available
      };

      return NextResponse.json(responsePayload);

    } else {
      // --- Streaming Response ---
      const result = await streamText({ model, ...options });

      const responseId = `chatcmpl-${uuidv4()}`;
      const created = Math.floor(Date.now() / 1000);
      const encoder = new TextEncoder();
      let sentFirstChunk = false; // To send the initial role chunk

      const readableStream = new ReadableStream({
        async start(controller) {
          try {
            for await (const part of result.fullStream) {
                // OpenAI stream chunks need ID, model, created etc. on each chunk
                const chunkBase = {
                    id: responseId,
                    object: 'chat.completion.chunk' as const,
                    created: created,
                    model: model.modelId,
                }

                let delta: { role?: 'assistant'; content?: string | null; tool_calls?: any[] } = {};
                let finish_reason: ReturnType<typeof mapFinishReason> | undefined = undefined;
                let sendChunk = false;

                // Handle first chunk specially to include role
                if (!sentFirstChunk && (part.type === 'text-delta' || part.type === 'tool-call')) { // or other content starting types
                    delta.role = 'assistant';
                    sentFirstChunk = true;
                    // Combine role with the first content delta if possible
                    if (part.type === 'text-delta') {
                        delta.content = part.textDelta;
                    }
                    // Handle first tool call delta etc. if needed
                    sendChunk = true;
                } else if (part.type === 'text-delta') {
                    delta.content = part.textDelta;
                    sendChunk = true;
                } else if (part.type === 'tool-call') {
                    // Basic tool call handling (sends the whole call in one chunk)
                    // More complex handling needed for streaming tool args ('tool-call-delta')
                     delta.tool_calls = [{
                        index: 0, // Assuming one tool call at a time for simplicity
                        id: part.toolCallId,
                        type: 'function', // Assuming 'function' type
                        function: {
                            name: part.toolName,
                            arguments: JSON.stringify(part.args), // OpenAI expects stringified JSON
                        }
                    }]
                    sendChunk = true;
                } else if (part.type === 'finish') {
                    finish_reason = mapFinishReason(part.finishReason);
                    delta = {}; // Ensure delta is empty for finish chunk
                    sendChunk = true;
                } else if (part.type === 'error') {
                    console.error('Error during stream:', part.error);
                    // You might want to send an error in the stream or just close
                    // controller.error(part.error); // This might terminate abruptly
                    // Sending a custom error format:
                    const errorChunk = { ...chunkBase, choices: [{ index: 0, delta: { content: `Stream error: ${part.error}`}, finish_reason: 'error' }] };
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorChunk)}\n\n`));
                    // Then maybe close or send [DONE] - depends on desired client behavior
                    break; // Stop streaming on error
                }
                // Ignore other part types ('step-start', 'step-finish', 'reasoning', etc.) for basic OpenAI compatibility

                if (sendChunk) {
                   const chunkPayload = {
                    ...chunkBase,
                    choices: [
                        {
                            index: 0,
                            delta: delta,
                            finish_reason: finish_reason,
                            // logprobs: null,
                        },
                    ],
                    // usage: null, // Usage is typically not in chunks, only in the final block response
                    // system_fingerprint: null,
                   }
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunkPayload)}\n\n`));
                }

                 // If this was the finish chunk, send [DONE] and close
                 if (finish_reason) {
                    controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                    controller.close();
                    break;
                }

            }
          } catch (error) {
             console.error('Error processing stream:', error);
             // Try to send an error message before closing if possible
             try {
                const errorData = { error: { message: 'Internal server error during stream processing' } };
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorData)}\n\n`));
             } catch {}
             controller.error(error); // Close the stream with an error
          } finally {
             // Ensure the stream is closed if the loop finishes unexpectedly without a 'finish' event
             try {
                 controller.close();
             } catch {}
          }
        },
        cancel(reason) {
            console.log('Stream cancelled:', reason);
            // You might want to call an abort controller associated with the streamText call if available
        }
      });

      return new Response(readableStream, {
        headers: {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
          'Connection': 'keep-alive',
          'X-Accel-Buffering': 'no', // Important for some reverse proxies like Nginx
        },
      });
    }
  } catch (error: any) {
    console.error('API Error:', error);
    const errorMessage = error.message || 'An unexpected error occurred';
    const status = error.status || 500; // Use status from error if available

    // Return OpenAI-compatible error structure
    return NextResponse.json(
      {
        error: {
          message: errorMessage,
          type: error.name || 'internal_server_error',
          param: null, // Add if relevant
          code: error.code || null, // Add if relevant
        },
      },
      { status: status },
    );
  }
}

// Add this if you want to handle OPTIONS requests for CORS, etc.
export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

// Required for Edge Runtime (though this example might exceed limits if models are large)
// export const runtime = 'edge';
// Remove or set to 'nodejs' if using Node.js specific APIs or larger dependencies
export const runtime = 'nodejs'; // Recommended for flexibility unless edge is required