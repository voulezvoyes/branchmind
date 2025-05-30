import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_MODEL_TEXT } from "../constants";
import { GeminiBranchMindResponse, ThoughtNode } from "../types";

// API 키 연결
const ai = new GoogleGenerativeAI({
  apiKey: import.meta.env.GEMINI_API_KEY,
});

export async function getBranchMindAIAnalysisFromService(
  userThought: string,
  options: { summary: boolean; tagging: boolean; connect: boolean },
  pastThoughtsForContext: ThoughtNode[]
): Promise<GeminiBranchMindResponse | null> {
  try {
    const model = ai.getGenerativeModel({ model: GEMINI_MODEL_TEXT });
    const result = await model.generateContent(userThought); // 여긴 실제 프롬프트 처리 방식에 따라 조정
    const text = await result.response.text();
    return { summary: text }; // 너의 데이터 구조에 맞춰 수정
  } catch (error) {
    console.error("Gemini API 호출 오류:", error);
    return null;
  }
}
// The Gemini API interaction logic has been moved into index.tsx 
// for the BranchMind application to simplify the structure for a non-React app
// with a single main AI interaction point.

// If you plan to expand with more diverse AI calls or want to keep services separate,
// you can re-extract the AI call logic into functions here. For example:
//
// import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
// import { GEMINI_MODEL_TEXT } from '../constants';
// import { GeminiBranchMindResponse, ThoughtNode } from "../types"; // Assuming types are in types.ts
//
// let ai: GoogleGenAI | null = null; 
// // Ensure ai is initialized (e.g., via a function called from index.tsx or by checking process.env.API_KEY)
//
// export async function getBranchMindAIAnalysisFromService(
//   userThought: string,
//   options: { summary: boolean; tagging: boolean; connect: boolean },
//   pastThoughtsForContext: ThoughtNode[],
//   initializedAi: GoogleGenAI // Pass the initialized AI instance
// ): Promise<GeminiBranchMindResponse | null> {
//   if (!initializedAi) {
//     console.error("AI service not initialized in getBranchMindAIAnalysisFromService.");
//     // Consider how to handle this: throw error, return null, or display UI error via callback?
//     return null; 
//   }
//   // ... (prompt construction and API call logic similar to what's in index.tsx)
//   // const prompt = "..."
//   // try {
//   //   const response: GenerateContentResponse = await initializedAi.models.generateContent({ ... });
//   //   // Parse and return
//   // } catch (error) {
//   //   console.error("Error in getBranchMindAIAnalysisFromService:", error);
//   //   return null;
//   // }
//   return {}; // Placeholder
// }

export {}; // To make it a module if no other exports are present.
