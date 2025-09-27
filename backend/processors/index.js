/**
 * File Format Processors Registry
 * Central hub for all file format processors developed by team members
 */

const csvProcessor = require('./csvProcessor');
const excelProcessor = require('./excelProcessor');
const xmlProcessor = require('./xmlProcessor');
const pdfProcessor = require('./pdfProcessor');
const imageProcessor = require('./imageProcessor');

// Supported file formats and their corresponding processors
const SUPPORTED_FORMATS = {
  // CSV Files
  'text/csv': csvProcessor,
  'application/csv': csvProcessor,
  
  // Excel Files
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': excelProcessor, // .xlsx
  'application/vnd.ms-excel': excelProcessor, // .xls
  
  // XML Files
  'application/xml': xmlProcessor,
  'text/xml': xmlProcessor,
  
  // PDF Files
  'application/pdf': pdfProcessor,
  
  // Image Files
  'image/jpeg': imageProcessor,
  'image/jpg': imageProcessor,
  'image/png': imageProcessor,
  'image/gif': imageProcessor,
  'image/webp': imageProcessor,
  'image/tiff': imageProcessor,
  'image/bmp': imageProcessor
};

// File extensions mapping
const EXTENSION_MAP = {
  '.csv': 'text/csv',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.xls': 'application/vnd.ms-excel',
  '.xml': 'application/xml',
  '.pdf': 'application/pdf',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.tiff': 'image/tiff',
  '.bmp': 'image/bmp'
};

/**
 * Get processor for file based on MIME type, extension, or specified type
 */
function getProcessor(mimeType, filename, specifiedType = null) {
  // If a specific type is provided, use it directly
  if (specifiedType) {
    switch (specifiedType.toLowerCase()) {
      case 'csv':
        return csvProcessor;
      case 'excel':
        return excelProcessor;
      case 'xml':
        return xmlProcessor;
      case 'pdf':
        return pdfProcessor;
      case 'image':
        return imageProcessor;
      default:
        // Continue with normal detection if specified type is not recognized
        break;
    }
  }
  
  // First try by MIME type
  if (SUPPORTED_FORMATS[mimeType]) {
    return SUPPORTED_FORMATS[mimeType];
  }
  
  // Fallback to file extension
  if (filename) {
    const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    const mappedMimeType = EXTENSION_MAP[ext];
    if (mappedMimeType && SUPPORTED_FORMATS[mappedMimeType]) {
      return SUPPORTED_FORMATS[mappedMimeType];
    }
  }
  
  return null;
}

/**
 * Check if file format is supported
 */
function isSupported(mimeType, filename, specifiedType = null) {
  return getProcessor(mimeType, filename, specifiedType) !== null;
}

/**
 * Get list of all supported formats
 */
function getSupportedFormats() {
  return {
    mimeTypes: Object.keys(SUPPORTED_FORMATS),
    extensions: Object.keys(EXTENSION_MAP),
    categories: {
      spreadsheet: ['.csv', '.xlsx', '.xls'],
      document: ['.xml', '.pdf'],
      image: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.tiff', '.bmp']
    }
  };
}

/**
 * Process file using appropriate processor
 */
async function processFile(file, options = {}) {
  const { specifiedFileType } = options;
  const processor = getProcessor(file.mimetype, file.originalname, specifiedFileType);
  
  if (!processor) {
    const errorMsg = specifiedFileType 
      ? `Unsupported specified file type: ${specifiedFileType}`
      : `Unsupported file format: ${file.mimetype} (${file.originalname})`;
    throw new Error(errorMsg);
  }
  
  // Determine which type was used for processing
  const processorType = specifiedFileType || detectFileType(file.mimetype, file.originalname);
  
  // Add common metadata
  const metadata = {
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    processedAt: new Date(),
    processor: processorType,
    specifiedType: specifiedFileType || null,
    detectedType: detectFileType(file.mimetype, file.originalname),
    ...options
  };
  
  try {
    const startTime = Date.now();
    const result = await processor.process(file, metadata);
    const processingTime = `${Date.now() - startTime}ms`;
    
    // Standardize the response format
    return {
      success: true,
      data: result.data || result,
      metadata: {
        ...metadata,
        recordCount: Array.isArray(result.data) ? result.data.length : (result.recordCount || 0),
        processingTime: processingTime,
        ...result.metadata
      },
      errors: result.errors || []
    };
  } catch (error) {
    return {
      success: false,
      data: [],
      metadata: {
        ...metadata,
        processingTime: `${Date.now() - metadata.processedAt.getTime()}ms`
      },
      errors: [{
        type: 'processing_error',
        message: error.message,
        timestamp: new Date()
      }]
    };
  }
}

/**
 * Detect file type from MIME type and filename
 */
function detectFileType(mimeType, filename) {
  if (mimeType && SUPPORTED_FORMATS[mimeType]) {
    if (mimeType.includes('csv')) return 'csv';
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'excel';
    if (mimeType.includes('xml')) return 'xml';
    if (mimeType.includes('pdf')) return 'pdf';
    if (mimeType.startsWith('image/')) return 'image';
  }
  
  if (filename) {
    const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    if (ext === '.csv') return 'csv';
    if (['.xlsx', '.xls'].includes(ext)) return 'excel';
    if (ext === '.xml') return 'xml';
    if (ext === '.pdf') return 'pdf';
    if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.tiff', '.bmp'].includes(ext)) return 'image';
  }
  
  return 'unknown';
}module.exports = {
  processFile,
  getProcessor,
  isSupported,
  getSupportedFormats,
  detectFileType,
  SUPPORTED_FORMATS,
  EXTENSION_MAP
};