import express from "express";

import {
  createComplaint,
  getMyComplaints,
  getComplaintById,
  updateComplaint,
} from "../controllers/complaintController.js";
import { uploadComplaintImages } from "../middleware/uploadMiddleware.js";
import { authenticate } from "../middleware/authMiddleware.js";
import {
  complaintCreateValidator,
  complaintUpdateValidator,
} from "../validators/complaintValidators.js";

const router = express.Router();

router.use(authenticate);

router.post(
  "/",
  uploadComplaintImages,
  complaintCreateValidator,
  createComplaint
);
router.get("/", getMyComplaints);
router.get("/:id", getComplaintById);
router.put(
  "/:id",
  uploadComplaintImages,
  complaintUpdateValidator,
  updateComplaint
);

export default router;
