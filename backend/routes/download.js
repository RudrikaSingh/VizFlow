const express = require('express');
const router = express.Router();
const ProcessedData = require('../models/ProcessedData');
const ErrorLog = require('../models/ErrorLog');
const { 
  exportToCSV, 
  exportToExcel, 
  exportToJSON, 
  exportMultipleSheetsToExcel,
  generateSummaryStats 
} = require('../utils/exportData');

// GET /api/download/customers - Download customer data
router.get('/customers', async (req, res) => {
  try {
    const {
      format = 'csv',
      search = '',
      sourceFormat = '',
      processedBy = '',
      startDate = '',
      endDate = '',
      limit = '',
      filename = 'customers_export'
    } = req.query;

    // Validate format
    const validFormats = ['csv', 'excel', 'json'];
    if (!validFormats.includes(format.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid format. Supported formats: csv, excel, json'
      });
    }

    // Build query (same as customers route)
    const query = {};

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { customerId: { $regex: search, $options: 'i' } }
      ];
    }

    if (sourceFormat) {
      query.sourceFormat = sourceFormat;
    }

    if (processedBy) {
      query.processedBy = processedBy;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Apply limit if specified
    let dataQuery = ProcessedData.find(query).sort({ createdAt: -1 });
    if (limit && !isNaN(limit)) {
      dataQuery = dataQuery.limit(parseInt(limit));
    }

    const data = await dataQuery.lean();

    if (data.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No customer data found matching the criteria'
      });
    }

    // Generate export based on format
    let exportResult;
    
    switch (format.toLowerCase()) {
      case 'csv':
        exportResult = exportToCSV(data, filename);
        break;
      case 'excel':
        exportResult = exportToExcel(data, filename, 'Customers');
        break;
      case 'json':
        exportResult = exportToJSON(data, filename, true);
        break;
    }

    // Set response headers
    res.setHeader('Content-Disposition', `attachment; filename="${exportResult.filename}"`);
    res.setHeader('Content-Type', exportResult.mimeType);

    // Send file
    res.send(exportResult.data);

  } catch (error) {
    console.error('Download customers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download customer data',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/download/errors - Download error logs
router.get('/errors', async (req, res) => {
  try {
    const {
      format = 'csv',
      errorType = '',
      sourceFormat = '',
      processedBy = '',
      status = '',
      startDate = '',
      endDate = '',
      search = '',
      limit = '',
      filename = 'error_logs_export'
    } = req.query;

    // Validate format
    const validFormats = ['csv', 'excel', 'json'];
    if (!validFormats.includes(format.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid format. Supported formats: csv, excel, json'
      });
    }

    // Build query (same as errors route)
    const query = {};

    if (search) {
      query.$or = [
        { errorMessage: { $regex: search, $options: 'i' } },
        { errorDetails: { $regex: search, $options: 'i' } },
        { fieldName: { $regex: search, $options: 'i' } }
      ];
    }

    if (errorType) query.errorType = errorType;
    if (sourceFormat) query.sourceFormat = sourceFormat;
    if (processedBy) query.processedBy = processedBy;
    if (status) query.status = status;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Apply limit if specified
    let dataQuery = ErrorLog.find(query).sort({ createdAt: -1 });
    if (limit && !isNaN(limit)) {
      dataQuery = dataQuery.limit(parseInt(limit));
    }

    const data = await dataQuery.lean();

    if (data.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No error logs found matching the criteria'
      });
    }

    // Generate export based on format
    let exportResult;
    
    switch (format.toLowerCase()) {
      case 'csv':
        exportResult = exportToCSV(data, filename);
        break;
      case 'excel':
        exportResult = exportToExcel(data, filename, 'Error Logs');
        break;
      case 'json':
        exportResult = exportToJSON(data, filename, true);
        break;
    }

    // Set response headers
    res.setHeader('Content-Disposition', `attachment; filename="${exportResult.filename}"`);
    res.setHeader('Content-Type', exportResult.mimeType);

    // Send file
    res.send(exportResult.data);

  } catch (error) {
    console.error('Download errors error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download error logs',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/download/combined - Download both customers and errors in one Excel file
router.get('/combined', async (req, res) => {
  try {
    const {
      customerLimit = '',
      errorLimit = '',
      startDate = '',
      endDate = '',
      filename = 'vizflow_export'
    } = req.query;

    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    // Fetch both datasets in parallel
    const [customersData, errorsData] = await Promise.all([
      ProcessedData.find(dateFilter)
        .sort({ createdAt: -1 })
        .limit(customerLimit ? parseInt(customerLimit) : 0)
        .lean(),
      ErrorLog.find(dateFilter)
        .sort({ createdAt: -1 })
        .limit(errorLimit ? parseInt(errorLimit) : 0)
        .lean()
    ]);

    // Prepare sheets data
    const sheets = [];
    
    if (customersData.length > 0) {
      sheets.push({
        data: customersData,
        sheetName: 'Customers'
      });
    }
    
    if (errorsData.length > 0) {
      sheets.push({
        data: errorsData,
        sheetName: 'Error Logs'
      });
    }

    if (sheets.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No data found for the specified criteria'
      });
    }

    // Generate combined Excel file
    const exportResult = exportMultipleSheetsToExcel(sheets, filename);

    // Set response headers
    res.setHeader('Content-Disposition', `attachment; filename="${exportResult.filename}"`);
    res.setHeader('Content-Type', exportResult.mimeType);

    // Send file
    res.send(exportResult.data);

  } catch (error) {
    console.error('Download combined error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download combined data',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/download/summary - Generate and download summary report
router.get('/summary', async (req, res) => {
  try {
    const { format = 'excel', startDate = '', endDate = '' } = req.query;

    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    // Generate summary statistics
    const [
      totalCustomers,
      totalErrors,
      customersByFormat,
      errorsByType,
      errorsByFormat,
      dailyActivity
    ] = await Promise.all([
      ProcessedData.countDocuments(dateFilter),
      ErrorLog.countDocuments(dateFilter),
      ProcessedData.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$sourceFormat', count: { $sum: 1 } } }
      ]),
      ErrorLog.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$errorType', count: { $sum: 1 } } }
      ]),
      ErrorLog.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$sourceFormat', count: { $sum: 1 } } }
      ]),
      ProcessedData.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            customers: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    // Create summary data
    const summaryData = {
      reportGenerated: new Date().toISOString(),
      dateRange: {
        startDate: startDate || 'All time',
        endDate: endDate || 'All time'
      },
      totals: {
        totalCustomers,
        totalErrors,
        successRate: totalCustomers + totalErrors > 0 ? 
          ((totalCustomers / (totalCustomers + totalErrors)) * 100).toFixed(2) + '%' : '0%'
      },
      breakdown: {
        customersByFormat,
        errorsByType,
        errorsByFormat
      },
      dailyActivity
    };

    let exportResult;

    if (format === 'json') {
      exportResult = exportToJSON([summaryData], 'summary_report', true);
    } else {
      // Create multiple sheets for Excel
      const sheets = [
        { data: [summaryData.totals], sheetName: 'Summary' },
        { data: customersByFormat, sheetName: 'Customers by Format' },
        { data: errorsByType, sheetName: 'Errors by Type' },
        { data: errorsByFormat, sheetName: 'Errors by Format' },
        { data: dailyActivity, sheetName: 'Daily Activity' }
      ];
      
      exportResult = exportMultipleSheetsToExcel(sheets, 'summary_report');
    }

    // Set response headers
    res.setHeader('Content-Disposition', `attachment; filename="${exportResult.filename}"`);
    res.setHeader('Content-Type', exportResult.mimeType);

    // Send file
    res.send(exportResult.data);

  } catch (error) {
    console.error('Download summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate summary report',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/download/formats - Get available export formats
router.get('/formats', (req, res) => {
  res.json({
    success: true,
    data: {
      formats: [
        {
          value: 'csv',
          label: 'CSV',
          description: 'Comma-separated values, suitable for Excel and data analysis'
        },
        {
          value: 'excel',
          label: 'Excel',
          description: 'Microsoft Excel format with formatting and multiple sheets'
        },
        {
          value: 'json',
          label: 'JSON',
          description: 'JavaScript Object Notation, suitable for API integration'
        }
      ],
      endpoints: [
        {
          path: '/api/download/customers',
          description: 'Download customer data',
          parameters: ['format', 'search', 'sourceFormat', 'processedBy', 'startDate', 'endDate', 'limit']
        },
        {
          path: '/api/download/errors',
          description: 'Download error logs',
          parameters: ['format', 'errorType', 'sourceFormat', 'processedBy', 'status', 'startDate', 'endDate', 'limit']
        },
        {
          path: '/api/download/combined',
          description: 'Download combined data in Excel format',
          parameters: ['customerLimit', 'errorLimit', 'startDate', 'endDate']
        },
        {
          path: '/api/download/summary',
          description: 'Download summary report',
          parameters: ['format', 'startDate', 'endDate']
        }
      ]
    }
  });
});

module.exports = router;