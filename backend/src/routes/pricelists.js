const { Router } = require('express');
const { list, get, create, update, remove, addItem, updateItem, removeItem, listItems, calculate } = require('../controllers/pricelistController');
const { auth, adminOnly } = require('../middleware/auth');

const router = Router();
router.use(auth);
router.get('/', list);
router.get('/calculate/:productId', calculate);
router.get('/:id', get);
router.get('/:id/items', listItems);
router.post('/', adminOnly, create);
router.post('/:id/items', adminOnly, addItem);
router.put('/:id', adminOnly, update);
router.put('/items/:id', adminOnly, updateItem);
router.delete('/:id', adminOnly, remove);
router.delete('/items/:id', adminOnly, removeItem);

module.exports = router;
