const { Router } = require('express');
const { get, update, status, uploadLogo, deleteLogo } = require('../controllers/settingsController');
const { auth } = require('../middleware/auth');

const router = Router();
router.get('/status', status);
router.use(auth);
router.get('/', get);
router.put('/', update);
router.post('/logo', uploadLogo);
router.delete('/logo', deleteLogo);

module.exports = router;
