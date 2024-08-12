import { Anthropic } from "@anthropic-ai/sdk";
import { Ratelimit } from "@upstash/ratelimit";
import { kv } from "@vercel/kv";
import { StreamingTextResponse } from "ai";
import { match } from "ts-pattern";

export const runtime = "edge";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
  baseURL: process.env.ANTHROPIC_BASE_URL,
});

const getSystemMessage = (option: string): string => {
  return match(option)
    .with(
      "continue",
      () =>
        "You are an AI writing assistant that continues existing text based on context from prior text. Give more weight/priority to the later characters than the beginning ones. Limit your response to no more than 200 characters, but make sure to construct complete sentences. Use Markdown formatting when appropriate.",
    )
    .with(
      "improve",
      () =>
        "You are an AI writing assistant that improves existing text. Limit your response to no more than 200 characters, but make sure to construct complete sentences. Use Markdown formatting when appropriate.",
    )
    .with(
      "shorter",
      () => "You are an AI writing assistant that shortens existing text. Use Markdown formatting when appropriate.",
    )
    .with(
      "longer",
      () => "You are an AI writing assistant that lengthens existing text. Use Markdown formatting when appropriate.",
    )
    .with(
      "fix",
      () =>
        "You are an AI writing assistant that fixes grammar and spelling errors in existing text. Limit your response to no more than 200 characters, but make sure to construct complete sentences. Use Markdown formatting when appropriate.",
    )
    .with(
      "zap",
      () =>
        "You are an AI writing assistant that generates text based on a prompt. You take an input from the user and a command for manipulating the text. Use Markdown formatting when appropriate.",
    )
    .otherwise(() => {
      throw new Error("Invalid option");
    });
};

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({ message: "Missing ANTHROPIC_API_KEY - make sure to add it to your .env file." }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  // Rate limiting
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    const ip = req.headers.get("x-forwarded-for");
    const ratelimit = new Ratelimit({
      redis: kv,
      limiter: Ratelimit.slidingWindow(50, "1 d"),
    });

    const { success, limit, reset, remaining } = await ratelimit.limit(`novel_ratelimit_${ip}`);

    if (!success) {
      return new Response(JSON.stringify({ message: "You have reached your request limit for the day." }), {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "X-RateLimit-Limit": limit.toString(),
          "X-RateLimit-Remaining": remaining.toString(),
          "X-RateLimit-Reset": reset.toString(),
        },
      });
    }
  }

  try {
    const { prompt, option, command } = await req.json();

    if (!prompt || !option) {
      return new Response(JSON.stringify({ message: "Missing required parameters: prompt and option" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const systemMessage = getSystemMessage(option);

    const stream = await anthropic.messages.create({
      model: "claude-3-sonnet-20240229",
      max_tokens: 1000,
      system: systemMessage,
      messages: [
        {
          role: "user",
          content: option === "zap" ? `For this text: ${prompt}. You have to respect the command: ${command}` : prompt,
        },
      ],
      stream: true,
    });

    // Convert the Anthropic stream to a ReadableStream
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (chunk.type === "content_block_delta" && chunk.delta && "text" in chunk.delta) {
              controller.enqueue(chunk.delta.text);
            }
          }
        } catch (error) {
          console.error("Error processing stream:", error);
          controller.error(error);
        } finally {
          controller.close();
        }
      },
    });

    // Return a StreamingTextResponse
    return new StreamingTextResponse(readableStream);
  } catch (error) {
    console.error("Error processing request:", error);
    let message = "An error occurred while processing your request.";
    let status = 500;

    if (error instanceof Anthropic.APIError) {
      message = "Invalid request to AI model. Please try again.";
      status = 400;
    } else if (error instanceof Error && error.message === "Invalid option") {
      message = "Invalid option provided.";
      status = 400;
    }

    return new Response(JSON.stringify({ message }), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }
}
