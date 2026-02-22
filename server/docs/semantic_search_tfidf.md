# Semantic Search with TF-IDF and Cosine Similarity

This document explains how the semantic search in `semanticService.js` works using **TF-IDF** and **cosine similarity** between a **query** and **complaints as documents**.

## Notation

- Let:
  - `N` = total number of complaint documents.
  - `d` = a single complaint document.
  - `q` = the text query from the user.
  - `t` = a term (token) that appears in either documents or the query.
  - `tokens(d)` = list of tokens in document `d` after tokenization.
  - `tokens(q)` = list of tokens in query `q` after tokenization.

The code uses simple tokenization: lowercase the text, split on non-alphanumeric characters, and keep tokens of length > 1.

## Step 1: Build Document Text

For each complaint `d`, we construct a single text string by concatenating a few fields:

- `title`
- `description`
- `location`

These are joined with spaces and then tokenized:

```text
text(d) = title(d) + " " + description(d) + " " + location(d)
```

## Step 2: Term Frequency (TF)

For each document `d`, we compute the **raw term frequency** of each token `t`:

- `tf(t, d)` = number of times term `t` appears in `d`.

The implementation does **not** normalize by document length; it just uses raw counts:

```text
For each token t in tokens(d):
    tf_d[t] = tf_d[t] + 1
```

We also build the **document frequency** `df(t)`, i.e., in how many documents each term appears:

```text
For each document d:
    For each unique term t in d:
        df[t] = df[t] + 1
```

- `df(t)` = number of documents that contain term `t` at least once.

## Step 3: Inverse Document Frequency (IDF)

Given `N` documents and the document frequency `df(t)` for each term, we compute a smoothed IDF:

```text
idf(t) = ln(1 + N / (1 + df(t)))
```

This smoothing (`+1` in numerator and denominator) avoids division by zero and infinite values.

- If `df(t)` is large (term appears in many documents), `idf(t)` is small.
- If `df(t)` is small (term appears in few documents), `idf(t)` is larger.

## Step 4: Query Term Frequencies and TF-IDF

We then compute term frequencies for the query `q` similarly to a document:

```text
For each token t in tokens(q):
    tf_q[t] = tf_q[t] + 1
```

Then we build the **TF-IDF weights** for the query:

```text
w_q(t) = tf_q(t) * idf(t)
```

If a term `t` in the query does not exist in any document (i.e., `idf(t)` is 0 or undefined), we ignore it.

We also compute the squared norm of the query vector:

```text
‖q‖^2 = Σ_t (w_q(t))^2
‖q‖ = sqrt(‖q‖^2)
```

## Step 5: Document TF-IDF Vectors

For each document `d`, we compute TF-IDF weights in the same way:

```text
w_d(t) = tf(t, d) * idf(t)
```

Only terms with non-zero `idf(t)` contribute to the vector. Then we compute the squared norm of each document vector:

```text
‖d‖^2 = Σ_t (w_d(t))^2
‖d‖ = sqrt(‖d‖^2)
```

## Step 6: Cosine Similarity Between Query and Each Document

We measure the similarity between query `q` and document `d` using **cosine similarity**:

```text
cos_sim(q, d) = ( Σ_t w_q(t) * w_d(t) ) / (‖q‖ * ‖d‖)
```

- The **numerator** is the dot product:

```text
q · d = Σ_t w_q(t) * w_d(t)
```

- The **denominator** is the product of the vector norms:

```text
‖q‖ * ‖d‖
```

In the implementation:

1. The query vector `w_q(t)` is computed first.
2. For each document `d`, we compute its vector `w_d(t)` and its norm.
3. We compute the dot product by iterating over all terms `t` present in the query vector and checking whether the document vector also has that term.
4. If the dot product is zero, the cosine similarity is 0.

So for each complaint, we get:

```text
score(d) = cos_sim(q, d)
```

## Step 7: Ranking and Filtering Complaints

1. For each complaint `d`, compute `score(d)`.
2. Filter out all documents with `score(d) == 0` (no overlap in informative terms with the query).
3. Sort the remaining documents in **descending** order of `score(d)`.
4. Return the sorted list of complaints (optionally removing the `embedding` field if present, since it is not needed on the client).

This gives you a ranked list of complaints where:

- Higher scores mean higher semantic similarity between the query text and the complaint content.
- Complaints that share rare but important terms with the query will rank higher.

## High-Level Algorithm Summary

**Given:**

- A user query string `q`.
- A list of complaint documents `complaints`.

**We do:**

1. **Tokenize** query and complaints.
2. **Compute TF** for each term in each complaint.
3. **Compute DF** and then **IDF** for each term across all complaints.
4. Build a **TF-IDF vector for the query**.
5. Build **TF-IDF vectors for each complaint**.
6. Compute **cosine similarity** between the query vector and each complaint vector.
7. **Filter** out zero-similarity complaints.
8. **Sort** remaining complaints by similarity score in descending order.
9. Return the ranked list as the semantic search result.

---

## Mathematical Formulas (Clean View)

Below is a compact view of the core formulas used.

- **Term Frequency (TF)** in document `d`:

  \[
  \mathrm{TF}(t, d) = \text{count of term } t \text{ in document } d
  \]

- **Document Frequency (DF)** across all documents:

  \[
  \mathrm{DF}(t) = \#\{ d : t \in d \}
  \]

- **Inverse Document Frequency (IDF)** (smoothed):

  \[
  \mathrm{IDF}(t) = \ln\left(1 + \frac{N}{1 + \mathrm{DF}(t)}\right)
  \]

- **TF-IDF weight** of term `t` in document `d`:

  \[
  w_d(t) = \mathrm{TF}(t, d) \cdot \mathrm{IDF}(t)
  \]

- **TF-IDF weight** of term `t` in query `q`:

  \[
  w_q(t) = \mathrm{TF}(t, q) \cdot \mathrm{IDF}(t)
  \]

- **Vector norms**:

  \[
  \|d\| = \sqrt{\sum_t w_d(t)^2}, \quad \|q\| = \sqrt{\sum_t w_q(t)^2}
  \]

- **Cosine similarity** between query `q` and document `d`:

  \[
  \cos(\theta) = \mathrm{cos\_sim}(q, d) =
  \frac{\sum_t w_q(t) w_d(t)}{\|q\|\,\|d\|}
  \]

---

## Worked Example (Small Corpus)

Consider a tiny corpus with two complaints and one query.

- Complaint 1 (`d1`):

  > "pothole on main road"

- Complaint 2 (`d2`):

  > "water leakage near main hospital"

- Query (`q`):

  > "pothole near hospital"

### 1. Tokenization

Ignoring stopwords and punctuation, tokens might look like:

- `tokens(d1) = ["pothole", "on", "main", "road"]`
- `tokens(d2) = ["water", "leakage", "near", "main", "hospital"]`
- `tokens(q)  = ["pothole", "near", "hospital"]`

Assume `N = 2` documents (`d1` and `d2`).

### 2. Term Frequencies

Document term frequencies (raw counts):

- For `d1`:

  - `TF("pothole", d1) = 1`
  - `TF("main", d1)    = 1`
  - `TF("road", d1)    = 1`

- For `d2`:

  - `TF("water", d2)    = 1`
  - `TF("leakage", d2)  = 1`
  - `TF("near", d2)     = 1`
  - `TF("main", d2)     = 1`
  - `TF("hospital", d2) = 1`

Query term frequencies:

- `TF("pothole", q)  = 1`
- `TF("near", q)     = 1`
- `TF("hospital", q) = 1`

### 3. Document Frequencies and IDF

Document frequency (how many documents contain the term at least once):

- `DF("pothole")  = 1` (only in `d1`)
- `DF("main")     = 2` (in both `d1` and `d2`)
- `DF("road")     = 1`
- `DF("water")    = 1`
- `DF("leakage")  = 1`
- `DF("near")     = 1`
- `DF("hospital") = 1`

Now compute IDF for a few relevant terms (using natural log `ln` and `N = 2`):

- `IDF("pothole")  = ln(1 + 2 / (1 + 1)) = ln(1 + 1) = ln(2)`
- `IDF("near")     = ln(1 + 2 / (1 + 1)) = ln(2)`
- `IDF("hospital") = ln(1 + 2 / (1 + 1)) = ln(2)`
- `IDF("main")     = ln(1 + 2 / (1 + 2)) = ln(1 + 2/3)`

We see that `main` has a lower IDF because it appears in both documents.

### 4. Query TF-IDF Vector

For the query `q`:

- `w_q("pothole")  = TF("pothole", q)  * IDF("pothole")  = 1 * ln(2)`
- `w_q("near")     = TF("near", q)     * IDF("near")     = 1 * ln(2)`
- `w_q("hospital") = TF("hospital", q) * IDF("hospital") = 1 * ln(2)`

The query norm is:

\[
\|q\| = \sqrt{(\ln 2)^2 + (\ln 2)^2 + (\ln 2)^2}
      = \sqrt{3 (\ln 2)^2}
\]

### 5. Document TF-IDF Vectors (Relevant Terms)

Focus only on terms overlapping with the query: `pothole`, `near`, `hospital`.

- For `d1`:

  - Contains `pothole`, not `near` or `hospital`.
  - `w_d1("pothole") = 1 * IDF("pothole") = ln(2)`

  Norm (partial, for these terms):

  \[
  \|d1\| = \sqrt{(\ln 2)^2} = \ln 2
  \]

- For `d2`:

  - Contains `near` and `hospital`, not `pothole`.
  - `w_d2("near")     = 1 * IDF("near")     = ln(2)`
  - `w_d2("hospital") = 1 * IDF("hospital") = ln(2)`

  Norm (partial, for these terms):

  \[
  \|d2\| = \sqrt{(\ln 2)^2 + (\ln 2)^2} = \sqrt{2 (\ln 2)^2}
  \]

### 6. Cosine Similarity

Now compute cosine similarity using only overlapping terms.

- **For `d1` vs query:** overlapping term = `pothole`.

  - Dot product:

    \[
    q \cdot d1 = w_q("pothole") \cdot w_d1("pothole")
                = (\ln 2) (\ln 2) = (\ln 2)^2
    \]

  - Cosine similarity:

    \[
    \mathrm{cos\_sim}(q, d1) = \frac{(\ln 2)^2}{\|q\|\,\|d1\|}
                               = \frac{(\ln 2)^2}{\sqrt{3(\ln 2)^2} \cdot (\ln 2)}
                               = \frac{1}{\sqrt{3}}
    \]

- **For `d2` vs query:** overlapping terms = `near`, `hospital`.

  - Dot product:

    \[
    q \cdot d2
      = w_q("near") w_d2("near") + w_q("hospital") w_d2("hospital")
      = (\ln 2)^2 + (\ln 2)^2 = 2 (\ln 2)^2
    \]

  - Cosine similarity:

    \[
    \mathrm{cos\_sim}(q, d2)
      = \frac{2 (\ln 2)^2}{\|q\|\,\|d2\|}
      = \frac{2 (\ln 2)^2}{\sqrt{3(\ln 2)^2} \cdot \sqrt{2(\ln 2)^2}}
      = \frac{2}{\sqrt{6}}
    \]

Since \(2/\sqrt{6} > 1/\sqrt{3}\), the system will rank `d2` ("water leakage near main hospital") **above** `d1` for the query "pothole near hospital" because it matches two important terms (`near`, `hospital`).

---

## Mapping to Code in `semanticService.js`

This section shows which parts of the code implement each conceptual step.

### Tokenization

```js
const tokenizeForIR = (text) => {
  return (text || "")
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .filter((token) => token.length > 1);
};
```

### Building Document Text

```js
const buildDocTextForIR = (complaint) => {
  return [complaint.title, complaint.description, complaint.location]
    .filter(Boolean)
    .join(" ");
};
```

### Computing TF, DF, and IDF

```js
const computeTfIdfCosineScores = (query, complaints) => {
  const queryTokens = tokenizeForIR(query);

  const df = {};
  const docs = [];

  complaints.forEach((complaint) => {
    const text = buildDocTextForIR(complaint);
    const tokens = tokenizeForIR(text);

    const tf = {};
    tokens.forEach((token) => {
      tf[token] = (tf[token] || 0) + 1; // TF(t, d)
    });

    const seen = new Set();
    Object.keys(tf).forEach((term) => {
      if (!seen.has(term)) {
        df[term] = (df[term] || 0) + 1; // DF(t)
        seen.add(term);
      }
    });

    docs.push({ complaint, tf });
  });

  const N = docs.length || 1;

  const idf = {};
  Object.keys(df).forEach((term) => {
    const docFreq = df[term] || 0;
    idf[term] = Math.log(1 + N / (1 + docFreq)); // IDF(t)
  });
  // ...
};
```

### Building Query TF-IDF and Cosine Similarity

```js
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

  const score = dot ? dot / (queryNorm * docNorm) : 0; // cos_sim(q, d)

  return { complaint: doc.complaint, score };
});
```

### Ranking and Filtering (Re-ranking Function)

```js
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
      complaint._id || '<no-id>',
      complaint.title || '<no-title>'
    );
  });

  return filtered.map((item) => {
    const { complaint } = item;
    if (
      complaint &&
      Object.prototype.hasOwnProperty.call(complaint, 'embedding')
    ) {
      const { embedding, ...rest } = complaint;
      return rest;
    }
    return complaint;
  });
};
---
## Filtering and Search Logic (Parametric + Text Search)

This section explains how **parametric search** (filters on structured fields like status/priority/date) and **text search** (`q`) work and how they connect to the TF-IDF re-ranking.

### Admin Filters: `buildAdminComplaintFilters`

File: `src/services/complaintService.js`

```js
export const buildAdminComplaintFilters = (query) => {
  const filters = {};

  if (query.status) {
    filters.status = query.status;
  }

  if (query.priorityLevel) {
    filters.priorityLevel = query.priorityLevel;
  }

  if (query.category) {
    filters.category = query.category;
  }

  if (query.createdBy) {
    filters.createdBy = query.createdBy;
  }

  if (query.assignedTo) {
    filters.assignedTo = query.assignedTo;
  }

  if (query.minScore || query.maxScore) {
    filters.priorityScore = {};
    if (query.minScore) {
      filters.priorityScore.$gte = Number(query.minScore);
    }
    if (query.maxScore) {
      filters.priorityScore.$lte = Number(query.maxScore);
    }
  }

  if (query.startDate || query.endDate) {
    filters.createdAt = {};
    if (query.startDate) {
      filters.createdAt.$gte = new Date(query.startDate);
    }
    if (query.endDate) {
      filters.createdAt.$lte = new Date(query.endDate);
    }
  }

  if (query.resolved === "true") {
    filters.resolvedAt = { $ne: null };
  } else if (query.resolved === "false") {
    filters.resolvedAt = null;
  }

  return filters;
};
```

**What this does:**

- Turns query parameters like `status`, `priorityLevel`, `minScore`, `maxScore`, `startDate`, etc. into a **MongoDB filter object**.
- Example URL:

  ```text
  /api/admin/complaints?status=submitted&priorityLevel=High&minScore=0.7
  ```

  becomes:

  ```js
  {
    status: "submitted",
    priorityLevel: "High",
    priorityScore: { $gte: 0.7 }
  }
  ```

This object is then passed to `Complaint.find(filters)`.

### Admin Text Search: `buildSearchQuery`

```js
export const buildSearchQuery = (query) => {
  const raw = query?.q?.trim();
  if (!raw) {
    return null;
  }

  // Split on whitespace to support multi-word queries like "pothole road".
  const terms = raw.split(/\s+/).filter(Boolean);

  // Single term: keep behavior equivalent to previous implementation.
  if (terms.length === 1) {
    const term = terms[0];
    return {
      $or: [
        { title: { $regex: term, $options: "i" } },
        { description: { $regex: term, $options: "i" } },
        { location: { $regex: term, $options: "i" } },
      ],
    };
  }

  // Multi-term: require that *each* term appears in at least one of the fields.
  // This builds an $and of per-term $or conditions across title/description/location.
  return {
    $and: terms.map((term) => ({
      $or: [
        { title: { $regex: term, $options: "i" } },
        { description: { $regex: term, $options: "i" } },
        { location: { $regex: term, $options: "i" } },
      ],
    })),
  };
};
```

**What this does:**

- `q` is the user’s search string in the admin UI.
- For a single term (e.g. `q=road`), it builds one `$or` with case-insensitive regex on `title`, `description`, `location`.
- For multiple terms (e.g. `q=pothole road`), it builds an `$and` of `$or` conditions so **every term** must appear in at least one field.

This search object is combined with the admin filters.

### Admin Controller: End-to-End with TF-IDF

File: `src/controllers/adminController.js`

```js
export const listComplaints = asyncHandler(async (req, res) => {
  const filters = buildAdminComplaintFilters(req.query);
  const search = buildSearchQuery(req.query);

  const baseQuery = Complaint.find(filters);

  if (search) {
    baseQuery.find(search);
  }

  const page = Number(req.query.page) || 1;
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const skip = (page - 1) * limit;

  // When a search query is present, rank the full filtered set by TF-IDF cosine
  // and then paginate to return the top-K documents for this page.
  if (req.query.q) {
    const [allItems, total] = await Promise.all([
      baseQuery
        .populate("createdBy", "name email role")
        .populate("assignedTo", "name email role")
        .lean(),
      Complaint.countDocuments(search ? { ...filters, ...search } : filters),
    ]);

    const ranked = await reRankComplaintsByIR(req.query.q, allItems);
    const items = ranked.slice(skip, skip + limit);

    return res.json({
      success: true,
      data: {
        items,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    });
  }

  // No query: use normal sorting + pagination
  if (req.query.sortBy) {
    const sortDirection = req.query.sortDirection === "asc" ? 1 : -1;
    baseQuery.sort({ [req.query.sortBy]: sortDirection });
  } else {
    baseQuery.sort({ createdAt: -1 });
  }

  baseQuery.skip(skip).limit(limit);

  const [rawItems, total] = await Promise.all([
    baseQuery
      .populate("createdBy", "name email role")
      .populate("assignedTo", "name email role")
      .lean(),
    Complaint.countDocuments(search ? { ...filters, ...search } : filters),
  ]);

  const items = rawItems;

  res.json({
    success: true,
    data: {
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    },
  });
});
```

**Flow with `q` present:**

1. Build `filters` from admin controls (status, priority, dates, etc.).
2. Build `search` from `q` (single or multi-term regex across fields).
3. `Complaint.find(filters).find(search)` applies both in MongoDB.
4. Load all matched complaints into `allItems`.
5. Call `reRankComplaintsByIR(q, allItems)` to apply TF-IDF + cosine similarity.
6. Paginate over the **TF-IDF–sorted** list.

So, this is a **parametric + text search pipeline**:

- **Parametric filters** on structured fields (status, priorityLevel, priorityScore, dates, etc.).
- **Regex text search** on unstructured text (title, description, location).
- **TF-IDF ranking** on the full complaint text to order the final candidate list.

### User Complaints: Filtering + TF-IDF

File: `src/controllers/complaintController.js`

```js
export const getMyComplaints = asyncHandler(async (req, res) => {
  const { status, priorityLevel, q } = req.query;

  const filter = { createdBy: req.user._id };

  if (status) filter.status = status;
  if (priorityLevel) filter.priorityLevel = priorityLevel;
  if (q) {
    filter.$or = [
      { title: { $regex: q, $options: "i" } },
      { description: { $regex: q, $options: "i" } },
      { location: { $regex: q, $options: "i" } },
    ];
  }

  let complaints = await Complaint.find(filter).sort({ createdAt: -1 }).lean();

  if (q) {
    complaints = await reRankComplaintsByIR(q, complaints);
  }

  res.json({ success: true, data: complaints });
});
```

**Flow for user route:**

1. Always filter by `createdBy` (only the current user’s complaints).
2. Optionally filter by `status` and `priorityLevel`.
3. If `q` is present, add a simple `$or` regex filter on title/description/location.
4. Sort by `createdAt` descending.
5. If `q` is present, re-rank this set in memory using TF-IDF (`reRankComplaintsByIR`).

Again, **filter + regex** select the set, and **TF-IDF** sorts that set by semantic similarity.

---

## Zone / Field Weighting with TF-IDF (Title vs Description vs Location)

You can extend the current TF-IDF model by giving different **weights ("zones")** to different fields, e.g. making matches in the **title** count more than matches in the **description**.

### Concept

Define three zones for each complaint:

- Zone 1: `title` (short, highly informative)
- Zone 2: `description` (long, detailed text)
- Zone 3: `location` (place names, roads, landmarks)

Assign a **zone weight** \(\alpha_z\) to each field, for example:

- \(\alpha_{\text{title}} = 3.0\)
- \(\alpha_{\text{description}} = 2.0\)
- \(\alpha_{\text{location}} = 1.5\)

These are reasonable defaults; you can tune them based on how important each field is to ranking.

### Zonal TF-IDF Formula

Let:

- \(\mathrm{TF}_{\text{title}}(t, d)\) = term frequency of \(t\) in the **title** of complaint \(d\).
- \(\mathrm{TF}_{\text{desc}}(t, d)\) = term frequency of \(t\) in the **description** of \(d\).
- \(\mathrm{TF}_{\text{loc}}(t, d)\)  = term frequency of \(t\) in the **location** of \(d\).

Define a **zonal term frequency** as a weighted sum:

\[
\mathrm{ZTF}(t, d) =
  \alpha_{\text{title}}\,\mathrm{TF}_{\text{title}}(t, d)
  + \alpha_{\text{desc}}\,\mathrm{TF}_{\text{desc}}(t, d)
  + \alpha_{\text{loc}}\,\mathrm{TF}_{\text{loc}}(t, d)
\]

Then the **zonal TF-IDF weight** for term \(t\) in document \(d\) becomes:

\[
  w^{\text{zone}}_d(t) = \mathrm{ZTF}(t, d) \cdot \mathrm{IDF}(t)
\]

The query vector can stay as-is:

\[
  w_q(t) = \mathrm{TF}(t, q) \cdot \mathrm{IDF}(t)
\]

Cosine similarity is then computed in exactly the same way as before, but using \(w^{\text{zone}}_d(t)\) for documents instead of the simple TF-based weights.

### How This Fits Your Current Code

Right now, `buildDocTextForIR` merges `title`, `description`, and `location` into one text string before tokenization:

```js
const buildDocTextForIR = (complaint) => {
  return [complaint.title, complaint.description, complaint.location]
    .filter(Boolean)
    .join(" ");
};
```

This implicitly treats all zones with the **same weight**.

To implement zone weighting conceptually, you would:

1. **Tokenize each field separately** (title, description, location).
2. Compute separate `TF_title`, `TF_desc`, `TF_loc` for each complaint.
3. Combine them into a zonal TF using weights \(\alpha\) as in the formulas above.
4. Use that combined TF when building document TF-IDF weights.

For example, in pseudocode:

```js
const ALPHA_TITLE = 3.0;
const ALPHA_DESC = 2.0;
const ALPHA_LOCATION = 1.5;

// Inside computeTfIdfCosineScores, for each complaint:
const titleTokens = tokenizeForIR(complaint.title);
const descTokens = tokenizeForIR(complaint.description);
const locTokens = tokenizeForIR(complaint.location);

const tfTitle = countFrequencies(titleTokens);
const tfDesc = countFrequencies(descTokens);
const tfLoc = countFrequencies(locTokens);

const zonalTf = {};
for (const term of allUniqueTermsAcross(tfTitle, tfDesc, tfLoc)) {
  const tfTitleVal = tfTitle[term] || 0;
  const tfDescVal = tfDesc[term] || 0;
  const tfLocVal = tfLoc[term] || 0;

  zonalTf[term] =
    ALPHA_TITLE * tfTitleVal +
    ALPHA_DESC * tfDescVal +
    ALPHA_LOCATION * tfLocVal;
}

// Then use zonalTf instead of a single tf map when computing IDF and TF-IDF.
```

This keeps the **same TF-IDF + cosine similarity framework**, but adds the ability to say:

- "A match in the title is more important than a match only in the description."
- "Location matches matter, but slightly less than title/description." 

You can tune the \(\alpha\) values based on your data and UX needs.

---

## Other Information Retrieval Features You Could Add

Here are some natural extensions to this TF-IDF + cosine approach that you can add later.

- **BM25 ranking**

  A more advanced TF-IDF variant that normalizes by document length and has tunable parameters (`k1`, `b`). It often performs better than plain TF-IDF for text search.

- **Field weighting**

  Give different weights to `title`, `description`, and `location` (e.g., title terms count more than description terms).

- **Synonym / query expansion**

  Expand the query with synonyms or related terms (e.g., "pothole" → "road damage", "crack") before computing TF-IDF.

- **Recency or priority boosting**

  Combine the TF-IDF score with additional signals, such as complaint `priorityLevel`, `createdAt`, or `status`, to prefer newer or more critical complaints.

- **Hybrid search (TF-IDF + embeddings)**

  Use TF-IDF for precise keyword matching and combine it with a vector similarity score from embeddings (if you later add real embeddings in `attachComplaintEmbedding`).
