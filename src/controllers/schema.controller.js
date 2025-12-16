const SimplePdfDocument = require('../../models/SimplePdfDocument');

exports.saveFormSchema = async (req, res) => {
  try {
    const documentId = req.params.id;
    const { formSchema } = req.body;

    if (!formSchema) {
      return res.status(400).json({ status: 'error', error: 'Form schema is required' });
    }

    const document = await SimplePdfDocument.findById(documentId);
    if (!document) {
      return res.status(404).json({ status: 'error', error: 'Document not found' });
    }

    const updatedDocument = await SimplePdfDocument.findByIdAndUpdate(
      documentId,
      { formSchema: formSchema },
      { new: true }
    );

    console.log(`Form schema saved for PDF document ID: ${documentId}`);

    res.json({ status: 'success', message: 'Form schema saved successfully', documentId: documentId, formSchema: updatedDocument.formSchema });
  } catch (err) {
    console.error('Error saving form schema:', err);
    res.status(500).json({ status: 'error', error: 'Failed to save form schema', details: err.message });
  }
};

exports.getFormSchema = async (req, res) => {
  try {
    const documentId = req.params.id;

    const document = await SimplePdfDocument.findById(documentId).select('formSchema originalFilename');
    if (!document) {
      return res.status(404).json({ status: 'error', error: 'Document not found' });
    }

    res.json({ status: 'success', documentId: documentId, originalFilename: document.originalFilename, formSchema: document.formSchema || null });
  } catch (err) {
    console.error('Error retrieving form schema:', err);
    res.status(500).json({ status: 'error', error: 'Failed to retrieve form schema', details: err.message });
  }
};
