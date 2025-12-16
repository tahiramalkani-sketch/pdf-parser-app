const mongoose = require('mongoose');

// Schema to store user-submitted filled form values for a PDF document
const UserFilledDataSchema = new mongoose.Schema({
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SimplePdfDocument',
    required: true
  },
  // Store filled data as a JSON string to ensure consistent storage
  filledData: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  collection: 'user_filled_data'
});

const UserFilledData = mongoose.model('UserFilledData', UserFilledDataSchema);

module.exports = UserFilledData;

