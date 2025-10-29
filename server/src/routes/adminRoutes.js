import express from 'express';

import { listComplaints, updateComplaintStatus } from '../controllers/adminController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticate, authorize('admin'));

router.get('/complaints', listComplaints);
router.patch('/complaints/:id', updateComplaintStatus);

export default router;
