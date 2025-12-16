const UserFilledData = require('../../models/UserFilledData');
const SimplePdfDocument = require('../../models/SimplePdfDocument');

exports.saveUserFilled = async (req, res) => {
  try {
    const { documentId, filledData } = req.body;

    if (!documentId || typeof filledData === 'undefined') {
      return res.status(400).json({ status: 'error', error: 'documentId and filledData are required' });
    }

    const doc = await SimplePdfDocument.findById(documentId);
    if (!doc) return res.status(404).json({ status: 'error', error: 'Document not found' });

    const saved = await UserFilledData.create({
      documentId: doc._id,
      filledData: JSON.stringify(filledData)
    });

    return res.json({ status: 'success', id: saved._id.toString() });
  } catch (err) {
    console.error('Error saving user filled data:', err);
    return res.status(500).json({ status: 'error', error: err.message });
  }
};
