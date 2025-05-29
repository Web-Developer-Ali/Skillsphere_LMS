export const dynamic = 'force-dynamic';

import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import connectToDatabase from "@/lib/dbConnect";
import { ratelimit } from "@/lib/rateLimiter";
import { getServerSession } from "next-auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {

        // Rate limiting check
        const ip = headers().get('x-forwarded-for') ?? '127.0.0.1';
        const { success, limit, reset, remaining } = await ratelimit.limit(ip);

        if (!success) {
            return new NextResponse('Too many requests', {
                status: 429,
                headers: {
                    'X-RateLimit-Limit': limit.toString(),
                    'X-RateLimit-Remaining': remaining.toString(),
                    'X-RateLimit-Reset': reset.toString(),
                },
            });
        }

        const session = await getServerSession(authOptions);
        const userId = session?.user?.id;

        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const parentPostId = searchParams.get("parentPostId");
        const authorId = searchParams.get("authorId");
        const includeTopContributors = searchParams.get("includeTopContributors") === "true";

        const pool = await connectToDatabase();

        // Get posts (your existing query)
        let postsQuery = `SELECT * FROM "CommunityPosts" WHERE 1=1`;
        const postsParams: (string | number)[] = [];
        let paramIndex = 1;

        if (parentPostId) {
            postsQuery += ` AND "ParentPostID" = $${paramIndex++}`;
            postsParams.push(parentPostId);
        } else {
            postsQuery += ` AND "ParentPostID" IS NULL`; // Get only top-level posts
        }

        if (authorId) {
            postsQuery += ` AND "AuthorID" = $${paramIndex++}`;
            postsParams.push(authorId);
        }

        postsQuery += ` ORDER BY "CreatedAt" DESC`;

        const postsResult = await pool.query(postsQuery, postsParams);
        const posts = postsResult.rows;

        // Get top contributors only if requested
        let topContributors = [];
        if (includeTopContributors) {
            const contributorsQuery = `
                SELECT 
                    u."UserID" as id,
                    u."Username" as username,
                    u."ProfilePicture" as avatar,
                    COUNT(cp."PostID") as post_count,
                    SUM(cp."LikeCount") as total_likes
                FROM 
                    "Users" u
                JOIN 
                    "CommunityPosts" cp ON u."UserID" = cp."AuthorID"
                WHERE
                    cp."ParentPostID" IS NULL
                GROUP BY 
                    u."UserID", u."Username", u."ProfilePicture"
                ORDER BY 
                    post_count DESC, total_likes DESC
                LIMIT 3
            `;
            const contributorsResult = await pool.query(contributorsQuery);
            topContributors = contributorsResult.rows;
        }
        // Return combined response
        return NextResponse.json({
            posts,
            ...(includeTopContributors && { topContributors }) // Conditionally include
        });

    } catch (error) {
        console.error("[GET_POSTS] error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}