const express = require('express');
const router = express.Router();
const ProcessedData = require('../models/ProcessedData');

// GET /api/customers - Fetch cleaned customer data with pagination, filtering, and sorting
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search = '',
      sourceFormat = '',
      processedBy = '',
      startDate = '',
      endDate = ''
    } = req.query;

    // Build query object
    const query = {};

    // Search across multiple fields
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { customerId: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by source format
    if (sourceFormat) {
      query.sourceFormat = sourceFormat;
    }

    // Filter by processed by
    if (processedBy) {
      query.processedBy = processedBy;
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
    const pageSize = Math.min(100, Math.max(1, parseInt(limit))); // Max 100 per page
    const skip = (pageNumber - 1) * pageSize;

    // Sorting
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute queries in parallel
    const [customers, totalCount] = await Promise.all([
      ProcessedData.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(pageSize)
        .lean(),
      ProcessedData.countDocuments(query)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / pageSize);
    const hasNextPage = pageNumber < totalPages;
    const hasPrevPage = pageNumber > 1;

    res.json({
      success: true,
      data: customers,
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
        sourceFormat,
        processedBy,
        startDate,
        endDate,
        sortBy,
        sortOrder
      }
    });

  } catch (error) {
    console.error('Fetch customers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer data',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/customers/:id - Fetch specific customer by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await ProcessedData.findById(id).lean();

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    res.json({
      success: true,
      data: customer
    });

  } catch (error) {
    console.error('Fetch customer by ID error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid customer ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/customers/stats/summary - Get customer data statistics
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
      totalRecords,
      sourceFormatStats,
      processedByStats,
      recentActivity
    ] = await Promise.all([
      // Total records count
      ProcessedData.countDocuments(dateFilter),

      // Records by source format
      ProcessedData.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$sourceFormat', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),

      // Records by processor
      ProcessedData.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$processedBy', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),

      // Recent activity (last 7 days)
      ProcessedData.aggregate([
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

    // Format response
    res.json({
      success: true,
      data: {
        summary: {
          totalRecords,
          averageRecordsPerDay: recentActivity.length > 0 ? 
            Math.round(recentActivity.reduce((sum, day) => sum + day.count, 0) / recentActivity.length) : 0
        },
        breakdown: {
          bySourceFormat: sourceFormatStats,
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
    console.error('Customer stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/customers/fields/unique - Get unique values for specific fields (for filters)
router.get('/fields/unique', async (req, res) => {
  try {
    const { field } = req.query;

    if (!field) {
      return res.status(400).json({
        success: false,
        message: 'Field parameter is required'
      });
    }

    // Only allow specific fields for security
    const allowedFields = ['sourceFormat', 'processedBy', 'firstName', 'lastName'];
    
    if (!allowedFields.includes(field)) {
      return res.status(400).json({
        success: false,
        message: 'Field not allowed for unique value retrieval'
      });
    }

    const uniqueValues = await ProcessedData.distinct(field);

    res.json({
      success: true,
      data: {
        field,
        values: uniqueValues.filter(value => value !== null && value !== '')
      }
    });

  } catch (error) {
    console.error('Unique fields error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unique field values',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;