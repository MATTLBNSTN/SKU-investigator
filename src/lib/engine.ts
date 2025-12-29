import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "./db";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

interface ExecutionRequest {
    orgId: string;
    apiSlug: string;
    payload: Record<string, any>; // The user's input (e.g., SKU)
}

export async function executeAntiGravityApi({ orgId, apiSlug, payload }: ExecutionRequest) {

    // 1. Fetch the User's API Configuration from DB
    const res = await db.query(
        `SELECT * FROM apis WHERE org_id = $1 AND slug = $2 LIMIT 1`,
        [orgId, apiSlug]
    );
    const apiConfig = res.rows[0];

    if (!apiConfig) throw new Error("API not found");

    // 2. Validate Input (Check if user sent the required SKU)
    // In a real app, use a library like 'Ajv' here to validate 'payload' against 'apiConfig.schema_config.input_inputs'

    // 3. Initialize Gemini 2.0 Flash
    const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash-exp",
        // CRITICAL: This enables the AI to browse the live web
        tools: [{ googleSearch: {} }]
    });

    // 4. Construct the Dynamic Response Schema
    // We take the JSON structure the user saved in the DB and pass it to Gemini
    // ensuring the output is always perfect JSON matching their needs.
    const userDefinedSchema = apiConfig.schema_config.output_schema;

    const generationConfig = {
        responseMimeType: "application/json",
        responseSchema: userDefinedSchema,
    };

    // 5. Build the Prompt
    // We combine the User's Input (SKU) with their Desired Output requirements
    const prompt = `
    You are an intelligent product data extraction engine.
    
    USER INPUT DATA:
    ${JSON.stringify(payload)}
    
    TASK:
    1. Use Google Search to find detailed information about the item specified in the input data.
    2. Look for specific details regarding: ${Object.keys(userDefinedSchema.properties || {}).join(", ")}.
    3. If an image is found, verify it matches the visual description (color, material).
    4. Return the data adhering strictly to the JSON schema provided.
  `;

    try {
        // 6. Execute the "Anti Gravity" Request
        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: generationConfig
        });

        const responseText = result.response.text();

        // 7. Parse and Return
        const parsedData = JSON.parse(responseText);

        // Log success for billing
        await db.query(
            `INSERT INTO execution_logs (api_id, org_id, status, latency_ms) VALUES ($1, $2, 'success', 0)`,
            [apiConfig.id, orgId]
        );

        return parsedData;

    } catch (error) {
        console.error("Gravity Engine Failure:", error);
        await db.query(
            `INSERT INTO execution_logs (api_id, org_id, status, latency_ms) VALUES ($1, $2, 'error', 0)`,
            [apiConfig.id, orgId]
        );
        throw new Error("Failed to retrieve data from Anti Gravity engine");
    }
}
