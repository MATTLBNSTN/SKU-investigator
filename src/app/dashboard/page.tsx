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
        <div className="max-w-7xl mx-auto p-8 font-sans">
            <div className="flex justify-between items-center mb-10 border-b border-slate-200 pb-6">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-black sm:text-5xl">Welcome to the SKU investigator</h1>
                    <p className="text-slate-500 mt-2 text-lg">Manage your data extraction endpoints.</p>
                </div>
                <Link
                    href="/dashboard/new"
                    className="inline-flex items-center px-4 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition shadow-lg shadow-slate-900/20"
                >
                    + Create New API
                </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {apis.map((api) => (
                    <div key={api.id} className="group bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-200 overflow-hidden flex flex-col h-full">
                        <div className="p-6 flex flex-col h-full">
                            <div className="flex justify-between items-start mb-4">
                                <h2 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{api.name}</h2>
                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide ${api.is_active ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                                    {api.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </div>

                            <div className="mb-4">
                                <div className="inline-block bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-mono text-slate-600">
                                    /{api.slug}
                                </div>
                            </div>

                            <p className="text-slate-500 text-sm mb-6 line-clamp-2 leading-relaxed flex-grow">
                                {api.description || "No description provided."}
                            </p>

                            <div className="pt-4 border-t border-slate-50 mt-auto flex justify-between items-center">
                                <span className="text-xs text-slate-400">v{api.version}</span>
                                <Link href={`/dashboard/${api.id}`} className="text-sm font-medium text-slate-700 hover:text-blue-600 hover:underline transition-colors flex items-center">
                                    Manage API &rarr;
                                </Link>
                            </div>
                        </div>
                    </div>
                ))}

                {apis.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center py-16 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                        <div className="p-4 bg-white rounded-full shadow-sm mb-4">
                            {/* You might want a Lucid icon here if available, defaulting to text */}
                            <span className="text-2xl">⚡</span>
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-1">No APIs defined yet</h3>
                        <p className="text-slate-500 mb-6 text-sm">Create your first schema to start extracting data.</p>
                        <Link
                            href="/dashboard/new"
                            className="text-blue-600 font-medium hover:underline"
                        >
                            Create API Configuration
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
