// src/utils/gemini.js
// Shared Gemini utility — single source of truth for all AI calls in the app.
import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

async function _attempt(modelName, prompt, jsonMode) {
  const genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature: 0.1,
      ...(jsonMode ? { responseMimeType: 'application/json' } : {}),
    },
  });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

// Returns parsed JSON
export async function callGemini(prompt) {
  const tryParse = async (modelName) => JSON.parse(await _attempt(modelName, prompt, true));
  try { return await tryParse('gemini-2.5-flash'); }
  catch { return await tryParse('gemini-2.0-flash'); }
}

// Returns plain text
export async function callGeminiText(prompt) {
  try { return await _attempt('gemini-2.5-flash', prompt, false); }
  catch { return await _attempt('gemini-2.0-flash', prompt, false); }
}
