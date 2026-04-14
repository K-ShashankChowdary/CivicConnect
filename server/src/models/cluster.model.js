import mongoose from "mongoose";

const clusterSchema = new mongoose.Schema(
  {
    clusterTitle: { type: String, required: true, trim: true }, // Logic: "[SubCategory] cluster in [WardName]" or "[Category] cluster across multiple wards"
    complaintIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Complaint" }],
    severity: { 
      type: String, 
      enum: ["Moderate", "High", "Critical"], // Configurable severity tiers based on anomaly escalation
      default: "Moderate"
    },
    maxPriorityScore: { type: Number, default: 0.0 },
    wardName: { type: String, trim: true }, // Can be null if it spans multiple wards
    category: { type: String, required: true, trim: true },
    complaintCount: { type: Number, default: 1 }
  },
  { timestamps: true }
);

const Cluster = mongoose.model("Cluster", clusterSchema);

export default Cluster;
