const { Router } = require('express');
const { exportProducts, exportCustomers, importProducts, importCustomers } = require('../controllers/importExportController');
const { auth, adminOnly } = require('../middleware/auth');

const router = Router();
router.use(auth, adminOnly);
router.get('/export/products', exportProducts);
router.get('/export/customers', exportCustomers);
router.post('/import/products', importProducts);
router.post('/import/customers', importCustomers);

module.exports = router;
