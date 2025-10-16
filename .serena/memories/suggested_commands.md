# Suggested Commands

## Development Commands

### Start Development Server
```bash
npm run dev
```
- Starts Vite dev server on http://localhost:5173
- Enables Hot Module Replacement (HMR)
- Auto-reloads on file changes
- Keep this running while developing

### Build for Production
```bash
npm run build
```
- Creates optimized production build in `dist/` directory
- Minifies code and assets
- Use this before packaging Chrome extension

### Preview Production Build
```bash
npm run preview
```
- Serves the built app from `dist/` locally
- Test production build before deployment
- Useful for catching build-specific issues

### Linting
```bash
npm run lint
```
- Runs ESLint on all `**/*.{js,jsx}` files
- Checks for code quality issues
- Ignores `dist/` directory
- Fix issues before committing

## Package Management

### Install Dependencies
```bash
npm install
```
- Installs all dependencies from package.json
- Run this after cloning or when package.json changes

### Add New Dependency
```bash
npm install <package-name>
```
- Example: `npm install ai @built-in-ai/transformers-js`

### Add Dev Dependency
```bash
npm install --save-dev <package-name>
```
- For build tools, linters, etc.

## Git Commands (Linux)

### Common Git Operations
```bash
git status                    # Check current status
git add .                     # Stage all changes
git commit -m "message"       # Commit with message
git push                      # Push to remote
git pull                      # Pull latest changes
git log --oneline -10         # View last 10 commits
```

## File System Commands (Linux)

### Navigation & Listing
```bash
ls -la                        # List all files with details
cd <directory>                # Change directory
pwd                           # Print working directory
tree -L 2                     # Show directory tree (2 levels)
```

### File Operations
```bash
cat <file>                    # Display file contents
grep -r "pattern" src/        # Search for pattern in files
find . -name "*.jsx"          # Find files by pattern
mkdir -p path/to/dir          # Create directories recursively
```

### Chrome Extension Development
```bash
# After building
cd dist/
ls -la                        # Verify build output

# Load unpacked extension in Chrome
# 1. Open chrome://extensions/
# 2. Enable "Developer mode"
# 3. Click "Load unpacked"
# 4. Select the `dist/` directory
```

## Useful Development Workflows

### Quick Test Cycle
```bash
# Terminal 1: Keep dev server running
npm run dev

# Terminal 2: Make changes, then lint
npm run lint

# Terminal 3: Git operations
git add .
git commit -m "feat: add feature"
```

### Build and Test Extension
```bash
# Build
npm run build

# Preview (optional)
npm run preview

# Load in Chrome as unpacked extension from dist/
```

### Clean Start
```bash
# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache (if issues)
rm -rf node_modules/.vite
npm run dev
```

## Future Commands (After Implementation)

### shadcn/ui Components
```bash
# Initialize shadcn/ui
npx shadcn@latest init

# Add specific component
npx shadcn@latest add button

# Add AI chatbot components
npx shadcn@latest add https://www.shadcn.io/registry/ai-chatbot.json
```

### Testing (When Added)
```bash
npm test                      # Run tests
npm run test:watch           # Watch mode
npm run test:coverage        # Coverage report
```

### Formatting (If Added)
```bash
npm run format               # Format with Prettier
npm run format:check         # Check formatting
```

## Environment Notes
- **OS**: Linux
- **Shell**: bash
- **Node.js**: Should be 18+ for best compatibility
- **Package Manager**: npm (not yarn/pnpm/bun)
- **Browser**: Chrome 90+ (WebGPU requires Chrome 113+)
