const express = require('express');
const router = express.Router();
const ErrorLog = require('../models/ErrorLog');

// GET /api/errors - Fetch error logs with pagination, filtering, and sorting
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      errorType = '',
      sourceFormat = '',
      processedBy = '',
      status = '',
      startDate = '',
      endDate = '',
      search = ''
    } = req.query;

    // Build query object
    const query = {};

    // Search in error message and details
    if (search) {
      query.$or = [
        { errorMessage: { $regex: search, $options: 'i' } },
        { errorDetails: { $regex: search, $options: 'i' } },
        { fieldName: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by error type
    if (errorType) {
      query.errorType = errorType;
    }

    // Filter by source format
    if (sourceFormat) {
      query.sourceFormat = sourceFormat;
    }

    // Filter by processor
    if (processedBy) {
      query.processedBy = processedBy;
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    // Pagination
    const pageNumber = Math.max(1, parseInt(page));
    const pageSize = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNumber - 1) * pageSize;

    // Sorting
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute queries in parallel
    const [errors, totalCount] = await Promise.all([
      ErrorLog.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(pageSize)
        .lean(),
      ErrorLog.countDocuments(query)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / pageSize);
    const hasNextPage = pageNumber < totalPages;
    const hasPrevPage = pageNumber > 1;

    res.json({
      success: true,
      data: errors,
      pagination: {
        currentPage: pageNumber,
        totalPages,
        totalRecords: totalCount,
        recordsPerPage: pageSize,
        hasNextPage,
        hasPrevPage,
        nextPage: hasNextPage ? pageNumber + 1 : null,
        prevPage: hasPrevPage ? pageNumber - 1 : null
      },
      filters: {
        search,
        errorType,
        sourceFormat,
        processedBy,
        status,
        startDate,
        endDate,
        sortBy,
        sortOrder
      }
    });

  } catch (error) {
    console.error('Fetch errors error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch error logs',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/errors/:id - Fetch specific error by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const error = await ErrorLog.findById(id).lean();

    if (!error) {
      return res.status(404).json({
        success: false,
        message: 'Error log not found'
      });
    }

    res.json({
      success: true,
      data: error
    });

  } catch (error) {
    console.error('Fetch error by ID error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid error ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to fetch error log',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/errors/stats/summary - Get error statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    // Aggregate statistics
    const [
      totalErrors,
      errorTypeStats,
      sourceFormatStats,
      statusStats,
      processedByStats,
      recentActivity
    ] = await Promise.all([
      // Total errors count
      ErrorLog.countDocuments(dateFilter),

      // Errors by type
      ErrorLog.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$errorType', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),

      // Errors by source format
      ErrorLog.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$sourceFormat', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),

      // Errors by status
      ErrorLog.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),

      // Errors by processor
      ErrorLog.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$processedBy', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),

      // Recent activity (last 7 days)
      ErrorLog.aggregate([
        {
          $match: {
            ...dateFilter,
            createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    // Calculate resolution rate
    const resolvedCount = statusStats.find(s => s._id === 'RESOLVED')?.count || 0;
    const resolutionRate = totalErrors > 0 ? ((resolvedCount / totalErrors) * 100).toFixed(2) : 0;

    res.json({
      success: true,
      data: {
        summary: {
          totalErrors,
          resolvedErrors: resolvedCount,
          resolutionRate: parseFloat(resolutionRate),
          averageErrorsPerDay: recentActivity.length > 0 ? 
            Math.round(recentActivity.reduce((sum, day) => sum + day.count, 0) / recentActivity.length) : 0
        },
        breakdown: {
          byErrorType: errorTypeStats,
          bySourceFormat: sourceFormatStats,
          byStatus: statusStats,
          byProcessor: processedByStats
        },
        recentActivity,
        dateRange: {
          startDate: startDate || null,
          endDate: endDate || null
        }
      }
    });

  } catch (error) {
    console.error('Error stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch error statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// PATCH /api/errors/:id/status - Update error status
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, resolvedBy, resolutionNotes } = req.body;

    // Validate status
    const validStatuses = ['UNRESOLVED', 'RESOLVED', 'IGNORED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
      });
    }

    // Prepare update object
    const updateData = { status };
    
    if (status === 'RESOLVED') {
      updateData.resolvedAt = new Date();
      updateData.resolvedBy = resolvedBy || 'System';
      if (resolutionNotes) {
        updateData.resolutionNotes = resolutionNotes;
      }
    }

    const updatedError = await ErrorLog.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedError) {
      return res.status(404).json({
        success: false,
        message: 'Error log not found'
      });
    }

    res.json({
      success: true,
      message: 'Error status updated successfully',
      data: updatedError
    });

  } catch (error) {
    console.error('Update error status error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid error ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update error status',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/errors/fields/unique - Get unique values for specific fields
router.get('/fields/unique', async (req, res) => {
  try {
    const { field } = req.query;

    if (!field) {
      return res.status(400).json({
        success: false,
        message: 'Field parameter is required'
      });
    }

    const allowedFields = ['errorType', 'sourceFormat', 'processedBy', 'status', 'fieldName'];
    
    if (!allowedFields.includes(field)) {
      return res.status(400).json({
        success: false,
        message: 'Field not allowed for unique value retrieval'
      });
    }

    const uniqueValues = await ErrorLog.distinct(field);

    res.json({
      success: true,
      data: {
        field,
        values: uniqueValues.filter(value => value !== null && value !== '')
      }
    });

  } catch (error) {
    console.error('Unique error fields error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unique field values',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;