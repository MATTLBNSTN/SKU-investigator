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
        tools: [{ googleSearch: {} } as any]
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
    ### ROLE
    You are a Master Product Data Steward and Expert Web Researcher. Your goal is to take a sparse product identifier or description, conduct a deep logical retrieval of all known attributes for that product, and map them to a strict destination schema.

    ### INPUT DATA
    ${JSON.stringify(payload, null, 2)}

    ### INSTRUCTIONS

    **STEP 1: IDENTIFICATION & ENRICHMENT (Internal Monologue)**
    First, identify the exact product based on the input data.
    * Use Google Search to find official product pages, retailer listings, and detailed specifications.
    * Draft a detailed "Product Knowledge Sheet" for this item containing all physical dimensions, technical specs, materials, and category details.
    * If you are unsure between two variants, identify the most common standard version matching the input.

    **STEP 2: DATA MAPPING**
    Map the information from your research into the User-Defined Fields listed below.

    **Rules for Mapping:**
    1.  **Accuracy:** Do not guess. If a specific field cannot be determined with at least 80% confidence, return null or an empty string, do not hallucinate.
    2.  **Formatting:** Ensure units of measure are standardized.
    3.  **Strict Schema:** You must only output the fields requested in the JSON schema.

    ### DESTINATION SCHEMA (User-Defined Fields)
    Please extract the following specific data points:
    ${Object.keys(userDefinedSchema.properties || {}).map(key => `* **${key}**: ${userDefinedSchema.properties[key].description || "Extract this value"}`).join("\n")}

    ### OUTPUT FORMAT
    Provide the output in valid JSON format only, complying with the Response Schema.
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

    } catch (error: any) {
        console.error("Gravity Engine Failure Full Error:", JSON.stringify(error, null, 2));
        console.error("Gravity Engine Failure Message:", error.message);

        await db.query(
            `INSERT INTO execution_logs (api_id, org_id, status, latency_ms) VALUES ($1, $2, 'error', 0)`,
            [apiConfig.id, orgId]
        );

        // Propagate the actual error message for debugging purposes
        throw new Error(`Gravity Engine Error: ${error.message || "Unknown error"}`);
    }
}
