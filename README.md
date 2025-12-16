# PDF Parsing with MongoDB Integration

A Node.js application for parsing PDF files and storing the extracted data in MongoDB Atlas.

## Features

- **PDF Upload & Parsing**: Upload PDF files and extract text content, metadata, and form fields
- **MongoDB Integration**: Automatically save parsed data to MongoDB Atlas
- **RESTful API**: Complete API for managing PDF documents
- **Local File Backup**: Optional local file storage alongside database storage
- **Error Handling**: Comprehensive error handling and logging
- **Health Monitoring**: Health check endpoint for monitoring system status

## Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account (or local MongoDB instance)
- Git (optional)

## Installation

1. **Clone the repository** (or download the files):
   ```bash
   git clone <repository-url>
   cd pdf-parsing
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Setup**:
   - Copy `.env.example` to `.env` (or create `.env` file)
   - Update the MongoDB connection string with your credentials:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
   PORT=4000
   NODE_ENV=development
   ```

4. **Start the server**:
   ```bash
   npm start
   # or for development
   npm run dev
   ```

## API Endpoints

### Upload & Parse PDF
```http
POST /upload
Content-Type: multipart/form-data
Body: pdf file (max 10MB)
```

### Get All Documents
```http
GET /api/documents?limit=20&page=1&status=success
```

### Get Specific Document
```http
GET /api/documents/:id
```

### Search Documents by Filename
```http
GET /api/documents/search/:filename
```

### Get Recent Documents
```http
GET /api/documents/recent/:count
```

### Delete Document
```http
DELETE /api/documents/:id
```

### Health Check
```http
GET /health
```

### Legacy File-based Endpoint
```http
GET /api/pdf-data/:filename
```

## Data Structure

The MongoDB documents follow this schema:

```javascript
{
  status: 'success',
  file: {
    originalName: 'document.pdf',
    originalSize: 1234567,
    storedFilename: 'timestamp-random.txt',
    uploadDate: '2023-12-05T10:00:00.000Z'
  },
  metadata: {
    numpages: 3,
    info: { /* PDF metadata */ }
  },
  content: {
    rawText: 'Extracted text content...',
    pages: ['Page 1 text', 'Page 2 text', 'Page 3 text']
  },
  formFields: [
    {
      name: 'fieldName',
      type: 'PDFTextField',
      value: 'field value',
      checked: null
    }
  ],
  dataExtracted: {
    pages: 3,
    formFields: 5,
    textLength: 1500
  },
  processingTime: 450,
  createdAt: '2023-12-05T10:00:00.000Z',
  updatedAt: '2023-12-05T10:00:00.000Z'
}
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | Required |
| `PORT` | Server port | 4000 |
| `NODE_ENV` | Environment (development/production) | development |
| `DB_NAME` | Database name | pdfParsingDB |
| `DB_CONNECTION_TIMEOUT` | Connection timeout (ms) | 10000 |
| `DB_MAX_POOL_SIZE` | Max connection pool size | 10 |

## Error Handling

The application includes comprehensive error handling:

- **File Validation**: Ensures only PDF files are uploaded
- **Size Limits**: Maximum 10MB file size
- **Database Fallback**: Server starts even if MongoDB is unavailable
- **Graceful Shutdown**: Proper cleanup on server termination
- **Detailed Logging**: Timestamped logs with emojis for easy reading

## MongoDB Collections

### pdf_documents
Main collection storing all PDF parsing results with indexes on:
- `file.originalName`
- `file.uploadDate` 
- `status`
- `createdAt`

## Development

### Project Structure
```
pdf-parsing/
├── db/
│   └── connect.js          # MongoDB connection
├── models/
│   └── PdfDocument.js      # Mongoose schema
├── utils/
│   └── parsePdf.js         # PDF parsing utility
├── uploads/                # Local file storage (optional)
├── server.js              # Main server file
├── index.html             # Frontend interface
├── package.json           # Dependencies
├── .env                   # Environment variables (not in repo)
└── .gitignore             # Git ignore rules
```

### Adding New Features

1. **Extend the Schema**: Modify `models/PdfDocument.js` to add new fields
2. **Update Parser**: Enhance `utils/parsePdf.js` for additional extraction
3. **Add Endpoints**: Create new API routes in `server.js`
4. **Database Migration**: Add scripts for schema changes if needed

## Production Deployment

1. **Set Environment Variables**:
   ```env
   NODE_ENV=production
   MONGODB_URI=your-production-mongodb-uri
   PORT=80
   ```

2. **Security Considerations**:
   - Use environment variables for all secrets
   - Enable MongoDB authentication
   - Implement rate limiting
   - Add HTTPS/SSL certificates
   - Validate file types and content

3. **Monitoring**:
   - Use the `/health` endpoint for health checks
   - Monitor MongoDB connection status
   - Set up log aggregation

## Troubleshooting

### MongoDB Connection Issues
- Check your MongoDB URI and credentials
- Verify network access (IP whitelist in MongoDB Atlas)
- Ensure environment variables are loaded correctly

### File Upload Issues
- Check file size limits (max 10MB)
- Verify file is a valid PDF
- Ensure uploads directory exists and has write permissions

### Performance Optimization
- Add database indexes for frequent queries
- Implement pagination for large datasets
- Consider file compression for storage

## License

This project is licensed under the ISC License.