import { validationResult } from 'express-validator';

import Complaint from '../models/Complaint.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { predictPriority } from '../services/priorityService.js';

export const createComplaint = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Validation failed', 422, errors.array());
  }

  const { title, category, description, location } = req.body;

  const { score, priorityLevel, impactLevel, tags } = await predictPriority({
    category,
    description,
    location
  });

  // Validate score
  if (isNaN(score) || score === null || score === undefined) {
    throw new AppError('Failed to calculate priority score. Please try again.', 500);
  }

  const complaint = await Complaint.create({
    title,
    category,
    description,
    location,
    impact: impactLevel, // AI-predicted impact
    incidentTime: new Date(), // Use current timestamp
    priorityScore: score,
    priorityLevel,
    tags,
    createdBy: req.user._id
  });

  res.status(201).json({
    success: true,
    data: complaint
  });
});

export const getMyComplaints = asyncHandler(async (req, res) => {
  const { status, priorityLevel, q } = req.query;
  
  const filter = { createdBy: req.user._id };
  
  if (status) filter.status = status;
  if (priorityLevel) filter.priorityLevel = priorityLevel;
  if (q) {
    filter.$or = [
      { title: { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } },
      { location: { $regex: q, $options: 'i' } }
    ];
  }

  const complaints = await Complaint.find(filter)
    .sort({ createdAt: -1 })
    .lean();

  res.json({ success: true, data: complaints });
});

export const getComplaintById = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findOne({ _id: req.params.id, createdBy: req.user._id }).lean();

  if (!complaint) {
    throw new AppError('Complaint not found', 404);
  }

  res.json({ success: true, data: complaint });
});

export const updateComplaint = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError('Validation failed', 422, errors.array());
  }

  const complaint = await Complaint.findOne({ _id: req.params.id, createdBy: req.user._id });

  if (!complaint) {
    throw new AppError('Complaint not found', 404);
  }

  if (complaint.status !== 'submitted') {
    throw new AppError('Only submitted complaints can be edited', 400);
  }

  const { title, category, description, location } = req.body;

  if (title) complaint.title = title;
  if (category) complaint.category = category;
  if (description) complaint.description = description;
  if (location) complaint.location = location;

  // Add new uploaded images to existing attachments
  if (req.files && req.files.length > 0) {
    const newAttachments = req.files.map(file => file.path);
    complaint.attachments = [...complaint.attachments, ...newAttachments];
  }

  const { score, priorityLevel, impactLevel, tags } = await predictPriority({
    category: complaint.category,
    description: complaint.description,
    location: complaint.location
  });

  // Validate score
  if (isNaN(score) || score === null || score === undefined) {
    throw new AppError('Failed to calculate priority score. Please try again.', 500);
  }

  complaint.impact = impactLevel; // AI-predicted impact
  complaint.priorityScore = score;
  complaint.priorityLevel = priorityLevel;
  complaint.tags = tags;

  await complaint.save();

  res.json({ success: true, data: complaint });
});
