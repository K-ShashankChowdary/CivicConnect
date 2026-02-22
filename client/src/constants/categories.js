// Categories and unique colors for chips/cards (civic/utility themed)
export const CATEGORY_LIST = [
  "Water Supply",
  "Sanitation",
  "Waste Management",
  "Roads & Transport",
  "Electricity",
  "Street Lighting",
  "Public Safety",
  "Noise Pollution",
  "Air Quality",
  "Drainage",
  "Animal Control",
  "Public Transport",
  "Traffic",
  "Building Maintenance",
  "Parks & Recreation",
];

// Unique background + text color per category (hex)
export const CATEGORY_COLORS = {
  "Water Supply": { bg: "#0ea5e9", text: "#fff" },        // sky
  "Sanitation": { bg: "#6366f1", text: "#fff" },         // indigo
  "Waste Management": { bg: "#84cc16", text: "#fff" },    // lime
  "Roads & Transport": { bg: "#f59e0b", text: "#fff" },   // amber
  "Electricity": { bg: "#eab308", text: "#1c1917" },     // yellow
  "Street Lighting": { bg: "#a16207", text: "#fff" },     // dark amber
  "Public Safety": { bg: "#dc2626", text: "#fff" },       // red
  "Noise Pollution": { bg: "#8b5cf6", text: "#fff" },     // violet
  "Air Quality": { bg: "#14b8a6", text: "#fff" },         // teal
  "Drainage": { bg: "#0891b2", text: "#fff" },           // cyan
  "Animal Control": { bg: "#65a30d", text: "#fff" },     // green
  "Public Transport": { bg: "#2563eb", text: "#fff" },   // blue
  "Traffic": { bg: "#ea580c", text: "#fff" },             // orange
  "Building Maintenance": { bg: "#64748b", text: "#fff" }, // slate
  "Parks & Recreation": { bg: "#059669", text: "#fff" },  // emerald
};

export function getCategoryColor(category) {
  return CATEGORY_COLORS[category] || { bg: "#64748b", text: "#fff" };
}
