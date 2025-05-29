// components/chapters/ProcessingOverlay.tsx
import { Loader2 } from "lucide-react"

interface ProcessingOverlayProps {
  isProcessing: boolean
  isPolling: boolean
  statusMessages: string[]
  uploadProgress: number
}

export const ProcessingOverlay = ({ 
  isProcessing, 
  isPolling, 
  statusMessages, 
  uploadProgress 
}: ProcessingOverlayProps) => {
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

          {/* Upload progress bar - only shown during upload (0 < progress < 100) */}
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm dark:text-gray-300">
                <span>Uploading video...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Dynamic status messages */}
          <div className="space-y-1">
            {statusMessages.map((message, index) => (
              <p key={index} className="text-sm dark:text-gray-300">
                {message}
              </p>
            ))}
          </div>

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