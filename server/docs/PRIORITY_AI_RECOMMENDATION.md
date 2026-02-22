# Better Way to Implement AI Priority Calculator

## Current approach (limitations)

- **TensorFlow.js** neural network trained on a CSV at server startup.
- **Inputs:** Category (one-hot), description (bag-of-words from a fixed 60-word vocabulary), urgency keywords, length.
- **Problems:**
  - Only words seen in the training CSV get weight; new phrasing (e.g. “kids playing near open manhole”) may not map well.
  - No semantic understanding (e.g. “road damage” vs “pothole”).
  - Model is static until restart; no quick way to tune for your city without retraining.
  - Training on every deploy is slow and can fail if the CSV is missing or malformed.
  - No explanation for *why* a priority was chosen (harder for admins and citizens to trust).

---

## Recommended approach: **LLM-based priority with fallback**

Use a **small LLM call** (e.g. **Google Gemini Flash**) to assign priority from the complaint text. Keep your current TF.js model as a **fallback** when the API is unavailable or not configured.

### Why an LLM is better for this task

| Aspect | TF.js (current) | LLM (e.g. Gemini) |
|--------|------------------|--------------------|
| **Understanding** | Keyword/vocabulary only | Full sentence meaning (“children near open drain” → High) |
| **Maintenance** | Retrain when data/labels change | Tune via prompt; no training pipeline |
| **Explainability** | None | Can return a short reason (“Safety risk to pedestrians”) |
| **New categories/phrasing** | Needs retraining or vocabulary update | Works with new categories and wording out of the box |
| **Cost** | Free, runs on your server | Per-request cost (Gemini Flash is cheap) |
| **Latency** | Low (~10–50 ms) | Higher (~200–800 ms) |
| **Offline / no key** | Works | Needs fallback when API is down or key missing |

### Suggested flow

1. **If `GEMINI_API_KEY` is set:** Call Gemini with a **structured prompt** that includes:
   - Category, title, description, (optional) location.
   - Instruction: “Assign exactly one of: Low, Medium, High, Critical. Consider safety, urgency, and impact. Optionally give a one-line reason.”
   - Parse the model output → `priorityLevel` + optional `priorityReason` + numeric `score` derived from level.

2. **If key is missing or API errors:** Fall back to your existing **TF.js** `predictPriority()` so the app always returns a priority.

3. **Store** `priorityLevel`, `priorityScore`, and (if you add the field) `priorityReason` on the complaint. Show the reason in the UI so users and admins see why the AI chose that priority.

### Prompt design (example)

```text
You are a civic complaint triage assistant. Given the following municipal complaint, assign exactly one priority: Low, Medium, High, or Critical. Consider: public safety, health risk, property damage, and urgency.

Category: {category}
Title: {title}
Description: {description}
Location: {location}

Respond in this exact JSON format only, no other text:
{"priority":"Critical|High|Medium|Low","reason":"one short sentence"}
```

Map `priority` to your enum and `reason` to `priorityReason`. Map level to a numeric score (e.g. Low=0.25, Medium=0.5, High=0.75, Critical=1.0) if you need `priorityScore`.

### Implementation outline

- Add **`priorityLLMService.js`** (or similar) that:
  - Exports `predictPriorityWithLLM({ category, title, description, location })`.
  - Calls Gemini (REST or `@google/generative-ai`), parses JSON, returns `{ priorityLevel, priorityScore, priorityReason }`.
  - Catches errors and returns `null` so the controller can fall back.
- In **complaintController** (create/update):
  - First try `predictPriorityWithLLM(...)`.
  - If result is `null`, call existing `predictPriority(...)` from `priorityService.js`.
  - Persist `priorityReason` if the model returns it (add optional field on the Complaint model).
- **Env:** `GEMINI_API_KEY` (optional). If unset, only the TF.js path is used.

This gives you a **better default** (LLM) when the API is available and a **reliable fallback** (current TF.js) when it’s not, with a clear path to add explanations and tune behavior via the prompt.

---

## Other options (shorter term)

- **Rule-based + keywords:** If you want zero external APIs, keep TF.js but add a **pre-step**: if the description matches high-urgency patterns (e.g. “burst”, “children”, “collapse”, “electrocution”), cap the minimum priority at High or Critical. Simple and interpretable.
- **Embeddings + classifier:** Use an embedding API once per complaint, store the vector, and train a small classifier (e.g. TF.js or scikit-learn) on `embedding → priority`. Better semantics than bag-of-words, but you still need training data and a training step; an LLM is simpler to ship first.
- **Hybrid:** Use the LLM only for “uncertain” cases (e.g. when TF.js score is between 0.4 and 0.6) to save cost; more logic to maintain.

---

## Summary

- **Best balance for “better AI priority calculator”:** **LLM-based priority (Gemini) with TF.js fallback**, plus an optional **priority reason** for transparency.
- **Implementation:** Add a small LLM service, try it first in the controller, fall back to existing `predictPriority`, and optionally add `priorityReason` to the schema and UI.
