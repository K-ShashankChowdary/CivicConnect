import express from "express";

import {
  createComplaint,
  getMyComplaints,
  getComplaintById,
  updateComplaint,
} from "../controllers/complaint.controller.js";
import { uploadComplaintImages } from "../middleware/upload.middleware.js";
import { authenticate } from "../middleware/auth.middleware.js";
import {
  complaintCreateValidator,
  complaintUpdateValidator,
} from "../validators/complaint.validators.js";

const router = express.Router();

router.use(authenticate);

router.post(
  "/",
  uploadComplaintImages,
  complaintCreateValidator,
  createComplaint,
);
router.get("/", getMyComplaints);
router.get("/:id", getComplaintById);
router.put(
  "/:id",
  uploadComplaintImages,
  complaintUpdateValidator,
  updateComplaint,
);

export default router;
