import Complaint from "../models/Complaint.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

const tokenize = (text) => {
  if (!text) return [];
  return text.toLowerCase().replace(/[^\w\s]/g, "").match(/\b\w+\b/g) || [];
};

export const attachComplaintEmbedding = async (complaintDoc) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !complaintDoc.description) return complaintDoc;
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
    const textToEmbed = `${complaintDoc.title} ${complaintDoc.description} ${complaintDoc.category} ${complaintDoc.location}`;
    const result = await model.embedContent(textToEmbed);
    complaintDoc.descriptionEmbedding = result.embedding.values;
  } catch (err) {
    console.warn("Failed to generate embedding", err.message);
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

const performBM25Search = (query, complaints) => {
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return complaints;

  const N = complaints.length;
  const docFrequencies = {};
  const complaintTokensMap = new Map();
  let totalTokenCount = 0;

  complaints.forEach((complaint) => {
    const textToAnalyze = `${complaint.title || ""} ${complaint.description || ""} ${complaint.category || ""} ${complaint.location || ""}`;
    const tokens = tokenize(textToAnalyze);
    complaintTokensMap.set(complaint._id.toString(), tokens);
    totalTokenCount += tokens.length;

    const uniqueTokens = [...new Set(tokens)];
    uniqueTokens.forEach((token) => {
      docFrequencies[token] = (docFrequencies[token] || 0) + 1;
    });
  });

  const avgdl = totalTokenCount / N || 1;
  const k1 = 1.5;
  const b = 0.75;

  const idf = {};
  queryTokens.forEach((token) => {
    const df = docFrequencies[token] || 0;
    idf[token] = Math.max(0, Math.log(((N - df + 0.5) / (df + 0.5)) + 1));
  });

  const scored = complaints.map((complaint) => {
    const tokens = complaintTokensMap.get(complaint._id.toString()) || [];
    const docLength = tokens.length;
    const termCounts = {};
    tokens.forEach((t) => { termCounts[t] = (termCounts[t] || 0) + 1; });

    let score = 0;
    if (docLength > 0) {
      queryTokens.forEach((token) => {
        const tf = termCounts[token] || 0;
        if (tf > 0) {
          const numerator = tf * (k1 + 1);
          const denominator = tf + k1 * (1 - b + b * (docLength / avgdl));
          score += idf[token] * (numerator / denominator);
        }
      });
    }
    return { complaint, score };
  });

  const filtered = scored.filter((item) => item.score > 0);
  filtered.sort((a, b) => b.score - a.score);

  return filtered.map((item) => {
    const obj = item.complaint._doc ? { ...item.complaint._doc } : { ...item.complaint };
    obj.score = item.score;
    delete obj.descriptionEmbedding;
    return obj;
  });
};

export const reRankComplaintsByIR = async (query, complaints) => {
  if (!query || !Array.isArray(complaints) || complaints.length === 0) {
    return complaints;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  let queryEmbedding = null;

  if (apiKey) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
      const result = await model.embedContent(query);
      queryEmbedding = result.embedding.values;
    } catch (err) {
      console.warn("Semantic Search API Failed:", err.message);
    }
  }

  // Fall back to robust BM25 algorithm if API is unavailable or throws an error
  if (!queryEmbedding) {
    console.warn("Falling back to local BM25 Semantic Search.");
    return performBM25Search(query, complaints);
  }

  const scored = complaints.map((complaint) => {
    let score = 0;
    if (complaint.descriptionEmbedding && complaint.descriptionEmbedding.length > 0) {
      score = cosineSimilarity(queryEmbedding, complaint.descriptionEmbedding);
    }
    return { complaint, score };
  });

  const filtered = scored.filter((item) => item.score > 0.15);

  // If semantic vector search yields no high-confidence results (e.g. single keyword query), fallback to BM25 lexical search
  if (filtered.length === 0) {
    return performBM25Search(query, complaints);
  }

  filtered.sort((a, b) => b.score - a.score);

  return filtered.map((item) => {
    const obj = item.complaint._doc ? { ...item.complaint._doc } : { ...item.complaint };
    obj.score = item.score;
    delete obj.descriptionEmbedding;
    return obj;
  });
};
