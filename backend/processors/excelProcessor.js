/**
 * Excel Processor
 * Team member's Excel processing implementation goes here
 */

const XLSX = require('xlsx');

const excelProcessor = {
  name: 'Excel Processor',
  
  /**
   * Process Excel file (.xlsx, .xls)
   * @param {Object} file - Multer file object
   * @param {Object} metadata - File metadata
   * @returns {Object} Processing result
   */
  async process(file, metadata) {
    try {
      let workbook;
      
      // Read workbook from file
      if (file.path) {
        workbook = XLSX.readFile(file.path);
      } else if (file.buffer) {
        workbook = XLSX.read(file.buffer, { type: 'buffer' });
      } else {
        throw new Error('No file data provided');
      }
      
      const sheetNames = workbook.SheetNames;
      const allData = [];
      const allErrors = [];
      
      // Process each worksheet
      for (const sheetName of sheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: null
        });
        
        if (jsonData.length === 0) continue;
        
        // First row as headers
        const headers = jsonData[0];
        const rows = jsonData.slice(1);
        
        // Process each row
        rows.forEach((row, index) => {
          const record = {};
          headers.forEach((header, colIndex) => {
            record[header] = row[colIndex] || null;
          });
          
          // Team member's validation logic
          const validation = validateExcelRecord(record, sheetName, index + 2);
          
          if (validation.isValid) {
            allData.push({
              ...record,
              _sheet: sheetName,
              _row: index + 2,
              _id: generateRecordId(),
              _processedAt: new Date()
            });
          } else {
            allErrors.push({
              sheet: sheetName,
              row: index + 2,
              data: record,
              errors: validation.errors,
              type: 'validation_error'
            });
          }
        });
      }
      
      return {
        data: allData,
        errors: allErrors,
        metadata: {
          sheets: sheetNames,
          totalSheets: sheetNames.length,
          totalRows: allData.length + allErrors.length,
          validRows: allData.length,
          errorRows: allErrors.length
        }
      };
      
    } catch (error) {
      throw new Error(`Excel processing failed: ${error.message}`);
    }
  }
};

/**
 * Validate Excel record
 * Team member implements custom validation
 */
function validateExcelRecord(record, sheetName, rowNumber) {
  const errors = [];
  
  // Example validation - customize as needed
  
  // Check for completely empty rows
  const hasData = Object.values(record).some(value => 
    value !== null && value !== undefined && value !== ''
  );
  
  if (!hasData) {
    errors.push('Empty row');
    return { isValid: false, errors };
  }
  
  // Add specific validation rules here
  // Example:
  // if (!record.ID) errors.push('ID is required');
  // if (record.Amount && isNaN(parseFloat(record.Amount))) errors.push('Invalid amount');
  
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

module.exports = excelProcessor;