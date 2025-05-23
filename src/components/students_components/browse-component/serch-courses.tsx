"use client"

import type React from "react"
import { useState, useRef, useCallback, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Search, Loader2, X } from "lucide-react"
import axios from "axios"

interface Suggestions {
  coursesTitles: string[]
  categories: string[]
}

interface SearchFormProps {
  onSearch: (query: string) => void
  isSearching?: boolean
}

const SearchForm: React.FC<SearchFormProps> = ({ onSearch, isSearching = false }) => {
  const [searchQuery, setSearchQuery] = useState("")
  const [suggestions, setSuggestions] = useState<Suggestions>({
    coursesTitles: [],
    categories: [],
  })
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false)

  const searchInputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null)

  const fetchSuggestions = useCallback(async (query: string) => {
    try {
      setIsFetchingSuggestions(true)
      const { data } = await axios.get(`/api/student/search-suggestions?searchQuery=${encodeURIComponent(query)}`)
      setSuggestions(data.data) // Accessing the data property from our API response
      setShowSuggestions(true)
    } catch (error) {
      console.error("Error fetching suggestions:", error)
      setSuggestions({ coursesTitles: [], categories: [] })
    } finally {
      setIsFetchingSuggestions(false)
    }
  }, [])

  const handleInputChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.trim()
    setSearchQuery(query)

    // Clear previous timeout
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current)
    }

    // Only fetch suggestions for queries with minimum length
    if (query.length >= 2) {
      debounceTimeout.current = setTimeout(() => {
        fetchSuggestions(query)
      }, 300) // Reduced debounce time for better responsiveness
    } else {
      setSuggestions({ coursesTitles: [], categories: [] })
      setShowSuggestions(false)
    }
  }, [fetchSuggestions])

  const selectSuggestion = (suggestion: string) => {
    setSearchQuery(suggestion)
    setShowSuggestions(false)
    onSearch(suggestion)
    if (searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setShowSuggestions(false)
    onSearch(searchQuery.trim())
  }

  const handleClearSearch = () => {
    setSearchQuery("")
    setSuggestions({ coursesTitles: [], categories: [] })
    setShowSuggestions(false)
    onSearch("")
    if (searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current)
      }
    }
  }, [])

  return (
    <form onSubmit={handleSubmit} className="relative flex-1 w-full md:w-[320px]">
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground dark:text-gray-400" />
      <Input
        ref={searchInputRef}
        type="text"
        placeholder="Search courses..."
        value={searchQuery}
        onChange={handleInputChange}
        className="pl-8 w-full dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 dark:placeholder-gray-500"
        aria-label="Search courses"
      />
      {searchQuery && !isSearching && !isFetchingSuggestions && (
        <button
          type="button"
          onClick={handleClearSearch}
          className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground hover:text-foreground"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}
      {(isSearching || isFetchingSuggestions) && (
        <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
      )}
      {showSuggestions && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full bg-white dark:bg-gray-700 mt-1 rounded-md shadow-lg border border-gray-200 dark:border-gray-600"
        >
          {isFetchingSuggestions ? (
            <div className="px-4 py-2 text-gray-500 dark:text-gray-400 flex items-center justify-center">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Loading suggestions...
            </div>
          ) : suggestions.coursesTitles.length > 0 || suggestions.categories.length > 0 ? (
            <ul className="max-h-60 overflow-auto py-1">
              {suggestions.coursesTitles.length > 0 && (
                <li className="px-3 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Course Titles
                </li>
              )}
              {suggestions.coursesTitles.map((title, index) => (
                <li
                  key={`title-${index}`}
                  className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer text-gray-800 dark:text-gray-200 transition-colors duration-150"
                  onClick={() => selectSuggestion(title)}
                >
                  {title}
                </li>
              ))}
              {suggestions.categories.length > 0 && (
                <li className="px-3 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Categories
                </li>
              )}
              {suggestions.categories.map((cat, index) => (
                <li
                  key={`category-${index}`}
                  className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer text-gray-800 dark:text-gray-200 transition-colors duration-150"
                  onClick={() => selectSuggestion(cat)}
                >
                  {cat}
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-2 text-gray-500 dark:text-gray-400">No suggestions found</div>
          )}
        </div>
      )}
    </form>
  )
}

export default SearchForm