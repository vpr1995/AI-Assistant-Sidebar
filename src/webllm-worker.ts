import { WebWorkerMLCEngineHandler } from "@built-in-ai/web-llm";

// Dual handler support for both WebLLM and TransformersJS
const webLLMHandler = new WebWorkerMLCEngineHandler();

self.onmessage = (msg: MessageEvent) => {
    webLLMHandler.onmessage(msg);
};