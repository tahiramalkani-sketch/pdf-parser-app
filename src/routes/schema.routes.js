const express = require('express');
const router = express.Router();
const controller = require('../controllers/schema.controller');

router.post('/documents/:id/schema', controller.saveFormSchema);
router.get('/documents/:id/schema', controller.getFormSchema);

module.exports = router;
