"use client";

import type React from "react";
import { useCallback, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { createEventSource, runDifyWorkflow } from "../../app/api/dify";
import type { DifyRequestBody, DifyResponse } from "../../app/api/types";

const TestDify: React.FC = () => {
  const [result, setResult] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [detailedError, setDetailedError] = useState<string | null>(null);

  const handleError = useCallback((error: unknown) => {
    console.error("Error in Dify API call:", error);
    if (error instanceof Error) {
      setError(error.message);
      setDetailedError(
        JSON.stringify(
          {
            name: error.name,
            message: error.message,
            stack: error.stack,
            cause: error.cause,
          },
          null,
          2,
        ),
      );
    } else {
      setError("An unknown error occurred");
      setDetailedError(JSON.stringify(error, null, 2));
    }
  }, []);

  const testDifyAPI = async () => {
    console.log("Environment:", process.env.NODE_ENV);
    console.log("Test function called");
    setResult("");
    setError(null);
    setDetailedError(null);

    const testBody: DifyRequestBody = {
      inputs: {
        language: "繁體中文 台灣",
        topic: "Warren Buffett talks about copywriting",
        style: "business writer",
        persona_json: "",
        post_orig: "sadsd",
      },
      user: "a549d539-3171-4e53-8ece-e574e82913e4",
      response_mode: "streaming",
    };

    try {
      console.log("Sending request to Dify API...");
      const response: DifyResponse = await runDifyWorkflow(testBody);
      let fullResponse = response.data.outputs?.generated_text || "";
      setResult(fullResponse);
      console.log("Dify API Response:", JSON.stringify(response, null, 2));

      const eventSource = createEventSource(testBody);

      eventSource.onmessage = (event: MessageEvent) => {
        const data = JSON.parse(event.data);
        console.log("Received event data:", JSON.stringify(data, null, 2));

        if (data.event === "text_chunk" && data.data?.text) {
          fullResponse += data.data.text;
          setResult(fullResponse);
        } else if (data.event === "workflow_finished") {
          console.log("Workflow finished:", data.status);
          eventSource.close();
        } else if (data.event === "error") {
          eventSource.close();
          handleError(new Error(data.error));
        }
      };

      eventSource.onerror = (error: Event) => {
        console.error("EventSource failed:", error);
        eventSource.close();
        handleError(new Error("Connection to the server was lost. Please try again."));
      };

      // Add a cleanup function to ensure EventSource is closed
      return () => {
        eventSource.close();
      };
    } catch (error) {
      handleError(error);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Test Dify API</h1>
      <button
        onClick={testDifyAPI}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        type="button"
      >
        Send Test Data
      </button>
      {result && (
        <div className="mt-4">
          <h2 className="text-xl font-semibold mb-2">Result:</h2>
          <div className="w-full h-96 bg-gray-800 text-white p-4 rounded text-xs overflow-auto">
            <ReactMarkdown
              className="prose prose-invert max-w-none text-xs"
              components={{
                code({ node, inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || "");
                  return !inline && match ? (
                    <SyntaxHighlighter
                      {...props}
                      style={oneDark}
                      language={match[1]}
                      PreTag="div"
                      customStyle={{ fontSize: "0.75rem" }}
                    >
                      {String(children).replace(/\n$/, "")}
                    </SyntaxHighlighter>
                  ) : (
                    <code {...props} className={className} style={{ fontSize: "0.75rem" }}>
                      {children}
                    </code>
                  );
                },
              }}
            >
              {result}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestDify;
