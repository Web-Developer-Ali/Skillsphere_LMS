import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import { NextResponse } from "next/server";

export async function GET() {
    const session = await getServerSession(authOptions);
    const userRole = session?.user?.role;

    if (!userRole) {
        return NextResponse.json(
            { error: "Unauthorized" }, 
            { status: 401 }
        );
    }

    return NextResponse.json(
        { 
            status: "success", 
            role: userRole
        },
        { status: 200 }
    );
}