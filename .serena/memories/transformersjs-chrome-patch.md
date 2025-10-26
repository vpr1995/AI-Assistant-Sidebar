# Transformers.js Chrome Extension Patch

This document records the changes made to make `@huggingface/transformers` (Transformers.js) work inside a Chrome extension with Manifest V3, which has a strict Content Security Policy (CSP) that blocks fetching runtime helper files from a CDN.

## The Problem

Chrome extensions under Manifest V3 have a strict Content Security Policy that disallows dynamic imports from remote origins (CDNs). By default, Transformers.js attempts to download ONNX runtime helper files (e.g., `ort-wasm-simd-threaded.jsep.mjs` and `ort-wasm-simd-threaded.jsep.wasm`) from a CDN at runtime, which fails under the extension's CSP.

**Related Issue**: https://github.com/huggingface/transformers.js/issues/1248

## The Solution

A three-part solution was implemented to bundle the necessary ONNX runtime files with the extension and configure Transformers.js to load them locally.

### 1. Vite Build Plugin

**File**: `vite.config.ts`

-   **Plugin**: `copyTransformersAssetsPlugin()`
-   **Trigger**: Runs during `build.closeBundle()` phase
-   **Action**: Copies ONNX runtime files from `node_modules/@huggingface/transformers/dist/` to `dist/transformers/`:
    -   `ort-wasm-simd-threaded.jsep.mjs` (JavaScript module)
    -   `ort-wasm-simd-threaded.jsep.wasm` (WebAssembly binary)

**Implementation**:
```typescript
function copyTransformersAssetsPlugin(): PluginOption {
  return {
    name: 'copy-transformers-assets',
    apply: 'build',
    async closeBundle() {
      const srcDir = path.resolve(rootDir, 'node_modules/@huggingface/transformers/dist')
      const destDir = path.resolve(rootDir, outDir, 'transformers')
      await mkdir(destDir, { recursive: true })
      // Copy ort-wasm-simd-threaded.jsep.mjs and .wasm files
    }
  }
}
```

**Result**: These files are bundled with the extension package, preventing runtime CDN fetches.

### 2. Runtime Configuration

**File**: `src/transformers-worker.ts`

-   **Import**: `{ env }` from `@huggingface/transformers`
-   **Configuration**: Sets `env.backends.onnx.wasm.wasmPaths` to point to the bundled assets
-   **Path Resolution**:
    -   If `chrome.runtime` available: `chrome.runtime.getURL('transformers/')`
    -   Otherwise: Fallback to relative URL based on `self.location.href`

**Implementation**:
```typescript
import { env } from "@huggingface/transformers";

if (env?.backends?.onnx?.wasm) {
  const bundledPath =
    typeof chrome !== "undefined" && chrome.runtime?.getURL
      ? chrome.runtime.getURL("transformers/")
      : new URL("../transformers/", self.location.href).toString();

  env.backends.onnx.wasm.wasmPaths = bundledPath;
}
```

**Purpose**: Ensures Transformers.js looks for ONNX files in the extension bundle instead of CDN.

### 3. Manifest Update

**File**: `public/manifest.json`

-   **Addition**: `web_accessible_resources` includes `transformers/*.wasm` and `transformers/*.mjs`
-   **Reason**: Chrome requires resources that will be fetched from extension pages/workers to be explicitly listed as web-accessible

**Manifest Entry**:
```json
{
  "web_accessible_resources": [
    {
      "resources": ["transformers/*.wasm", "transformers/*.mjs"],
      "matches": ["<all_urls>"]
    }
  ]
}
```

## Implementation Details

### Files Changed

1.  **Modified**: `vite.config.ts` - Added `copyTransformersAssetsPlugin()`
2.  **Modified**: `src/transformers-worker.ts` - Set `env.backends.onnx.wasm.wasmPaths`
3.  **Modified**: `public/manifest.json` - Added `web_accessible_resources` for transformers assets

**Note**: Unlike the initial documentation, there is **NO postinstall script**. The solution is entirely build-time and runtime configuration.

### Build Verification

After running `npm run build`, verify the assets were copied:

```bash
ls dist/transformers/
# Expected output:
# ort-wasm-simd-threaded.jsep.mjs
# ort-wasm-simd-threaded.jsep.wasm
```

## Testing

1.  **Build Extension**:
    ```bash
    npm run build
    ls dist/transformers  # Verify files exist
    ```

2.  **Load in Chrome**:
    -   Go to `chrome://extensions`
    -   Enable "Developer mode"
    -   Click "Load unpacked"
    -   Select the `dist/` directory
    -   Open sidebar and select Transformers.js provider
    -   Verify model initialization loads local assets (no CDN requests in Network tab)

## How It Works

### Without Patch (Fails)
```
Transformers.js → Tries to fetch from CDN
    ↓
Chrome CSP blocks request
    ↓
Extension fails with CSP violation error
```

### With Patch (Works)
```
Build Process:
1. Vite plugin copies ONNX assets to dist/transformers/
2. manifest.json exposes transformers/* as web-accessible

Runtime:
1. transformers-worker.ts sets wasmPaths to chrome.runtime.getURL('transformers/')
2. Transformers.js loads from local extension bundle
3. No CDN requests, CSP satisfied ✓
```

## Maintenance Notes

-   **Upstream Updates**: If `@huggingface/transformers` adds built-in extension support, this patch can be removed
-   **Alternative Approach**: Could configure solely via runtime `env.backends.onnx.wasm.wasmPaths`, but bundling assets ensures reliability
-   **Keep in Sync**: If Transformers.js changes asset names, update the Vite plugin accordingly
-   **No Node Modules Modification**: This solution does not modify `node_modules`, making it more maintainable

## Why No Postinstall Script?

The original documentation mentioned a postinstall script that patched `node_modules/@huggingface/transformers/src/env.js`. This approach was **not implemented** in the actual codebase. Instead, the solution relies on:

1.  **Build-time asset copying**: Vite plugin handles bundling
2.  **Runtime configuration**: Worker sets paths before Transformers.js initializes
3.  **No source modifications**: Cleaner, more maintainable approach

This is simpler and more maintainable than patching installed packages.

## References

-   **GitHub Issue**: https://github.com/huggingface/transformers.js/issues/1248
-   **Transformers.js Docs**: Environment configuration (`env.backends.onnx.wasm.wasmPaths`)
-   **Chrome Extension CSP**: https://developer.chrome.com/docs/extensions/mv3/intro/mv3-migration/#content-security-policy

## Status

✅ **Implementation Complete** (October 25, 2025)
-   Assets bundled via Vite plugin
-   Runtime paths configured in worker
-   Extension loads Transformers.js without CSP violations
-   No node_modules modifications needed
-   Production-ready
