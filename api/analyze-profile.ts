
import { GoogleGenAI } from "@google/genai";
import { MODEL_NAME, SYSTEM_INSTRUCTION, profileSchema } from "./constants.js";

// Vercel Serverless Function
export default async function handler(req: Request) {
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
    }

    try {
        const { image, note } = await req.json();

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return new Response(JSON.stringify({ error: 'Server configuration error: API Key missing' }), { status: 500 });
        }

        const ai = new GoogleGenAI({ apiKey });

        const prompt = `這是對方的個人資料截圖，請幫我：
    1. 建立她的基本檔案 (包含姓名推測)。
    2. 分析她的興趣和性格。
    3. **重要**：根據她的檔案，提供 3 個適合作為「第一句開場白」的建議。
       這些開場白必須嚴格遵守 System Instruction 中的 Core Framework (關鍵字+故事/情緒+問句) 和 Constraints (拒絕套路)。
    ${note ? `\n使用者補充備註: ${note}` : ''}`;

        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: {
                parts: [
                    { inlineData: { mimeType: 'image/png', data: image } },
                    { text: prompt }
                ]
            },
            config: {
                systemInstruction: SYSTEM_INSTRUCTION,
                responseMimeType: "application/json",
                responseSchema: profileSchema,
            }
        });

        const text = response.text;
        if (!text) throw new Error("No response from AI");

        return new Response(text, {
            headers: {
                'Content-Type': 'application/json',
            }
        });
    } catch (error: any) {
        console.error("API Error:", error);
        return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), { status: 500 });
    }
}
