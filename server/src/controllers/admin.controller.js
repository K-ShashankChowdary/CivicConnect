// Admin controller: list, update, get by id, find similar
import Complaint from "../models/complaint.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {
  buildAdminComplaintFilters,
  buildSearchQuery,
} from "../services/complaint.service.js";
import { reRankComplaintsByIR } from "../services/semantic.service.js";

export const listComplaints = asyncHandler(async (req, res) => {
  // 1. Build filtering query
  const filters = buildAdminComplaintFilters(req.query);
  const baseQuery = Complaint.find(filters);

  // 2. Pagination Math
  const page = Number(req.query.page) || 1;
  const limit = Math.min(Number(req.query.limit) || 20, 100); // Cap max page size to 100
  const skip = (page - 1) * limit;

  // 3. Information Retrieval (Semantic Search) Path
  // When a search query is present, rank the full filtered set by TF-IDF/cosine similarity
  // and then paginate to return the top-K documents for this page.
  if (req.query.q) {
    // We must fetch all documents passing the initial filters because
    // relevance ranking requires evaluating the whole document pool against the query.
    const allItems = await baseQuery
        .populate("createdBy", "name email role")
        .populate("assignedTo", "name email role")
        .lean();

    const ranked = await reRankComplaintsByIR(req.query.q, allItems);
    
    // Manual pagination over the re-ranked array
    const items = ranked.slice(skip, skip + limit);

    return res.status(200).json(new ApiResponse(200, {
      items,
      total: ranked.length,
      page,
      totalPages: Math.ceil(ranked.length / limit) || 1,
    }));
  }

  // 4. Standard Database Sorting Path (No natural language text query)
  if (req.query.sortBy) {
    const sortDirection = req.query.sortDirection === "asc" ? 1 : -1;
    baseQuery.sort({ [req.query.sortBy]: sortDirection });
  } else {
    // Default to newest first
    baseQuery.sort({ createdAt: -1 });
  }

  baseQuery.skip(skip).limit(limit);

  // Execute the data fetch and total document count in parallel to significantly reduce latency
  const [rawItems, total] = await Promise.all([
    baseQuery
      .populate("createdBy", "name email role")
      .populate("assignedTo", "name email role")
      .lean(),
    Complaint.countDocuments(filters),
  ]);

  const items = rawItems;

  return res.status(200).json(new ApiResponse(200, {
    items,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  }));
});

// Update complaint status and operational notes
export const updateComplaintStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, assignedTo, resolutionNotes } = req.body;

  const complaint = await Complaint.findById(id).populate(
    "createdBy",
    "name email",
  );
  
  if (!complaint) {
    throw new ApiError(404, "Complaint not found");
  }

  // Handle Operational State changes and Audit Logging
  if (status && complaint.status !== status) {
    complaint.status = status;
    complaint.auditLog.push({
      status,
      timestamp: new Date(),
      updatedBy: req.user._id, // Track which admin changed the status
    });
  }

  // Allow assignment of workers (e.g. sanitation department user)
  if (assignedTo) {
    complaint.assignedTo = assignedTo;
  }

  // Record details from resolution (e.g., "Pothole filled with asphalt")
  if (resolutionNotes) {
    complaint.resolutionNotes = resolutionNotes;
  }

  // Automatically stamp resolution timestamp
  if (status === "resolved") {
    complaint.resolvedAt = new Date();
  }

  await complaint.save();

  return res.status(200).json(new ApiResponse(200, complaint));
});

// Fetch a single complaint for an admin
export const getComplaintById = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id)
    .populate("createdBy", "name email role")
    .populate("assignedTo", "name email role")
    .lean();

  if (!complaint) {
    throw new ApiError(404, "Complaint not found");
  }

  return res.status(200).json(new ApiResponse(200, complaint));
});

// Find and return semantically similar complaints using embeddings/IR
export const findSimilarToComplaint = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const complaint = await Complaint.findById(id).lean();
  
  if (!complaint) {
    throw new ApiError(404, "Complaint not found");
  }

  // Fetch all OTHER complaints. In a massively scalable system, this would be restricted
  // by geofencing or recent time boundaries to prevent pulling 1,000,000 rows.
  const allItems = await Complaint.find({ _id: { $ne: id } })
    .populate("createdBy", "name email role")
    .populate("assignedTo", "name email role")
    .lean();

  // Combine relevant fields into a single blob of test to embed/rank against
  const queryText = `${complaint.title} ${complaint.description} ${complaint.category}`;
  
  // Rerank using Semantic Engine
  const ranked = await reRankComplaintsByIR(queryText, allItems);
  
  // Only surface top 10 most related results
  const items = ranked.slice(0, 10);
  
  return res.status(200).json(new ApiResponse(200, {
      items,
      total: items.length,
      page: 1,
      totalPages: 1,
  }));
});
