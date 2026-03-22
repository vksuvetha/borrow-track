import express from 'express';
const router = express.Router();
import {
  borrowItem,
  returnItem,
  getBorrowRecords,
  getMyBorrowHistory,
  getOverdueItems,
  sendManualReminder,
  testCron
} from '../controllers/borrowController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

router.route('/test-cron').get(protect, admin, testCron);
router.route('/').get(protect, admin, getBorrowRecords);
router.route('/mybhistory').get(protect, getMyBorrowHistory);
router.route('/overdue').get(protect, admin, getOverdueItems);
router.route('/:qrCodeId').post(protect, borrowItem);
router.route('/return/:qrCodeId').put(protect, returnItem);
router.route('/reminder/:id').post(protect, admin, sendManualReminder);

export default router;
