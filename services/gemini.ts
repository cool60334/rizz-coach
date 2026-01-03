
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ProfileAnalysis, ChatAdvice } from "../types";

// Shared Logic for Local Mode (Duplicated from api/constants.ts to keep local mode self-contained without import issues if not needed)
const MODEL_NAME = 'gemini-2.5-flash';

const SYSTEM_INSTRUCTION = `
你是一位專業社交溝通教練與聊天助手，擅長透過「自然感」與「故事架構」與異性建立深度連結。

### Core Framework (核心架構)
回覆必須包含：【關鍵字】+【個人故事/想法/情緒分享】+【經過設計的問句】

### Constraints (原則限制)
1. **拒絕套路感**：口語化、自然，絕對不要像機器人或背台詞。
2. **節奏控制**：訊息簡潔，一串話題控制在 2-3 句內，嚴禁長篇大論。
3. **創造 Hook**：擷取故事中的「非常態資訊」（反直覺、有趣、引人好奇點）並放大。
4. **情緒張力**：使用具體的形容詞與適度的誇飾，增加畫面感與情緒起伏。
5. **不聊到底**：適度保留懸念。

### Output Styles (回覆風格)
請提供三個回覆，分別對應以下風格（可根據對話情境微調）：
- **風格 A (輕鬆幽默)**：用於破冰或緩解氣氛，帶點調皮或趣味。
- **風格 B (深度共鳴)**：展現同理心，針對對方內容分享獨特觀點。
- **風格 C (引導提問)**：延伸話題，利用好奇心讓對方想接話。

請務必以**繁體中文 (Traditional Chinese)** 輸出。
`;

const profileSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    basicInfo: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: "Inferred name of the person from the bio/image. If unknown, leave empty." },
        age: { type: Type.STRING },
        occupation: { type: Type.STRING },
        constellation: { type: Type.STRING },
        location: { type: Type.STRING },
      },
    },
    interests: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    personalityTraits: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    summary: { type: Type.STRING, description: "A brief summary of the target persona" },
    openingLines: {
      type: Type.ARRAY,
      description: "Three opening lines to start a conversation with this specific profile.",
      items: {
        type: Type.OBJECT,
        properties: {
          style: { type: Type.STRING, description: "e.g., 風格 A (輕鬆幽默)" },
          content: { type: Type.STRING, description: "The actual opening line text." },
          explanation: { type: Type.STRING, description: "Why this opener works for this specific profile." },
        },
        required: ["style", "content", "explanation"],
      },
    },
  },
  required: ["basicInfo", "interests", "personalityTraits", "summary", "openingLines"],
};

const chatSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    situationAnalysis: { type: Type.STRING, description: "Analysis of the current conversation mood and the user's last message intent." },
    suggestions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          style: { type: Type.STRING, description: "e.g., 風格 A (輕鬆幽默)" },
          content: { type: Type.STRING, description: "The actual suggested reply text." },
          explanation: { type: Type.STRING, description: "Why this reply works." },
        },
        required: ["style", "content", "explanation"],
      },
    },
    coachTip: { type: Type.STRING, description: "Final advice on future direction." },
  },
  required: ["situationAnalysis", "suggestions", "coachTip"],
};


// Main Service Functions

export const analyzeProfileImage = async (base64Image: string, note?: string): Promise<ProfileAnalysis> => {
  // Check for Local Dev Mode with Key
  // We check process.env.GEMINI_API_KEY (injected by Vite config) OR VITE_ env var
  const localKey = process.env.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY; // Note: Ensure your env var is prefixed with VITE_
  if (localKey && import.meta.env.DEV) {
    console.log("Using Local Gemini SDK");
    return localAnalyzeProfile(localKey, base64Image, note);
  }

  // Production / Proxy Mode
  console.log("Using Backend API Proxy");
  const response = await fetch('/api/analyze-profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: base64Image, note })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to analyze profile");
  }

  return await response.json();
};

export const analyzeChatImage = async (
  base64Image: string | null,
  profileContext: ProfileAnalysis,
  note?: string
): Promise<ChatAdvice> => {
  // Check for Local Dev Mode with Key
  const localKey = process.env.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY;
  if (localKey && import.meta.env.DEV) {
    console.log("Using Local Gemini SDK");
    return localAnalyzeChat(localKey, base64Image, profileContext, note);
  }

  // Production / Proxy Mode
  console.log("Using Backend API Proxy");
  const response = await fetch('/api/analyze-chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: base64Image, profileContext, note })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to analyze chat");
  }

  return await response.json();
};


// --- Local Implementations (Private) ---

const localAnalyzeProfile = async (apiKey: string, base64Image: string, note?: string): Promise<ProfileAnalysis> => {
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
        { inlineData: { mimeType: 'image/png', data: base64Image } },
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

  return JSON.parse(text) as ProfileAnalysis;
}

const localAnalyzeChat = async (apiKey: string, base64Image: string | null, profileContext: ProfileAnalysis, note?: string): Promise<ChatAdvice> => {
  const ai = new GoogleGenAI({ apiKey });
  const contextString = JSON.stringify(profileContext);

  const prompt = `這是我們目前的對話進度。
        
  目標對象檔案: ${contextString}
  
  ${note ? `使用者對於目前狀況的想法/備註(或文字描述的對話內容): ${note}\n` : ''}

  請根據${base64Image ? '圖片中的對話內容' : '使用者提供的備註描述'}，分析對方的意圖，並提供三個不同風格的回覆建議。
  請嚴格遵循 System Instruction 中的 Output Styles (風格 A, B, C) 提供建議。
  務必遵循核心架構：關鍵字 + 故事/情緒 + 問句。`;

  const parts: any[] = [{ text: prompt }];

  if (base64Image) {
    parts.unshift({ inlineData: { mimeType: 'image/png', data: base64Image } });
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

  return JSON.parse(text) as ChatAdvice;
}