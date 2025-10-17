import { cn } from "@/lib/utils"

interface ProviderOption {
  id: "built-in-ai" | "web-llm" | "auto"
  label: string
  description: string
}

interface ProviderSelectorProps {
  value: "built-in-ai" | "web-llm" | "auto"
  onChange: (provider: "built-in-ai" | "web-llm" | "auto") => void
  availableProviders: ("built-in-ai" | "web-llm")[]
  className?: string
}

const PROVIDER_OPTIONS: ProviderOption[] = [
  {
    id: "auto",
    label: "Auto",
    description: "Automatically select best available",
  },
  {
    id: "built-in-ai",
    label: "Chrome Built-in AI",
    description: "Fast, native browser AI",
  },
  {
    id: "web-llm",
    label: "WebLLM",
    description: "Local model (fallback)",
  },
]

export function ProviderSelector({
  value,
  onChange,
  availableProviders,
  className,
}: ProviderSelectorProps) {
  // Determine which options are available and selectable
  const selectableOptions = PROVIDER_OPTIONS.filter(option => {
    if (option.id === "auto") return true // Auto is always available
    return availableProviders.includes(option.id)
  })

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <label htmlFor="provider-select" className="text-xs font-medium text-muted-foreground">
        AI Provider:
      </label>
      <select
        id="provider-select"
        value={value}
        onChange={(e) =>
          onChange(e.target.value as "built-in-ai" | "web-llm" | "auto")
        }
        className={cn(
          "h-8 rounded-md border border-input bg-background px-2.5 py-1 text-xs",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "cursor-pointer transition-colors",
          "hover:bg-accent/50 dark:hover:bg-accent/30"
        )}
      >
        {selectableOptions.map((option) => (
          <option key={option.id} value={option.id} title={option.description}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}
