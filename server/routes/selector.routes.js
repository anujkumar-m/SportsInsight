// ─── routes/selector.routes.js ────────────────────────────
'use strict';

const router = require('express').Router();
const ctrl = require('../controllers/selector.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.use(authenticate);

router.post('/assign-sport', authorize(['admin']), ctrl.assignSport);
router.delete('/remove-sport', authorize(['admin']), ctrl.removeSport);
router.get('/recommendations', authorize(['admin', 'selector']), ctrl.getRecommendations);

router.get('/', authorize(['admin']), ctrl.list);
router.get('/:id', authorize(['admin', 'selector']), ctrl.getOne);
router.get('/:id/history', authorize(['admin', 'selector']), ctrl.getHistory);
router.get('/:id/recommendations', authorize(['admin', 'selector']), ctrl.getRecommendations);
router.post('/', authorize(['admin']), ctrl.create);
router.put('/:id', authorize(['admin']), ctrl.update);
router.delete('/:id', authorize(['admin']), ctrl.remove);

module.exports = router;
