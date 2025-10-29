import Complaint from '../models/Complaint.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { buildAdminComplaintFilters, buildSearchQuery } from '../services/complaintService.js';

export const listComplaints = asyncHandler(async (req, res) => {
  const filters = buildAdminComplaintFilters(req.query);
  const search = buildSearchQuery(req.query);

  const query = Complaint.find(filters);

  if (search) {
    query.find(search);
  }

  if (req.query.sortBy) {
    const sortDirection = req.query.sortDirection === 'asc' ? 1 : -1;
    query.sort({ [req.query.sortBy]: sortDirection });
  } else {
    query.sort({ createdAt: -1 });
  }

  const page = Number(req.query.page) || 1;
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const skip = (page - 1) * limit;

  query.skip(skip).limit(limit);

  const [items, total] = await Promise.all([
    query.populate('createdBy', 'name email role').populate('assignedTo', 'name email role').lean(),
    Complaint.countDocuments(search ? { ...filters, ...search } : filters)
  ]);

  res.json({
    success: true,
    data: {
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    }
  });
});

export const updateComplaintStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, assignedTo, resolutionNotes } = req.body;

  const complaint = await Complaint.findById(id);
  if (!complaint) {
    throw new AppError('Complaint not found', 404);
  }

  if (status) {
    complaint.status = status;
  }

  if (assignedTo) {
    complaint.assignedTo = assignedTo;
  }

  if (resolutionNotes) {
    complaint.resolutionNotes = resolutionNotes;
  }

  if (status === 'resolved') {
    complaint.resolvedAt = new Date();
  }

  await complaint.save();

  res.json({ success: true, data: complaint });
});
