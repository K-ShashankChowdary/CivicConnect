import Complaint from "../models/Complaint.js";
import AppError from "../utils/AppError.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
  buildAdminComplaintFilters,
  buildSearchQuery,
} from "../services/complaintService.js";
import { reRankComplaintsByIR } from "../services/semanticService.js";

export const listComplaints = asyncHandler(async (req, res) => {
  const filters = buildAdminComplaintFilters(req.query);
  const search = buildSearchQuery(req.query);

  const baseQuery = Complaint.find(filters);

  if (search) {
    baseQuery.find(search);
  }

  const page = Number(req.query.page) || 1;
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const skip = (page - 1) * limit;

  // When a search query is present, rank the full filtered set by TF-IDF cosine
  // and then paginate to return the top-K documents for this page.
  if (req.query.q) {
    const [allItems, total] = await Promise.all([
      baseQuery
        .populate("createdBy", "name email role")
        .populate("assignedTo", "name email role")
        .lean(),
      Complaint.countDocuments(search ? { ...filters, ...search } : filters),
    ]);

    const ranked = await reRankComplaintsByIR(req.query.q, allItems);
    const items = ranked.slice(skip, skip + limit);

    return res.json({
      success: true,
      data: {
        items,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    });
  }

  // No query: use normal sorting + pagination
  if (req.query.sortBy) {
    const sortDirection = req.query.sortDirection === "asc" ? 1 : -1;
    baseQuery.sort({ [req.query.sortBy]: sortDirection });
  } else {
    baseQuery.sort({ createdAt: -1 });
  }

  baseQuery.skip(skip).limit(limit);

  const [rawItems, total] = await Promise.all([
    baseQuery
      .populate("createdBy", "name email role")
      .populate("assignedTo", "name email role")
      .lean(),
    Complaint.countDocuments(search ? { ...filters, ...search } : filters),
  ]);

  const items = rawItems;

  res.json({
    success: true,
    data: {
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    },
  });
});

export const updateComplaintStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, assignedTo, resolutionNotes } = req.body;

  const complaint = await Complaint.findById(id);
  if (!complaint) {
    throw new AppError("Complaint not found", 404);
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

  if (status === "resolved") {
    complaint.resolvedAt = new Date();
  }

  await complaint.save();

  res.json({ success: true, data: complaint });
});
