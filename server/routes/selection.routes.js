const express = require('express');
const router = express.Router();
const c = require('../controllers/selection.controller');
const { authenticateJWT, authorizeRoles } = require('../middleware/auth.middleware');

router.use(authenticateJWT);

router.get('/',                   c.getSelections);
router.get('/recommendations',    c.getRecommendations);
router.get('/history',            c.getSelectionHistory);
router.post('/generate', authorizeRoles('admin','selector'), c.generateAndSave);

module.exports = router;
