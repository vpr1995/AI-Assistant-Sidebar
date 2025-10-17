import { Loader2 } from "lucide-react"

interface ModelLoadingIndicatorProps {
  status: "downloading" | "complete"
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

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
        <span className="text-sm text-muted-foreground">{message}</span>
      </div>
      {status === "downloading" && (
        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
          <div
            className="bg-blue-500 h-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  )
}
