const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/documents.controller');

router.get('/documents/:id/full', ctrl.getFull);
router.get('/pdf-data/:filename', ctrl.getPdfDataFile);
router.get('/documents/:id/json', ctrl.getJson);
router.get('/documents/:id', ctrl.getDocument);
router.get('/documents/:id/parsed-text', ctrl.getParsedText);
router.get('/documents/:id/combined', ctrl.getCombined);
router.get('/documents', ctrl.listDocuments);
router.get('/documents/search/:filename', ctrl.searchDocuments);
router.get('/documents/recent/:count', ctrl.recentDocumentsCount);
router.get('/documents/recent', ctrl.recentDocuments);
router.delete('/documents/:id', ctrl.deleteDocument);

module.exports = router;
