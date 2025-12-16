
const mongoose = require('mongoose');

// Schema that stores PDF data in completely flat JSON structure
const SimplePdfDocumentSchema = new mongoose.Schema({
    // Store individual fields directly (not nested)
    status: String,
    metadata: mongoose.Schema.Types.Mixed,
    content: mongoose.Schema.Types.Mixed,
    formFields: mongoose.Schema.Types.Mixed,

    // Parsed PDF text or JSON (NEW)
    // Store parsed PDF data as a JSON string to ensure consistent storage
    // Use JSON.stringify before saving and JSON.parse when reading
    parsedData: {
        type: String,
        default: null
    },

    // Form schema for user-edited form structure
    formSchema: mongoose.Schema.Types.Mixed,

    // Tracking fields
    originalFilename: String,
    originalFilePath: String,          // <-- NEW: required for your new logic
    fileSize: Number,
    uploadDate: Date,
    processingTime: Number
}, {
    timestamps: true,
    collection: 'pdf_documents_flat',
    strict: false,
    minimize: false,
    // Return clean JSON without internal MongoDB fields
    toJSON: { 
        transform: function(doc, ret) {
            ret._id = ret._id.toString();
            if (ret.uploadDate) ret.uploadDate = ret.uploadDate.toISOString();
            if (ret.createdAt) ret.createdAt = ret.createdAt.toISOString();
            if (ret.updatedAt) ret.updatedAt = ret.updatedAt.toISOString();
            delete ret.__v;
            return ret;
        }
    }
});

// Create indexes for quick searches
SimplePdfDocumentSchema.index({ originalFilename: 1 });
SimplePdfDocumentSchema.index({ uploadDate: -1 });
SimplePdfDocumentSchema.index({ status: 1 });

const SimplePdfDocument = mongoose.model('SimplePdfDocument', SimplePdfDocumentSchema);

module.exports = SimplePdfDocument;

