import { auth } from "@clerk/nextjs/server";
import { getApiById } from "../actions";
import { redirect } from "next/navigation";
import ApiForm from "@/components/ApiForm";
import ApiTester from "@/components/ApiTester";
import IntegrationGuide from "@/components/IntegrationGuide";
import { db } from "@/lib/db";

export default async function EditApiPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const { orgId } = await auth();

    if (!orgId) {
        redirect("/sign-in");
    }

    const apiData = await getApiById(id);

    if (!apiData) {
        redirect("/dashboard");
    }

    const outputProps = apiData.schema_config?.output_schema?.properties || {};

    // Fetch the Org's API Key for the integration guide
    // We fetch this directly here since it's sensitive and specific to the dashboard view
    const orgRes = await db.query('SELECT api_key FROM organizations WHERE id = $1', [orgId]);
    const apiKey = orgRes.rows[0]?.api_key || "";

    return (
        <div className="space-y-12 pb-20">
            <ApiForm initialData={apiData} />

            <div className="max-w-5xl mx-auto px-8">
                <div className="flex items-center gap-4 mb-4">
                    <div className="h-px bg-slate-200 flex-1"></div>
                    <span className="text-sm font-semibold text-slate-400 uppercase tracking-widest">Verification Zone</span>
                    <div className="h-px bg-slate-200 flex-1"></div>
                </div>
                <ApiTester
                    apiSlug={apiData.slug}
                    fieldDefinitions={outputProps}
                />
            </div>

            <div className="max-w-5xl mx-auto px-8">
                <div className="flex items-center gap-4 mb-4">
                    <div className="h-px bg-slate-200 flex-1"></div>
                    <span className="text-sm font-semibold text-slate-400 uppercase tracking-widest">Integration</span>
                    <div className="h-px bg-slate-200 flex-1"></div>
                </div>
                <IntegrationGuide
                    apiSlug={apiData.slug}
                    apiKey={apiKey}
                    fields={outputProps}
                    inputParams={apiData.schema_config?.input_inputs || ['sku']}
                />
            </div>
        </div>
    );
}
