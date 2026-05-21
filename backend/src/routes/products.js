const { Router } = require('express');
const { list, get, getByBarcode, create, update, remove, adjustStock } = require('../controllers/productController');
const { auth } = require('../middleware/auth');

const router = Router();
router.use(auth);
router.get('/', list);
router.get('/barcode/:barcode', getByBarcode);
router.get('/:id', get);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);
router.patch('/:id/stock', adjustStock);

module.exports = router;
