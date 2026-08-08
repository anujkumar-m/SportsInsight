const express = require('express');
const router = express.Router();
const injuryController = require('../controllers/injury.controller');
const { authenticateJWT, authorizeRoles } = require('../middleware/auth.middleware');

router.use(authenticateJWT);

router.get('/', injuryController.getInjuries);
router.get('/history/:athleteId', injuryController.getAthleteInjuryHistory);

router.get('/:id', injuryController.getInjuryById);
router.post('/', authorizeRoles('admin', 'coach'), injuryController.createInjury);
router.put('/:id', authorizeRoles('admin', 'coach'), injuryController.updateInjury);
router.delete('/:id', authorizeRoles('admin', 'coach'), injuryController.deleteInjury);
router.post('/:id/recovery', authorizeRoles('admin', 'coach'), injuryController.addRecoveryLog);

module.exports = router;
