import { WebWorkerMLCEngineHandler } from "@built-in-ai/web-llm";
import { TransformersJSWorkerHandler } from "@built-in-ai/transformers-js";
import { env } from "@huggingface/transformers";

// Dual handler support for both WebLLM and TransformersJS
const webLLMHandler = new WebWorkerMLCEngineHandler();
const transformersJSHandler = new TransformersJSWorkerHandler();

if (env?.backends?.onnx?.wasm) {
  const bundledPath =
    typeof chrome !== "undefined" && chrome.runtime?.getURL
      ? chrome.runtime.getURL("transformers/")
      : new URL("../transformers/", self.location.href).toString();

  env.backends.onnx.wasm.wasmPaths = bundledPath;
}

self.onmessage = (msg: MessageEvent) => {
  // Route to appropriate handler based on message type
  // TransformersJS uses 'load', 'generate', 'interrupt', 'reset'
  // WebLLM uses different message types
  const messageType = msg.data?.type || msg.data?.kind;
  
  if (messageType === 'load' || messageType === 'generate' || messageType === 'interrupt' || messageType === 'reset') {
    // TransformersJS message
    transformersJSHandler.onmessage(msg);
  } else {
    // WebLLM message (default)
    webLLMHandler.onmessage(msg);
  }
};