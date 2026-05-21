const { Router } = require('express');
const { list, get, active, open, close, addCashMove, getCashMoves } = require('../controllers/sessionController');
const { auth } = require('../middleware/auth');

const router = Router();
router.use(auth);
router.get('/', list);
router.get('/active', active);
router.get('/:id', get);
router.post('/', open);
router.post('/:id/close', close);
router.post('/:id/cash-move', addCashMove);
router.get('/:id/cash-moves', getCashMoves);

module.exports = router;
