import { Router } from 'express';
import {
  getSummary, getCategoryTotals, getMonthlyTrends, getRecentActivity,
} from '../controllers/dashboardController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';

const router = Router();

router.use(authenticate);

// summary & recent activity — all authenticated users (including viewers)
router.get('/summary', getSummary);
router.get('/recent', getRecentActivity);

// deeper analytics — analyst + admin
router.get('/category-totals', authorize('analyst', 'admin'), getCategoryTotals);
router.get('/trends', authorize('analyst', 'admin'), getMonthlyTrends);

export default router;
