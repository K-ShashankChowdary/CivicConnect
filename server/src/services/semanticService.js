import Complaint from "../models/Complaint.js";

export const attachComplaintEmbedding = async (complaintDoc) => {
  return complaintDoc;
};

const tokenizeForIR = (text) => {
  return (text || "")
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .filter((token) => token.length > 1);
};

const buildDocTextForIR = (complaint) => {
  return [complaint.title, complaint.description, complaint.location]
    .filter(Boolean)
    .join(" ");
};

const computeTfIdfCosineScores = (query, complaints) => {
  const queryTokens = tokenizeForIR(query);

  if (queryTokens.length === 0) {
    return complaints.map((complaint) => ({ complaint, score: 0 }));
  }

  const df = {};
  const docs = [];

  // Build term frequencies for each document and document frequencies across the set
  complaints.forEach((complaint) => {
    const text = buildDocTextForIR(complaint);
    const tokens = tokenizeForIR(text);

    const tf = {};
    tokens.forEach((token) => {
      tf[token] = (tf[token] || 0) + 1;
    });

    const seen = new Set();
    Object.keys(tf).forEach((term) => {
      if (!seen.has(term)) {
        df[term] = (df[term] || 0) + 1;
        seen.add(term);
      }
    });

    docs.push({ complaint, tf });
  });

  const N = docs.length || 1;

  // Compute IDF per term
  const idf = {};
  Object.keys(df).forEach((term) => {
    const docFreq = df[term] || 0;
    idf[term] = Math.log(1 + N / (1 + docFreq));
  });

  // Query term frequencies
  const tfQuery = {};
  queryTokens.forEach((token) => {
    tfQuery[token] = (tfQuery[token] || 0) + 1;
  });

  // Query TF-IDF vector and norm
  const queryWeights = {};
  let queryNormSq = 0;
  Object.keys(tfQuery).forEach((term) => {
    const weight = tfQuery[term] * (idf[term] || 0);
    if (!weight) return;
    queryWeights[term] = weight;
    queryNormSq += weight * weight;
  });

  const queryNorm = Math.sqrt(queryNormSq) || 1;

  // Compute cosine similarity between query vector and each document vector
  return docs.map((doc) => {
    const tfDoc = doc.tf;
    const docWeights = {};
    let docNormSq = 0;

    Object.keys(tfDoc).forEach((term) => {
      const weight = tfDoc[term] * (idf[term] || 0);
      if (!weight) return;
      docWeights[term] = weight;
      docNormSq += weight * weight;
    });

    const docNorm = Math.sqrt(docNormSq) || 1;

    let dot = 0;
    Object.keys(queryWeights).forEach((term) => {
      if (docWeights[term]) {
        dot += queryWeights[term] * docWeights[term];
      }
    });

    const score = dot ? dot / (queryNorm * docNorm) : 0;

    return { complaint: doc.complaint, score };
  });
};

export const reRankComplaintsByIR = (query, complaints) => {
  if (!query || !Array.isArray(complaints) || complaints.length === 0) {
    return complaints;
  }

  const scored = computeTfIdfCosineScores(query, complaints);

  // Keep only documents with some degree of similarity to the query
  const filtered = scored.filter((item) => item.score > 0);

  // If nothing has positive similarity, return an empty list
  if (filtered.length === 0) {
    return [];
  }

  filtered.sort((a, b) => b.score - a.score);

  // Log query, rank, and score for debugging IR ranking
  filtered.forEach((item, index) => {
    const complaint = item.complaint || {};
    console.log(
      '[IR] query="%s" rank=%d score=%f id=%s title="%s"',
      query,
      index + 1,
      item.score,
      complaint._id || "<no-id>",
      complaint.title || "<no-title>"
    );
  });

  return filtered.map((item) => {
    const { complaint } = item;
    if (
      complaint &&
      Object.prototype.hasOwnProperty.call(complaint, "embedding")
    ) {
      const { embedding, ...rest } = complaint;
      return rest;
    }
    return complaint;
  });
};
