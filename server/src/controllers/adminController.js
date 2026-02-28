import Complaint from "../models/Complaint.js";
import AppError from "../utils/AppError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { successResponse } from "../utils/apiResponse.js";
import {
  buildAdminComplaintFilters,
  buildSearchQuery,
} from "../services/complaintService.js";
import { reRankComplaintsByIR } from "../services/semanticService.js";
import { getIO } from "../services/socketService.js";

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

    return successResponse(res, 200, {
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit),
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

  return successResponse(res, 200, {
    items,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
});

export const updateComplaintStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, assignedTo, resolutionNotes } = req.body;

  const complaint = await Complaint.findById(id).populate(
    "createdBy",
    "name email",
  );
  if (!complaint) {
    throw new AppError("Complaint not found", 404);
  }

  if (status && complaint.status !== status) {
    complaint.status = status;
    complaint.auditLog.push({
      status,
      timestamp: new Date(),
      updatedBy: req.user._id,
    });
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

  const creatorId = complaint.createdBy._id 
    ? complaint.createdBy._id.toString() 
    : complaint.createdBy.toString();

  getIO()
    .to(creatorId)
    .to("admin_events")
    .to(`complaint_${complaint._id.toString()}`)
    .emit("complaintUpdated", complaint);

  return successResponse(res, 200, complaint);
});

export const findSimilarToComplaint = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const complaint = await Complaint.findById(id).lean();
  
  if (!complaint) {
    throw new AppError("Complaint not found", 404);
  }

  const allItems = await Complaint.find({ _id: { $ne: id } })
    .populate("createdBy", "name email role")
    .populate("assignedTo", "name email role")
    .lean();

  const queryText = `${complaint.title} ${complaint.description} ${complaint.category}`;
  const ranked = await reRankComplaintsByIR(queryText, allItems);
  
  const items = ranked.slice(0, 10);
  
  return successResponse(res, 200, {
      items,
      total: items.length,
      page: 1,
      totalPages: 1,
  });
});
