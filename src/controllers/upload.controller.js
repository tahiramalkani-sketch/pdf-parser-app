const fs = require('fs');
const path = require('path');
const SimplePdfDocument = require('../../models/SimplePdfDocument');

exports.uploadPdf = async (req, res) => {
  const startTime = Date.now();
  try {
    if (!req.file) {
      console.log('No file uploaded.');
      return res.status(400).json({ status: 'error', error: 'No PDF file uploaded' });
    }

    const { v4: uuidv4 } = require('uuid');
    const fileBuffer = req.file.buffer;
    const originalName = req.file.originalname;
    console.log(`Original Filename: ${originalName}`);

    const pdfHeader = fileBuffer.slice(0, 4).toString();
    if (!pdfHeader.startsWith('%PDF')) {
      console.log('Invalid PDF header — upload rejected.');
      return res.status(400).json({ status: 'error', error: 'Invalid PDF file' });
    }

    const fileExt = path.extname(originalName);
    const fileBase = path.basename(originalName, fileExt);
    const uuid = uuidv4();
    const newFileName = `${fileBase}-${uuid}${fileExt}`;
    const projectRoot = path.join(__dirname, '..', '..');
    const uploadsDir = path.join(projectRoot, 'uploads');
    const newFilePath = path.join(uploadsDir, newFileName);

    fs.writeFileSync(newFilePath, fileBuffer);
    console.log(`File saved locally at: uploads/${newFileName}`);

    const parsePdf = require('../../utils/parsePdf');
    const parsedData = await parsePdf(fileBuffer);

    const mongoData = {
      originalFilename: originalName,
      storedFilename: newFileName,
      storedFilePath: newFilePath,
      fileSize: req.file.size,
      uploadDate: new Date(),
      status: parsedData.status || 'success',
      metadata: parsedData.metadata || {},
      content: parsedData.content || {},
      formFields: parsedData.formFields || [],
      parsedData: JSON.stringify(parsedData || {}),
      processingTime: Date.now() - startTime
    };

    const savedDocument = await new SimplePdfDocument(mongoData).save();
    console.log(` MongoDB Save Successful — Document ID: ${savedDocument._id}`);

    console.log(`⏱ Processing Time: ${mongoData.processingTime} ms\n`);

    return res.json({ status: 'success', documentId: savedDocument._id.toString(), originalName: originalName, storedName: newFileName, size: req.file.size, uploadDate: mongoData.uploadDate });
  } catch (err) {
    console.error('\nERROR DURING PDF UPLOAD/PARSE:');
    console.error(err);
    return res.status(500).json({ status: 'error', error: err.message });
  }
};
