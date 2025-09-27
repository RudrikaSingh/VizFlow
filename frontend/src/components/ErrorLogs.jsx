import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, ChevronRight, Search, Filter, 
  Download, RefreshCw, Eye, AlertCircle, CheckCircle,
  XCircle, Clock 
} from 'lucide-react';
import { errorsAPI, downloadAPI, handleFileDownload } from '../services/api';
import { dateUtils, numberUtils, colorUtils } from '../utils/helpers';
import toast from 'react-hot-toast';

const ErrorLogs = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0,
    recordsPerPage: 10
  });
  const [filters, setFilters] = useState({
    search: '',
    errorType: '',
    sourceFormat: '',
    processedBy: '',
    status: '',
    startDate: '',
    endDate: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [downloading, setDownloading] = useState(false);
  const [selectedError, setSelectedError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(null);

  // Fetch error logs
  const fetchErrors = async (page = 1) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: pagination.recordsPerPage,
        ...filters
      };

      const response = await errorsAPI.getErrors(params);
      setData(response.data);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Error fetching error logs:', error);
      toast.error('Failed to fetch error logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchErrors();
  }, [filters, pagination.recordsPerPage]);

  // Handle filter changes
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle pagination
  const handlePageChange = (page) => {
    fetchErrors(page);
  };

  // Handle download
  const handleDownload = async (format) => {
    setDownloading(true);
    try {
      const params = {
        format,
        ...filters,
        filename: `error_logs_${dateUtils.formatDate(new Date(), 'yyyy-MM-dd')}`
      };

      const response = await downloadAPI.downloadErrors(params);
      const result = handleFileDownload(response, `errors.${format}`);
      
      if (result.success) {
        toast.success(`Downloaded ${result.filename}`);
      } else {
        toast.error('Download failed');
      }
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download data');
    } finally {
      setDownloading(false);
    }
  };

  // Handle status update
  const handleStatusUpdate = async (errorId, newStatus, resolutionNotes = '') => {
    setUpdatingStatus(errorId);
    try {
      await errorsAPI.updateErrorStatus(
        errorId, 
        newStatus, 
        'System User', 
        resolutionNotes
      );
      
      toast.success('Status updated successfully');
      fetchErrors(pagination.currentPage);
      setSelectedError(null);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  // Handle sort
  const handleSort = (field) => {
    const newOrder = filters.sortBy === field && filters.sortOrder === 'asc' ? 'desc' : 'asc';
    setFilters(prev => ({
      ...prev,
      sortBy: field,
      sortOrder: newOrder
    }));
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      search: '',
      errorType: '',
      sourceFormat: '',
      processedBy: '',
      status: '',
      startDate: '',
      endDate: '',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'RESOLVED':
        return <CheckCircle className="h-4 w-4 text-success-500" />;
      case 'IGNORED':
        return <XCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-warning-500" />;
    }
  };

  // Get error type color
  const getErrorTypeColor = (errorType) => {
    return colorUtils.getErrorTypeColor(errorType);
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">
                Error Logs
              </h2>
              <p className="text-gray-600 mt-1">
                Monitor and manage data processing errors
              </p>
            </div>
            
            <div className="flex items-center space-x-3 mt-4 sm:mt-0">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </button>
              
              <div className="relative">
                <button
                  onClick={() => document.getElementById('downloadMenu').classList.toggle('hidden')}
                  disabled={downloading}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-error-600 hover:bg-error-700 disabled:opacity-50"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {downloading ? 'Downloading...' : 'Download'}
                </button>
                
                <div id="downloadMenu" className="hidden absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
                  <div className="py-1">
                    <button
                      onClick={() => handleDownload('csv')}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Download as CSV
                    </button>
                    <button
                      onClick={() => handleDownload('excel')}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Download as Excel
                    </button>
                    <button
                      onClick={() => handleDownload('json')}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Download as JSON
                    </button>
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => fetchErrors(pagination.currentPage)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Search
                  </label>
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search errors..."
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                      className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-error-500 focus:ring-error-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Error Type
                  </label>
                  <select
                    value={filters.errorType}
                    onChange={(e) => handleFilterChange('errorType', e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-error-500 focus:ring-error-500 sm:text-sm"
                  >
                    <option value="">All Types</option>
                    <option value="MISSING_FIELD">Missing Field</option>
                    <option value="INVALID_FORMAT">Invalid Format</option>
                    <option value="DUPLICATE_RECORD">Duplicate Record</option>
                    <option value="VALIDATION_ERROR">Validation Error</option>
                    <option value="PARSING_ERROR">Parsing Error</option>
                    <option value="DATA_TYPE_ERROR">Data Type Error</option>
                    <option value="BUSINESS_RULE_ERROR">Business Rule Error</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-error-500 focus:ring-error-500 sm:text-sm"
                  >
                    <option value="">All Status</option>
                    <option value="UNRESOLVED">Unresolved</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="IGNORED">Ignored</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Source Format
                  </label>
                  <select
                    value={filters.sourceFormat}
                    onChange={(e) => handleFilterChange('sourceFormat', e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-error-500 focus:ring-error-500 sm:text-sm"
                  >
                    <option value="">All Formats</option>
                    <option value="CSV">CSV</option>
                    <option value="Excel">Excel</option>
                    <option value="XML">XML</option>
                    <option value="JSON">JSON</option>
                    <option value="PDF">PDF</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-error-500 focus:ring-error-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-error-500 focus:ring-error-500 sm:text-sm"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    onClick={clearFilters}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  onClick={() => handleSort('errorType')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  Error Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Message
                </th>
                <th 
                  onClick={() => handleSort('sourceFormat')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  Source
                </th>
                <th 
                  onClick={() => handleSort('processedBy')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  Processed By
                </th>
                <th 
                  onClick={() => handleSort('status')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  Status
                </th>
                <th 
                  onClick={() => handleSort('createdAt')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-error-500"></div>
                      <span className="ml-2 text-gray-500">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    No error logs found
                  </td>
                </tr>
              ) : (
                data.map((error) => (
                  <tr key={error._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span 
                        className="inline-flex px-2 py-1 text-xs font-semibold rounded-full text-white"
                        style={{ backgroundColor: getErrorTypeColor(error.errorType) }}
                      >
                        {error.errorType.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                      <div className="truncate" title={error.errorMessage}>
                        {error.errorMessage}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                        {error.sourceFormat}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {error.processedBy}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(error.status)}
                        <span className="ml-2 text-sm text-gray-900">
                          {error.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {dateUtils.formatDateTime(error.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setSelectedError(error)}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {error.status === 'UNRESOLVED' && (
                          <button
                            onClick={() => handleStatusUpdate(error._id, 'RESOLVED')}
                            disabled={updatingStatus === error._id}
                            className="text-success-600 hover:text-success-900 disabled:opacity-50"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {((pagination.currentPage - 1) * pagination.recordsPerPage) + 1} to{' '}
              {Math.min(pagination.currentPage * pagination.recordsPerPage, pagination.totalRecords)} of{' '}
              {numberUtils.formatNumber(pagination.totalRecords)} results
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={!pagination.hasPrevPage}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              
              <span className="text-sm text-gray-700">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              
              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={!pagination.hasNextPage}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Detail Modal */}
      {selectedError && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Error Details
              </h3>
              <button
                onClick={() => setSelectedError(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Error ID</label>
                  <p className="text-sm text-gray-900">{selectedError.errorId || selectedError._id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Error Type</label>
                  <span 
                    className="inline-flex px-2 py-1 text-xs font-semibold rounded-full text-white"
                    style={{ backgroundColor: getErrorTypeColor(selectedError.errorType) }}
                  >
                    {selectedError.errorType.replace('_', ' ')}
                  </span>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Error Message</label>
                  <p className="text-sm text-gray-900">{selectedError.errorMessage}</p>
                </div>
                {selectedError.errorDetails && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Error Details</label>
                    <p className="text-sm text-gray-900">{selectedError.errorDetails}</p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Source Format</label>
                  <p className="text-sm text-gray-900">{selectedError.sourceFormat}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Source File</label>
                  <p className="text-sm text-gray-900">{selectedError.sourceFile || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Line Number</label>
                  <p className="text-sm text-gray-900">{selectedError.lineNumber || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Field Name</label>
                  <p className="text-sm text-gray-900">{selectedError.fieldName || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Expected Value</label>
                  <p className="text-sm text-gray-900">{selectedError.expectedValue || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Actual Value</label>
                  <p className="text-sm text-gray-900">{selectedError.actualValue || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Processed By</label>
                  <p className="text-sm text-gray-900">{selectedError.processedBy}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Processed At</label>
                  <p className="text-sm text-gray-900">{dateUtils.formatDateTime(selectedError.createdAt)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <div className="flex items-center">
                    {getStatusIcon(selectedError.status)}
                    <span className="ml-2 text-sm text-gray-900">{selectedError.status}</span>
                  </div>
                </div>
                {selectedError.resolvedAt && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Resolved At</label>
                    <p className="text-sm text-gray-900">{dateUtils.formatDateTime(selectedError.resolvedAt)}</p>
                  </div>
                )}
              </div>
              
              {selectedError.rawData && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Raw Data</label>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <pre className="text-xs text-gray-900 whitespace-pre-wrap max-h-40 overflow-y-auto">
                      {JSON.stringify(selectedError.rawData, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
              
              {selectedError.resolutionNotes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Resolution Notes</label>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm text-gray-900">{selectedError.resolutionNotes}</p>
                  </div>
                </div>
              )}

              {/* Status Update Actions */}
              {selectedError.status === 'UNRESOLVED' && (
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    onClick={() => handleStatusUpdate(selectedError._id, 'IGNORED', 'Marked as ignored by user')}
                    disabled={updatingStatus === selectedError._id}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Mark as Ignored
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(selectedError._id, 'RESOLVED', 'Resolved by user')}
                    disabled={updatingStatus === selectedError._id}
                    className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-success-600 hover:bg-success-700 disabled:opacity-50"
                  >
                    Mark as Resolved
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ErrorLogs;