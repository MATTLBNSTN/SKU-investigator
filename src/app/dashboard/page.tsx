import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardPage() {
    const { userId, orgId } = await auth();

    if (!userId) {
        redirect("/sign-in");
    }

    if (!orgId) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                <h1 className="text-2xl font-bold">Welcome to Anti Gravity</h1>
                <p>Please create or join an organization to continue.</p>
                {/* Clerk's organization creator would be invoked here via UI or Redirect */}
                <p className="text-sm text-gray-500">Use the Organization Switcher in the top bar.</p>
            </div>
        );
    }

    // Sync Org to DB (Lazy Sync for PoC)
    // We assume the user has a name in Clerk.
    await db.query(`
    INSERT INTO organizations (id, name)
    VALUES ($1, $2)
    ON CONFLICT (id) DO NOTHING
  `, [orgId, `Org ${orgId.slice(0, 8)}`]);
    // Note: We can't easily get the real Org Name here without Clerk SDK call, 
    // so we use a placeholder or would fetch it. 
    // Ideally use Webhooks.

    const apisRes = await db.query(
        "SELECT * FROM apis WHERE org_id = $1 ORDER BY created_at DESC",
        [orgId]
    );
    const apis = apisRes.rows;

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Your Gravity APIs</h1>
                <Link
                    href="/dashboard/new"
                    className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition"
                >
                    + Create New API
                </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {apis.map((api) => (
                    <div key={api.id} className="border p-6 rounded-lg shadow-sm hover:shadow-md transition bg-white">
                        <h2 className="text-xl font-semibold mb-2">{api.name}</h2>
                        <div className="text-xs font-mono bg-gray-100 p-1 rounded inline-block mb-4">/{api.slug}</div>
                        <p className="text-gray-600 mb-4 line-clamp-2">{api.description || "No description."}</p>
                        <div className="flex justify-between items-center mt-auto">
                            <span className={`text-xs px-2 py-1 rounded-full ${api.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {api.is_active ? 'Active' : 'Inactive'}
                            </span>
                            <Link href={`/dashboard/${api.id}`} className="text-blue-600 hover:underline text-sm">
                                Manage &rarr;
                            </Link>
                        </div>
                    </div>
                ))}

                {apis.length === 0 && (
                    <div className="col-span-full text-center py-12 border-2 border-dashed rounded-lg text-gray-400">
                        <p>No APIs defined yet. Create your first one!</p>
                    </div>
                )}
            </div>
        </div>
    );
}
