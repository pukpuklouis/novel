import Markdown from "marked-react";
import type React from "react";
import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { runDifyWorkflow, stopGeneration } from "../app/api/dify";
import type { DifyRequestBody, DifyResponse } from "../app/api/types";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";

const ErrorMessage: React.FC<{ message: string }> = ({ message }) => (
  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
    <strong className="font-bold">Error: </strong>
    <span className="block sm:inline">{message}</span>
  </div>
);

const Post2Thread: React.FC = () => {
  console.log("Post2Thread component rendering");
  const [formState, setFormState] = useState({
    language: "",
    topic: "",
    writerStyle: "",
    persona: "",
    originalArticle: "",
  });
  const [generatedContent, setGeneratedContent] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormState({ ...formState, [e.target.name]: e.target.value });
  };

  const handleApiError = (error: unknown) => {
    console.error("API Error:", error);
    let errorMessage = "An unexpected error occurred. Please try again.";

    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === "string") {
      errorMessage = error;
    }

    setError(errorMessage);
    setIsGenerating(false);
    setTaskId(null);
  };

  const validateInputs = () => {
    const errors: Record<string, string> = {};
    if (!formState.language) errors.language = "Language is required";
    if (!formState.topic) errors.topic = "Topic is required";
    if (!formState.writerStyle) errors.writerStyle = "Writer style is required";
    if (formState.topic && formState.topic.length > 100) errors.topic = "Topic must be 100 characters or less";
    if (formState.persona && formState.persona.length > 1000)
      errors.persona = "Persona must be 1000 characters or less";
    if (formState.originalArticle && formState.originalArticle.length > 10000)
      errors.originalArticle = "Original article must be 5000 characters or less";

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const sanitizeInput = (input: string) => {
    return input.replace(/<[^>]*>?/gm, "").trim();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setError(null);
    setGeneratedContent("");
    setTaskId(null);

    if (!validateInputs()) {
      setIsGenerating(false);
      return;
    }

    const requestBody: DifyRequestBody = {
      inputs: {
        language: formState.language,
        topic: sanitizeInput(formState.topic),
        style: formState.writerStyle,
        persona_json: sanitizeInput(formState.persona),
        post_orig: sanitizeInput(formState.originalArticle),
      },
      response_mode: "streaming",
      user: uuidv4(),
    };

    try {
      const response: DifyResponse = await runDifyWorkflow(requestBody);

      if (response.task_id) {
        setTaskId(response.task_id);
      }

      // Update generatedContent from responseData
      if (response.data?.outputs?.generated_text) {
        setGeneratedContent(response.data.outputs.generated_text);
      }

      if (response.data?.status === "failed") {
        throw new Error(response.data.error || "Workflow failed");
      }

      setIsGenerating(false);
    } catch (error) {
      handleApiError(error);
    }
  };

  const handleStopGeneration = async () => {
    if (taskId) {
      try {
        await stopGeneration(taskId);
        setIsGenerating(false);
        setTaskId(null);
      } catch (error) {
        console.error("Error stopping generation:", error);
        handleApiError("Failed to stop generation. Please try again.");
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-2">
        <Label className="w-24">輸出語言:</Label>
        <Select onValueChange={(value) => setFormState({ ...formState, language: value })} value={formState.language}>
          <SelectTrigger>
            <SelectValue placeholder="輸出文章的語言" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="English">English</SelectItem>
            <SelectItem value="繁體中文 台灣">繁體中文</SelectItem>
            <SelectItem value="Japanese">Japanese</SelectItem>
          </SelectContent>
        </Select>
        {validationErrors.language && <span className="text-red-500 text-sm">{validationErrors.language}</span>}
      </div>
      <div className="flex items-center gap-2">
        <Label className="w-24">寫作主題:</Label>
        <Input type="text" name="topic" value={formState.topic} onChange={handleChange} placeholder="輸入主題" />
        {validationErrors.topic && <span className="text-red-500 text-sm">{validationErrors.topic}</span>}
      </div>
      <div className="flex items-center gap-2">
        <Label className="w-24">寫作風格:</Label>
        <Select
          onValueChange={(value) => setFormState({ ...formState, writerStyle: value })}
          value={formState.writerStyle}
        >
          <SelectTrigger>
            <SelectValue placeholder="選擇寫作風格" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="business writer">商業文章</SelectItem>
            <SelectItem value="personal feeling">Personal Feeling</SelectItem>
            <SelectItem value="personal opinion">Personal Opinion</SelectItem>
            <SelectItem value="for thread">脆的發文</SelectItem>
          </SelectContent>
        </Select>
        {validationErrors.writerStyle && <span className="text-red-500 text-sm">{validationErrors.writerStyle}</span>}
      </div>
      <div className="flex items-center gap-2">
        <Label className="w-36">用人設寫章:</Label>
        <Input
          type="text"
          name="persona"
          value={formState.persona}
          onChange={handleChange}
          placeholder="輸入人設(選填)"
        />
        {validationErrors.persona && <span className="text-red-500 text-sm">{validationErrors.persona}</span>}
      </div>
      <div className="flex items-center gap-2">
        <Label className="w-36">靈感來源文章:</Label>
        <Textarea
          name="originalArticle"
          value={formState.originalArticle}
          onChange={handleChange}
          placeholder="輸入靈感來源文章(選填)"
        />
        {validationErrors.originalArticle && (
          <span className="text-red-500 text-sm">{validationErrors.originalArticle}</span>
        )}
      </div>
      <div className="flex justify-center w-full px-4">
        <Button type="submit" disabled={isGenerating} className="w-full max-w-md">
          {isGenerating ? "Generating..." : "Generate Content"}
        </Button>
      </div>
      {isGenerating && (
        <div className="flex justify-center w-full px-4 mt-2">
          <Button onClick={handleStopGeneration} className="w-full max-w-md">
            Stop Generation
          </Button>
        </div>
      )}
      {error && <ErrorMessage message={error} />}

      <div className="mt-4">
        <h3 className="text-sm font-semibold">{isGenerating ? "Generating Content:" : "Generated Content:"}</h3>
        <div className="w-full h-64 bg-gray-800 p-4 rounded-md overflow-auto text-white">
          {isGenerating ? (
            <span className="animate-pulse">|</span>
          ) : (
            <div className="select-text">
              <Markdown>{generatedContent}</Markdown>
            </div>
          )}
        </div>
      </div>
    </form>
  );
};

export default Post2Thread;
