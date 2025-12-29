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
    const schemaConfigJson = formData.get("schema_config") as string;

    if (!name || !slug) {
        throw new Error("Name and Slug are required");
    }

    let schemaConfig = {};
    try {
        schemaConfig = JSON.parse(schemaConfigJson);
    } catch (e) {
        console.error("Invalid Schema JSON", e);
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
        if (error.code === '23505') {
            throw new Error("An API with this slug already exists.");
        }
        throw error;
    }

    revalidatePath("/dashboard");
    redirect("/dashboard");
}

export async function updateApi(id: string, formData: FormData) {
    const { orgId } = await auth();
    if (!orgId) throw new Error("Unauthorized");

    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const schemaConfigJson = formData.get("schema_config") as string;

    let schemaConfig = {};
    if (schemaConfigJson) {
        try {
            schemaConfig = JSON.parse(schemaConfigJson);
        } catch (e) {
            console.error("Invalid Schema JSON", e);
        }
    }

    try {
        // Only update name, description, and schema. Slug usually stays constant to avoid breaking URLs, 
        // or we could allow it but that's riskier.
        await db.query(`
      UPDATE apis 
      SET name = $1, description = $2, schema_config = $3
      WHERE id = $4 AND org_id = $5
    `, [name, description, schemaConfig, id, orgId]);
    } catch (error) {
        console.error("Failed to update API", error);
        throw new Error("Failed to update API");
    }

    revalidatePath("/dashboard");
    revalidatePath(`/dashboard/${id}`);
    redirect("/dashboard");
}

export async function deleteApi(id: string) {
    const { orgId } = await auth();
    if (!orgId) throw new Error("Unauthorized");

    await db.query(`DELETE FROM apis WHERE id = $1 AND org_id = $2`, [id, orgId]);
    revalidatePath("/dashboard");
    redirect("/dashboard");
}

export async function getApiById(id: string) {
    const { orgId } = await auth();
    if (!orgId) return null;

    const res = await db.query(
        `SELECT * FROM apis WHERE id = $1 AND org_id = $2 LIMIT 1`,
        [id, orgId]
    );
    return res.rows[0] || null;
}
