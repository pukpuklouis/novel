export interface DifyRequestBody {
  inputs: {
    language: string;
    topic: string;
    style: string;
    persona_json: string;
    post_orig: string;
  };
  user: string;
  response_mode: "streaming";
}

// Update the DifyResponse type
export interface DifyResponse {
  workflow_run_id: string;
  task_id: string;
  event_stream_url?: string; // Add this optional property
  data: {
    id: string;
    workflow_id: string;
    status: "running" | "completed" | "failed";
    outputs: {
      generated_text?: string; // Make this optional
    };
    created_at: string;
    error?: string;
    elapsed_time?: number;
    total_tokens?: number;
    total_steps?: number;
    finished_at?: string;
  };
}

export interface DifyEventData {
  event: "workflow_started" | "text_chunk" | "workflow_finished" | "error";
  workflow_run_id?: string;
  task_id?: string;
  data?: {
    id?: string;
    workflow_id?: string;
    status?: "running" | "succeeded" | "failed" | "stopped";
    text?: string;
    error?: string;
    elapsed_time?: number;
    total_tokens?: number;
    total_steps?: number;
    created_at?: number;
    finished_at?: number;
  };
  error?: string;
}
