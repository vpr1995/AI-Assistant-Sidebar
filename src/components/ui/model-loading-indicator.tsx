import { Loader2 } from "lucide-react"

interface ModelLoadingIndicatorProps {
  status: "downloading" | "extracting" | "complete"
  progress: number
  message: string
}

export function ModelLoadingIndicator({
  status,
  progress,
  message,
}: ModelLoadingIndicatorProps) {
  if (status === "complete" && progress === 100 && !message) {
    return null
  }

  // Determine if we should show indeterminate progress (extracting phase)
  const isIndeterminate = status === "extracting"

  return (
    <div className="flex flex-col gap-2 py-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
          <span className="text-sm text-muted-foreground">{message}</span>
        </div>
        {status === "downloading" && (
          <span className="text-xs font-medium text-muted-foreground">
            {Math.round(progress)}%
          </span>
        )}
      </div>

      {/* Progress bar - shown for downloading or extracting phases */}
      {(status === "downloading" || status === "extracting") && (
        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
          {isIndeterminate ? (
            // Indeterminate state - animated flowing bar for extraction phase
            <div
              className="bg-blue-500 h-full"
              style={{
                width: "100%",
                animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
              }}
            />
          ) : (
            // Determinate state - normal progress bar for downloading
            <div
              className="bg-blue-500 h-full transition-all duration-300"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          )}
        </div>
      )}
    </div>
  )
}
