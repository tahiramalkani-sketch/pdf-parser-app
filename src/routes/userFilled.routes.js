const express = require('express');
const router = express.Router();
const controller = require('../controllers/userFilled.controller');

router.post('/user-filled-data', controller.saveUserFilled);

module.exports = router;
