import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Industry-standard semantic search (Google-style):
 * - Reciprocal Rank Fusion (RRF) to combine vector and lexical rankers without score normalization
 * - BM25 with Robertson/Walker parameters, IDF, and document length normalization
 * - Query expansion (synonyms) and light stemming for recall
 * - Vector embeddings (cosine similarity) for meaning-based search
 */

// --- Stop words (English) ---
const STOP_WORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "has", "he",
  "in", "is", "it", "its", "of", "on", "that", "the", "to", "was", "were", "will",
  "with", "or", "but", "if", "then", "else", "when", "where", "why", "how", "this",
  "have", "had", "do", "does", "did", "can", "could", "would", "should", "may",
]);

// --- Synonyms for query expansion (civic/infrastructure) ---
const SYNONYMS = {
  road: ["street", "avenue", "highway", "lane", "roadway", "boulevard", "drive", "way"],
  street: ["road", "avenue", "lane", "highway", "roadway", "boulevard", "drive"],
  roads: ["streets", "avenues", "highways", "lanes"],
  avenue: ["road", "street", "lane", "boulevard", "drive"],
  highway: ["road", "street", "roadway"],
  lane: ["road", "street", "avenue", "drive", "way"],
  pothole: ["crater", "hole", "crack", "damage", "road damage"],
  potholes: ["craters", "holes", "cracks", "damage"],
  streetlight: ["street light", "lamp", "light", "lighting", "pole"],
  streetlights: ["street lights", "lamps", "lights", "lighting", "poles"],
  light: ["lighting", "lamp", "streetlight", "street light"],
  lighting: ["light", "lamp", "streetlight", "street light"],
  garbage: ["waste", "trash", "bin", "rubbish", "refuse", "litter"],
  waste: ["garbage", "trash", "bin", "rubbish", "refuse"],
  trash: ["garbage", "waste", "rubbish", "litter"],
  water: ["supply", "leak", "pipe", "main", "flood"],
  leak: ["leakage", "water", "pipe", "dripping"],
  drain: ["drainage", "sewer", "blocked", "clogged"],
  drainage: ["drain", "sewer", "flood", "water"],
  noise: ["sound", "loud", "disturbance", "pollution"],
  power: ["electricity", "outage", "electrical"],
  electricity: ["power", "electrical", "outage"],
  broken: ["damaged", "cracked", "faulty"],
  damaged: ["broken", "cracked", "damage"],
  safety: ["danger", "hazard", "unsafe", "public safety"],
  dangerous: ["safety", "hazard", "unsafe", "risk"],
};

// RRF constant (standard in literature; higher k = more weight to agreement across rankers)
const RRF_K = 60;

// BM25 parameters (Robertson–Walker standard)
const BM25_K1 = 1.2;
const BM25_B = 0.75;

// Simple English stemmer: reduce word variants for better match (e.g. roads->road, streets->street)
function stem(word) {
  if (!word || word.length < 4) return word;
  const w = word.toLowerCase();
  if (w.endsWith("sses")) return w.slice(0, -2);
  if (w.endsWith("ies")) return w.slice(0, -3) + "y";
  if (w.endsWith("ss")) return w;
  if (w.endsWith("s") && !w.endsWith("us") && !w.endsWith("ss")) return w.slice(0, -1);
  if (w.endsWith("ing") && w.length > 5) return w.slice(0, -3);
  if (w.endsWith("ed") && w.length > 4) return w.slice(0, -2);
  if (w.endsWith("er") && w.length > 4) return w.slice(0, -2);
  if (w.endsWith("ly") && w.length > 4) return w.slice(0, -2);
  return w;
}

function tokenize(text, options = {}) {
  const { filterStopWords = false, stem: doStem = false } = options;
  if (!text) return [];
  let tokens = text.toLowerCase().replace(/[^\w\s]/g, " ").match(/\b\w+\b/g) || [];
  if (filterStopWords && tokens.length > 1) {
    tokens = tokens.filter((t) => !STOP_WORDS.has(t) && t.length > 1);
  }
  return doStem ? tokens.map(stem) : tokens;
}

function expandQueryTokens(tokens) {
  const expanded = new Set();
  tokens.forEach((t) => {
    const lower = t.toLowerCase();
    const st = stem(lower);
    expanded.add(lower);
    expanded.add(st);
    const syns = SYNONYMS[lower] || SYNONYMS[st];
    if (syns) {
      syns.forEach((s) => {
        s.toLowerCase().split(/\s+/).forEach((w) => {
          expanded.add(w);
          expanded.add(stem(w));
        });
      });
    }
  });
  return [...expanded].filter((x) => x.length > 0);
}

function extractEmbeddingValues(result) {
  if (!result) return null;
  const values =
    result.embedding?.values ??
    result.embeddings?.[0]?.values ??
    (Array.isArray(result.embedding) ? result.embedding : null);
  return Array.isArray(values) && values.length > 0 ? values : null;
}

export const attachComplaintEmbedding = async (complaintDoc) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !complaintDoc.description) return complaintDoc;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
    const textToEmbed = `${complaintDoc.title} ${complaintDoc.description} ${complaintDoc.category} ${complaintDoc.location}`;
    const result = await model.embedContent(textToEmbed);
    const values = extractEmbeddingValues(result);
    if (values) complaintDoc.descriptionEmbedding = values;
  } catch (err) {
    console.warn("Failed to generate embedding:", err.message);
  }
  return complaintDoc;
};

function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dot = 0, nA = 0, nB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    nA += vecA[i] * vecA[i];
    nB += vecB[i] * vecB[i];
  }
  if (nA === 0 || nB === 0) return 0;
  return Math.max(0, Math.min(1, dot / (Math.sqrt(nA) * Math.sqrt(nB))));
}

function getComplaintId(c) {
  const id = c._id ?? c.id;
  return id != null ? String(id) : "";
}

/**
 * BM25 with Robertson/Walker formula.
 * Uses stemmed + synonym-expanded query and stemmed document terms.
 */
function computeBM25Scores(query, complaints) {
  let queryTokens = tokenize(query, { filterStopWords: true, stem: true });
  queryTokens = expandQueryTokens(queryTokens);

  if (queryTokens.length === 0) {
    return complaints.map((c) => ({ complaint: c, score: 0 }));
  }

  const N = complaints.length;
  const docFreq = {};
  const docTokens = new Map();
  let totalLen = 0;

  complaints.forEach((complaint) => {
    const text = `${complaint.title || ""} ${complaint.description || ""} ${complaint.category || ""} ${complaint.location || ""}`;
    const tokens = tokenize(text, { stem: true });
    docTokens.set(getComplaintId(complaint), tokens);
    totalLen += tokens.length;
    [...new Set(tokens)].forEach((t) => {
      docFreq[t] = (docFreq[t] || 0) + 1;
    });
  });

  const avgdl = totalLen / N || 1;

  const idf = {};
  queryTokens.forEach((t) => {
    const df = docFreq[t] || 0;
    idf[t] = Math.log(1 + (N - df + 0.5) / (df + 0.5));
  });

  return complaints.map((complaint) => {
    const tokens = docTokens.get(getComplaintId(complaint)) || [];
    const len = tokens.length;
    const tf = {};
    tokens.forEach((t) => { tf[t] = (tf[t] || 0) + 1; });

    let score = 0;
    queryTokens.forEach((term) => {
      const f = tf[term] || 0;
      if (f === 0) return;
      const idfVal = idf[term] ?? 0;
      score += idfVal * (f * (BM25_K1 + 1)) / (f + BM25_K1 * (1 - BM25_B + BM25_B * (len / avgdl)));
    });

    return { complaint, score };
  });
}

/**
 * Reciprocal Rank Fusion (RRF): combine multiple ranked lists without score normalization.
 * score(d) = sum over each ranker: 1 / (k + rank(d))
 * Used by Google and other large-scale search systems.
 */
function reciprocalRankFusion(rankedLists, idGetter) {
  const scores = new Map();
  rankedLists.forEach((list) => {
    list.forEach((item, rank) => {
      const id = idGetter(item);
      const rrf = 1 / (RRF_K + rank + 1);
      scores.set(id, (scores.get(id) || 0) + rrf);
    });
  });
  return scores;
}

function toPlain(complaint) {
  const obj = complaint._doc ? { ...complaint._doc } : { ...complaint };
  delete obj.descriptionEmbedding;
  return obj;
}

/**
 * Industry-standard hybrid search:
 * 1. Vector ranker: rank by cosine similarity (query embedding vs document embedding).
 * 2. Lexical ranker: BM25 with stemmed + synonym-expanded query.
 * 3. RRF: merge the two rankings so both semantic and keyword matches surface.
 * 4. Return all documents in fused order (like a search engine: everything is “found”, ordered by relevance).
 */
export const reRankComplaintsByIR = async (query, complaints) => {
  const q = typeof query === "string" ? query.trim() : "";
  if (!q || !Array.isArray(complaints) || complaints.length === 0) {
    return complaints;
  }

  const idToComplaint = new Map(complaints.map((c) => [getComplaintId(c), c]));

  // --- 1. Lexical (BM25) ranking: all docs, ordered by BM25 score ---
  const bm25Scored = computeBM25Scores(q, complaints);
  bm25Scored.sort((a, b) => b.score - a.score);
  const bm25List = bm25Scored.map((x) => x.complaint);

  // --- 2. Vector ranking (when embeddings available) ---
  let vectorList = [];
  let queryEmbedding = null;

  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
      const result = await model.embedContent(q);
      queryEmbedding = extractEmbeddingValues(result);
    } catch (err) {
      console.warn("Semantic Search API failed:", err.message);
    }
  }

  const hasEmbeddings = complaints.some(
    (c) => c.descriptionEmbedding && c.descriptionEmbedding.length > 0
  );

  if (queryEmbedding && hasEmbeddings) {
    const vectorScored = complaints.map((complaint) => {
      let sim = 0;
      if (complaint.descriptionEmbedding?.length > 0) {
        sim = cosineSimilarity(queryEmbedding, complaint.descriptionEmbedding);
      }
      return { complaint, score: sim };
    });
    vectorScored.sort((a, b) => b.score - a.score);
    vectorList = vectorScored.map((x) => x.complaint);
  }

  // --- 3. RRF: merge rankings ---
  const rankers = [bm25List];
  if (vectorList.length > 0) rankers.push(vectorList);

  const rrfScores = reciprocalRankFusion(rankers, getComplaintId);

  // Build result: all complaints ordered by RRF score (then by BM25 for ties)
  const withRrf = complaints.map((complaint) => ({
    complaint,
    rrf: rrfScores.get(getComplaintId(complaint)) ?? 0,
    bm25: bm25Scored.find((x) => getComplaintId(x.complaint) === getComplaintId(complaint))?.score ?? 0,
  }));

  withRrf.sort((a, b) => {
    if (Math.abs(a.rrf - b.rrf) > 1e-9) return b.rrf - a.rrf;
    return b.bm25 - a.bm25;
  });

  return withRrf.map((item, idx) => {
    const obj = toPlain(item.complaint);
    obj.score = Math.round(item.rrf * 1000) / 1000;
    return obj;
  });
};
