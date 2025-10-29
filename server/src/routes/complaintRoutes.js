import express from 'express';

import {
  createComplaint,
  getMyComplaints,
  getComplaintById,
  updateComplaint
} from '../controllers/complaintController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { complaintCreateValidator, complaintUpdateValidator } from '../validators/complaintValidators.js';

const router = express.Router();

router.use(authenticate);

router.post('/', complaintCreateValidator, createComplaint);
router.get('/', getMyComplaints);
router.get('/:id', getComplaintById);
router.put('/:id', complaintUpdateValidator, updateComplaint);

export default router;
