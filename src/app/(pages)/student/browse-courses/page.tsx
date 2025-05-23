"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ChevronRight } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Head from "next/head"
import SearchForm from "@/components/students_components/browse-component/serch-courses"
import FilterSidebar, { type FilterState } from "@/components/students_components/browse-component/filter-sidebar"
import Pagination from "@/components/students_components/browse-component/pagination-component"
import { CourseListSection } from "@/components/students_components/browse-component/course-list-section"
import { useCourseData } from "@/components/students_components/browse-component/use-course-data"


const SORT_OPTIONS = [
  { value: "popular", label: "Most Popular" },
  { value: "newest", label: "Newest" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "rating", label: "Highest Rated" },
]

export default function CoursesPage() {
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [category, setCategory] = useState("All")
  const [sort, setSort] = useState("popular")
  const [searchQuery, setSearchQuery] = useState("")
  const [limit] = useState(6)
  const [filters, setFilters] = useState<FilterState>({
    levels: [],
    durations: [],
    priceRange: 50,
    ratings: [],
  })
  const [isSearching, setIsSearching] = useState(false)

  // Check if client-side to avoid SSR mismatches
  const [isClient, setIsClient] = useState(false)
  useEffect(() => {
    setIsClient(true)
  }, [])

  const { courses, categories, loading, error, totalPages, totalCount, favorites, fetchCourses, handleFavoriteToggle } =
    useCourseData({
      page,
      limit,
      category,
      sort,
      searchQuery,
      filters,
      isClient,
      setIsSearching,
    })

  // Set document title for SEO
  useEffect(() => {
    document.title = `Browse ${category === "All" ? "" : category + " "}Courses | Learn New Skills`
  }, [category])

  // Set SEO optimized title and meta description
  const seoTitle = `Browse ${category === "All" ? "" : category + " "}Courses | Learn New Skills`
  const seoDescription = `Explore high-quality ${
    category === "All" ? "" : category + " "
  }courses online and grow your career.`

  const handleSearch = (query: string) => {
    setIsSearching(true)
    setSearchQuery(query || "") // Use empty string if query is undefined
    setPage(1)
  }

  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory)
    setPage(1)
  }

  const handleSortChange = (newSort: string) => {
    setSort(newSort)
    setPage(1)
  }

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setPage(newPage)
      // Scroll to top smoothly
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      })
    }
  }

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters)
    setPage(1)
  }

  return (
    <>
      <Head>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta name="robots" content="index, follow" />
      </Head>

      <div className="flex min-h-screen flex-col bg-background dark:bg-gray-900">
        {/* <Navbar/> */}
        <main className="flex-1">
          <div className="container max-w-full py-4 px-4 md:px-6 md:py-6 space-y-6 md:space-y-8">
            {/* Search Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight dark:text-white">Browse Courses</h1>
                <p className="text-muted-foreground dark:text-gray-400">Discover new skills and advance your career</p>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full md:w-auto">
                <SearchForm onSearch={handleSearch} isSearching={isSearching} />
                <Select value={sort} onValueChange={handleSortChange}>
                  <SelectTrigger
                    className="w-full sm:w-[160px] dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
                    aria-label="Sort courses by"
                  >
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                    {SORT_OPTIONS.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                        className="dark:text-gray-200 dark:focus:bg-gray-700 dark:hover:text-white"
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Categories */}
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide">
              <Button
                key="All"
                variant={category === "All" ? "default" : "outline"}
                className={`rounded-full whitespace-nowrap ${
                  category !== "All" &&
                  "dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-700 dark:hover:text-white"
                }`}
                onClick={() => handleCategoryChange("All")}
                aria-current={category === "All" ? "true" : undefined}
              >
                All
              </Button>
              {categories?.map((cat) => (
                <Button
                  key={cat}
                  variant={cat === category ? "default" : "outline"}
                  className={`rounded-full whitespace-nowrap ${
                    cat !== category &&
                    "dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-700 dark:hover:text-white"
                  }`}
                  onClick={() => handleCategoryChange(cat)}
                  aria-current={cat === category ? "true" : undefined}
                >
                  {cat}
                </Button>
              ))}
            </div>

            {/* Main Grid */}
            <div className="grid gap-6 md:grid-cols-[240px_1fr]">
              {/* Mobile Filter Toggle */}
              <div className="md:hidden mb-4">
                <Button
                  variant="outline"
                  className="w-full flex items-center justify-between dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
                  onClick={() => setFiltersOpen(!filtersOpen)}
                  aria-expanded={filtersOpen}
                  aria-controls="filters-sidebar"
                >
                  <span>Filters</span>
                  <ChevronRight
                    className={`h-4 w-4 transition-transform ${filtersOpen ? "rotate-90" : ""}`}
                    aria-hidden="true"
                  />
                </Button>
              </div>

              {/* Filters Sidebar */}
              {(filtersOpen || (isClient && !window.matchMedia("(max-width: 768px)").matches)) && (
                <FilterSidebar
                  onFilterChange={handleFilterChange}
                  initialFilters={filters}
                  isMobile={isClient ? window.matchMedia("(max-width: 768px)").matches : false}
                />
              )}

              <CourseListSection
                courses={courses}
                loading={loading}
                error={error}
                favorites={favorites}
                handleFavoriteToggle={handleFavoriteToggle}
                fetchCourses={fetchCourses}
                setCategory={setCategory}
                setSearchQuery={setSearchQuery}
                setFilters={setFilters}
              />
            </div>

            {/* Pagination */}
            {!loading && !error && courses.length > 0 && (
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalCount={totalCount}
                limit={limit}
                onPageChange={handlePageChange}
                aria-label="Course pagination"
              />
            )}
          </div>
        </main>
      </div>
    </>
  )
}
