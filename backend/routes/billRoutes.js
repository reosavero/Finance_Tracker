const express = require('express');
const router = express.Router();
const { getBills, createBill, updateBill, markBillPaid, deleteBill } = require('../controllers/billController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);
router.get('/', getBills);
router.post('/', createBill);
router.put('/:id', updateBill);
router.put('/:id/pay', markBillPaid);
router.delete('/:id', deleteBill);

module.exports = router;
