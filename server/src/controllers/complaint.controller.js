// Complaint controller: create, read, update user complaints
import { validationResult } from "express-validator";

import Complaint from "../models/complaint.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { predictPriorityWithLLM } from "../services/priorityLLM.service.js";
import { predictPriority } from "../services/priority.service.js";
import { buildSearchQuery } from "../services/complaint.service.js";
import {
  attachComplaintEmbedding,
  reRankComplaintsByIR,
} from "../services/semantic.service.js";

export const createComplaint = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(422, "Validation failed", errors.array());
  }

  const { title, category, description, location, latitude, longitude } =
    req.body;

  // S3 (multer-s3) populates req.files via Multer. Map output to S3 public URLs.
  const attachments =
    Array.isArray(req.files) && req.files.length > 0
      ? req.files.map((file) => file.location)
      : [];

  // Prefer LLM (Gemini) when available; fall back to TF.js
  let result = await predictPriorityWithLLM({
    category,
    title,
    description,
    location,
  });
  
  if (!result) {
    // LLM failed, using baseline model
    result = await predictPriority({ category, description, location });
  }
  const { score, priorityLevel, tags, priorityReason } = result;

  // Validate score integrity
  if (isNaN(score) || score === null || score === undefined) {
    throw new ApiError(500, "Failed to calculate priority score. Please try again.");
  }

  // Parse coordinates with bounds checking against typical Earth measurements
  let lat, lng;
  if (typeof latitude !== "undefined" && latitude !== null && String(latitude).trim() !== "") {
    const latParsed = Number.parseFloat(latitude);
    // Latitude must be within physical boundaries
    if (Number.isFinite(latParsed) && latParsed >= -90 && latParsed <= 90) {
      lat = latParsed;
    }
  }

  if (typeof longitude !== "undefined" && longitude !== null && String(longitude).trim() !== "") {
    const lngParsed = Number.parseFloat(longitude);
    // Longitude must be within physical boundaries
    if (Number.isFinite(lngParsed) && lngParsed >= -180 && lngParsed <= 180) {
      lng = lngParsed;
    }
  }

  const geoTags = [];

  // Always keep user-provided address in the tag metadata payload
  if (location) {
    geoTags.push({ label: "address", value: location });
  }

  const allTags = [...tags, ...geoTags];

  const complaintData = {
    title,
    category,
    description,
    location,
    incidentTime: new Date(), // Use current timestamp
    priorityScore: score,
    priorityLevel,
    ...(priorityReason && { priorityReason }),
    tags: allTags,
    attachments,
    createdBy: req.user._id,
  };

  // Only assign coordinates if they passed our bounds-check boundary verification
  if (lat !== undefined) {
    complaintData.latitude = lat;
  }

  if (lng !== undefined) {
    complaintData.longitude = lng;
  }

  const complaint = await Complaint.create(complaintData);

  // Generate embeddings for semantic search capabilities
  // Operates directly on the document before saving is strictly necessary, but Mongoose
  // `save()` will be handled by the next update loop, or the service does it directly.
  await attachComplaintEmbedding(complaint);
  await complaint.save();
  
  return res.status(201).json(new ApiResponse(201, complaint));
});

// Get user's complaints with optional semantic search and filters
export const getMyComplaints = asyncHandler(async (req, res) => {
  const { status, priorityLevel, q } = req.query;

  // Security barrier: Ensure users can ONLY query their own records!
  const filter = { createdBy: req.user._id };

  if (status) filter.status = status;
  if (priorityLevel) filter.priorityLevel = priorityLevel;

  // Using .lean() directly yields JSON object data drastically increasing JSON parse speed.
  let complaints = await Complaint.find(filter).sort({ createdAt: -1 }).lean();

  if (q?.trim() && complaints.length > 0) {
    try {
      const ranked = await reRankComplaintsByIR(q.trim(), complaints);
      if (Array.isArray(ranked) && ranked.length > 0) {
        complaints = ranked;
      }
    } catch (err) {
      console.warn("Search re-rank failed, returning unranked list:", err.message);
    }
  }

  return res.status(200).json(new ApiResponse(200, complaints));
});

// Fetch a single complaint belonging to the user
export const getComplaintById = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findOne({
    _id: req.params.id,
    createdBy: req.user._id, // Enforce ownership security barrier
  }).lean();

  if (!complaint) {
    throw new ApiError(404, "Complaint not found");
  }

  return res.status(200).json(new ApiResponse(200, complaint));
});

// Update a submitted complaint
export const updateComplaint = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(422, "Validation failed", errors.array());
  }

  // Get raw Mongoose document to use property assignment and .save() semantics natively
  const complaint = await Complaint.findOne({
    _id: req.params.id,
    createdBy: req.user._id,
  });

  if (!complaint) {
    throw new ApiError(404, "Complaint not found");
  }

  // State-machine gate - users can't edit complaints that administrators are already evaluating!
  if (complaint.status !== "submitted") {
    throw new ApiError(400, "Only submitted complaints can be edited");
  }

  const { title, category, description, location, latitude, longitude } =
    req.body;

  if (title) complaint.title = title;
  if (category) complaint.category = category;
  if (description) complaint.description = description;
  if (location) complaint.location = location;

  if (typeof latitude !== "undefined" && latitude !== null && String(latitude).trim() !== "") {
    const latParsed = Number.parseFloat(latitude);
    // Strict geographic validation fixes potential bound issues and edge case bugs
    if (Number.isFinite(latParsed) && latParsed >= -90 && latParsed <= 90) {
      complaint.latitude = latParsed;
    }
  }

  if (typeof longitude !== "undefined" && longitude !== null && String(longitude).trim() !== "") {
    const lngParsed = Number.parseFloat(longitude);
    // Strict geographic validation fixes potential bound issues and edge case bugs
    if (Number.isFinite(lngParsed) && lngParsed >= -180 && lngParsed <= 180) {
      complaint.longitude = lngParsed;
    }
  }

  // Add new uploaded images to existing attachments array
  if (req.files && req.files.length > 0) {
    const newAttachments = req.files.map((file) => file.location);
    complaint.attachments = [...complaint.attachments, ...newAttachments];
  }

  // Re-predict priority because user updated text metadata affecting priority/reasoning
  let updateResult = await predictPriorityWithLLM({
    category: complaint.category,
    title: complaint.title,
    description: complaint.description,
    location: complaint.location,
  });
  
  if (!updateResult) {
    updateResult = await predictPriority({
      category: complaint.category,
      description: complaint.description,
      location: complaint.location,
    });
  }
  const { score, priorityLevel, tags, priorityReason } = updateResult;

  // Validate score returned by underlying engines
  if (isNaN(score) || score === null || score === undefined) {
    throw new ApiError(500, "Failed to calculate priority score. Please try again.");
  }

  // Update AI data in tracking columns
  complaint.priorityScore = score;
  complaint.priorityLevel = priorityLevel;
  if (priorityReason !== undefined) complaint.priorityReason = priorityReason || undefined;

  const geoTags = [];
  if (complaint.location) {
    geoTags.push({ label: "address", value: complaint.location });
  }
  complaint.tags = [...tags, ...geoTags];

  // Because the description changed, update vectors mapping to NLP semantics
  await attachComplaintEmbedding(complaint);
  await complaint.save();

  return res.status(200).json(new ApiResponse(200, complaint));
});
