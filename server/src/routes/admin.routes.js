import express from 'express';

import { listComplaints, getComplaintById, updateComplaintStatus, findSimilarToComplaint } from '../controllers/admin.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authenticate, authorize('admin'));

router.get('/complaints', listComplaints);
router.get('/complaints/:id', getComplaintById);
router.get('/complaints/:id/similar', findSimilarToComplaint);
router.patch('/complaints/:id', updateComplaintStatus);

export default router;
