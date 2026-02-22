/**
 * LLM-based priority prediction (Gemini) with structured output.
 * Use when GEMINI_API_KEY is set; controller falls back to TF.js otherwise.
 */
import { GoogleGenerativeAI } from "@google/generative-ai";

const LEVEL_TO_SCORE = { Low: 0.25, Medium: 0.5, High: 0.75, Critical: 1.0 };
const VALID_LEVELS = new Set(["Low", "Medium", "High", "Critical"]);

function parseJsonFromResponse(text) {
  if (!text || typeof text !== "string") return null;
  const trimmed = text.trim();
  // Strip markdown code block if present
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    return null;
  }
}

/**
 * Predict priority using Gemini. Returns null if disabled, missing key, or API error (caller should fall back to TF.js).
 * @param {{ category: string, title?: string, description: string, location?: string }} payload
 * @returns {Promise<{ score: number, priorityLevel: string, priorityReason?: string, tags: Array<{label, value}> } | null>}
 */
export async function predictPriorityWithLLM(payload) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const { category = "", title = "", description = "", location = "" } = payload;
  if (!description) return null;

  const prompt = `You are a civic complaint triage assistant. Given this municipal complaint, assign exactly one priority: Low, Medium, High, or Critical. Consider: public safety, health risk, property damage, and urgency. Be concise.

Category: ${category}
Title: ${title}
Description: ${description}
Location: ${location || "Not provided"}

Respond with ONLY a single JSON object, no other text. Use this exact structure:
{"priority":"Critical|High|Medium|Low","reason":"one short sentence explaining why"}`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const text = result?.response?.text?.() ?? null;
    const parsed = parseJsonFromResponse(text);
    if (!parsed || !VALID_LEVELS.has(parsed.priority)) return null;

    const priorityLevel = parsed.priority;
    const score = LEVEL_TO_SCORE[priorityLevel] ?? 0.5;
    const priorityReason = typeof parsed.reason === "string" ? parsed.reason.trim() : undefined;

    return {
      score,
      priorityLevel,
      ...(priorityReason && { priorityReason }),
      tags: [
        { label: "Priority", value: priorityLevel },
        { label: "Urgency Score", value: score.toFixed(2) },
        { label: "Location", value: location || "Unknown" },
        ...(priorityReason ? [{ label: "AI reason", value: priorityReason }] : []),
      ],
    };
  } catch (err) {
    console.warn("Priority LLM (Gemini) failed, will use fallback:", err.message);
    return null;
  }
}
