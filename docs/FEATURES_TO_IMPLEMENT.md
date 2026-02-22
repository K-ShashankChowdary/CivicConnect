# Suggested Additional Features for CivicConnect

Use this as a roadmap for new functionality. Each item can be implemented incrementally.

---

## 1. **Citizen / User experience**

- **Complaint status notifications**  
  In-app or email when status changes (e.g. “In progress”, “Resolved”). You already have email; add a simple “Status updated” email and optionally a notifications bell in the header.

- **Estimated resolution time**  
  Admin sets an optional “expected resolve by” date when moving to “In progress”. Show it on the complaint detail and in the list (e.g. “Expected by 15 Mar”).

- **Draft complaints**  
  Save complaint as draft (localStorage or API) so users can finish later. Add “Save draft” and “Submit” on the submit page.

- **Complaint history / timeline**  
  On the detail page, show a timeline: Created → In progress (with date) → Resolved (with date and resolution notes).

- **Duplicate / similar complaints**  
  When submitting, call semantic search (or embeddings) and show “Similar existing complaints” so users can see if the issue was already reported.

---

## 2. **Admin / operations**

- **Bulk actions**  
  Select multiple complaints and bulk update status, assignee, or priority.

- **Assignment to staff**  
  Assign complaints to specific admin users; filter and list “My assigned” vs “Unassigned”.

- **SLA dashboard**  
  Show counts of complaints by “within SLA” / “breached” based on expected resolution time or default SLA (e.g. Critical 24h, High 72h).

- **Export**  
  Export filtered list to CSV/Excel (complaint id, title, category, status, priority, created, resolved).

- **Analytics**  
  Simple charts: complaints by category, by priority, by week/month; average resolution time.

---

## 3. **AI & search**

- **LLM-based priority**  
  Use an LLM (e.g. Gemini) to assign priority and a short “reason” from title + description. Store `priorityReason` and show it in the UI. Fallback to current TF.js model if API is unavailable.

- **Image / vision AI**  
  Send first attachment to a vision API (e.g. Gemini Vision), get a short description, and use it for priority and search (so “broken streetlight” in a photo is searchable).

- **Semantic search with embeddings**  
  Store embeddings for each complaint (e.g. Gemini embedding) and use vector search (MongoDB Atlas Vector Search or similar) for “find similar” and better search ranking.

- **Category / tag suggestions**  
  LLM or keyword rules suggest category or tags from description (e.g. “water leak” → Water Supply) before submit.

---

## 4. **Platform & UX**

- **Dark mode**  
  Toggle in header; persist in localStorage; use CSS variables or Tailwind dark: classes (you now have Tailwind set up).

- **Multi-language (i18n)**  
  Support at least one extra language (e.g. Hindi, Kannada) for labels and key messages via react-i18next or similar.

- **PWA**  
  Add a service worker and manifest so the app is installable and works offline for viewing already-loaded complaints.

- **Mobile app**  
  Consider React Native or Capacitor to ship a native-like app reusing the same API.

- **Ward / zone filters**  
  If location data includes ward or zone, let admins filter by ward and show a simple map or list by area.

---

## 5. **Trust & safety**

- **Rate limiting**  
  Limit submissions per user per day (e.g. 5) to reduce spam.

- **Abuse reporting**  
  Allow users to report inappropriate content; flag for admin review.

- **Audit log**  
  Log admin actions (status change, assignment, resolution) with user and timestamp for accountability.

---

## 6. **Integrations**

- **WhatsApp / SMS notifications**  
  Optional opt-in for status updates via Twilio or similar.

- **Map view**  
  Show complaints on a map (Leaflet / Mapbox) with filters by category and status.

- **External ticketing**  
  Optionally create a ticket in an external system (e.g. Zendesk, Freshdesk) when complaint is created or when status changes.

---

## Suggested order

1. **Quick wins:** Complaint timeline on detail page, “Expected by” date, status-change email.
2. **High impact:** LLM-based priority (with reason), vision AI for images, duplicate/similar complaints.
3. **Scale:** Bulk actions, assignment, SLA dashboard, export, analytics.
4. **Polish:** Dark mode, i18n, PWA, map view.

You can use **Tailwind CSS** (now set up in the client) for all new UI: layout, spacing, colors, and dark mode with `dark:` classes.
