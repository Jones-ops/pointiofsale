const { Router } = require('express');
const { list, get, create, update, remove } = require('../controllers/customerController');
const { auth } = require('../middleware/auth');

const router = Router();
router.use(auth);
router.get('/', list);
router.get('/:id', get);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);

module.exports = router;
