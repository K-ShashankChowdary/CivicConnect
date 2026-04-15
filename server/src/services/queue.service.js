import { Queue } from 'bullmq';

// We fall back to a default connection string so development naturally cascades safely
const redisConnection = process.env.REDIS_URL || 'redis://localhost:6379';

export const embeddingQueue = new Queue('EmbeddingQueue', {
  connection: {
    url: redisConnection,
  },
});

/**
 * Enqueues a background job to embed a complaint and upsert it into Pinecone.
 * @param {object} payload - Job payload
 * @param {string} payload.complaintId - The MongoDB ObjectID of the complaint
 * @param {number[] | null} payload.precomputedVector - The early-fetched 768d vector (null ONLY if requeued after failure)
 * @param {string} payload.category - Complaint category for filtering
 * @param {string} payload.wardName - Ward name for filtering
 * @param {number} payload.priorityScore - Computed prioritization float
 * @param {string} payload.priorityLabel - Formal label (Low, Medium, High, Critical)
 */
export const enqueueEmbeddingJob = async (payload) => {
  await embeddingQueue.add('upsert-embedding', payload, {
    // Basic backoff strategy enforcing retry capability
    attempts: parseInt(process.env.QUEUE_MAX_ATTEMPTS || '5', 10),
    backoff: {
      type: 'exponential',
      delay: parseInt(process.env.QUEUE_BACKOFF_DELAY_MS || '2000', 10),
    },
    removeOnComplete: true, // Keep Redis lightweight
  });
};
