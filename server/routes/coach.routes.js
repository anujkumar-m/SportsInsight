// ─── routes/coach.routes.js ───────────────────────────────
'use strict';

const router = require('express').Router();
const ctrl = require('../controllers/coach.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.use(authenticate);

router.post('/assign-athlete', authorize(['admin', 'coach']), ctrl.assignAthlete);
router.delete('/remove-athlete', authorize(['admin', 'coach']), ctrl.removeAthlete);
router.post('/generate-list', authorize(['admin', 'coach']), ctrl.generateList);

router.get('/', authorize(['admin', 'selector']), ctrl.list);
router.get('/:id', authorize(['admin', 'coach', 'selector']), ctrl.getOne);
router.get('/:id/athletes', authorize(['admin', 'coach', 'selector']), ctrl.getAthletes);
router.get('/:id/analytics', authorize(['admin', 'coach']), ctrl.getAnalytics);
router.post('/', authorize(['admin']), ctrl.create);
router.put('/:id', authorize(['admin', 'coach']), ctrl.update);
router.delete('/:id', authorize(['admin']), ctrl.remove);

module.exports = router;
