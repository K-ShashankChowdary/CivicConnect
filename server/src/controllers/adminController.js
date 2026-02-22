import Complaint from "../models/Complaint.js";
import AppError from "../utils/AppError.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
  buildAdminComplaintFilters,
  buildSearchQuery,
} from "../services/complaintService.js";
import { reRankComplaintsByIR } from "../services/semanticService.js";
import { sendEmail } from "../services/emailService.js";

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

  const complaint = await Complaint.findById(id).populate(
    "createdBy",
    "name email",
  );
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

  try {
    const user = complaint.createdBy;
    if (user && user.email) {
      const baseUrl = process.env.APP_BASE_URL;
      const trimmedBaseUrl = baseUrl ? baseUrl.replace(/\/+$/, "") : null;
      const detailsUrl = trimmedBaseUrl
        ? `${trimmedBaseUrl}/complaints/${complaint._id}`
        : null;
      const statusLabel = complaint.status.replace("_", " ");

      const plainLines = [
        `Dear ${user.name || "Citizen"},`,
        "",
        `The status of your complaint '${complaint.title}' has been updated.`,
        `New status: ${statusLabel}`,
      ];

      if (complaint.resolutionNotes) {
        plainLines.push(`Resolution notes: ${complaint.resolutionNotes}`);
      }

      if (detailsUrl) {
        plainLines.push(
          "",
          `You can view the full details here: ${detailsUrl}`,
        );
      }

      plainLines.push("", "Thank you for your patience.");

      const text = plainLines.join("\n");

      const htmlLines = [
        `<p>Dear ${user.name || "Citizen"},</p>`,
        `<p>The status of your complaint titled <strong>${complaint.title}</strong> has been updated.</p>`,
        "<ul>",
        `<li><strong>Status:</strong> ${statusLabel}</li>`,
      ];

      if (complaint.resolutionNotes) {
        htmlLines.push(
          `<li><strong>Resolution notes:</strong> ${complaint.resolutionNotes}</li>`,
        );
      }

      htmlLines.push("</ul>");

      if (detailsUrl) {
        htmlLines.push(
          `<p>You can view the full details here: <a href="${detailsUrl}">${detailsUrl}</a></p>`,
        );
      }

      htmlLines.push("<p>Thank you for your patience.</p>");

      await sendEmail({
        to: user.email,
        subject: `Complaint status updated: ${statusLabel}`,
        text,
        html: htmlLines.join(""),
      });
    }
  } catch (error) {
    console.error("Failed to send complaint status update email", error);
  }

  res.json({ success: true, data: complaint });
});
