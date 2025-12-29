import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { executeAntiGravityApi } from "@/lib/engine";

export async function POST(req: Request) {
    const { orgId } = await auth();

    if (!orgId) {
        return new NextResponse("Unauthorized: Organization context required", { status: 401 });
    }

    try {
        const body = await req.json();
        const { apiSlug, payload } = body;

        if (!apiSlug || !payload) {
            return new NextResponse("Bad Request: apiSlug and payload are required", { status: 400 });
        }

        const result = await executeAntiGravityApi({ orgId: orgId, apiSlug, payload });

        return NextResponse.json(result);

    } catch (err: any) {
        console.error("API Execution Error:", err);
        return NextResponse.json(
            { error: err.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
