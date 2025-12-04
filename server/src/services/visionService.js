import AppError from "../utils/AppError.js";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
// Use whatever model ID the project supports; user will configure GEMINI_MODEL.
// Example values (depending on your project/region/quota):
//   gemini-1.5-flash
//   gemini-1.5-flash-latest
//   gemini-1.5-flash-001
//   models/gemini-1.5-flash-latest
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash";

const buildPromptText = (context = {}) => {
  const { title, description, category, location } = context;

  const baseInstruction =
    "You are given one or more images of a civic issue and optional text that the citizen has already written. Use BOTH the images and the provided text to infer:\n" +
    "- A short, clear complaint title (max 80 characters).\n" +
    "- A concise description (2-4 sentences) that a citizen might write when reporting this issue.\n" +
    "- A high-level category that best fits the issue. The category must be returned as EXACTLY one of these strings (case-sensitive): [Water Supply, Sanitation, Waste Management, Roads & Transport, Electricity, Street Lighting, Public Safety, Noise Pollution, Air Quality, Drainage, Animal Control, Public Transport, Traffic, Building Maintenance, Parks & Recreation].\n\n" +
    'Return ONLY a JSON object with this exact shape: { "title": string, "description": string, "category": string }. Do not include any additional fields or text.';

  const contextLines = [];
  if (title) contextLines.push(`Existing title: ${title}`);
  if (description) contextLines.push(`Existing description: ${description}`);
  if (category) contextLines.push(`Existing category: ${category}`);
  if (location) contextLines.push(`Location: ${location}`);

  if (contextLines.length === 0) {
    return baseInstruction;
  }

  return (
    baseInstruction +
    "\n\nHere is additional information the citizen already typed. You may correct or improve it if needed, but keep the meaning consistent:\n" +
    contextLines.join("\n")
  );
};

const fetchImageAsInlineData = async (url) => {
  let response;
  try {
    response = await fetch(url);
  } catch (error) {
    throw new AppError("Failed to download image for vision model", 502);
  }

  if (!response.ok) {
    throw new AppError("Failed to download image for vision model", 502);
  }

  const contentType = response.headers.get("content-type") || "image/jpeg";
  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");

  return {
    inlineData: {
      data: base64,
      mimeType: contentType,
    },
  };
};

export const inferComplaintMetadataFromImages = async (
  imageUrls,
  context = {}
) => {
  if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
    throw new AppError("No images provided for inference", 400);
  }

  if (!GEMINI_API_KEY) {
    throw new AppError("GEMINI_API_KEY is not configured", 500);
  }

  const promptText = buildPromptText(context);

  const imageParts = [];
  for (const url of imageUrls) {
    imageParts.push(await fetchImageAsInlineData(url));
  }

  const contents = [
    {
      role: "user",
      parts: [{ text: promptText }, ...imageParts],
    },
  ];

  let response;
  try {
    const modelPath = GEMINI_MODEL.startsWith("models/")
      ? GEMINI_MODEL
      : `models/${GEMINI_MODEL}`;

    response = await fetch(
      `https://generativelanguage.googleapis.com/v1/${modelPath}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.2,
          },
        }),
      }
    );
  } catch (error) {
    throw new AppError("Failed to call vision model API", 502);
  }

  if (!response.ok) {
    let errorBody = null;
    try {
      errorBody = await response.json();
    } catch (e) {
      // ignore JSON parse errors
    }

    console.error(
      "Gemini API error",
      response.status,
      errorBody ? JSON.stringify(errorBody) : "<no body>"
    );

    const messageFromApi = errorBody?.error?.message;

    throw new AppError(
      messageFromApi || "Vision model API returned an error",
      502
    );
  }

  const data = await response.json();

  const message =
    data?.candidates?.[0]?.content?.parts?.[0]?.text ||
    data?.candidates?.[0]?.content?.parts
      ?.map((p) => p.text)
      .filter(Boolean)
      .join("\n");

  if (!message) {
    throw new AppError("Invalid response from vision model", 502);
  }

  let parsed;
  try {
    parsed = JSON.parse(message);
  } catch (error) {
    // Fallback: try to extract the first JSON object from the text
    const match = message.match(/\{[\s\S]*\}/);
    if (!match) {
      console.error("Gemini response not JSON parsable", message);
      throw new AppError("Failed to parse vision model response", 502);
    }

    try {
      parsed = JSON.parse(match[0]);
    } catch (innerError) {
      console.error("Gemini JSON extract parse error", match[0]);
      throw new AppError("Failed to parse vision model response", 502);
    }
  }

  const { title, description, category } = parsed || {};

  if (!title || !description || !category) {
    throw new AppError(
      "Vision model did not return required fields (title, description, category)",
      502
    );
  }

  return { title, description, category };
};
