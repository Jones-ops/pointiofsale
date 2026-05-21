const { Router } = require('express');
const { getRules, updateRules, getTransactions, redeem } = require('../controllers/loyaltyController');
const { auth, adminOnly } = require('../middleware/auth');

const router = Router();
router.use(auth);
router.get('/rules', getRules);
router.put('/rules', adminOnly, updateRules);
router.get('/transactions', getTransactions);
router.post('/redeem', redeem);

module.exports = router;
