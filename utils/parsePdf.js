const fs = require('fs');
const pdfParse = require('pdf-parse');
const { PDFDocument } = require('pdf-lib');

async function parsePdf(input) {
    try {
        let buffer;
        
        if (typeof input === 'string') {
            buffer = fs.readFileSync(input);
        } else if (Buffer.isBuffer(input)) {
            buffer = input;
        } else {
            throw new Error('Invalid input: expected file path string or Buffer');
        }

        const textData = await pdfParse(buffer);

    const pages = textData.text.split(/\n\s*\n/);

    const pdfDoc = await PDFDocument.load(buffer);
    const form = pdfDoc.getForm();
    const fields = form.getFields();


const formFields = fields.map(field => {
    const type = field.constructor.name;

    let value = null;
    let checked = null;

    if (field.getText) value = field.getText();
    if (field.isChecked) checked = field.isChecked();

    return {
        name: field.getName(),
        type,
        value,
        checked
    };
});

        return {
            status: "success",
            metadata: {
                numpages: textData.numpages,
                info: textData.info
            },
            content: {
                rawText: textData.text,
                pages
            },
            formFields
        };
    } catch (error) {
        console.error('Error in parsePdf:', error);
        throw error;
    }
}

module.exports = parsePdf;


