// =====================================================
// routes/evaluationRoutes.js
// =====================================================
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { getMonthlyEvaluation } = require('../controllers/evaluationController');

router.get('/monthly', authMiddleware, getMonthlyEvaluation);

module.exports = router;