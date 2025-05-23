import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/dbConnect";
import { redis } from "@/lib/redis";

// Cache configuration
const CACHE_TTL = 60 * 5; // 5 minutes
const MIN_QUERY_LENGTH = 2; // Minimum characters to trigger search
const MAX_RESULTS = 10; // Limit results for each category

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const query = searchParams.get("searchQuery")?.trim();

  // Early return for empty or too short queries
  if (!query || query.length < MIN_QUERY_LENGTH) {
    return NextResponse.json({ 
      success: true,
      data: { 
        coursesTitles: [], 
        categories: [] 
      } 
    });
  }

  // Generate cache key
  const cacheKey = `course-search:${query.toLowerCase()}`;

  try {
    // Try to get cached results
    const cached = await redis.get(cacheKey);
    if (cached) {
      return NextResponse.json(JSON.parse(cached as string));
    }
  } catch (cacheError) {
    console.error("Cache read error:", cacheError);
  }

  try {
    const pool = await connectToDatabase();
    const searchPattern = `%${query}%`;
    const startsWithPattern = `${query}%`;

    // First get distinct titles with ranking
    const titlesQuery = `
      SELECT "Title"
      FROM "Courses"
      WHERE "Status" = 'published'
        AND "Title" ILIKE $1
      GROUP BY "Title"  -- Using GROUP BY instead of DISTINCT to allow ordering
      ORDER BY 
        -- Prioritize matches at the beginning of the title
        CASE WHEN "Title" ILIKE $2 THEN 0 ELSE 1 END,
        -- Then by shorter titles (more precise matches)
        LENGTH("Title"),
        -- Then alphabetically
        "Title"
      LIMIT $3
    `;

    // Then get distinct categories with ranking
    const categoriesQuery = `
      SELECT "Category"
      FROM "Courses"
      WHERE "Status" = 'published'
        AND "Category" ILIKE $1
      GROUP BY "Category"  -- Using GROUP BY instead of DISTINCT to allow ordering
      ORDER BY 
        -- Prioritize matches at the beginning of the category
        CASE WHEN "Category" ILIKE $2 THEN 0 ELSE 1 END,
        -- Then by shorter categories (more precise matches)
        LENGTH("Category"),
        -- Then alphabetically
        "Category"
      LIMIT $3
    `;

    // Execute both queries in parallel
    const [titlesResult, categoriesResult] = await Promise.all([
      pool.query(titlesQuery, [searchPattern, startsWithPattern, MAX_RESULTS]),
      pool.query(categoriesQuery, [searchPattern, startsWithPattern, MAX_RESULTS])
    ]);

    const response = {
      success: true,
      data: {
        coursesTitles: titlesResult.rows.map(row => row.Title),
        categories: categoriesResult.rows.map(row => row.Category),
      },
      meta: {
        query,
        resultsCount: {
          titles: titlesResult.rows.length,
          categories: categoriesResult.rows.length
        }
      }
    };

    // Cache the response in background
    cacheResponse(cacheKey, response).catch(e => 
      console.error("Background cache update failed:", e)
    );

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching course suggestions:", error);
    return NextResponse.json({
      success: false,
      error: "Internal Server Error",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

async function cacheResponse(cacheKey: string, data: any) {
  try {
    await redis.set(cacheKey, JSON.stringify(data), { ex: CACHE_TTL });
  } catch (error) {
    console.error("Failed to update cache:", error);
  }
}