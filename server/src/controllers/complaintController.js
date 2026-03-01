import { validationResult } from "express-validator";

import Complaint from "../models/Complaint.js";
import AppError from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { successResponse } from "../utils/apiResponse.js";
import { predictPriorityWithLLM } from "../services/priorityLLMService.js";
import { predictPriority } from "../services/priorityService.js";
import { buildSearchQuery } from "../services/complaintService.js";
import {
  attachComplaintEmbedding,
  reRankComplaintsByIR,
} from "../services/semanticService.js";

export const createComplaint = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError("Validation failed", 422, errors.array());
  }

  const { title, category, description, location, latitude, longitude } =
    req.body;

  const attachments =
    Array.isArray(req.files) && req.files.length > 0
      ? req.files.map((file) => file.path)
      : [];

  // Prefer LLM (Gemini) when available; fall back to TF.js
  let result = await predictPriorityWithLLM({
    category,
    title,
    description,
    location,
  });
  if (!result) {
    result = await predictPriority({ category, description, location });
  }
  const { score, priorityLevel, tags, priorityReason } = result;

  // Validate score
  if (isNaN(score) || score === null || score === undefined) {
    throw new AppError(
      "Failed to calculate priority score. Please try again.",
      500,
    );
  }

  const lat =
    typeof latitude !== "undefined" ? Number.parseFloat(latitude) : undefined;
  const lng =
    typeof longitude !== "undefined" ? Number.parseFloat(longitude) : undefined;

  const geoTags = [];

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

  if (Number.isFinite(lat)) {
    complaintData.latitude = lat;
  }

  if (Number.isFinite(lng)) {
    complaintData.longitude = lng;
  }

  const complaint = await Complaint.create(complaintData);

  await attachComplaintEmbedding(complaint);
  
  return successResponse(res, 201, complaint);
});

export const getMyComplaints = asyncHandler(async (req, res) => {
  const { status, priorityLevel, q } = req.query;

  const filter = { createdBy: req.user._id };

  if (status) filter.status = status;
  if (priorityLevel) filter.priorityLevel = priorityLevel;

  let complaints = await Complaint.find(filter).sort({ createdAt: -1 }).lean();

  if (q?.trim()) {
    complaints = await reRankComplaintsByIR(q.trim(), complaints);
  }

  return successResponse(res, 200, complaints);
});

export const getComplaintById = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findOne({
    _id: req.params.id,
    createdBy: req.user._id,
  }).lean();

  if (!complaint) {
    throw new AppError("Complaint not found", 404);
  }

  return successResponse(res, 200, complaint);
});

export const updateComplaint = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError("Validation failed", 422, errors.array());
  }

  const complaint = await Complaint.findOne({
    _id: req.params.id,
    createdBy: req.user._id,
  });

  if (!complaint) {
    throw new AppError("Complaint not found", 404);
  }

  if (complaint.status !== "submitted") {
    throw new AppError("Only submitted complaints can be edited", 400);
  }

  const { title, category, description, location, latitude, longitude } =
    req.body;

  if (title) complaint.title = title;
  if (category) complaint.category = category;
  if (description) complaint.description = description;
  if (location) complaint.location = location;

  if (typeof latitude !== "undefined") {
    const lat = Number.parseFloat(latitude);
    if (Number.isFinite(lat)) {
      complaint.latitude = lat;
    }
  }

  if (typeof longitude !== "undefined") {
    const lng = Number.parseFloat(longitude);
    if (Number.isFinite(lng)) {
      complaint.longitude = lng;
    }
  }

  // Add new uploaded images to existing attachments
  if (req.files && req.files.length > 0) {
    const newAttachments = req.files.map((file) => file.path);
    complaint.attachments = [...complaint.attachments, ...newAttachments];
  }

  // Prefer LLM when available; fall back to TF.js
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

  // Validate score
  if (isNaN(score) || score === null || score === undefined) {
    throw new AppError(
      "Failed to calculate priority score. Please try again.",
      500,
    );
  }

  complaint.priorityScore = score;
  complaint.priorityLevel = priorityLevel;
  if (priorityReason !== undefined) complaint.priorityReason = priorityReason || undefined;

  const geoTags = [];
  if (complaint.location) {
    geoTags.push({ label: "address", value: complaint.location });
  }
  complaint.tags = [...tags, ...geoTags];

  await attachComplaintEmbedding(complaint);
  await complaint.save();

  return successResponse(res, 200, complaint);
});
