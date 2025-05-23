"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"

type FilterSidebarProps = {
  onFilterChange: (filters: FilterState) => void
  initialFilters?: FilterState
  isMobile?: boolean
}

export type FilterState = {
  levels: string[]
  durations: string[]
  priceRange: number
  ratings: number[]
}

export default function FilterSidebar({ onFilterChange, initialFilters, isMobile = false }: FilterSidebarProps) {
  const [filters, setFilters] = useState<FilterState>(
    initialFilters || {
      levels: [],
      durations: [],
      priceRange: 50,
      ratings: [],
    },
  )

  // Add a local state for price to make the UI more responsive
  const [localPrice, setLocalPrice] = useState<number>(initialFilters?.priceRange || 50)

  // Add a debounce timer for price changes
  const priceDebounceTimer = useRef<NodeJS.Timeout | null>(null)

  // Update local price when initialFilters change
  useEffect(() => {
    if (initialFilters?.priceRange !== undefined) {
      setLocalPrice(initialFilters.priceRange)
    }
  }, [initialFilters?.priceRange])

  const handleLevelChange = (level: string, checked: boolean) => {
    const newLevels = checked ? [...filters.levels, level] : filters.levels.filter((l) => l !== level)

    const newFilters = { ...filters, levels: newLevels }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const handleDurationChange = (duration: string, checked: boolean) => {
    const newDurations = checked ? [...filters.durations, duration] : filters.durations.filter((d) => d !== duration)

    const newFilters = { ...filters, durations: newDurations }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const handleRatingChange = (rating: number, checked: boolean) => {
    const newRatings = checked ? [...filters.ratings, rating] : filters.ratings.filter((r) => r !== rating)

    const newFilters = { ...filters, ratings: newRatings }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  // Improved price change handler with debounce
  const handlePriceChange = (value: number[]) => {
    const newPrice = value[0]
    setLocalPrice(newPrice)

    // Clear any existing timer
    if (priceDebounceTimer.current) {
      clearTimeout(priceDebounceTimer.current)
    }

    // Set a new timer to update the actual filter after a short delay
    priceDebounceTimer.current = setTimeout(() => {
      const newFilters = { ...filters, priceRange: newPrice }
      setFilters(newFilters)
      onFilterChange(newFilters)
    }, 300)
  }

  // Handle direct input for price
  const handlePriceInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const numValue = Number.parseInt(value, 10)

    // Validate input
    if (value === "" || isNaN(numValue)) {
      setLocalPrice(0)
      return
    }

    // Clamp value between 0 and 200
    const clampedValue = Math.min(Math.max(numValue, 0), 200)
    setLocalPrice(clampedValue)

    // Clear any existing timer
    if (priceDebounceTimer.current) {
      clearTimeout(priceDebounceTimer.current)
    }

    // Set a new timer to update the actual filter after a short delay
    priceDebounceTimer.current = setTimeout(() => {
      const newFilters = { ...filters, priceRange: clampedValue }
      setFilters(newFilters)
      onFilterChange(newFilters)
    }, 500)
  }

  // Handle touch events specifically for mobile
  const handleTouchEnd = (e: React.TouchEvent) => {
    // Immediately apply the price change when touch ends
    const newFilters = { ...filters, priceRange: localPrice }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  // Clean up the debounce timer when component unmounts
  useEffect(() => {
    return () => {
      if (priceDebounceTimer.current) {
        clearTimeout(priceDebounceTimer.current)
      }
    }
  }, [])

  const levels = ["Beginner", "Intermediate", "Advanced"]
  const durations = ["0-2 weeks", "3-6 weeks", "7-12 weeks", "3+ months"]
  const ratings = [4.5, 4.0, 3.5, 3.0]

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Level */}
      <div className="space-y-4">
        <h3 className="font-medium dark:text-gray-200">Level</h3>
        {levels.map((level) => (
          <div key={level} className="flex items-center space-x-2">
            <Checkbox
              id={`${isMobile ? "mobile-" : ""}${level.toLowerCase()}`}
              className="dark:border-gray-600"
              checked={filters.levels.includes(level)}
              onCheckedChange={(checked) => handleLevelChange(level, checked as boolean)}
            />
            <label
              htmlFor={`${isMobile ? "mobile-" : ""}${level.toLowerCase()}`}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 dark:text-gray-300"
            >
              {level}
            </label>
          </div>
        ))}
      </div>

      {/* Duration */}
      <div className="space-y-4">
        <h3 className="font-medium dark:text-gray-200">Duration</h3>
        {durations.map((duration) => (
          <div key={duration} className="flex items-center space-x-2">
            <Checkbox
              id={`${isMobile ? "mobile-" : ""}${duration.toLowerCase().replace(/ /g, "-")}`}
              className="dark:border-gray-600"
              checked={filters.durations.includes(duration)}
              onCheckedChange={(checked) => handleDurationChange(duration, checked as boolean)}
            />
            <label
              htmlFor={`${isMobile ? "mobile-" : ""}${duration.toLowerCase().replace(/ /g, "-")}`}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 dark:text-gray-300"
            >
              {duration}
            </label>
          </div>
        ))}
      </div>

      {/* Price Range */}
      <div className="space-y-4">
        <h3 className="font-medium dark:text-gray-200">Price Range</h3>
        <Slider
          value={[localPrice]}
          max={200}
          step={1}
          className="dark:text-blue-700 touch-action-none"
          onValueChange={handlePriceChange}
          onTouchEnd={handleTouchEnd}
          aria-label="Price range"
        />
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground dark:text-gray-400">$0</span>
          <div className="flex items-center">
            <span className="text-sm font-medium mr-2 dark:text-gray-200">$</span>
            <Input
              type="number"
              inputMode="numeric"
              pattern="[0-9]*"
              value={localPrice}
              onChange={handlePriceInput}
              min={0}
              max={200}
              className="w-20 h-10 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
              aria-label="Price value"
            />
          </div>
          <span className="text-sm text-muted-foreground dark:text-gray-400">$200</span>
        </div>
      </div>

      {/* Rating */}
      <div className="space-y-4">
        <h3 className="font-medium dark:text-gray-200">Rating</h3>
        {ratings.map((rating) => (
          <div key={rating} className="flex items-center space-x-2">
            <Checkbox
              id={`${isMobile ? "mobile-" : ""}rating-${rating}`}
              className="dark:border-gray-600"
              checked={filters.ratings.includes(rating)}
              onCheckedChange={(checked) => handleRatingChange(rating, checked as boolean)}
            />
            <label
              htmlFor={`${isMobile ? "mobile-" : ""}rating-${rating}`}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 dark:text-gray-300"
            >
              {rating}+ Stars
            </label>
          </div>
        ))}
      </div>
    </div>
  )

  if (isMobile) {
    return (
      <Card className="mt-2 dark:bg-gray-800 dark:border-gray-700 md:hidden">
        <CardContent className="pt-4">
          <FilterContent />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-fit hidden md:block dark:bg-gray-800 dark:border-gray-700 sticky top-4">
      <CardHeader>
        <CardTitle className="dark:text-white">Filters</CardTitle>
      </CardHeader>
      <CardContent>
        <FilterContent />
      </CardContent>
    </Card>
  )
}
