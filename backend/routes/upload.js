const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const ProcessedData = require('../models/ProcessedData');
const ErrorLog = require('../models/ErrorLog');
const { validateProcessedDataBatch, validateErrorLogBatch, sanitizeData } = require('../utils/validateData');
const { processFile, isSupported, getSupportedFormats } = require('../processors');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: function (req, file, cb) {
    if (isSupported(file.mimetype, file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file format: ${file.mimetype}`), false);
    }
  }
});

// POST /api/upload/file - Upload and process files (CSV, Excel, XML, PDF, Images)
router.post('/file', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Get specified file type from request (if provided)
    const specifiedFileType = req.body.fileType;
    
    // Validate specified file type if provided
    if (specifiedFileType && !isSupported(null, null, specifiedFileType)) {
      return res.status(400).json({
        success: false,
        message: `Unsupported file type: ${specifiedFileType}`
      });
    }

    // Process file using appropriate processor
    const result = await processFile(req.file, {
      userId: req.user?.id,
      uploadedBy: req.ip,
      specifiedFileType: specifiedFileType,
      additionalOptions: req.body
    });

    let successCount = 0;
    let errorCount = 0;
    const responseErrors = [];

    // Save successfully processed data
    if (result.data && result.data.length > 0) {
      try {
        // Create documents for each data item with metadata
        const documentsToInsert = result.data.map((dataItem, index) => ({
          data: sanitizeData(dataItem),
          metadata: {
            originalFileName: req.file.originalname,
            fileType: result.metadata.detectedType || result.metadata.processor,
            mimeType: req.file.mimetype,
            fileSize: req.file.size,
            processor: result.metadata.processor,
            processingTime: result.metadata.processingTime,
            specifiedType: result.metadata.specifiedType,
            detectedType: result.metadata.detectedType,
            uploadedBy: req.ip,
            userId: req.user?.id,
            recordCount: 1,
            extractedFields: Object.keys(dataItem || {}),
            additionalOptions: result.metadata.additionalOptions || {}
          }
        }));

        const insertResult = await ProcessedData.insertMany(documentsToInsert, {
          ordered: false,
          rawResult: true
        });
        successCount = insertResult.insertedCount || documentsToInsert.length;

      } catch (error) {
        console.error('Database insert error:', error);
        
        // Handle bulk insert errors
        if (error.writeErrors) {
          successCount = result.data.length - error.writeErrors.length;
          errorCount = error.writeErrors.length;
          responseErrors.push({
            type: 'DATABASE_ERRORS',
            message: 'Some records failed to save to database',
            count: errorCount,
            details: error.writeErrors.slice(0, 5).map(err => err.errmsg)
          });
        } else {
          errorCount = result.data.length;
          responseErrors.push({
            type: 'DATABASE_ERROR',
            message: 'Failed to save processed data',
            error: error.message
          });
        }
      }
    } else {
      // Handle case where no data was extracted
      responseErrors.push({
        type: 'NO_DATA_EXTRACTED',
        message: 'No valid data was extracted from the file',
        count: 0
      });
    }

    // Save processing errors
    if (result.errors && result.errors.length > 0) {
      try {
        const errorLogs = result.errors.map((error, index) => ({
          errorType: error.type || 'PROCESSING_ERROR',
          errorMessage: error.message || 'Unknown error occurred',
          errorDetails: error.details || JSON.stringify(error),
          sourceFormat: (result.metadata.processor || '').toUpperCase(),
          sourceFile: req.file.originalname,
          lineNumber: error.lineNumber || null,
          rawData: error.rawData || error.data || null,
          fieldName: error.fieldName || null,
          expectedValue: error.expected || null,
          actualValue: error.actual || null,
          processedBy: req.ip || 'system',
          processedAt: new Date()
        }));

        await ErrorLog.insertMany(errorLogs, { ordered: false });
        errorCount += result.errors.length;
      } catch (error) {
        console.error('Error log save error:', error);
        // Don't fail the entire operation if error logging fails
      }
    }

    // Clean up uploaded file
    const fs = require('fs');
    if (req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    // Response
    res.status(200).json({
      success: result.success,
      message: result.success ? 'File processed successfully' : 'File processing completed with errors',
      summary: {
        fileName: req.file.originalname,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        processor: result.metadata.processor,
        processingTime: result.metadata.processingTime,
        totalRecords: (result.data?.length || 0) + (result.errors?.length || 0),
        successfulInserts: successCount,
        failedRecords: errorCount,
        metadata: result.metadata
      },
      errors: responseErrors.length > 0 ? responseErrors : undefined
    });

  } catch (error) {
    console.error('File upload error:', error);
    
    // Clean up file on error
    if (req.file && req.file.path) {
      const fs = require('fs');
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
    }

    res.status(500).json({
      success: false,
      message: 'File processing failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/upload/formats - Get supported file formats
router.get('/formats', (req, res) => {
  try {
    const formats = getSupportedFormats();
    
    // Enhanced format information with processing details
    const enhancedFormats = {
      ...formats,
      processors: {
        csv: {
          name: 'CSV Processor',
          description: 'Processes comma-separated values files',
          extensions: ['.csv'],
          mimeTypes: ['text/csv', 'application/csv'],
          features: ['Data extraction', 'Column mapping', 'Validation']
        },
        excel: {
          name: 'Excel Processor',
          description: 'Processes Microsoft Excel spreadsheets',
          extensions: ['.xlsx', '.xls'],
          mimeTypes: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'],
          features: ['Multiple sheets', 'Formulas', 'Data validation']
        },
        xml: {
          name: 'XML Processor',
          description: 'Processes XML structured data files',
          extensions: ['.xml'],
          mimeTypes: ['application/xml', 'text/xml'],
          features: ['Schema validation', 'Nested data', 'Attribute extraction']
        },
        pdf: {
          name: 'PDF Processor',
          description: 'Extracts text and data from PDF documents',
          extensions: ['.pdf'],
          mimeTypes: ['application/pdf'],
          features: ['Text extraction', 'Table detection', 'OCR support']
        },
        image: {
          name: 'Image Processor',
          description: 'Extracts text from images using OCR',
          extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.tiff', '.bmp'],
          mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/tiff', 'image/bmp'],
          features: ['OCR text recognition', 'Multi-language support', 'Image preprocessing']
        }
      }
    };
    
    res.json({
      success: true,
      data: enhancedFormats
    });
  } catch (error) {
    console.error('Get formats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve supported formats'
    });
  }
});

// POST /api/upload/cleaned - Upload cleaned JSON data (legacy support)
router.post('/cleaned', async (req, res) => {
  try {
    const { data, metadata = {} } = req.body;

    // Validate input
    if (!data) {
      return res.status(400).json({
        success: false,
        message: 'No data provided'
      });
    }

    // Ensure data is an array
    const dataArray = Array.isArray(data) ? data : [data];
    
    // Sanitize and validate data
    const sanitizedData = dataArray.map(item => sanitizeData(item));
    const validation = validateProcessedDataBatch(sanitizedData);

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    // Process valid records
    if (validation.valid.length > 0) {
      try {
        const insertResult = await ProcessedData.insertMany(validation.valid, {
          ordered: false, // Continue on error
          rawResult: true
        });
        successCount = insertResult.insertedCount || validation.valid.length;
      } catch (error) {
        console.error('Bulk insert error:', error);
        // Handle duplicate key errors or other MongoDB errors
        if (error.code === 11000) {
          errorCount = error.writeErrors ? error.writeErrors.length : 0;
          successCount = validation.valid.length - errorCount;
          errors.push({
            type: 'DUPLICATE_RECORDS',
            message: 'Some records were duplicates and skipped',
            count: errorCount
          });
        } else {
          throw error;
        }
      }
    }

    // Process invalid records
    if (validation.invalid.length > 0) {
      errorCount += validation.invalid.length;
      errors.push({
        type: 'VALIDATION_ERRORS',
        message: 'Some records failed validation',
        count: validation.invalid.length,
        details: validation.invalid
      });
    }

    // Response
    res.status(200).json({
      success: true,
      message: 'Data upload completed',
      summary: {
        totalRecords: dataArray.length,
        successfulInserts: successCount,
        failedInserts: errorCount,
        metadata
      },
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Upload cleaned data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload cleaned data',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// POST /api/upload/errors - Upload error JSON data
router.post('/errors', async (req, res) => {
  try {
    const { data, metadata = {} } = req.body;

    // Validate input
    if (!data) {
      return res.status(400).json({
        success: false,
        message: 'No error data provided'
      });
    }

    // Ensure data is an array
    const errorArray = Array.isArray(data) ? data : [data];
    
    // Sanitize and validate error data
    const sanitizedErrors = errorArray.map(item => sanitizeData(item));
    const validation = validateErrorLogBatch(sanitizedErrors);

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    // Process valid error records
    if (validation.valid.length > 0) {
      try {
        const insertResult = await ErrorLog.insertMany(validation.valid, {
          ordered: false,
          rawResult: true
        });
        successCount = insertResult.insertedCount || validation.valid.length;
      } catch (error) {
        console.error('Error log bulk insert error:', error);
        if (error.code === 11000) {
          errorCount = error.writeErrors ? error.writeErrors.length : 0;
          successCount = validation.valid.length - errorCount;
          errors.push({
            type: 'DUPLICATE_ERROR_LOGS',
            message: 'Some error logs were duplicates and skipped',
            count: errorCount
          });
        } else {
          throw error;
        }
      }
    }

    // Process invalid error records
    if (validation.invalid.length > 0) {
      errorCount += validation.invalid.length;
      errors.push({
        type: 'VALIDATION_ERRORS',
        message: 'Some error records failed validation',
        count: validation.invalid.length,
        details: validation.invalid
      });
    }

    // Response
    res.status(200).json({
      success: true,
      message: 'Error data upload completed',
      summary: {
        totalRecords: errorArray.length,
        successfulInserts: successCount,
        failedInserts: errorCount,
        metadata
      },
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Upload error data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload error data',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/upload/status - Check upload status or system health
router.get('/status', async (req, res) => {
  try {
    // Get database statistics
    const processedDataCount = await ProcessedData.countDocuments();
    const errorLogCount = await ErrorLog.countDocuments();
    
    // Get recent activity (last 24 hours)
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentProcessedData = await ProcessedData.countDocuments({
      createdAt: { $gte: last24Hours }
    });
    const recentErrors = await ErrorLog.countDocuments({
      createdAt: { $gte: last24Hours }
    });

    res.json({
      success: true,
      status: 'operational',
      statistics: {
        totalProcessedRecords: processedDataCount,
        totalErrorLogs: errorLogCount,
        recentActivity: {
          processedRecordsLast24h: recentProcessedData,
          errorLogsLast24h: recentErrors
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({
      success: false,
      status: 'error',
      message: 'Failed to retrieve system status',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;