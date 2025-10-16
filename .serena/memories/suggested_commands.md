# Suggested Commands

## Development Commands

### Start Development Server
```bash
npm run dev
```
- Starts Vite dev server on http://localhost:5173
- Enables Hot Module Replacement (HMR)
- Use for testing changes during development
- **Note**: Extension must be loaded in Chrome separately

### Build for Production
```bash
npm run build
```
- Compiles TypeScript and bundles code
- Outputs to `dist/` directory
- Minifies and optimizes for production
- Run before testing as Chrome extension

### Preview Production Build
```bash
npm run preview
```
- Serves the built `dist/` directory locally
- Tests production build before packaging
- Use to verify build works correctly

### Lint Code
```bash
npm run lint
```
- Runs ESLint on all `.js`, `.jsx`, `.ts`, `.tsx` files
- Checks for code quality issues
- Fix errors before committing

## Chrome Extension Testing

### Load Extension in Chrome
1. Build the project first:
   ```bash
   npm run build
   ```

2. Open Chrome and navigate to:
   ```
   chrome://extensions/
   ```

3. Enable "Developer mode" (toggle in top-right)

4. Click "Load unpacked"

5. Select the `dist/` folder from your project

6. Extension should appear in the list

### Reload Extension After Changes
```bash
# 1. Rebuild
npm run build

# 2. In Chrome, go to chrome://extensions/
# 3. Click the reload icon (circular arrow) on your extension card
```

**Tip**: Keep the extensions page open during development for quick reloads.

### Open Extension Sidebar
- Click the extension icon in Chrome toolbar
- Or use keyboard shortcut (if configured)
- Sidebar should open on the right side

### Enable Built-in AI (Required for AI Features)

**Chrome (Gemini Nano)**:
1. Navigate to:
   ```
   chrome://flags/#prompt-api-for-gemini-nano
   ```

2. Set to "Enabled"

3. Restart Chrome

4. Navigate to:
   ```
   chrome://components/
   ```

5. Find "Optimization Guide On Device Model"

6. Click "Check for Update" and wait for download (~500MB)

**Edge (Phi Mini)**:
1. Navigate to:
   ```
   edge://flags/#prompt-api-for-phi-mini
   ```

2. Set to "Enabled"

3. Restart Edge

4. Follow similar steps in edge://components/

## Debugging Commands

### Check TypeScript Errors
```bash
npx tsc --noEmit
```
- Type-checks without building
- Shows all TypeScript errors
- Use before building to catch type issues

### Check Specific File
```bash
npx tsc --noEmit src/App.tsx
```
- Type-checks a single file
- Faster for quick checks

### Format Code (if Prettier installed)
```bash
npx prettier --write "src/**/*.{ts,tsx}"
```
- Auto-formats all TypeScript files
- Ensures consistent code style

### View Bundle Size Analysis (requires plugin)
```bash
npm run build -- --mode analyze
```
- Shows bundle size breakdown
- Identifies large dependencies
- **Note**: Requires vite-plugin-visualizer or similar

## Git Commands

### Commit Changes
```bash
# Stage all changes
git add .

# Commit with message
git commit -m "feat: add feature description"

# Push to remote
git push origin main
```

### Check Status
```bash
git status
```
- Shows modified, staged, and untracked files

### View Recent Changes
```bash
git diff
```
- Shows uncommitted changes

### Create New Branch
```bash
git checkout -b feature/feature-name
```

### Switch Branches
```bash
git checkout main
```

## Package Management

### Install New Dependency
```bash
npm install package-name
```

### Install Dev Dependency
```bash
npm install --save-dev package-name
```

### Update All Dependencies
```bash
npm update
```

### Check for Outdated Packages
```bash
npm outdated
```

### Remove Unused Dependencies
```bash
npm prune
```

## shadcn/ui Commands

### Add New Component
```bash
npx shadcn@latest add component-name
```
- Installs shadcn/ui component
- Examples: `button`, `dialog`, `dropdown-menu`

### Add AI Chatbot Components (Already Done)
```bash
npx shadcn@latest add https://shadcn-chatbot-kit.vercel.app/r/chat.json
```
- Installs Chat, Message, MessageInput components
- Already installed in this project

### Update shadcn/ui Components
```bash
npx shadcn@latest update
```
- Updates all installed shadcn/ui components

## Chrome DevTools Debugging

### Open Extension Console
1. Right-click sidebar panel
2. Select "Inspect"
3. Console tab shows runtime logs

### Debug Background Worker
1. Navigate to `chrome://extensions/`
2. Find your extension
3. Click "service worker" link under "Inspect views"
4. Console opens for background.ts debugging

### View Network Requests
1. Open extension DevTools
2. Network tab shows all requests
3. Useful for debugging model downloads

### Check Storage
1. Open extension DevTools
2. Application tab → Storage → Local Storage
3. View Chrome storage API data

## Performance Testing

### Measure Bundle Size
```bash
npm run build
```
Check console output for:
- `dist/index.html` size
- `dist/assets/*.js` sizes
- Total bundle size

### Profile React Performance
1. Install React DevTools browser extension
2. Open extension DevTools
3. Profiler tab → Record
4. Interact with app
5. Stop recording and analyze

### Check Memory Usage
1. Open Chrome Task Manager (Shift+Esc)
2. Find your extension
3. Monitor memory usage during AI inference

## Cleanup Commands

### Remove node_modules and Reinstall
```bash
rm -rf node_modules package-lock.json
npm install
```
- Use when dependencies are corrupted

### Clean Build Output
```bash
rm -rf dist
```
- Removes all build artifacts
- Next `npm run build` creates fresh build

### Clear npm Cache
```bash
npm cache clean --force
```
- Clears npm cache
- Use if package installations fail

## Useful Aliases (Optional)

Add to `~/.bashrc` or `~/.zshrc`:

```bash
# Development
alias dev="npm run dev"
alias build="npm run build"
alias preview="npm run preview"

# Chrome Extension
alias reload-ext="npm run build && echo 'Build complete! Reload extension in Chrome.'"

# Git shortcuts
alias gs="git status"
alias gc="git commit"
alias gp="git push"
alias gl="git log --oneline -10"
```

Reload shell after adding:
```bash
source ~/.bashrc  # or ~/.zshrc
```

## Emergency Recovery

### Reset to Last Commit
```bash
git reset --hard HEAD
```
- ⚠️ WARNING: Discards all uncommitted changes
- Use only if you want to start fresh

### Restore Single File
```bash
git checkout HEAD -- path/to/file
```
- Restores file to last committed version

### Revert Last Commit (Keep Changes)
```bash
git reset --soft HEAD~1
```
- Undoes last commit but keeps changes staged

## Quick Reference

| Task | Command |
|------|---------|
| Start dev server | `npm run dev` |
| Build for production | `npm run build` |
| Preview build | `npm run preview` |
| Lint code | `npm run lint` |
| Type-check | `npx tsc --noEmit` |
| Add shadcn component | `npx shadcn@latest add [name]` |
| Git status | `git status` |
| Git commit | `git commit -m "message"` |
| Load extension | Build → chrome://extensions/ → Load unpacked |
| Debug extension | Right-click sidebar → Inspect |
| Enable Built-in AI | chrome://flags/#prompt-api-for-gemini-nano |

## Common Workflows

### Making Changes
```bash
# 1. Start dev server
npm run dev

# 2. Make code changes (HMR updates browser)

# 3. Test in browser

# 4. Lint and type-check
npm run lint
npx tsc --noEmit

# 5. Build and test as extension
npm run build
# Load/reload in Chrome

# 6. Commit
git add .
git commit -m "feat: description"
git push
```

### Adding New Feature
```bash
# 1. Create feature branch
git checkout -b feature/new-feature

# 2. Implement feature

# 3. Test thoroughly

# 4. Merge to main
git checkout main
git merge feature/new-feature

# 5. Push
git push origin main
```
