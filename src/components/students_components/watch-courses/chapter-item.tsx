"use client"

import { useEffect, useState, useCallback, memo } from "react"
import { PlayCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import axios from "axios"
import { ChapterItemProps } from "@/types/watch-courses-api"
import Image from "next/image"

const formatDuration = (duration: number): string => {
  if (!duration || isNaN(duration)) return "0:00"
  
  const minutes = Math.floor(duration / 60)
  const seconds = Math.floor(duration % 60)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

const ThumbnailPlaceholder = () => (
  <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700">
    <PlayCircle className="h-6 w-6 text-gray-500 dark:text-gray-400" />
  </div>
)

const CompletedBadge = () => (
  <div className="absolute inset-0 bg-black/60 dark:bg-black/70 flex items-center justify-center">
    <div className="bg-white dark:bg-gray-200 rounded-full p-1">
      <PlayCircle className="h-5 w-5 text-black dark:text-gray-800" />
    </div>
  </div>
)

const ChapterItem = memo(({
  chapter,
  index,
  isActive,
  onSelect,
}: ChapterItemProps) => {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  const formattedDuration = formatDuration(Number(chapter.duration))

  const fetchThumbnail = useCallback(async () => {
    if (!chapter.thumbnailUrl || thumbnailUrl || loading) return

    setLoading(true)
    setError(false)
    
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      const sasResponse = await axios.get("/api/generate-sas-token", {
        params: { blobName: chapter.thumbnailUrl },
        signal: controller.signal
      })

      clearTimeout(timeoutId)
      setThumbnailUrl(sasResponse.data.sasURL)
    } catch (err) {
      if (!axios.isCancel(err)) {
        console.error(`Error fetching SAS URL for ${chapter.thumbnailUrl}:`, err)
        setError(true)
      }
    } finally {
      setLoading(false)
    }
  }, [chapter.thumbnailUrl, thumbnailUrl, loading])

  useEffect(() => {
    fetchThumbnail()
  }, [fetchThumbnail])

  const handleImageError = useCallback(() => {
    setThumbnailUrl(null)
    setError(true)
  }, [])

  return (
    <li>
      <button
        aria-label={`Play chapter ${index + 1}: ${chapter.title}`}
        className={cn(
          "w-full text-left p-3 flex items-start rounded-md transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:focus-visible:ring-primary/80",
          isActive 
            ? "bg-gray-100 dark:bg-gray-800/80" 
            : "hover:bg-gray-100 dark:hover:bg-gray-800/50",
        )}
        onClick={onSelect}
      >
        <div className="relative mr-3 flex-shrink-0">
          <div className="w-24 h-14 rounded-md overflow-hidden relative">
            {thumbnailUrl && !error ? (
              <Image
              src={thumbnailUrl}
              alt={`Thumbnail for ${chapter.title}`}
              fill
              className="object-cover"
              onError={handleImageError}
            />
            ) : (
              <ThumbnailPlaceholder />
            )}
            
            {chapter.isCompleted && <CompletedBadge />}
            
            <span className="absolute bottom-1 right-1 text-xs bg-black/80 dark:bg-gray-900/90 text-white dark:text-gray-200 px-1 rounded">
              {formattedDuration}
            </span>
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm line-clamp-2 mb-1 text-gray-900 dark:text-gray-100">
            {chapter.title}
          </p>
          <div className="flex items-center text-xs text-muted-foreground dark:text-gray-400">
            {chapter.isFreePreview && (
              <span className="text-primary dark:text-primary-400">Free • </span>
            )}
            <span>Chapter {index + 1}</span>
          </div>
        </div>
      </button>
    </li>
  )
})

ChapterItem.displayName = "ChapterItem"

export default ChapterItem