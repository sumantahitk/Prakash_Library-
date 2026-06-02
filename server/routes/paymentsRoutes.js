import express from 'express';
import { addPayment, getPayments, getDueStudents, getRevenue, getMonthlyReport, revertPayment } from '../controllers/paymentsController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .post(protect, adminOnly, addPayment)
  .get(protect, adminOnly, getPayments);

router.post('/:id/revert', protect, adminOnly, revertPayment);

router.get('/due',     protect, adminOnly, getDueStudents);
router.get('/revenue', protect, adminOnly, getRevenue);
router.get('/monthly-report', protect, adminOnly, getMonthlyReport);

export default router;
