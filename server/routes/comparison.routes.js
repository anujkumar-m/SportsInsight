const express = require('express');
const router = express.Router();
const c = require('../controllers/comparison.controller');
const { authenticateJWT } = require('../middleware/auth.middleware');

router.use(authenticateJWT);
router.get('/',  c.compareAthletes);
router.post('/', c.compareAthletes);

module.exports = router;
