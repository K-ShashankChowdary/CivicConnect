# AI Feature Improvements – CivicConnect

This doc suggests **better ways to implement and extend** the AI features that are central to CivicConnect: priority prediction, search, and (future) vision.

---

## Current State

| Feature | Implementation | Limitation |
|--------|----------------|------------|
| **Priority** | TensorFlow.js NN on CSV (category + bag-of-words + urgency keywords) | Trained on fixed dataset; no image signal; vocabulary from training data only. |
| **Search** | TF-IDF + cosine similarity over title/description/location | Keyword overlap only; no true “semantic” meaning (e.g. “pothole” vs “road damage”). |
| **Vision** | Stub (`visionService.js` exports nothing) | No image analysis; uploaded photos unused for priority or search. |

---

## 1. Priority Prediction – Better Approaches

### Option A: Keep TF.js, Improve Data & Features (Quick Win)

- **Larger / fresher training data**: Use `municipal_complaints_training.csv` (set `USE_TEST_DATA=false`) for production so the model sees more variety.
- **Field weighting**: In `extractTextFeatures`, weight title terms higher than description (e.g. 2x) so “burst pipe” in the title has more impact.
- **Category embeddings**: One-hot is fine; you could add a small embedding layer for category to capture similarity between categories (e.g. “Water Supply” vs “Drainage”).
- **Validation**: Log MAE/accuracy per priority band; consider a small held-out set to avoid overfitting.

### Option B: Use an External ML API (Best Accuracy, More Cost)

- **Google Cloud Natural Language / Vertex AI**: Send `title + description` (and optionally location) to an API that returns sentiment, entities, or a custom priority model trained on your labels.
- **Small LLM (e.g. Gemini Flash)**: One prompt: “Given this civic complaint, output a priority: Low, Medium, High, or Critical. Reply with one word.” Parse the reply and map to your enum. Gives true semantic understanding (e.g. “kids playing near open manhole” → High).
- **Hybrid**: Keep TF.js as fast, free fallback; call the API only when confidence is low or for high-stakes categories.

### Option C: Pre-computed Embeddings + Classifier

- **Embeddings**: When a complaint is created/updated, call an embedding API (OpenAI, Cohere, or Gemini embedding) and store a vector in the complaint doc.
- **Classifier**: Train a small classifier (e.g. in TF.js or Python) on `embedding → priority` using your CSV labels. At inference, embed the new complaint and run the classifier.
- **Benefit**: Semantic understanding without calling a big LLM at inference; search can reuse the same embedding (see below).

---

## 2. Search – Better “Semantic” Search

### Option A: Improve Current TF-IDF (Quick)

- **Zone weighting**: Weight title > description > location in TF-IDF (see `server/docs/semantic_search_tfidf.md`). Implement `buildDocTextForIR` with per-field TF and combine with weights (e.g. 3.0, 2.0, 1.5).
- **Multi-term for user search**: In `getMyComplaints`, use the same `buildSearchQuery` (multi-term `$and` of `$or`) as admin so “pothole road” matches complaints containing both words.
- **BM25**: Replace raw TF-IDF with BM25 for better length normalization and ranking.

### Option B: Real Semantic Search with Embeddings (Recommended Long-Term)

- **Store embeddings**: In `attachComplaintEmbedding`, call an embedding API (e.g. Gemini `embedContent` or OpenAI `text-embedding-3-small`) and save the vector in the complaint (e.g. `complaint.embedding`).
- **Vector search**: Use MongoDB Atlas Vector Search or a small vector DB (e.g. in-memory or LanceDB) to do k-NN search. At query time: embed the search string, then find complaints with highest cosine similarity to that vector.
- **Hybrid**: Run MongoDB text/regex filter first (for status, category, etc.), then re-rank or filter by vector similarity to the query embedding. This keeps filters fast and adds true “meaning” search.

---

## 3. Vision – Use Uploaded Images

Right now `visionService.js` is a stub. To make images part of the main AI story:

### Option A: Gemini Vision (Recommended)

- **Single image**: On complaint create/update, if there are attachments, send the first image (e.g. base64 or URL) to Gemini with a prompt: “Describe what you see in this civic complaint photo in 1–2 sentences. If relevant, mention: damage, danger, urgency, type of infrastructure.”
- **Use output for**:
  - **Priority**: Append this description to the text you send to your priority model (TF.js or LLM).
  - **Search**: Include the vision description in the text you embed or index (TF-IDF / embedding) so “broken streetlight” in a photo is searchable.
- **Implementation**: Add `@google/generative-ai` (or use REST), implement `analyzeComplaintImage(imageBufferOrUrl)` in `visionService.js`, and call it from `complaintController` when `attachments.length > 0`. Store the description on the complaint (e.g. `imageDescription`) and use it in priority + search.

### Option B: Lighter Heuristic

- If you want to avoid an API: run a simple image tagger (e.g. TensorFlow.js pre-trained MobileNet) and map tags (e.g. “water”, “road”, “outdoor”) to a small boost in priority or to category hints. Less accurate than Gemini but no external key.

---

## 4. Suggested Implementation Order

1. **Short term**
   - Unify user search with `buildSearchQuery` (multi-term) so user and admin search behave the same.
   - Add zone weighting to TF-IDF (title > description > location).
   - Use full dataset in production (`USE_TEST_DATA=false`) and add a health check that ensures the priority model is loaded before accepting complaints.

2. **Medium term**
   - Implement **Gemini Vision** in `visionService.js`: one image per complaint → short description → feed into priority and search.
   - Optionally add **Gemini (or similar) for priority**: one LLM call for “priority + short reason” for high-impact complaints.

3. **Long term**
   - Add **embeddings** (create + store in `attachComplaintEmbedding`) and **vector search** for true semantic search; keep TF-IDF as fallback or hybrid.

---

## 5. Environment / Config

- **Vision / LLM**: Add `GEMINI_API_KEY` (or similar) to `server/.env` and only enable vision/LLM when the key is set; otherwise keep current behavior.
- **Embeddings**: If you add embedding APIs, add a feature flag (e.g. `ENABLE_EMBEDDINGS=true`) so you can roll out without breaking existing complaints.

---

## Summary

- **AI is the main thing**: Prioritize **vision** (use the photo) and **semantic search** (embeddings or at least better TF-IDF + multi-term user search).
- **Quick wins**: Zone weighting, multi-term user search, full training dataset, and a simple Gemini Vision integration so every uploaded image contributes to priority and search.
