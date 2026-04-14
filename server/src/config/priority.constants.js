/**
 * Priority Score System
 * Priority score is a float between 0.0 and 1.0 everywhere in the system.
 */

export const PRIORITY_BANDS = {
  LOW: { min: 0.00, max: 0.25, label: 'Low', representative: 0.15 },
  MEDIUM: { min: 0.25, max: 0.55, label: 'Medium', representative: 0.40 },
  HIGH: { min: 0.55, max: 0.80, label: 'High', representative: 0.67 },
  CRITICAL: { min: 0.80, max: 1.00, label: 'Critical', representative: 0.90 }
};

/**
 * Derives a formal priority label ('Low', 'Medium', 'High', 'Critical') based on a continuous score.
 * @param {number} score - Float between 0.0 and 1.0
 * @returns {string} The matched label, defaulting to 'Low'
 */
export const getLabelForScore = (score) => {
  if (score >= PRIORITY_BANDS.CRITICAL.min) return PRIORITY_BANDS.CRITICAL.label;
  if (score >= PRIORITY_BANDS.HIGH.min) return PRIORITY_BANDS.HIGH.label;
  if (score >= PRIORITY_BANDS.MEDIUM.min) return PRIORITY_BANDS.MEDIUM.label;
  return PRIORITY_BANDS.LOW.label;
};
