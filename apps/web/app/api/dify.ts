import { resolve } from "path";
import { config } from "dotenv";
import type { DifyEventData, DifyRequestBody, DifyResponse } from "./types";

const envPath = resolve(process.cwd(), ".env.local");
config({ path: envPath });

const BASE_URL = process.env.DIFY_API_URL || "https://api.dify.ai/v1";
const API_KEY = process.env.DIFY_API_KEY;

if (typeof window === "undefined" && !API_KEY) {
  throw new Error("DIFY_API_KEY is not set in the .env.local file");
}

function getApiKey(): string {
  if (!API_KEY) {
    throw new Error("DIFY_API_KEY is not set in the .env.local file");
  }
  return API_KEY;
}

type ApiResponse = {
  data?: ApplicationParameter[];
  // Add other possible properties here
};

const cache = new Map<string, ApiResponse>();

async function cachedFetch(url: string, options: RequestInit): Promise<ApiResponse> {
  const cacheKey = `${url}${JSON.stringify(options)}`;
  if (cache.has(cacheKey)) {
    const cachedResponse = cache.get(cacheKey);
    if (cachedResponse) {
      return cachedResponse;
    }
  }
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  cache.set(cacheKey, data);
  return data;
}

const rateLimiter = (() => {
  const requests: number[] = [];
  const WINDOW_MS = 60000;
  const MAX_REQUESTS = 10;
  return {
    check: (): boolean => {
      const now = Date.now();
      const windowStart = now - WINDOW_MS;
      requests.push(now);
      while (requests.length > 0 && requests[0] <= windowStart) {
        requests.shift();
      }
      return requests.length <= MAX_REQUESTS;
    },
  };
})();

export interface ApplicationParameter {
  key: string;
  name: string;
  type: string;
  required: boolean;
  max_length?: number;
}

// The getApplicationFormat function has been removed as per instructions.

export async function getApplicationParameters(user: string): Promise<ApplicationParameter[]> {
  const apiKey = getApiKey();
  const url = new URL(`${BASE_URL}/parameters`);
  url.searchParams.append("user", user);

  try {
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return (
      data.user_input_form?.map((item: Record<string, unknown>) => {
        const [type, details] = Object.entries(item)[0];
        if (typeof details === "object" && details !== null) {
          return {
            key: String((details as Record<string, unknown>).variable || ""),
            name: String((details as Record<string, unknown>).label || ""),
            type: type,
            required: Boolean((details as Record<string, unknown>).required),
            max_length: Number((details as Record<string, unknown>).max_length) || undefined,
          };
        }
        throw new Error("Invalid item structure in user_input_form");
      }) || []
    );
  } catch (error) {
    console.error("Error fetching application parameters:", error);
    throw error;
  }
}

export async function runDifyWorkflow(requestBody: DifyRequestBody): Promise<DifyResponse> {
  console.log("runDifyWorkflow called with:", JSON.stringify(requestBody, null, 2));

  const apiKey = getApiKey();

  if (!rateLimiter.check()) {
    throw new Error("Rate limit exceeded. Please try again later.");
  }

  try {
    const url = `${BASE_URL}/workflows/run`;
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    };
    const body = JSON.stringify(requestBody);

    if (!url.startsWith("http")) {
      throw new Error(`Invalid API URL: ${url}`);
    }
    if (!headers.Authorization) {
      throw new Error("Missing API key in Authorization header");
    }
    if (!body) {
      throw new Error("Empty request body");
    }

    const response = await fetch(url, {
      method: "POST",
      headers: headers,
      body: body,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("Failed to get response reader");
    }

    const responseData: DifyResponse = {
      workflow_run_id: "",
      task_id: "",
      data: {
        id: "",
        workflow_id: "",
        status: "running",
        outputs: {},
        created_at: "",
      },
    };

    let generatedText = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = new TextDecoder().decode(value);
      const events = chunk.split("\n\n").filter(Boolean);

      for (const event of events) {
        if (event.startsWith("data: ")) {
          try {
            const data: DifyEventData = JSON.parse(event.slice(6));
            switch (data.event) {
              case "workflow_started":
                if (data.workflow_run_id) responseData.workflow_run_id = data.workflow_run_id;
                if (data.task_id) responseData.task_id = data.task_id;
                if (data.data?.id) responseData.data.id = data.data.id;
                if (data.data?.workflow_id) responseData.data.workflow_id = data.data.workflow_id;
                if (data.data?.created_at)
                  responseData.data.created_at = new Date(data.data.created_at * 1000).toISOString();
                break;
              case "text_chunk":
                if (data.data?.text) {
                  const decodedText = decodeURIComponent(JSON.parse(`"${data.data.text}"`));
                  generatedText += decodedText;
                }
                break;
              case "workflow_finished":
                if (data.data?.status)
                  responseData.data.status = data.data.status as "running" | "completed" | "failed";
                responseData.data.outputs = {
                  generated_text: generatedText,
                };
                if (data.data?.error) responseData.data.error = data.data.error;
                if (data.data?.elapsed_time) responseData.data.elapsed_time = data.data.elapsed_time;
                if (data.data?.total_tokens) responseData.data.total_tokens = data.data.total_tokens;
                if (data.data?.total_steps) responseData.data.total_steps = data.data.total_steps;
                if (data.data?.finished_at)
                  responseData.data.finished_at = new Date(data.data.finished_at * 1000).toISOString();
                break;
              case "error":
                throw new Error(data.error);
            }
          } catch (e) {
            console.warn("Failed to parse JSON:", event);
          }
        }
      }
    }

    console.log("Dify API response:", JSON.stringify(responseData, null, 2));
    return responseData;
  } catch (error) {
    console.error("Error in runDifyWorkflow:", error);
    throw error;
  }
}

export async function stopGeneration(taskId: string): Promise<void> {
  const apiKey = getApiKey();

  try {
    const response = await fetch(`${BASE_URL}/workflows/stop`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ task_id: taskId }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (data.error) {
      throw new Error(`Dify API error: ${data.error}`);
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to stop generation: ${error.message}`);
    }
    throw new Error("An unknown error occurred while stopping generation");
  }
}

export async function formatRequestBody(
  language: string,
  topic: string,
  style: string,
  persona: string,
  originalArticle: string,
  user: string,
): Promise<DifyRequestBody> {
  const appParameters = await getApplicationParameters(user);

  const formattedInputs: { [key: string]: string } = {
    language,
    topic,
    style,
    persona_json: persona,
    post_orig: originalArticle,
  };

  // Add any missing required parameters with default values
  appParameters.forEach((param) => {
    if (param.required && !(param.key in formattedInputs)) {
      formattedInputs[param.key] = ""; // or some default value
    }
  });
  return {
    inputs: formattedInputs as {
      language: string;
      topic: string;
      style: string;
      persona_json: string;
      post_orig: string;
    },
    user,
    response_mode: "streaming",
  };
}
