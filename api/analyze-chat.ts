
import { GoogleGenAI } from "@google/genai";
import { MODEL_NAME, SYSTEM_INSTRUCTION, chatSchema } from "./constants.js";

// Vercel Serverless Function
export default async function handler(req: Request) {
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
    }

    try {
        const { image, profileContext, note } = await req.json();

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return new Response(JSON.stringify({ error: 'Server configuration error: API Key missing' }), { status: 500 });
        }

        const ai = new GoogleGenAI({ apiKey });

        const contextString = JSON.stringify(profileContext);

        const prompt = `這是我們目前的對話進度。
          
    目標對象檔案: ${contextString}
    
    ${note ? `使用者對於目前狀況的想法/備註(或文字描述的對話內容): ${note}\n` : ''}
  
    請根據${image ? '圖片中的對話內容' : '使用者提供的備註描述'}，分析對方的意圖，並提供三個不同風格的回覆建議。
    請嚴格遵循 System Instruction 中的 Output Styles (風格 A, B, C) 提供建議。
    務必遵循核心架構：關鍵字 + 故事/情緒 + 問句。`;

        const parts: any[] = [{ text: prompt }];

        if (image) {
            parts.unshift({ inlineData: { mimeType: 'image/png', data: image } });
        }

        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: {
                parts: parts
            },
            config: {
                systemInstruction: SYSTEM_INSTRUCTION,
                responseMimeType: "application/json",
                responseSchema: chatSchema,
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
