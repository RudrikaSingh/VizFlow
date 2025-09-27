/**
 * XML Processor
 * Team member's XML processing implementation goes here
 */

const xml2js = require('xml2js');
const fs = require('fs');

const xmlProcessor = {
  name: 'XML Processor',
  
  /**
   * Process XML file using Python script
   * @param {Object} file - Multer file object
   * @param {Object} metadata - File metadata
   * @returns {Object} Processing result
   */
  async process(file, metadata) {
    try {
      const { spawn } = require('child_process');
      const path = require('path');
      
      // Path to your teammate's Python script
      const pythonScriptPath = path.join(__dirname, '..', 'python_scripts', 'xml_processor.py');
      
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
        _source: 'python_xml_processor',
        _originalFile: file.originalname
      }));
      
      // Add metadata to error logs
      const errors = errorLogs.map(error => ({
        ...error,
        _timestamp: new Date(),
        _source: 'python_xml_processor',
        _originalFile: file.originalname,
        type: error.type || 'processing_error'
      }));
      
      return {
        data: records,
        errors: errors,
        metadata: {
          processor: 'Python XML Processor',
          totalItems: records.length + errors.length,
          validItems: records.length,
          errorItems: errors.length,
          originalFile: file.originalname,
          fileSize: file.size,
          pythonScript: pythonScriptPath
        }
      };
      
    } catch (error) {
      throw new Error(`XML processing failed: ${error.message}`);
    }
  },

  /**
   * Execute Python script and get JSON output
   * @param {string} scriptPath - Path to Python script
   * @param {Array} args - Arguments to pass to script
   * @returns {Object} JSON output from Python script
   */
  async executePythonScript(scriptPath, args = []) {
    return new Promise((resolve, reject) => {
      const { spawn } = require('child_process');
      
      // Spawn Python process
      const pythonProcess = spawn('python', [scriptPath, ...args]);
      
      let stdout = '';
      let stderr = '';
      
      // Collect stdout data
      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      // Collect stderr data
      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      // Handle process completion
      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Python script failed with code ${code}: ${stderr}`));
          return;
        }
        
        try {
          // Parse JSON output from Python script
          const result = JSON.parse(stdout);
          resolve(result);
        } catch (parseError) {
          reject(new Error(`Failed to parse Python output as JSON: ${parseError.message}`));
        }
      });
      
      // Handle process errors
      pythonProcess.on('error', (error) => {
        reject(new Error(`Failed to start Python process: ${error.message}`));
      });
    });
  }
};

/**
 * Extract data from parsed XML object
 * Team member implements custom extraction logic based on XML structure
 */
function extractDataFromXML(xmlObject) {
  const data = [];
  
  // Example extraction - customize based on your XML structure
  // This is a generic extraction that handles common patterns
  
  function traverse(obj, path = '') {
    if (Array.isArray(obj)) {
      obj.forEach((item, index) => traverse(item, `${path}[${index}]`));
    } else if (typeof obj === 'object' && obj !== null) {
      // Check if this looks like a data record
      if (isDataRecord(obj)) {
        data.push(flattenObject(obj));
      } else {
        // Continue traversing
        Object.keys(obj).forEach(key => {
          traverse(obj[key], path ? `${path}.${key}` : key);
        });
      }
    }
  }
  
  traverse(xmlObject);
  
  return data;
}

/**
 * Check if object looks like a data record
 */
function isDataRecord(obj) {
  if (typeof obj !== 'object' || obj === null) return false;
  
  const keys = Object.keys(obj);
  
  // Heuristic: if it has multiple primitive values, it's likely a record
  const primitiveCount = keys.filter(key => 
    typeof obj[key] === 'string' || 
    typeof obj[key] === 'number' || 
    typeof obj[key] === 'boolean'
  ).length;
  
  return primitiveCount >= 2 && keys.length <= 20; // Reasonable limits
}

/**
 * Flatten nested object
 */
function flattenObject(obj, prefix = '') {
  const flattened = {};
  
  Object.keys(obj).forEach(key => {
    const value = obj[key];
    const newKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      Object.assign(flattened, flattenObject(value, newKey));
    } else {
      flattened[newKey] = value;
    }
  });
  
  return flattened;
}

/**
 * Get XML structure overview
 */
function getXMLStructure(xmlObject) {
  function getStructure(obj) {
    if (Array.isArray(obj)) {
      return `Array[${obj.length}]`;
    } else if (typeof obj === 'object' && obj !== null) {
      const structure = {};
      Object.keys(obj).forEach(key => {
        structure[key] = getStructure(obj[key]);
      });
      return structure;
    } else {
      return typeof obj;
    }
  }
  
  return getStructure(xmlObject);
}

/**
 * Validate XML record
 * Team member implements custom validation
 */
function validateXmlRecord(record, index) {
  const errors = [];
  
  // Example validation - customize as needed
  if (!record || Object.keys(record).length === 0) {
    errors.push('Empty record');
  }
  
  // Add more validation rules based on your XML schema
  
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

module.exports = xmlProcessor;