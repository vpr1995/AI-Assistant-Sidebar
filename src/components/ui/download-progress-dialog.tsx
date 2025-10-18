import { Loader2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface DownloadProgressDialogProps {
  isOpen: boolean
  status: "downloading" | "extracting" | "complete"
  progress: number
  message: string
}

export function DownloadProgressDialog({
  isOpen,
  status,
  progress,
  message,
}: DownloadProgressDialogProps) {
  const isIndeterminate = status === "extracting"

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-background rounded-lg shadow-lg p-8 max-w-sm w-full mx-4"
          >
            <div className="flex flex-col items-center gap-4">
              {/* Spinner */}
              <div className="flex items-center justify-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Loader2 className="h-8 w-8 text-blue-500" />
                </motion.div>
              </div>

              {/* Message */}
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">{message}</p>
              </div>

              {/* Progress Bar */}
              <div className="w-full">
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  {isIndeterminate ? (
                    // Indeterminate state - animated flowing bar
                    <div
                      className="bg-blue-500 h-full"
                      style={{
                        width: "100%",
                        animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                      }}
                    />
                  ) : (
                    // Determinate state - normal progress bar
                    <motion.div
                      className="bg-blue-500 h-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(progress, 100)}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  )}
                </div>
              </div>

              {/* Progress Percentage */}
              {status === "downloading" && (
                <p className="text-xs text-muted-foreground font-medium">
                  {Math.round(progress)}%
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
