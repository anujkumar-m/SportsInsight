// ─── routes/sport.routes.js ───────────────────────────────
'use strict';

const router = require('express').Router();
const ctrl = require('../controllers/sport.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.use(authenticate);

// Sports
router.get('/', ctrl.listSports);
router.get('/:id', ctrl.getSport);
router.post('/', authorize(['admin']), ctrl.createSport);
router.put('/:id', authorize(['admin']), ctrl.updateSport);
router.delete('/:id', authorize(['admin']), ctrl.deleteSport);

// Metrics
router.get('/:id/metrics', ctrl.getMetrics);
router.post('/:id/metrics', authorize(['admin']), ctrl.upsertMetrics);
router.delete('/:id/metrics/:metricId', authorize(['admin']), ctrl.deleteMetric);

module.exports = router;
