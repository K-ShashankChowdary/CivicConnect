import mongoose from "mongoose";

const tagSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    value: { type: String, required: true },
  },
  { _id: false },
);

const complaintSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    latitude: { type: Number },
    longitude: { type: Number },
    incidentTime: { type: Date },
    status: {
      type: String,
      enum: ["submitted", "in_progress", "resolved"],
      default: "submitted",
    },
    priorityScore: { type: Number, default: 0.5 },
    priorityLevel: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Medium",
    },
    // Short reason from LLM when using Gemini for priority (optional)
    priorityReason: { type: String, trim: true },
    tags: [tagSchema],
    attachments: [{ type: String }],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    resolutionNotes: { type: String, trim: true },
    resolvedAt: { type: Date },
    auditLog: [
      {
        status: String,
        timestamp: Date,
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        _id: false,
      },
    ],
    severityScore: { type: Number, min: 1, max: 5 },
    assignedDepartment: { type: String, trim: true },
    descriptionEmbedding: { type: [Number] },
  },
  { timestamps: true },
);

complaintSchema.index({ category: 1, priorityLevel: 1 });
complaintSchema.index({ location: "text", description: "text", title: "text" });

const Complaint = mongoose.model("Complaint", complaintSchema);

export default Complaint;
