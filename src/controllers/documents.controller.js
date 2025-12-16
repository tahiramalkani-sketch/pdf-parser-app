const fs = require('fs');
const path = require('path');
const SimplePdfDocument = require('../../models/SimplePdfDocument');
const UserFilledData = require('../../models/UserFilledData');

exports.getFull = async (req, res) => {
  try {
    const documentId = req.params.id;
    const document = await SimplePdfDocument.findById(documentId);
    if (!document) return res.status(404).json({ status: 'error', error: 'Document not found' });

    const filePath = document.storedFilePath;
    if (!filePath || !fs.existsSync(filePath)) return res.status(404).json({ status: 'error', error: 'PDF file not found on server' });

    const fileUrl = `/uploads/${document.storedFilename}`;
    res.json({ status: 'success', data: { _id: document._id.toString(), originalFilename: document.originalFilename, fileSize: document.fileSize, uploadDate: document.uploadDate, processingTime: document.processingTime, status: document.status, metadata: document.metadata, content: document.content, formFields: document.formFields, pdfFileUrl: fileUrl } });
  } catch (err) {
    console.error('Error fetching full document:', err);
    res.status(500).json({ status: 'error', error: err.message });
  }
};

exports.getPdfDataFile = async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '..', '..', 'uploads', filename);
    if (!fs.existsSync(filePath)) return res.status(404).json({ status: 'error', error: 'Parsed data file not found' });
    const jsonData = fs.readFileSync(filePath, 'utf8');
    const parsedData = JSON.parse(jsonData);
    res.json(parsedData);
  } catch (err) {
    res.status(500).json({ status: 'error', error: 'Failed to read parsed data', details: err.message });
  }
};

exports.getJson = async (req, res) => {
  try {
    const documentId = req.params.id;
    const document = await SimplePdfDocument.findById(documentId);
    if (!document) return res.status(404).json({ status: 'error', error: 'Document not found in database' });

    const flattenedData = {
      _id: document._id.toString(),
      status: document.pdfData?.status || document.status,
      metadata: document.pdfData?.metadata || {},
      content: document.pdfData?.content || {},
      formFields: document.pdfData?.formFields || [],
      originalFilename: document.originalFilename,
      fileSize: document.fileSize,
      uploadDate: document.uploadDate ? document.uploadDate.toISOString() : null,
      processingTime: document.processingTime,
      createdAt: document.createdAt ? document.createdAt.toISOString() : null,
      updatedAt: document.updatedAt ? document.updatedAt.toISOString() : null
    };
    res.json(flattenedData);
  } catch (err) {
    console.error('Error fetching document JSON:', err);
    res.status(500).json({ status: 'error', error: 'Failed to fetch document JSON', details: err.message });
  }
};

exports.getDocument = async (req, res) => {
  try {
    const documentId = req.params.id;
    const document = await SimplePdfDocument.findById(documentId);
    if (!document) return res.status(404).json({ status: 'error', error: 'Document not found in database' });

    const cleanData = {
      _id: document._id.toString(),
      status: document.status,
      metadata: document.metadata,
      content: document.content,
      formFields: document.formFields,
      originalFilename: document.originalFilename,
      fileSize: document.fileSize,
      uploadDate: document.uploadDate ? document.uploadDate.toISOString() : null,
      processingTime: document.processingTime,
      createdAt: document.createdAt ? document.createdAt.toISOString() : null,
      updatedAt: document.updatedAt ? document.updatedAt.toISOString() : null
    };

    res.json({ status: 'success', data: cleanData });
  } catch (err) {
    console.error('Error fetching document:', err);
    res.status(500).json({ status: 'error', error: 'Failed to fetch document from database', details: err.message });
  }
};

exports.getParsedText = async (req, res) => {
  try {
    const documentId = req.params.id;
    console.log(`Incoming request: GET /api/documents/${documentId}/parsed-text`);
    const document = await SimplePdfDocument.findById(documentId);
    if (!document) return res.status(404).json({ status: 'error', error: 'Document not found' });

    let parsedData = document.parsedData;
    if (!parsedData) {
      const assembled = { metadata: document.metadata || {}, content: document.content || {}, formFields: document.formFields || [] };
      document.parsedData = JSON.stringify(assembled);
      await document.save();
      parsedData = document.parsedData;
    }

    if (typeof parsedData !== 'string') {
      document.parsedData = JSON.stringify(parsedData);
      await document.save();
      parsedData = document.parsedData;
    }

    let parsedObj;
    try { parsedObj = JSON.parse(parsedData); } catch (err) { const wrapped = { rawText: String(parsedData) }; document.parsedData = JSON.stringify(wrapped); await document.save(); parsedObj = wrapped; }

    return res.json({ status: 'success', documentId, parsedData: parsedObj });
  } catch (err) {
    console.error('Error in parsed-text endpoint:', err);
    return res.status(500).json({ status: 'error', error: err.message });
  }
};

exports.getCombined = async (req, res) => {
  try {
    const documentId = req.params.id;
    const document = await SimplePdfDocument.findById(documentId);
    if (!document) return res.status(404).json({ status: 'error', error: 'Document not found' });

    let parsedData = document.parsedData;
    if (!parsedData) {
      const assembled = { metadata: document.metadata || {}, content: document.content || {}, formFields: document.formFields || [] };
      document.parsedData = JSON.stringify(assembled);
      await document.save();
      parsedData = document.parsedData;
    }
    if (typeof parsedData !== 'string') { document.parsedData = JSON.stringify(parsedData); await document.save(); parsedData = document.parsedData; }
    let parsedObj; try { parsedObj = JSON.parse(parsedData); } catch (err) { const wrapped = { rawText: String(parsedData) }; document.parsedData = JSON.stringify(wrapped); await document.save(); parsedObj = wrapped; }

    const filledDocs = await UserFilledData.find({ documentId: document._id }).sort({ createdAt: -1 });
    const userFilled = filledDocs.map(fd => { let value = fd.filledData; let parsedValue; try { parsedValue = JSON.parse(value); } catch (e) { parsedValue = { raw: String(value) }; } return { id: fd._id.toString(), createdAt: fd.createdAt, filledData: parsedValue }; });

    return res.json({ status: 'success', documentId: document._id.toString(), parsedData: parsedObj, userFilled });
  } catch (err) {
    console.error('Error fetching combined document data:', err);
    return res.status(500).json({ status: 'error', error: err.message });
  }
};

exports.listDocuments = async (req, res) => {
  try {
    const { limit = 20, page = 1, status } = req.query;
    const skip = (page - 1) * limit;
    const filter = {}; if (status) filter.status = status;
    const documents = await SimplePdfDocument.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit));
    const cleanDocuments = documents.map(doc => ({ _id: doc._id.toString(), status: doc.status, metadata: doc.metadata, content: doc.content, formFields: doc.formFields, originalFilename: doc.originalFilename, fileSize: doc.fileSize, uploadDate: doc.uploadDate ? doc.uploadDate.toISOString() : null, processingTime: doc.processingTime, createdAt: doc.createdAt ? doc.createdAt.toISOString() : null, updatedAt: doc.updatedAt ? doc.updatedAt.toISOString() : null }));
    const total = await SimplePdfDocument.countDocuments(filter);
    res.json({ status: 'success', data: { documents: cleanDocuments, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) } } });
  } catch (err) {
    console.error('Error fetching documents list:', err);
    res.status(500).json({ status: 'error', error: 'Failed to fetch documents list', details: err.message });
  }
};

exports.searchDocuments = async (req, res) => {
  try {
    const filename = req.params.filename;
    const documents = await SimplePdfDocument.find({ originalFilename: { $regex: filename, $options: 'i' } });
    const cleanDocuments = documents.map(doc => ({ _id: doc._id.toString(), pdfData: doc.pdfData, originalFilename: doc.originalFilename, fileSize: doc.fileSize, uploadDate: doc.uploadDate ? doc.uploadDate.toISOString() : null, processingTime: doc.processingTime, status: doc.status, createdAt: doc.createdAt ? doc.createdAt.toISOString() : null, updatedAt: doc.updatedAt ? doc.updatedAt.toISOString() : null }));
    res.json({ status: 'success', data: cleanDocuments, count: cleanDocuments.length });
  } catch (err) {
    console.error('Error searching documents:', err);
    res.status(500).json({ status: 'error', error: 'Failed to search documents', details: err.message });
  }
};

exports.recentDocumentsCount = async (req, res) => {
  try {
    const count = parseInt(req.params.count) || 10;
    const documents = await SimplePdfDocument.find().sort({ createdAt: -1 }).limit(count);
    const cleanDocuments = documents.map(doc => ({ _id: doc._id.toString(), pdfData: doc.pdfData, originalFilename: doc.originalFilename, fileSize: doc.fileSize, uploadDate: doc.uploadDate ? doc.uploadDate.toISOString() : null, processingTime: doc.processingTime, status: doc.status, createdAt: doc.createdAt ? doc.createdAt.toISOString() : null, updatedAt: doc.updatedAt ? doc.updatedAt.toISOString() : null }));
    res.json({ status: 'success', data: cleanDocuments });
  } catch (err) {
    console.error('Error fetching recent documents:', err);
    res.status(500).json({ status: 'error', error: 'Failed to fetch recent documents', details: err.message });
  }
};

exports.recentDocuments = async (req, res) => {
  try {
    const count = 10;
    const documents = await SimplePdfDocument.find().sort({ createdAt: -1 }).limit(count);
    const cleanDocuments = documents.map(doc => ({ _id: doc._id.toString(), pdfData: doc.pdfData, originalFilename: doc.originalFilename, fileSize: doc.fileSize, uploadDate: doc.uploadDate ? doc.uploadDate.toISOString() : null, processingTime: doc.processingTime, status: doc.status, createdAt: doc.createdAt ? doc.createdAt.toISOString() : null, updatedAt: doc.updatedAt ? doc.updatedAt.toISOString() : null }));
    res.json({ status: 'success', data: cleanDocuments });
  } catch (err) {
    console.error('Error fetching recent documents:', err);
    res.status(500).json({ status: 'error', error: 'Failed to fetch recent documents', details: err.message });
  }
};

exports.deleteDocument = async (req, res) => {
  try {
    const documentId = req.params.id;
    const document = await SimplePdfDocument.findById(documentId);
    if (!document) return res.status(404).json({ status: 'error', error: 'Document not found' });
    await SimplePdfDocument.findByIdAndDelete(documentId);
    res.json({ status: 'success', message: 'Document deleted successfully' });
  } catch (err) {
    console.error('Error deleting document:', err);
    res.status(500).json({ status: 'error', error: 'Failed to delete document', details: err.message });
  }
};
