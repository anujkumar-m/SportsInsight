const express = require('express');
const router = express.Router();
const fitnessController = require('../controllers/fitness.controller');
const { authenticateJWT, authorizeRoles } = require('../middleware/auth.middleware');

router.use(authenticateJWT);

router.get('/', fitnessController.getFitnessAssessments);
router.get('/analytics', fitnessController.getFitnessAnalytics);
router.get('/history/:athleteId', fitnessController.getAthleteFitnessHistory);

router.get('/:id', fitnessController.getFitnessById);
router.post('/', authorizeRoles('admin', 'coach'), fitnessController.createFitness);
router.put('/:id', authorizeRoles('admin', 'coach'), fitnessController.updateFitness);
router.delete('/:id', authorizeRoles('admin', 'coach'), fitnessController.deleteFitness);

module.exports = router;
