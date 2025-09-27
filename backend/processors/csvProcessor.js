/**
 * CSV Processor - Enhanced version
 * Team member can implement specific CSV processing logic here
 */

const csv = require('csv-parse');
const fs = require('fs');

const csvProcessor = {
  name: 'CSV Processor',
  
  /**
   * Process CSV file
   * @param {Object} file - Multer file object
   * @param {Object} metadata - File metadata
   * @returns {Object} Processing result
   */
  async process(file, metadata) {
    try {
      const path = require('path');
      
      // Path to your teammate's Python script
      const pythonScriptPath = path.join(__dirname, '..', 'python_scripts', 'csv_processor.py');
      
      // Execute Python script with file path as argument
      const result = await this.executePythonScript(pythonScriptPath, [file.path]);
      
      // Parse JSON outputs
      const processedData = result.processedData || [];
      const errorLogs = result.errorLogs || [];
      
      // Add metadata to processed records
      const records = processedData.map(item => ({
        ...item,
        _id: generateRecordId(),
        _processedAt: new Date(),
        _source: 'python_csv_processor',
        _originalFile: file.originalname
      }));
      
      // Add metadata to error logs
      const errors = errorLogs.map(error => ({
        ...error,
        _timestamp: new Date(),
        _source: 'python_csv_processor',
        _originalFile: file.originalname,
        type: error.type || 'processing_error'
      }));
      
      return {
        data: records,
        errors: errors,
        metadata: {
          processor: 'Python CSV Processor',
          totalItems: records.length + errors.length,
          validItems: records.length,
          errorItems: errors.length,
          originalFile: file.originalname,
          fileSize: file.size,
          pythonScript: pythonScriptPath
        }
      };
      
    } catch (error) {
      throw new Error(`CSV processing failed: ${error.message}`);
    }
  },

  /**
   * Execute Python script and get JSON output
   */
  async executePythonScript(scriptPath, args = []) {
    return new Promise((resolve, reject) => {
      const { spawn } = require('child_process');
      
      const pythonProcess = spawn('python', [scriptPath, ...args]);
      
      let stdout = '';
      let stderr = '';
      
      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Python script failed with code ${code}: ${stderr}`));
          return;
        }
        
        try {
          const result = JSON.parse(stdout);
          resolve(result);
        } catch (parseError) {
          reject(new Error(`Failed to parse Python output as JSON: ${parseError.message}`));
        }
      });
      
      pythonProcess.on('error', (error) => {
        reject(new Error(`Failed to start Python process: ${error.message}`));
      });
    });
  }
};

/**
 * Validate individual CSV record
 * Team member can implement custom validation rules here
 */
function validateCsvRecord(record) {
  const errors = [];
  
  // Example validation rules - customize as needed
  if (!record.name || record.name.toString().trim() === '') {
    errors.push('Name is required');
  }
  
  if (record.email && !isValidEmail(record.email)) {
    errors.push('Invalid email format');
  }
  
  if (record.age && (isNaN(record.age) || record.age < 0 || record.age > 150)) {
    errors.push('Invalid age value');
  }
  
  // Add more validation rules as needed
  
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

/**
 * Validate email format
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

module.exports = csvProcessor;