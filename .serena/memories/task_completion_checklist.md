# Task Completion Checklist

When completing a task in this project, follow this checklist to ensure quality and consistency:

## 1. Code Quality Checks

### Linting
```bash
npm run lint
```
- ✅ Fix all ESLint errors
- ✅ Address warnings if possible
- ✅ Ensure no unused variables (except uppercase)
- ✅ Check React hooks dependencies

### Code Review
- ✅ Follow component conventions (functional, hooks, default export)
- ✅ Use proper import paths (relative for local, absolute for public)
- ✅ Add comments for complex logic
- ✅ Remove console.logs (unless intentional debugging)
- ✅ Check for proper error handling

## 2. Functionality Verification

### Development Testing
```bash
npm run dev
```
- ✅ Test feature in dev environment
- ✅ Verify HMR works (changes reflect without full reload)
- ✅ Check browser console for errors
- ✅ Test edge cases and error scenarios

### Build Testing
```bash
npm run build
npm run preview
```
- ✅ Verify production build succeeds
- ✅ Test built version in preview
- ✅ Check for build warnings
- ✅ Verify all assets load correctly

## 3. Chrome Extension Specific

### Extension Testing (After Manifest Added)
- ✅ Load unpacked extension in Chrome (chrome://extensions/)
- ✅ Test sidebar panel opens correctly
- ✅ Verify permissions are granted
- ✅ Check Chrome storage API works
- ✅ Test on page load and across page navigations

### WebGPU/AI Testing (After AI Integration)
- ✅ Test model loading and caching
- ✅ Verify WebGPU acceleration (or WASM fallback)
- ✅ Test with different model sizes
- ✅ Check memory usage (Chrome Task Manager)
- ✅ Verify offline functionality after cache

## 4. UI/UX Checks

### Visual Testing
- ✅ Test responsive layout (400-500px sidebar width)
- ✅ Verify styles match shadcn/ui design system
- ✅ Check hover states and interactions
- ✅ Test loading states and animations
- ✅ Verify icons and assets render correctly

### Accessibility
- ✅ Test keyboard navigation (Tab, Enter, Escape)
- ✅ Verify focus indicators are visible
- ✅ Check ARIA labels and screen reader support
- ✅ Test with high contrast mode
- ✅ Ensure text is readable (contrast ratios)

## 5. Documentation

### Code Documentation
- ✅ Add JSDoc comments for complex functions
- ✅ Document component props (if not using TypeScript)
- ✅ Update inline comments if logic changed
- ✅ Add README sections if new features added

### Commit Messages
- ✅ Use conventional commit format:
  - `feat:` for new features
  - `fix:` for bug fixes
  - `refactor:` for code refactoring
  - `style:` for formatting changes
  - `docs:` for documentation
  - `chore:` for maintenance tasks
- ✅ Write clear, descriptive commit messages
- ✅ Reference issue numbers if applicable

## 6. Git Workflow

### Before Committing
```bash
# Check status
git status

# Review changes
git diff

# Stage changes
git add .

# Commit with message
git commit -m "feat: implement feature"
```

### After Committing
```bash
# Push to remote
git push origin <branch-name>

# Create pull request (if using PRs)
```

## 7. Performance Checks

### Bundle Size
- ✅ Check build output size (should be reasonable)
- ✅ Verify code splitting for large dependencies
- ✅ Lazy load heavy components when possible
- ✅ Optimize images and assets

### Runtime Performance
- ✅ Check for memory leaks (especially with Web Workers)
- ✅ Verify smooth scrolling and animations
- ✅ Test with long conversation histories
- ✅ Profile with React DevTools (if performance issues)

## 8. Error Handling

### User-Facing Errors
- ✅ Graceful error messages (no raw errors to user)
- ✅ Fallback UI for error states
- ✅ Recovery options provided (retry, reset)
- ✅ Log errors for debugging (console.error)

### Common Error Scenarios
- ✅ Network failures (model download)
- ✅ Out of memory (large models)
- ✅ WebGPU not supported
- ✅ Permissions denied (microphone, storage)

## 9. Security Checks

### Content Security Policy
- ✅ Verify CSP allows necessary operations (WASM, WebGPU)
- ✅ No unsafe inline scripts (unless required and documented)
- ✅ Sanitize user input (especially for markdown rendering)
- ✅ No sensitive data logged or exposed

### Privacy
- ✅ Verify no data sent to external servers
- ✅ Check local storage usage is appropriate
- ✅ No tracking or analytics (privacy-first)

## 10. Final Checklist

Before marking task as complete:
- [ ] Code linted and formatted
- [ ] Functionality tested in dev and build
- [ ] UI looks correct and accessible
- [ ] Documentation updated
- [ ] Git committed with proper message
- [ ] No console errors or warnings
- [ ] Performance is acceptable
- [ ] Error handling is robust
- [ ] Security best practices followed
- [ ] Ready for review (if team project)

## Task-Specific Additions

### For New Components
- [ ] Added to appropriate directory
- [ ] Imported and used in parent component
- [ ] Styles scoped properly
- [ ] Props documented

### For AI Integration
- [ ] Model loads correctly
- [ ] Streaming works smoothly
- [ ] Progress tracking implemented
- [ ] Error recovery tested
- [ ] Memory usage acceptable

### For Chrome Extension Features
- [ ] Manifest permissions updated
- [ ] Extension reloaded in Chrome
- [ ] Works across browser restarts
- [ ] Storage persistence tested
