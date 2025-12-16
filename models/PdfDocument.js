const mongoose = require('mongoose');

// Schema for form fields found in PDFs
const FormFieldSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    value: {
        type: mongoose.Schema.Types.Mixed, // Can be string, number, boolean, etc.
        default: null
    },
    checked: {
        type: Boolean,
        default: null
    }
}, { _id: false });

// Schema for PDF metadata
const MetadataSchema = new mongoose.Schema({
    numpages: {
        type: Number,
        required: true
    },
    info: {
        type: mongoose.Schema.Types.Mixed, // Contains PDF info object
        default: {}
    }
}, { _id: false });

// Schema for PDF content
const ContentSchema = new mongoose.Schema({
    rawText: {
        type: String,
        required: true
    },
    pages: [{
        type: String
    }]
}, { _id: false });

// Schema for file information
const FileInfoSchema = new mongoose.Schema({
    originalName: {
        type: String,
        required: true
    },
    originalSize: {
        type: Number,
        required: true
    },
    storedFilename: {
        type: String,
        required: true,
        unique: true
    },
    uploadDate: {
        type: Date,
        default: Date.now
    }
}, { _id: false });

// Main PDF Document schema
const PdfDocumentSchema = new mongoose.Schema({
    // Processing status
    status: {
        type: String,
        enum: ['success', 'error', 'processing'],
        default: 'processing'
    },
    
    // File information
    file: {
        type: FileInfoSchema,
        required: true
    },
    
    // PDF parsing results
    metadata: {
        type: MetadataSchema,
        required: true
    },
    
    content: {
        type: ContentSchema,
        required: true
    },
    
    formFields: [FormFieldSchema],
    
    // Data extraction summary
    dataExtracted: {
        pages: {
            type: Number,
            required: true
        },
        formFields: {
            type: Number,
            required: true
        },
        textLength: {
            type: Number,
            required: true
        }
    },
    
    // Processing information
    processingTime: {
        type: Number, // in milliseconds
        default: null
    },
    
    errorDetails: {
        type: String,
        default: null
    }
}, {
    timestamps: true, // Adds createdAt and updatedAt automatically
    collection: 'pdf_documents'
});

// Create indexes for better query performance
PdfDocumentSchema.index({ 'file.originalName': 1 });
PdfDocumentSchema.index({ 'file.uploadDate': -1 });
PdfDocumentSchema.index({ status: 1 });
PdfDocumentSchema.index({ createdAt: -1 });

// Instance method to get document summary
PdfDocumentSchema.methods.getSummary = function() {
    return {
        id: this._id,
        originalName: this.file.originalName,
        uploadDate: this.file.uploadDate,
        status: this.status,
        pages: this.dataExtracted.pages,
        formFields: this.dataExtracted.formFields,
        textLength: this.dataExtracted.textLength,
        processingTime: this.processingTime
    };
};

// Static method to find recent documents
PdfDocumentSchema.statics.findRecent = function(limit = 10) {
    return this.find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .select('file.originalName file.uploadDate status dataExtracted');
};

// Static method to find by original filename
PdfDocumentSchema.statics.findByOriginalName = function(originalName) {
    return this.find({ 'file.originalName': originalName });
};

const PdfDocument = mongoose.model('PdfDocument', PdfDocumentSchema);

module.exports = PdfDocument;