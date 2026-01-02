import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { executeAntiGravityApi } from "@/lib/engine";

export async function GET(req: Request) {
    const { orgId: clerkOrgId } = await auth();
    let orgId = clerkOrgId;

    // Check for API Key if not authenticated via Clerk
    if (!orgId) {
        let apiKey = req.headers.get('x-api-key');

        // Allow passing key via query param for easier GET caching/usage
        if (!apiKey) {
            const { searchParams } = new URL(req.url);
            apiKey = searchParams.get('x-api-key');
        }

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
        const { searchParams } = new URL(req.url);
        const apiSlug = searchParams.get('apiSlug');

        if (!apiSlug) {
            return new NextResponse("Bad Request: apiSlug is required", { status: 400 });
        }

        // Construct payload from all other params
        const payload: Record<string, string> = {};
        searchParams.forEach((value, key) => {
            if (key !== 'apiSlug') {
                payload[key] = value;
            }
        });

        if (Object.keys(payload).length === 0) {
            return new NextResponse("Bad Request: at least one input parameter is required", { status: 400 });
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
