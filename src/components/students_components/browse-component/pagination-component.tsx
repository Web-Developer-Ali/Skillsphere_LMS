"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

type PaginationProps = {
  currentPage: number
  totalPages: number
  totalCount: number
  limit: number
  onPageChange: (page: number) => void
}

export default function Pagination({ currentPage, totalPages, totalCount, limit, onPageChange }: PaginationProps) {
  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = []

    // Always show first page
    if (currentPage > 3) {
      pages.push(1)
      // Add ellipsis if there's a gap
      if (currentPage > 4) {
        pages.push("ellipsis-start")
      }
    }

    // Calculate range around current page
    const start = Math.max(2, currentPage - 1)
    const end = Math.min(totalPages - 1, currentPage + 1)

    // Add pages around current page
    for (let i = start; i <= end; i++) {
      if (i > 1 && i < totalPages) {
        pages.push(i)
      }
    }

    // Always show last page
    if (currentPage < totalPages - 2) {
      // Add ellipsis if there's a gap
      if (currentPage < totalPages - 3) {
        pages.push("ellipsis-end")
      }
      if (totalPages > 1) {
        pages.push(totalPages)
      }
    }

    return pages
  }

  const pageNumbers = getPageNumbers()

  return (
    <div className="mt-8">
      <div className="flex justify-center items-center">
        <div className="flex gap-1 md:gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 md:h-10 md:w-10 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* First page */}
          {pageNumbers[0] === 1 && (
            <Button
              key="page-1"
              variant={currentPage === 1 ? "default" : "outline"}
              className={`h-8 w-8 md:h-10 md:w-10 ${
                currentPage !== 1 && "dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
              onClick={() => onPageChange(1)}
              aria-label="Page 1"
              aria-current={currentPage === 1 ? "page" : undefined}
            >
              1
            </Button>
          )}

          {/* Page numbers with ellipsis */}
          {pageNumbers.slice(1).map((pageNum, idx) => {
            if (pageNum === "ellipsis-start" || pageNum === "ellipsis-end") {
              return (
                <Button
                  key={`ellipsis-${idx}`}
                  variant="outline"
                  className="h-8 w-8 md:h-10 md:w-10 pointer-events-none dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
                  disabled
                >
                  &hellip;
                </Button>
              )
            }

            return (
              <Button
                key={`page-${pageNum}`}
                variant={currentPage === pageNum ? "default" : "outline"}
                className={`h-8 w-8 md:h-10 md:w-10 ${
                  currentPage !== pageNum &&
                  "dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
                }`}
                onClick={() => onPageChange(pageNum as number)}
                aria-label={`Page ${pageNum}`}
                aria-current={currentPage === pageNum ? "page" : undefined}
              >
                {pageNum}
              </Button>
            )
          })}

          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 md:h-10 md:w-10 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <p className="text-xs md:text-sm text-muted-foreground dark:text-gray-400 text-center mt-3 md:mt-4">
        Showing <span className="font-medium dark:text-gray-300">{(currentPage - 1) * limit + 1}</span> to{" "}
        <span className="font-medium dark:text-gray-300">{Math.min(currentPage * limit, totalCount)}</span> of{" "}
        <span className="font-medium dark:text-gray-300">{totalCount}</span> results
      </p>
    </div>
  )
}

