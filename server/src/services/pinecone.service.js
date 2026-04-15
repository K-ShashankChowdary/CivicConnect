import { Pinecone } from '@pinecone-database/pinecone';

const apiKey = process.env.PINECONE_API_KEY || 'dummy-key';
const indexName = process.env.PINECONE_INDEX_NAME || 'civicconnect-complaints';
const namespaceLive = process.env.PINECONE_NAMESPACE_LIVE || 'live-complaints';
const namespaceResolved = process.env.PINECONE_NAMESPACE_RESOLVED || 'resolved-complaints';

const pinecone = new Pinecone({ apiKey });
const index = pinecone.index(indexName);

/**
 * Upserts a complaint vector into the live complaints namespace.
 * @param {string} id - The complaint ID
 * @param {number[]} vector - The 768-dimensional embedding
 * @param {object} metadata - Descriptive metadata for filtering
 */
export const upsertComplaintVector = async (id, vector, metadata) => {
  await index.namespace(namespaceLive).upsert([{ id, values: vector, metadata }]);
};

/**
 * Queries for similar active complaints for clustering purposes.
 * @param {number[]} vector - The query embedding
 * @param {number} topK - Number of results to return
 * @param {object} filter - Optional Pinecone metadata filter (e.g., category, ward)
 * @returns {Promise<Array>} Array of matches
 */
export const querySimilarComplaints = async (vector, topK = parseInt(process.env.PINECONE_TOP_K_CLUSTERING || '10', 10), filter = {}) => {
  const result = await index.namespace(namespaceLive).query({
    topK,
    vector,
    includeMetadata: true,
    filter: Object.keys(filter).length > 0 ? filter : undefined
  });
  return result.matches || [];
};

/**
 * Queries for context across all complaints (live and resolved) to enrich LLM prompts via RAG.
 * Note: Assuming it targets resolved complaints for historical context or both via independent queries/merged namespaces.
 * For now, targets resolved mostly for historical trend RAG.
 */
export const queryForRAGContext = async (vector, topK = parseInt(process.env.PINECONE_TOP_K_RAG || '3', 10), filter = {}) => {
  const result = await index.namespace(namespaceResolved).query({
    topK,
    vector,
    includeMetadata: true,
    filter: Object.keys(filter).length > 0 ? filter : undefined
  });
  return result.matches || [];
};

/**
 * Updates metadata for an existing vector without altering real values.
 */
export const updateComplaintMetadata = async (id, metadata, isResolved = false) => {
  const ns = isResolved ? namespaceResolved : namespaceLive;
  await index.namespace(ns).update({ id, metadata });
};

/**
 * Moves a complaint vector from live to resolved namespace.
 * Pinecone doesn't natively "move" — you fetch, upsert to new, delete from old.
 */
export const moveToResolved = async (id) => {
  // 1. Fetch from live
  const response = await index.namespace(namespaceLive).fetch([id]);
  const record = response.records[id];
  if (!record) return; // Ignore if not found

  // 2. Upsert to resolved
  await index.namespace(namespaceResolved).upsert([record]);

  // 3. Delete from live
  await index.namespace(namespaceLive).deleteOne(id);
};

/**
 * Deletes a vector entirely.
 */
export const deleteVector = async (id, isResolved = false) => {
  const ns = isResolved ? namespaceResolved : namespaceLive;
  await index.namespace(ns).deleteOne(id);
};
