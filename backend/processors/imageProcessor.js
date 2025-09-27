/**
 * Image Processor
 * Team member's image processing implementation goes here
 */

const sharp = require('sharp');
const tesseract = require('tesseract.js');
const fs = require('fs');

const imageProcessor = {
  name: 'Image Processor',
  
  /**
   * Process image file (OCR + metadata extraction)
   * @param {Object} file - Multer file object
   * @param {Object} metadata - File metadata
   * @returns {Object} Processing result
   */
  async process(file, metadata) {
    try {
      let imageBuffer;
      
      // Get image buffer
      if (file.path) {
        imageBuffer = fs.readFileSync(file.path);
      } else if (file.buffer) {
        imageBuffer = file.buffer;
      } else {
        throw new Error('No file data provided');
      }
      
      // Extract image metadata
      const imageMetadata = await sharp(imageBuffer).metadata();
      
      // Perform OCR to extract text
      const ocrResult = await performOCR(imageBuffer);
      
      // Extract structured data from OCR text
      const extractedData = extractDataFromOCR(ocrResult.data.text);
      const records = [];
      const errors = [];
      
      // Process extracted data
      extractedData.forEach((item, index) => {
        const validation = validateImageRecord(item, index);
        
        if (validation.isValid) {
          records.push({
            ...item,
            _id: generateRecordId(),
            _processedAt: new Date(),
            _index: index,
            _imageMetadata: {
              width: imageMetadata.width,
              height: imageMetadata.height,
              format: imageMetadata.format,
              channels: imageMetadata.channels
            }
          });
        } else {
          errors.push({
            index: index,
            data: item,
            errors: validation.errors,
            type: 'validation_error'
          });
        }
      });
      
      // If no structured data found, include OCR text as a single record
      if (records.length === 0 && ocrResult.data.text.trim().length > 0) {
        records.push({
          _id: generateRecordId(),
          _processedAt: new Date(),
          type: 'ocr_text',
          content: ocrResult.data.text,
          confidence: ocrResult.data.confidence,
          _imageMetadata: {
            width: imageMetadata.width,
            height: imageMetadata.height,
            format: imageMetadata.format,
            channels: imageMetadata.channels
          }
        });
      }
      
      return {
        data: records,
        errors: errors,
        metadata: {
          image: {
            width: imageMetadata.width,
            height: imageMetadata.height,
            format: imageMetadata.format,
            channels: imageMetadata.channels,
            density: imageMetadata.density
          },
          ocr: {
            confidence: ocrResult.data.confidence,
            textLength: ocrResult.data.text.length,
            words: ocrResult.data.words ? ocrResult.data.words.length : 0
          },
          totalItems: records.length + errors.length,
          validItems: records.length,
          errorItems: errors.length
        }
      };
      
    } catch (error) {
      throw new Error(`Image processing failed: ${error.message}`);
    }
  }
};

/**
 * Perform OCR on image
 */
async function performOCR(imageBuffer) {
  try {
    // Preprocess image for better OCR results
    const processedBuffer = await sharp(imageBuffer)
      .greyscale()
      .normalize()
      .sharpen()
      .toBuffer();
    
    // Perform OCR
    const result = await tesseract.recognize(processedBuffer, 'eng', {
      logger: m => {} // Silent logging
    });
    
    return result;
  } catch (error) {
    throw new Error(`OCR failed: ${error.message}`);
  }
}

/**
 * Extract structured data from OCR text
 * Team member implements custom extraction logic
 */
function extractDataFromOCR(text) {
  const data = [];
  
  // Method 1: Extract table-like data
  const tableData = extractTableFromOCR(text);
  if (tableData.length > 0) {
    data.push(...tableData);
  }
  
  // Method 2: Extract forms/receipts
  const formData = extractFormFromOCR(text);
  if (formData.length > 0) {
    data.push(...formData);
  }
  
  // Method 3: Extract key-value pairs
  const keyValueData = extractKeyValueFromOCR(text);
  if (keyValueData.length > 0) {
    data.push(...keyValueData);
  }
  
  return data;
}

/**
 * Extract table data from OCR text
 */
function extractTableFromOCR(text) {
  const data = [];
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  // Look for tabular patterns in OCR text
  // This is basic - customize based on your image types
  
  return data;
}

/**
 * Extract form data from OCR text
 */
function extractFormFromOCR(text) {
  const data = [];
  
  // Common form patterns in receipts, invoices, etc.
  const patterns = [
    /(?:total|amount|price):\s*\$?([0-9,.]+)/gi,
    /(?:date|time):\s*([0-9\/\-\s:]+)/gi,
    /(?:name|customer):\s*([^\n\r]+)/gi,
    /(?:email|e-mail):\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi,
    /(?:phone|tel|telephone):\s*([0-9\-\+\(\)\s]+)/gi
  ];
  
  const extracted = {};
  
  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const key = match[0].split(':')[0].toLowerCase().trim();
      const value = match[1].trim();
      extracted[key] = value;
    }
  });
  
  if (Object.keys(extracted).length > 0) {
    data.push(extracted);
  }
  
  return data;
}

/**
 * Extract key-value pairs from OCR text
 */
function extractKeyValueFromOCR(text) {
  const data = [];
  const keyValuePattern = /^([^:]+):\s*(.+)$/gm;
  const matches = {};
  
  let match;
  while ((match = keyValuePattern.exec(text)) !== null) {
    const key = match[1].trim().toLowerCase().replace(/\s+/g, '_');
    const value = match[2].trim();
    matches[key] = value;
  }
  
  if (Object.keys(matches).length > 0) {
    data.push(matches);
  }
  
  return data;
}

/**
 * Validate image record
 * Team member implements custom validation
 */
function validateImageRecord(record, index) {
  const errors = [];
  
  // Example validation - customize as needed
  if (!record || Object.keys(record).length === 0) {
    errors.push('No data extracted');
  }
  
  // Add more validation rules based on your image processing needs
  
  return {
    isValid: errors.length === 0,
    errors: errors
  };
}

/**
 * Generate unique record ID
 */
function generateRecordId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

module.exports = imageProcessor;