import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/dbConnect";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";

interface CreatePostRequest {
    Title?: string;
    Content: string;
    Tags?: string[];
    parentPostId?: number;
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        const userId = session?.user?.id;

        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const requestBody: CreatePostRequest = await req.json();
        
        if (!requestBody.Content) {
            return new NextResponse("Content is required", { status: 400 });
        }

        const pool = await connectToDatabase();

        const { rows } = await pool.query(
        `INSERT INTO "CommunityPosts" (
        "AuthorID",
        "ParentPostID",
        "Title",
        "Content",
        "Tags"
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *`,
            [
                userId,
                requestBody.parentPostId || null,
                requestBody.Title || null,
                requestBody.Content,
                requestBody.Tags || null
            ]
        );

        const newPost = rows[0];
        return NextResponse.json(newPost);

    } catch (error) {
        console.error("[CREATE_POST] error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}