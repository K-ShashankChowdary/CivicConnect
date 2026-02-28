import Complaint from "../models/Complaint.js";

import { GoogleGenerativeAI } from "@google/generative-ai";

export const attachComplaintEmbedding = async (complaintDoc) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !complaintDoc.description) return complaintDoc;
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const textToEmbed = `${complaintDoc.title} ${complaintDoc.description} ${complaintDoc.category} ${complaintDoc.location}`;
    const result = await model.embedContent(textToEmbed);
    complaintDoc.descriptionEmbedding = result.embedding.values;
  } catch (err) {
    console.warn("Failed to generate embedding", err);
  }
  return complaintDoc;
};

const cosineSimilarity = (vecA, vecB) => {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

export const reRankComplaintsByIR = async (query, complaints) => {
  if (!query || !Array.isArray(complaints) || complaints.length === 0) {
    return complaints;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("No GEMINI_API_KEY, falling back to unranked.");
    return complaints;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const result = await model.embedContent(query);
    const queryEmbedding = result.embedding.values;

    const scored = complaints.map((complaint) => {
      let score = 0;
      if (complaint.descriptionEmbedding && complaint.descriptionEmbedding.length > 0) {
        score = cosineSimilarity(queryEmbedding, complaint.descriptionEmbedding);
      }
      return { complaint, score };
    });

    const filtered = scored.filter((item) => item.score > 0.3); // Threshold for relevancy

    if (filtered.length === 0) {
      return [];
    }

    filtered.sort((a, b) => b.score - a.score);

    return filtered.map((item) => {
      const { complaint } = item;
      if (
        complaint &&
        Object.prototype.hasOwnProperty.call(complaint, "descriptionEmbedding")
      ) {
        const { descriptionEmbedding, ...rest } = complaint;
        return rest;
      }
      return complaint;
    });
  } catch (err) {
    console.warn("Semantic Search Failed:", err);
    return complaints;
  }
};
