import { transformersJS } from "@built-in-ai/transformers-js";
import { embed } from "ai";
import { env } from "@huggingface/transformers"

if (env?.backends?.onnx?.wasm) {
    const bundledPath =
        typeof chrome !== "undefined" && chrome.runtime?.getURL
            ? chrome.runtime.getURL("transformers/")
            : new URL("../transformers/", self.location.href).toString();

    env.backends.onnx.wasm.wasmPaths = bundledPath;
}

const embeddingModel = transformersJS.textEmbedding("Supabase/gte-small", {
    device: "webgpu", // Use WebGPU for acceleration
    dtype: "q8", // Quantization level
    normalize: true, // Normalize embeddings (default: true)
    pooling: "mean", // Pooling strategy: 'mean', 'cls', or 'max'
    maxTokens: 512, // Maximum input tokens
});

export async function getEmbedding(text: string): Promise<number[]> {
    const result = await embed({
        model: embeddingModel,
        value: text,
    });
    return result.embedding;
}