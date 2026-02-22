import { getCategoryColor } from "../constants/categories.js";

/**
 * Tailwind-styled category chip with unique color per category.
 * Use this for a consistent look across Dashboard, Details, and Admin.
 */
export default function CategoryChip({ category, className = "" }) {
  const { bg, text } = getCategoryColor(category || "");

  return (
    <span
      className={`inline-flex items-center rounded-lg px-2.5 py-0.5 text-xs font-semibold ${className}`}
      style={{ backgroundColor: bg, color: text }}
    >
      {category || "—"}
    </span>
  );
}
