export const dynamic = 'force-dynamic';

import connectToDatabase from "@/lib/dbConnect";
import { redis } from "@/lib/redis";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse and validate parameters
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.max(1, Number(searchParams.get("limit") || 6));
    const offset = (page - 1) * limit;
    const rawCategory = searchParams.get("category") || "";
    const category = decodeURIComponent(rawCategory);
    const sort = searchParams.get("sort") || "popular";
    const levels = searchParams.get("level")?.split(",").map(level => level.trim()).filter(Boolean);
    const maxPrice = parseFloat(searchParams.get("maxPrice") || "");
    const minRating = parseFloat(searchParams.get("minRating") || "");
    const search = searchParams.get("search")?.trim() || "";

    const cacheKey = `courses:${category}:${sort}:${levels}:${maxPrice}:${minRating}:${search}:${page}:${limit}`;

    // Try to get from Redis cache
    try {
      const cachedData = await redis.get(cacheKey);
      if (cachedData) {
        const parsedData = typeof cachedData === 'string' ? JSON.parse(cachedData) : cachedData;
        return NextResponse.json(parsedData);
      }
    } catch (cacheError) {
      console.error("Cache read error:", cacheError);
      // Continue with fresh data fetch if cache read fails
    }

    const pool = await connectToDatabase();

    let query = `
      SELECT 
        c."CourseID", c."Title", c."Description", c."Category", 
        c."DifficultyLevel", c."Fees", c."Rating", 
        c."ThumbnailPublicID", u."FullName" AS "InstructorName", 
        c."CreatedAt", 
        EXTRACT(WEEK FROM CURRENT_DATE) - EXTRACT(WEEK FROM c."CreatedAt") AS "DurationWeeks",
        (
          SELECT COUNT(*) 
          FROM "Courses_Chapters" cc 
          WHERE cc."CourseID" = c."CourseID"
        ) AS "ChapterCount",
        (
          SELECT COUNT(DISTINCT "UserID")
          FROM "CourseProgress"
          WHERE "CourseID" = c."CourseID"
        ) AS "StudentCount"
      FROM "Courses" c
      JOIN "Users" u ON c."InstructorID" = u."UserID"
      WHERE c."Status" = 'published'
    `;

    const queryParams: (string | number)[] = [];

    if (category && category !== "All") {
      query += ` AND c."Category" = $${queryParams.length + 1}`;
      queryParams.push(category);
    }

    if (levels && levels.length > 0) {
      const levelPlaceholders = levels.map((_, i) => `$${queryParams.length + i + 1}`).join(", ");
      query += ` AND c."DifficultyLevel" IN (${levelPlaceholders})`;
      queryParams.push(...levels);
    }

    if (!isNaN(maxPrice) && maxPrice > 0) {
      query += ` AND c."Fees" <= $${queryParams.length + 1}`;
      queryParams.push(maxPrice);
    }

    if (!isNaN(minRating) && minRating > 0) {
      query += ` AND c."Rating" >= $${queryParams.length + 1}`;
      queryParams.push(minRating);
    }

    if (search && search !== "") {
      query += ` AND (c."Title" ILIKE $${queryParams.length + 1} OR c."Category" ILIKE $${queryParams.length + 1})`;
      queryParams.push(`%${search}%`);
    }

    const sortOptions: Record<string, string> = {
      newest: `c."CreatedAt" DESC`,
      "price-low": `c."Fees" ASC`,
      "price-high": `c."Fees" DESC`,
      rating: `c."Rating" DESC`,
      popular: `"StudentCount" DESC`,
    };
    
    query += ` ORDER BY ${sortOptions[sort]}`;
    query += ` LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;

    const result = await pool.query(query, [...queryParams, limit, offset]);

    if (!result.rows || result.rows.length === 0) {
      return NextResponse.json({ courses: [], totalCount: 0, page, totalPages: 0 });
    }

    let countQuery = `SELECT COUNT(*) AS "TotalCount" FROM "Courses" c WHERE c."Status" = 'published'`;
    const countParams: (string | number)[] = [];

    if (category && category !== "All") {
      countQuery += ` AND c."Category" = $${countParams.length + 1}`;
      countParams.push(category);
    }
    if (levels && levels.length > 0) {
      const levelPlaceholders = levels.map((_, i) => `$${countParams.length + i + 1}`).join(", ");
      countQuery += ` AND c."DifficultyLevel" IN (${levelPlaceholders})`;
      countParams.push(...levels);
    }
    if (!isNaN(maxPrice) && maxPrice > 0) {
      countQuery += ` AND c."Fees" <= $${countParams.length + 1}`;
      countParams.push(maxPrice);
    }
    if (!isNaN(minRating) && minRating > 0) {
      countQuery += ` AND c."Rating" >= $${countParams.length + 1}`;
      countParams.push(minRating);
    }
    if (search && search !== "") {
      countQuery += ` AND (c."Title" ILIKE $${countParams.length + 1} OR c."Category" ILIKE $${countParams.length + 1})`;
      countParams.push(`%${search}%`);
    }

    const totalCountResult = await pool.query(countQuery, countParams);
    const totalCount = parseInt(totalCountResult.rows[0]?.TotalCount || "0");
    const totalPages = Math.ceil(totalCount / limit);

    const categoryResult = await pool.query(`
      SELECT "Category"
      FROM (
        SELECT 
          "Category", 
          COUNT(*) AS "CourseCount",
          MAX("CreatedAt") AS "LatestCourseDate"
        FROM "Courses" 
        WHERE TRIM(LOWER("Status")) = 'published' AND "Category" IS NOT NULL AND TRIM("Category") <> ''
        GROUP BY "Category"
      ) AS "CategoryStats"
      ORDER BY "CourseCount" DESC, "LatestCourseDate" DESC
      LIMIT 6
    `);

    const availableCategories = categoryResult.rows.map(row => row.Category);
    const response = {
      courses: result.rows,
      totalCount,
      page,
      totalPages,
      availableCategories,
    };

    // Store in Redis for 30 mins
    try {
      await redis.set(cacheKey, JSON.stringify(response), { ex: 60 * 30 });
    } catch (cacheError) {
      console.error("Cache write error:", cacheError);
    }

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error("Error fetching courses:", error);
  
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
  
    return NextResponse.json(
      { error: "Failed to fetch courses", details: errorMessage },
      { status: 500 }
    );
  }
}