import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ProfileAnalysis, ChatAdvice } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const MODEL_NAME = 'gemini-3-flash-preview';

// System Instruction based on the "Role" and "Core Feature Specifications"
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
  },
  required: ["interests", "personalityTraits", "summary"],
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

export const analyzeProfileImage = async (base64Image: string): Promise<ProfileAnalysis> => {
  if (!apiKey) throw new Error("API Key is missing");

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: {
      parts: [
        { inlineData: { mimeType: 'image/png', data: base64Image } },
        { text: "這是對方的個人資料截圖，請幫我建立她的基本檔案，分析她的興趣和可能的聊天偏好。" }
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
};

export const analyzeChatImage = async (
  base64Image: string, 
  profileContext: ProfileAnalysis
): Promise<ChatAdvice> => {
  if (!apiKey) throw new Error("API Key is missing");

  const contextString = JSON.stringify(profileContext);

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: {
      parts: [
        { inlineData: { mimeType: 'image/png', data: base64Image } },
        { text: `這是我們目前的對話進度。
        
        目標對象檔案: ${contextString}
        
        請分析她的所有回覆內容，並提供三個不同風格的回覆建議。
        請嚴格遵循 System Instruction 中的 Output Styles (風格 A, B, C) 提供建議。
        務必遵循核心架構：關鍵字 + 故事/情緒 + 問句。` }
      ]
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
};