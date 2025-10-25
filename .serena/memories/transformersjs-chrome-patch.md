# Transformers.js Chrome Extension patch (Oct 25, 2025)

Summary
-------
This memory records the changes made to make `@huggingface/transformers` (Transformers.js)
work inside a Chrome extension (Manifest V3) without attempting to fetch runtime helper files
from a CDN at runtime (CSP blocked). The approach combines a small install-time patch with
packaging the necessary ONNX runtime assets and configuring Transformers.js to load them
from the extension bundle.

Why this was necessary
----------------------
- Chrome extensions under Manifest V3 have a strict Content Security Policy that disallows
  dynamic imports from remote origins (CDNs). Transformers.js by default points to a
  CDN location for ONNX helper files (e.g. `ort-wasm-simd-threaded.jsep.mjs`) which
  fails at runtime under extension CSP (issue: https://github.com/huggingface/transformers.js/issues/1248).
- The fix is to ensure the ONNX runtime support files are bundled with the extension and
  that Transformers.js is told to use the local path (or not attempt CDN fallback).

What was implemented
---------------------
1. Postinstall patch script
   - File: `postinstall/run.sh`
   - Purpose: Patch `node_modules/@huggingface/transformers/src/env.js` to force the
     library into "browser mode" (sets `IS_BROWSER_ENV = true`) so transformers.js behaves
     predictably inside extension contexts.
   - Added cross-platform `sed -i` handling (macOS vs Linux).
   - `package.json` now has a `postinstall` script that runs this file: `bash postinstall/run.sh`.
   - Rationale: This is a minimal and targeted source patch (non-invasive) to avoid
     environment-detection edge cases in extension pages.

2. Vite build plugin to copy runtime assets
   - File modified: `vite.config.ts`
   - Added plugin `copyTransformersAssetsPlugin()` which runs during `build.closeBundle()` and
     copies these files from `node_modules/@huggingface/transformers/dist/` into
     `dist/transformers/`:
     - `ort-wasm-simd-threaded.jsep.mjs`
     - `ort-wasm-simd-threaded.jsep.wasm`
   - Rationale: Bundling these files into the extension package prevents runtime CDN fetches.

3. Configure Transformers.js runtime path in the worker
   - File modified: `src/transformers-worker.ts`
   - Changes: import `{ env }` from `@huggingface/transformers` and set
     `env.backends.onnx.wasm.wasmPaths` to point to the bundled `transformers/` folder using
     `chrome.runtime.getURL('transformers/')` when `chrome.runtime` is available. If `chrome` is not
     available, it falls back to a relative URL based on `self.location.href`.
   - Rationale: Ensures Transformers.js looks for ONNX WASM/MJS files in the extension bundle.

4. Manifest update
   - File modified: `public/manifest.json`
   - `web_accessible_resources` now includes `transformers/*.wasm` and `transformers/*.mjs` so
     extension pages/workers can fetch/execute these packaged files.
   - Rationale: Chrome requires resources that will be fetched from extension pages to be listed here.

5. Build & verification
   - Running `npm run build` produced `dist/transformers/ort-wasm-simd-threaded.jsep.mjs`
     and `dist/transformers/ort-wasm-simd-threaded.jsep.wasm` and the build succeeded.
   - A Vite-bundled asset `dist/assets/ort-wasm-simd-threaded.jsep-<hash>.wasm` may also exist
     (output from other bundling behaviors). The explicit `dist/transformers` copies ensure a
     predictable runtime location.

Files changed (high-level)
--------------------------
- Added: `postinstall/run.sh` (postinstall patcher)
- Edited: `package.json` (added `postinstall` script)
- Edited: `vite.config.ts` (copy plugin)
- Edited: `src/transformers-worker.ts` (set `env.backends.onnx.wasm.wasmPaths` to local path)
- Edited: `public/manifest.json` (expose `transformers/*` in `web_accessible_resources`)

How to test
-----------
1. Fresh install (postinstall runs automatically):

```bash
npm ci
# postinstall/run.sh will execute (sets IS_BROWSER_ENV in node_modules if found)
```

2. Build the extension and verify the assets are copied:

```bash
npm run build
ls dist/transformers
# expect: ort-wasm-simd-threaded.jsep.mjs ort-wasm-simd-threaded.jsep.wasm
```

3. Load the `dist/` directory as an unpacked extension in Chrome (chrome://extensions),
   then open the sidebar and select the TransformersJS provider. The model initialization
   should not attempt to fetch the CDN MJS and instead load the local `transformers/*.mjs`.

Revert / safety notes
---------------------
- The `postinstall/run.sh` modifies files inside `node_modules`. This is a maintenance tradeoff:
  - Pros: quick fix for node-installed package behavior
  - Cons: modifications are local to the installed package and may be lost on package updates.
- If you prefer not to modify `node_modules`, you can instead remove the `postinstall` script and
  rely solely on the runtime `env.backends.onnx.wasm.wasmPaths` configuration in
  `src/transformers-worker.ts` which directs Transformers.js to the bundled path.
- Keep `public/manifest.json` `web_accessible_resources` in sync with whatever directory you copy assets to.

References
----------
- Issue: https://github.com/huggingface/transformers.js/issues/1248 (CSP / CDN dynamic import blocked in Chrome extensions)
- Transformers runtime config hints: `env.backends.onnx.wasm.wasmPaths`, `env.allowRemoteModels`

Maintenance notes
-----------------
- If the upstream `@huggingface/transformers` package adds built-in detection for extension contexts,
  remove the `postinstall` patch and rely on upstream fix.
- Consider adding a small integration test that spins up the built extension in headless Chrome and
  asserts the worker loads local MJS/wasm instead of reaching out to remote URLs.

Status (at time of writing)
--------------------------
- Implementation applied and built successfully on Oct 25, 2025.
- `dist/transformers/` contains the expected files and `manifest.json` exposes them.

