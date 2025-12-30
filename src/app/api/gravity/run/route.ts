import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { executeAntiGravityApi } from "@/lib/engine";

export async function POST(req: Request) {
    const { orgId: clerkOrgId } = await auth();
    let orgId = clerkOrgId;

    // Check for API Key if not authenticated via Clerk
    if (!orgId) {
        const apiKey = req.headers.get('x-api-key');
        if (apiKey) {
            // Lazy import db to avoid top-level side effects if used in edge (though we are nodejs here)
            const { db } = await import("@/lib/db");
            const res = await db.query('SELECT id FROM organizations WHERE api_key = $1 LIMIT 1', [apiKey]);
            if (res.rows.length > 0) {
                orgId = res.rows[0].id;
            }
        }
    }

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
