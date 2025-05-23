// components/chapters/ProcessingOverlay.tsx
import { Loader2 } from "lucide-react"

interface ProcessingOverlayProps {
  isProcessing: boolean
  isPolling: boolean
  statusMessages: string[]
}

export const ProcessingOverlay = ({ isProcessing, isPolling, statusMessages }: ProcessingOverlayProps) => {
  if (!isProcessing) return null

  return (
    <div className="fixed inset-0 bg-background/80 dark:bg-gray-900/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-card dark:bg-gray-800 text-card-foreground dark:text-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-semibold mb-4 dark:text-white">Processing Chapter</h2>
        <div className="space-y-4">
          {/* Static message about processing time */}
          <p className="text-sm dark:text-gray-300">
            This task may take 10 to 15 minutes to complete. Please wait...
          </p>

          {/* Dynamic status message */}
          <p className="text-sm dark:text-gray-300">
            {statusMessages[statusMessages.length - 1]}
          </p>

          {/* Loading spinner and message */}
          {isPolling && (
            <div className="flex items-center space-x-2">
              <Loader2 className="h-5 w-5 animate-spin dark:text-blue-400" />
              <p className="text-sm dark:text-gray-300">Processing video...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}