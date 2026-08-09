// ─── routes/athlete.routes.js ─────────────────────────────
'use strict';

const router = require('express').Router();
const ctrl = require('../controllers/athlete.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.use(authenticate);

// Special routes first (before /:id)
router.get('/archived', authorize(['admin', 'coach']), ctrl.listArchived);
router.get('/export', authorize(['admin', 'coach', 'selector']), ctrl.exportData);
router.post('/import', authorize(['admin']), ctrl.importData);
router.post('/archive', authorize(['admin', 'coach']), ctrl.archive);
router.post('/restore', authorize(['admin']), ctrl.restore);
router.post('/bulk-delete', authorize(['admin']), ctrl.bulkDelete);
router.post('/bulk-update', authorize(['admin', 'coach']), ctrl.bulkUpdate);
router.post('/generate-list', authorize(['admin', 'coach', 'selector']), ctrl.generateList);

// CRUD
router.get('/', authorize(['admin', 'coach', 'selector']), ctrl.list);
router.get('/:id', authorize(['admin', 'coach', 'selector', 'athlete']), ctrl.getOne);
router.post('/', authorize(['admin', 'coach']), ctrl.create);
router.put('/:id', authorize(['admin', 'coach', 'athlete']), ctrl.update);
router.delete('/:id', authorize(['admin']), ctrl.remove);

module.exports = router;
