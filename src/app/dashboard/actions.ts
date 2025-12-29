'use server'

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function createApi(formData: FormData) {
    const { orgId } = await auth();
    if (!orgId) throw new Error("Unauthorized");

    const name = formData.get("name") as string;
    const slug = formData.get("slug") as string;
    const description = formData.get("description") as string;
    // schema_config is passed as a hidden JSON string for now from the client builder
    const schemaConfigJson = formData.get("schema_config") as string;

    if (!name || !slug) {
        throw new Error("Name and Slug are required");
    }

    // Basic validation that it's valid JSON
    let schemaConfig = {};
    try {
        schemaConfig = JSON.parse(schemaConfigJson);
    } catch (e) {
        console.error("Invalid Schema JSON", e);
        // Fallback to default
        schemaConfig = {
            input_inputs: ["sku"],
            output_schema: { type: "object", properties: {} }
        };
    }

    try {
        await db.query(`
      INSERT INTO apis (org_id, name, slug, description, schema_config)
      VALUES ($1, $2, $3, $4, $5)
    `, [orgId, name, slug, description, schemaConfig]);
    } catch (error: any) {
        console.error("Failed to create API", error);
        // Simple error handling for duplicates
        if (error.code === '23505') { // Unique violation
            throw new Error("An API with this slug already exists.");
        }
        throw error;
    }

    revalidatePath("/dashboard");
    redirect("/dashboard");
}
