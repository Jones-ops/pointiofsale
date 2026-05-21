const { Router } = require('express');
const { list, get, create, update, remove, categories } = require('../controllers/expenseController');
const { auth } = require('../middleware/auth');

const router = Router();
router.use(auth);
router.get('/categories', categories);
router.get('/', list);
router.get('/:id', get);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);

module.exports = router;
