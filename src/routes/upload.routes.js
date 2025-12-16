const express = require('express');
const router = express.Router();
const controller = require('../controllers/upload.controller');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage(), fileFilter: (req, file, cb) => { if (file.mimetype === 'application/pdf') cb(null, true); else cb(new Error('Only PDF files are allowed!'), false); }, limits: { fileSize: 10 * 1024 * 1024 } });

router.post('/upload', upload.single('pdf'), controller.uploadPdf);

module.exports = router;
