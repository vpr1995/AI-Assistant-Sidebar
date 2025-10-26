import { TransformersJSWorkerHandler } from "@built-in-ai/transformers-js";
import { env } from "@huggingface/transformers";

const transformersJSHandler = new TransformersJSWorkerHandler();

if (env?.backends?.onnx?.wasm) {
  const bundledPath =
    typeof chrome !== "undefined" && chrome.runtime?.getURL
      ? chrome.runtime.getURL("transformers/")
      : new URL("../transformers/", self.location.href).toString();

  env.backends.onnx.wasm.wasmPaths = bundledPath;
}

self.onmessage = (msg: MessageEvent) => {
    transformersJSHandler.onmessage(msg);
};