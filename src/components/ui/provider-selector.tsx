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
    <div className={cn("flex items-center", className)}>
      <select
        id="provider-select"
        value={value}
        onChange={(e) =>
          onChange(e.target.value as "built-in-ai" | "web-llm" | "auto")
        }
        className={cn(
          "h-8 rounded-md border border-border bg-popover text-popover-foreground px-2.5 py-1 text-xs",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "cursor-pointer transition-all duration-200",
          "hover:bg-accent/50 hover:text-accent-foreground",
          "dark:hover:bg-accent/30"
        )}
        title="Select AI Provider"
        aria-label="AI Provider"
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
