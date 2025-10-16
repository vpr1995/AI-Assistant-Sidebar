import { useState } from 'react'
import { Button } from '@/components/ui/button'
import './App.css'

function App() {
  const [count, setCount] = useState<number>(0)

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Chrome Extension</h1>
          <p className="text-muted-foreground">
            Tailwind CSS v4 & shadcn/ui are successfully configured! ✨
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 className="text-2xl font-semibold">Counter Example</h2>
          <div className="flex items-center gap-4">
            <Button onClick={() => setCount((count) => count + 1)}>
              Count is {count}
            </Button>
            <Button variant="secondary" onClick={() => setCount(0)}>
              Reset
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Click the buttons to test React state and shadcn/ui Button component
          </p>
        </div>

        <div className="bg-secondary rounded-lg p-6 space-y-4">
          <h3 className="text-xl font-semibold">Tailwind Utilities Test</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-primary text-primary-foreground p-4 rounded-md">
              Primary Color
            </div>
            <div className="bg-accent text-accent-foreground p-4 rounded-md">
              Accent Color
            </div>
            <div className="bg-muted text-muted-foreground p-4 rounded-md">
              Muted Color
            </div>
            <div className="bg-destructive text-white p-4 rounded-md">
              Destructive Color
            </div>
          </div>
        </div>

        <div className="text-center text-sm text-muted-foreground">
          <p>✅ Task 3 Completed: Tailwind CSS & shadcn/ui Setup</p>
        </div>
      </div>
    </div>
  )
}

export default App
