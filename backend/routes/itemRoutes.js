import express from 'express';
const router = express.Router();
import {
  getItems,
  getItemById,
  getItemByQrCode,
  createItem,
  updateItem,
  deleteItem,
} from '../controllers/itemController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

router.route('/').get(protect, getItems).post(protect, admin, createItem);
router.route('/qr/:qrCodeId').get(protect, getItemByQrCode);
router
  .route('/:id')
  .get(protect, getItemById)
  .put(protect, admin, updateItem)
  .delete(protect, admin, deleteItem);

export default router;
