const express = require('express');
const router = express.Router();
const { getBudgets, createBudget, updateBudget, deleteBudget } = require('../controllers/budgetController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);
router.get('/', getBudgets);
router.post('/', createBudget);
router.put('/:id', updateBudget);
router.delete('/:id', deleteBudget);

module.exports = router;
