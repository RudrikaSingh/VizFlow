/**
 * PDF Processor
 * Team member's PDF processing implementation goes here
 */

const pdf = require('pdf-parse');
const fs = require('fs');

const pdfProcessor = {
  name: 'PDF Processor',
  
  /**
   * Process PDF file
   * @param {Object} file - Multer file object
   * @param {Object} metadata - File metadata
   * @returns {Object} Processing result
   */
  async process(file, metadata) {
    try {
      let pdfBuffer;
      
      // Get PDF buffer
      if (file.path) {
        pdfBuffer = fs.readFileSync(file.path);
      } else if (file.buffer) {
        pdfBuffer = file.buffer;
      } else {
        throw new Error('No file data provided');
      }
      
      // Parse PDF
      const pdfData = await pdf(pdfBuffer);
      
      // Extract structured data from PDF text
      const extractedData = extractDataFromPDF(pdfData);
      const records = [];
      const errors = [];
      
      // Process extracted data
      extractedData.forEach((item, index) => {
        const validation = validatePdfRecord(item, index);
        
        if (validation.isValid) {
          records.push({
            ...item,
            _id: generateRecordId(),
            _processedAt: new Date(),
            _index: index
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
      
      return {
        data: records,
        errors: errors,
        metadata: {
          pages: pdfData.numpages,
          textLength: pdfData.text.length,
          totalItems: records.length + errors.length,
          validItems: records.length,
          errorItems: errors.length,
          info: pdfData.info || {}
        }
      };
      
    } catch (error) {
      throw new Error(`PDF processing failed: ${error.message}`);
    }
  }
};

/**
 * Extract structured data from PDF text
 * Team member implements custom extraction logic based on PDF format
 */
function extractDataFromPDF(pdfData) {
  const text = pdfData.text;
  const data = [];
  
  // Example extraction patterns - customize based on your PDF structure
  
  // Method 1: Extract table-like data
  const tableData = extractTableData(text);
  if (tableData.length > 0) {
    data.push(...tableData);
  }
  
  // Method 2: Extract key-value pairs
  const keyValueData = extractKeyValuePairs(text);
  if (keyValueData.length > 0) {
    data.push(...keyValueData);
  }
  
  // Method 3: Extract structured forms
  const formData = extractFormData(text);
  if (formData.length > 0) {
    data.push(...formData);
  }
  
  // If no structured data found, create a single record with the full text
  if (data.length === 0) {
    data.push({
      content: text,
      type: 'full_text',
      pages: pdfData.numpages
    });
  }
  
  return data;
}

/**
 * Extract table-like data from PDF text
 */
function extractTableData(text) {
  const data = [];
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  // Look for lines that might be table headers or data
  // This is a basic implementation - customize based on your PDF format
  
  let headers = null;
  const tablePattern = /^[\w\s]+\s+[\w\s]+\s+[\w\s]+/; // Pattern for multi-column data
  
  lines.forEach((line, index) => {
    if (tablePattern.test(line)) {
      const columns = line.split(/\s{2,}/).filter(col => col.length > 0);
      
      if (!headers && columns.length > 1) {
        // First matching line might be headers
        headers = columns.map(h => h.toLowerCase().replace(/\s+/g, '_'));
      } else if (headers && columns.length === headers.length) {
        // Data row
        const record = {};
        headers.forEach((header, i) => {
          record[header] = columns[i] || '';
        });
        data.push(record);
      }
    }
  });
  
  return data;
}

/**
 * Extract key-value pairs from PDF text
 */
function extractKeyValuePairs(text) {
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
 * Extract form data from PDF text
 */
function extractFormData(text) {
  const data = [];
  
  // Look for form-like patterns
  // Example: "Name: John Doe    Age: 30    Email: john@example.com"
  const formPattern = /(\w+):\s*([^\s]+(?:\s+[^\s:]+)*)/g;
  const forms = [];
  
  let currentForm = {};
  let match;
  
  while ((match = formPattern.exec(text)) !== null) {
    const key = match[1].toLowerCase().replace(/\s+/g, '_');
    const value = match[2].trim();
    currentForm[key] = value;
  }
  
  if (Object.keys(currentForm).length > 0) {
    data.push(currentForm);
  }
  
  return data;
}

/**
 * Validate PDF record
 * Team member implements custom validation
 */
function validatePdfRecord(record, index) {
  const errors = [];
  
  // Example validation - customize as needed
  if (!record || Object.keys(record).length === 0) {
    errors.push('Empty record');
  }
  
  // Add more validation rules based on your PDF data structure
  
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

module.exports = pdfProcessor;