import mongoose from "mongoose";

const wardContextCardSchema = new mongoose.Schema(
  {
    wardName: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    totalCount: { type: Number, default: 0 },
    recentCount: { type: Number, default: 0 }, // 30-day count
    commonSubCategory: { type: String, trim: true },
    dominantStaffRole: { type: String, trim: true },
    trend: { 
      type: String, 
      enum: ["increasing", "decreasing", "stable", "unknown"],
      default: "unknown"
    },
    chronicFlag: { type: Boolean, default: false }, // >= 10 complaints
    anomalyFlag: { type: Boolean, default: false }, // 0 prior complaints 
    lastUpdated: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

// CRITICAL: Unique compound index to prevent duplicate inserts during race conditions
wardContextCardSchema.index({ wardName: 1, category: 1 }, { unique: true });

const WardContextCard = mongoose.model("WardContextCard", wardContextCardSchema);

export default WardContextCard;
