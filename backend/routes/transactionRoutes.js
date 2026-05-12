const express = require('express');
const router = express.Router();
const { createTransaction, getTransactions, getTransactionById, updateTransaction, deleteTransaction } = require('../controllers/transactionController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);
router.post('/', createTransaction);
router.get('/', getTransactions);
router.get('/:id', getTransactionById);
router.put('/:id', updateTransaction);
router.delete('/:id', deleteTransaction);

module.exports = router;
