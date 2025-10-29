import mongoose from 'mongoose';

const tagSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    value: { type: String, required: true }
  },
  { _id: false }
);

const complaintSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    impact: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    incidentTime: { type: Date },
    status: {
      type: String,
      enum: ['submitted', 'in_progress', 'resolved'],
      default: 'submitted'
    },
    priorityScore: { type: Number, default: 0.5 },
    priorityLevel: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium'
    },
    tags: [tagSchema],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    resolutionNotes: { type: String, trim: true },
    resolvedAt: { type: Date }
  },
  { timestamps: true }
);

complaintSchema.index({ category: 1, priorityLevel: 1 });
complaintSchema.index({ location: 'text', description: 'text', title: 'text' });

const Complaint = mongoose.model('Complaint', complaintSchema);

export default Complaint;
