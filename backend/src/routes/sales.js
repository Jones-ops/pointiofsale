const { Router } = require('express');
const { list, get, create, voidSale, receipt, returnItems, eligibleReturnItems } = require('../controllers/saleController');
const { auth } = require('../middleware/auth');

const router = Router();
router.use(auth);
router.get('/', list);
router.get('/:id', get);
router.get('/:id/receipt', receipt);
router.get('/:id/eligible-returns', eligibleReturnItems);
router.post('/', create);
router.post('/:id/void', voidSale);
router.post('/:id/return', returnItems);

module.exports = router;
