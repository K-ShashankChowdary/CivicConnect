import { GoogleGenerativeAI } from "@google/generative-ai";

// Map text priority levels to numerical scores (1.0 is highest)
const LEVEL_TO_SCORE = { Low: 0.25, Medium: 0.5, High: 0.75, Critical: 1.0 };
const VALID_LEVELS = new Set(["Low", "Medium", "High", "Critical"]);

function parseJsonFromResponse(text) {
  if (!text || typeof text !== "string") return null;
  const trimmed = text.trim();
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    return null;
  }
}

// Uses Gemini AI to intelligently analyze complaint text and assign a priority level and department
export async function predictPriorityWithLLM(payload) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const { category = "", title = "", description = "", location = "" } = payload;
  if (!description) return null;

  const prompt = `You are an expert municipal triage algorithm. Analyze this complaint and assign:
1. One Priority Level: Low, Medium, High, or Critical.
2. A Severity Score (1-5), where 5 is maximum severity.
3. The specific municipal Department responsible.
4. A concise reason (1 short sentence max).

Rules for Priority:
- CRITICAL (Score 4-5): Immediate risk to human life, massive gas leaks, active water main breaks flooding homes. Response needed within hours.
- HIGH (Score 3-4): Significant property damage risk, large potholes on busy roads, entire blocks without power. Response needed within 1-2 days.
- MEDIUM (Score 2-3): Nuisances causing moderate inconvenience. Overflowing garbage, noise complaints, dead street animals.
- LOW (Score 1-2): Aesthetic issues, minor maintenance, requests with absolutely no urgency. Faded paint, a single cracked sidewalk tile, overgrown grass. Do not over-escalate standard maintenance to Medium.

Category: ${category}
Title: ${title}
Description: ${description}
Location: ${location || "Not provided"}

Respond with ONLY a single valid JSON object, no other text. Use this exact structure:
{"priority":"Critical|High|Medium|Low","reason":"short sentence explaining why","severityScore":<number 1-5>,"department":"<Department Name>"}`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    const result = await model.generateContent(prompt);
    const text = result?.response?.text?.() ?? null;
    const parsed = parseJsonFromResponse(text);
    if (!parsed || !VALID_LEVELS.has(parsed.priority)) return null;

    const priorityLevel = parsed.priority;
    const score = LEVEL_TO_SCORE[priorityLevel] ?? 0.5;
    const severityScore = parsed.severityScore || Math.ceil(score * 5);
    const assignedDepartment = parsed.department || "General";
    const priorityReason = typeof parsed.reason === "string" ? parsed.reason.trim() : undefined;

    return {
      score,
      priorityLevel,
      severityScore,
      assignedDepartment,
      ...(priorityReason && { priorityReason }),
      tags: [
        { label: "Priority", value: priorityLevel },
        { label: "Urgency Score", value: score.toFixed(2) },
        { label: "Severity Score", value: severityScore.toString() },
        { label: "Department", value: assignedDepartment },
        { label: "Location", value: location || "Unknown" },
        ...(priorityReason ? [{ label: "AI reason", value: priorityReason }] : []),
      ],
    };
  } catch (err) {
    console.warn("Priority LLM (Gemini) failed, will use fallback:", err.message);
    return null;
  }
}
