const { Router } = require('express');
const { auth } = require('../middleware/auth');
const controller = require('../controllers/reportController');

const router = Router();
router.use(auth);
router.get('/sales-summary', controller.salesSummary);
router.get('/daily-sales', controller.dailySales);
router.get('/monthly-sales', controller.monthlySales);
router.get('/profit-loss', controller.profitLoss);
router.get('/inventory-valuation', controller.inventoryValuation);
router.get('/tax-report', controller.taxReport);
router.get('/sales-by-category', controller.salesByCategory);
router.get('/payment-methods', controller.paymentMethods);
router.get('/profit-margins', controller.profitMargins);

module.exports = router;
