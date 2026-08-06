// ─── routes/category.routes.js ────────────────────────────
'use strict';

const router = require('express').Router();
const ctrl = require('../controllers/sport.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.use(authenticate);

router.get('/', ctrl.listCategories);
router.post('/', authorize(['admin']), ctrl.createCategory);
router.put('/:id', authorize(['admin']), ctrl.updateCategory);
router.delete('/:id', authorize(['admin']), ctrl.deleteCategory);

module.exports = router;
