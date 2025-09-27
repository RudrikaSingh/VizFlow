import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, AlertCircle, CheckCircle, X, Database, Trash2, Loader, FileSpreadsheet, TrendingDown, TrendingUp, BarChart3, FileImage } from 'lucide-react';
import toast from 'react-hot-toast';

const UploadForm = () => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [fileCounter, setFileCounter] = useState(0);

  // Handle file drop for multiple files
  const onDrop = useCallback((acceptedFiles) => {
    const newFiles = acceptedFiles.map(file => {
      // Determine file type based on extension
      const extension = file.name.toLowerCase().split('.').pop();
      let fileType = 'unknown';
      
      if (extension === 'xml') fileType = 'xml';
      else if (extension === 'json') fileType = 'json';
      else if (['xlsx', 'xls'].includes(extension)) fileType = 'excel';
      else if (extension === 'pdf') fileType = 'pdf';
      else if (extension === 'csv') fileType = 'csv';

      return {
        id: fileCounter + Math.random(),
        file: file,
        name: file.name,
        size: file.size,
        type: file.type,
        fileType: fileType,
        addedAt: new Date().toLocaleTimeString()
      };
    });

    // Check for duplicates and file type limits
    const currentFileTypes = selectedFiles.map(f => f.fileType);
    const filteredNewFiles = [];

    newFiles.forEach(newFile => {
      if (currentFileTypes.includes(newFile.fileType)) {
        // Replace existing file of the same type
        setSelectedFiles(prev => prev.filter(f => f.fileType !== newFile.fileType));
        toast.success(`${newFile.fileType.toUpperCase()} file replaced with ${newFile.name}`);
      } else {
        toast.success(`${newFile.fileType.toUpperCase()} file ${newFile.name} added successfully!`);
      }
      filteredNewFiles.push(newFile);
    });

    setSelectedFiles(prev => [...prev.filter(f => !filteredNewFiles.some(nf => nf.fileType === f.fileType)), ...filteredNewFiles]);
    setFileCounter(prev => prev + filteredNewFiles.length);
  }, [selectedFiles, fileCounter]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/xml': ['.xml'],
      'application/xml': ['.xml'],
      'application/json': ['.json'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/pdf': ['.pdf'],
      'text/csv': ['.csv'],
      'application/csv': ['.csv']
    },
    multiple: true,
    disabled: uploading
  });

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get file type icon and color
  const getFileIcon = (fileType) => {
    switch (fileType) {
      case 'xml':
        return { icon: FileText, color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-200' };
      case 'json':
        return { icon: Database, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-200' };
      case 'excel':
        return { icon: FileSpreadsheet, color: 'text-green-500', bg: 'bg-green-50', border: 'border-green-200' };
      case 'pdf':
        return { icon: FileImage, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200' };
      case 'csv':
        return { icon: BarChart3, color: 'text-purple-500', bg: 'bg-purple-50', border: 'border-purple-200' };
      default:
        return { icon: FileText, color: 'text-gray-500', bg: 'bg-gray-50', border: 'border-gray-200' };
    }
  };

  // Calculate metrics for XML processing
  const calculateXMLMetrics = (xmlResults) => {
    if (!xmlResults || !xmlResults.success) return null;

    const xmlCustomers = xmlResults.xml_customers || 0;
    const masterCustomers = xmlResults.master_customers || 0;
    const cleanedRecords = xmlResults.cleaned_data?.length || 0;

    const xmlSuccessRate = xmlCustomers > 0 ? (cleanedRecords / xmlCustomers * 100) : 0;
    const missingFromXmlCount = masterCustomers - xmlCustomers;
    const missingRate = masterCustomers > 0 ? (missingFromXmlCount / masterCustomers * 100) : 0;
    const coverageRate = masterCustomers > 0 ? (xmlCustomers / masterCustomers * 100) : 0;

    return {
      xmlSuccessRate: Math.round(xmlSuccessRate * 100) / 100,
      missingRate: Math.round(missingRate * 100) / 100,
      coverageRate: Math.round(coverageRate * 100) / 100,
      missingFromXmlCount
    };
  };

  // Calculate metrics for Excel processing
  const calculateExcelMetrics = (excelResults) => {
    if (!excelResults || !excelResults.success) return null;

    const totalRows = excelResults.total_rows || 0;
    const cleanRows = excelResults.clean_count || 0;
    const errorRows = excelResults.error_count || 0;
    const successRate = excelResults.success_rate || 0;

    return {
      totalRows,
      cleanRows,
      errorRows,
      successRate,
      errorInfo: excelResults.error_info || {}
    };
  };

  // Calculate metrics for PDF processing
  const calculatePDFMetrics = (pdfResults) => {
    if (!pdfResults || !pdfResults.success) return null;

    const totalPdfRows = pdfResults.total_pdf_rows || 0;
    const processedRows = pdfResults.processed_count || pdfResults.processed_data?.length || 0;
    const errorRows = pdfResults.error_count || pdfResults.error_data?.length || 0;
    const successRate = pdfResults.success_rate || 0;

    return {
      totalPdfRows,
      processedRows,
      errorRows,
      successRate,
      tablesFound: pdfResults.tables_found || 0,
      columnsExtracted: pdfResults.columns_extracted || [],
      extractionMethod: pdfResults.extraction_method || 'unknown'
    };
  };

  // Calculate metrics for CSV processing
  const calculateCSVMetrics = (csvResults) => {
    if (!csvResults || !csvResults.success) return null;

    const totalRows = csvResults.total_rows || 0;
    const cleanRows = csvResults.clean_count || 0;
    const errorRows = csvResults.error_count || 0;
    const successRate = csvResults.success_rate || 0;
    const duplicatesRemoved = csvResults.duplicate_rows_removed || 0;
    const emptyRowsRemoved = csvResults.empty_rows_removed || 0;

    return {
      totalRows,
      cleanRows,
      errorRows,
      successRate,
      duplicatesRemoved,
      emptyRowsRemoved,
      columnTypes: csvResults.column_types || {},
      fileInfo: csvResults.file_info || {},
      validationStats: csvResults.validation_stats || {}
    };
  };

  // Upload files to backend
  const uploadFiles = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select at least one file (XML, JSON, Excel, PDF, or CSV)');
      return;
    }

    // Check for valid combinations - Updated validation logic
    const fileTypes = selectedFiles.map(f => f.fileType);
    const hasXML = fileTypes.includes('xml');
    const hasJSON = fileTypes.includes('json');
    const hasExcel = fileTypes.includes('excel');
    const hasPDF = fileTypes.includes('pdf');
    const hasCSV = fileTypes.includes('csv');

    // Only XML requires JSON, PDF and CSV are standalone now
    if (hasXML && !hasJSON) {
      toast.error('XML files require JSON master data file for processing');
      return;
    }

    setUploading(true);
    
    try {
      const formData = new FormData();
      selectedFiles.forEach(fileItem => {
        formData.append('files', fileItem.file);
      });

      toast.loading('Processing files...', { id: 'processing' });

      const response = await fetch('http://localhost:8000/upload/multi-files', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || errorData.message || 'Upload failed');
      }

      const result = await response.json();
      setUploadResult(result);
      
      if (result.success) {
        let successMessage = 'Processing completed successfully! ';
        
        if (result.results?.xml_results) {
          const xmlMetrics = calculateXMLMetrics(result.results.xml_results);
          successMessage += `XML: ${result.results.xml_results.cleaned_data?.length || 0} cleaned records. `;
        }
        
        if (result.results?.excel_results) {
          const excelMetrics = calculateExcelMetrics(result.results.excel_results);
          successMessage += `Excel: ${excelMetrics.cleanRows} clean records from ${excelMetrics.totalRows} total. `;
        }

        if (result.results?.pdf_results) {
          const pdfMetrics = calculatePDFMetrics(result.results.pdf_results);
          successMessage += `PDF: ${pdfMetrics.processedRows} processed records from ${pdfMetrics.totalPdfRows} total. `;
        }

        if (result.results?.csv_results) {
          const csvMetrics = calculateCSVMetrics(result.results.csv_results);
          successMessage += `CSV: ${csvMetrics.cleanRows} clean records from ${csvMetrics.totalRows} total.`;
        }

        toast.success(successMessage, { id: 'processing' });
      } else {
        toast.error(`Processing failed: ${result.error}`, { id: 'processing' });
      }

    } catch (error) {
      console.error('Upload error:', error);
      toast.error(`Failed to process files: ${error.message}`, { id: 'processing' });
      setUploadResult({
        success: false,
        error: error.message
      });
    } finally {
      setUploading(false);
    }
  };

  // Remove specific file
  const removeFile = (fileId) => {
    const fileToRemove = selectedFiles.find(f => f.id === fileId);
    setSelectedFiles(prev => prev.filter(f => f.id !== fileId));
    if (fileToRemove) {
      toast.success(`${fileToRemove.fileType.toUpperCase()} file removed`);
    }
  };

  // Clear all files
  const clearAll = () => {
    setSelectedFiles([]);
    setUploadResult(null);
    toast.success('All files cleared');
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Multi-File Data Processor
          </h2>
          <p className="text-gray-600">
            Upload XML, JSON (Master Data), Excel, PDF, and/or CSV files for comprehensive data processing and validation.
          </p>
        </div>

        <div className="p-6">
          {/* File Requirements Notice - Updated */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900 mb-2">Supported File Types & Processing:</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-sm text-blue-800">
              <div>
                <h4 className="font-medium mb-1">XML + JSON Processing:</h4>
                <ul className="text-xs space-y-1">
                  <li>• XML: Credit card transactions</li>
                  <li>• JSON: Customer master data</li>
                  <li>• Both files required together</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-1">Excel Processing:</h4>
                <ul className="text-xs space-y-1">
                  <li>• Excel: UPI transaction data</li>
                  <li>• Comprehensive data validation</li>
                  <li>• Standalone processing</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-1">PDF Processing:</h4>
                <ul className="text-xs space-y-1">
                  <li>• PDF: Trade data tables</li>
                  <li>• Multiple extraction methods</li>
                  <li>• OCR support for images</li>
                  <li>• Standalone processing</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-1">CSV Processing:</h4>
                <ul className="text-xs space-y-1">
                  <li>• CSV: Any tabular data</li>
                  <li>• Auto-detects delimiters</li>
                  <li>• Data type detection</li>
                  <li>• Comprehensive cleaning</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-1">Combined Processing:</h4>
                <ul className="text-xs space-y-1">
                  <li>• Multiple file types together</li>
                  <li>• Independent processing</li>
                  <li>• Separate output files</li>
                </ul>
              </div>
            </div>
          </div>

          {/* File Upload Area - Updated */}
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
              transition-colors duration-200 ease-in-out mb-6
              ${isDragActive 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
              }
              ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <input {...getInputProps()} />
            
            <div className="flex flex-col items-center">
              {uploading ? (
                <Loader className="h-12 w-12 mb-4 text-blue-500 animate-spin" />
              ) : (
                <Upload className={`
                  h-12 w-12 mb-4 
                  ${isDragActive ? 'text-blue-500' : 'text-gray-400'}
                `} />
              )}
              
              <div className="text-center">
                <p className="text-lg font-medium text-gray-900 mb-2">
                  {uploading ? 'Processing files...' :
                   isDragActive ? 'Drop your files here' : 'Drag & drop files here'
                  }
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  or click to browse files
                </p>
                <div className="flex flex-wrap justify-center gap-2 text-xs text-gray-500">
                  <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded">XML</span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">JSON</span>
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded">Excel</span>
                  <span className="px-2 py-1 bg-red-100 text-red-700 rounded">PDF</span>
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">CSV</span>
                </div>
              </div>
            </div>
          </div>

          {/* Selected Files Display */}
          {selectedFiles.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Selected Files ({selectedFiles.length})
                </h3>
                <button
                  onClick={clearAll}
                  disabled={uploading}
                  className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
                >
                  <Trash2 className="h-4 w-4" />
                  Clear All
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {selectedFiles.map((fileItem) => {
                  const { icon: Icon, color, bg, border } = getFileIcon(fileItem.fileType);
                  return (
                    <div
                      key={fileItem.id}
                      className={`flex items-center p-4 rounded-lg border ${bg} ${border}`}
                    >
                      <div className="flex-shrink-0 mr-3">
                        <Icon className={`h-6 w-6 ${color}`} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {fileItem.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(fileItem.size)} • {fileItem.fileType.toUpperCase()}
                        </p>
                        <p className="text-xs text-gray-400">
                          Added at {fileItem.addedAt}
                        </p>
                      </div>

                      {!uploading && (
                        <button
                          onClick={() => removeFile(fileItem.id)}
                          className="text-red-500 hover:text-red-700 p-1 ml-2"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Process Button */}
              <div className="mt-6 flex justify-center">
                <button
                  onClick={uploadFiles}
                  disabled={uploading}
                  className={`px-8 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors ${
                    uploading 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  } text-white font-medium`}
                >
                  {uploading ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin inline" />
                      Processing {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''}...
                    </>
                  ) : (
                    `Process ${selectedFiles.length} File${selectedFiles.length !== 1 ? 's' : ''}`
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Processing Results */}
        {uploadResult && (
          <div className="p-6 border-t">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Processing Results
            </h3>
            
            <div className={`
              p-4 rounded-lg border mb-6
              ${uploadResult.success 
                ? 'border-green-200 bg-green-50' 
                : 'border-red-200 bg-red-50'
              }
            `}>
              <div className="flex items-start">
                <div className="flex-shrink-0 mr-3">
                  {uploadResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  {uploadResult.success ? (
                    <div className="text-sm text-green-700">
                      <p className="font-medium mb-3">✓ Multi-file processing completed successfully!</p>
                      
                      <div className="text-xs text-green-600 mb-4">
                        <p>Processing Time: <span className="font-medium">{uploadResult.processing_time}</span></p>
                        <p>Files Processed: <span className="font-medium">{Object.keys(uploadResult.files_processed || {}).join(', ')}</span></p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-red-700">
                      <p className="font-medium">✗ Processing failed</p>
                      <p className="mt-1 text-xs bg-red-100 p-2 rounded">{uploadResult.error}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* XML Results */}
            {uploadResult.success && uploadResult.results?.xml_results && (
              <div className="mb-6">
                <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                  <FileText className="h-4 w-4 text-orange-500 mr-2" />
                  XML Processing Results
                </h4>
                
                {(() => {
                  const xmlResults = uploadResult.results.xml_results;
                  const metrics = calculateXMLMetrics(xmlResults);
                  
                  return (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                      {/* XML Processing Summary */}
                      <div className="bg-orange-50 p-3 rounded border border-orange-200">
                        <h5 className="font-medium text-orange-800 mb-2 flex items-center">
                          <FileSpreadsheet className="h-4 w-4 mr-1" />
                          XML Summary
                        </h5>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span>XML Customers:</span>
                            <span className="font-medium">{xmlResults.xml_customers?.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Master Customers:</span>
                            <span className="font-medium">{xmlResults.master_customers?.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Cleaned Records:</span>
                            <span className="font-medium text-green-600">{xmlResults.cleaned_data?.length || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Error Records:</span>
                            <span className="font-medium text-red-600">{xmlResults.error_log?.length || 0}</span>
                          </div>
                        </div>
                      </div>

                      {/* XML Success Metrics */}
                      {metrics && (
                        <>
                          <div className="bg-blue-50 p-3 rounded border border-blue-200">
                            <h5 className="font-medium text-blue-800 mb-2 flex items-center">
                              <TrendingUp className="h-4 w-4 mr-1" />
                              Success Metrics
                            </h5>
                            <div className="space-y-1 text-xs">
                              <div className="flex justify-between">
                                <span>XML Success Rate:</span>
                                <span className="font-medium text-green-600">{metrics.xmlSuccessRate}%</span>
                              </div>
                              <div className="text-xs text-blue-700 italic">
                                (Cleaned / XML Customers)
                              </div>
                              <div className="flex justify-between mt-2">
                                <span>Coverage Rate:</span>
                                <span className="font-medium text-purple-600">{metrics.coverageRate}%</span>
                              </div>
                            </div>
                          </div>

                          <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                            <h5 className="font-medium text-yellow-800 mb-2 flex items-center">
                              <TrendingDown className="h-4 w-4 mr-1" />
                              Missing Analysis
                            </h5>
                            <div className="space-y-1 text-xs">
                              <div className="flex justify-between">
                                <span>Missing Rate:</span>
                                <span className="font-medium text-orange-600">{metrics.missingRate}%</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Missing Customers:</span>
                                <span className="font-medium text-red-600">{metrics.missingFromXmlCount.toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Excel Results */}
            {uploadResult.success && uploadResult.results?.excel_results && (
              <div className="mb-6">
                <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                  <FileSpreadsheet className="h-4 w-4 text-green-500 mr-2" />
                  Excel Processing Results
                </h4>
                
                {(() => {
                  const excelResults = uploadResult.results.excel_results;
                  const metrics = calculateExcelMetrics(excelResults);
                  
                  return (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                      {/* Excel Processing Summary */}
                      <div className="bg-green-50 p-3 rounded border border-green-200">
                        <h5 className="font-medium text-green-800 mb-2 flex items-center">
                          <BarChart3 className="h-4 w-4 mr-1" />
                          Excel Summary
                        </h5>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span>Total Rows:</span>
                            <span className="font-medium">{metrics.totalRows.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Clean Rows:</span>
                            <span className="font-medium text-green-600">{metrics.cleanRows.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Error Rows:</span>
                            <span className="font-medium text-red-600">{metrics.errorRows.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Success Rate:</span>
                            <span className="font-medium text-blue-600">{metrics.successRate}%</span>
                          </div>
                        </div>
                      </div>

                      {/* Column Information */}
                      <div className="bg-blue-50 p-3 rounded border border-blue-200">
                        <h5 className="font-medium text-blue-800 mb-2">Columns Processed</h5>
                        <div className="text-xs">
                          <p className="font-medium mb-1">Total Columns: {excelResults.columns_processed?.length || 0}</p>
                          <div className="max-h-20 overflow-y-auto">
                            {excelResults.columns_processed?.slice(0, 5).map((col, idx) => (
                              <div key={idx} className="text-blue-700">• {col}</div>
                            ))}
                            {excelResults.columns_processed?.length > 5 && (
                              <div className="text-blue-600 italic">... and {excelResults.columns_processed.length - 5} more</div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Error Breakdown */}
                      <div className="bg-red-50 p-3 rounded border border-red-200">
                        <h5 className="font-medium text-red-800 mb-2">Error Breakdown</h5>
                        <div className="text-xs max-h-20 overflow-y-auto">
                          {Object.entries(metrics.errorInfo || {}).filter(([_, count]) => count > 0).slice(0, 4).map(([column, count], idx) => (
                            <div key={idx} className="flex justify-between">
                              <span className="text-red-700 truncate">{column}:</span>
                              <span className="font-medium text-red-600">{count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* PDF Results */}
            {uploadResult.success && uploadResult.results?.pdf_results && (
              <div className="mb-6">
                <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                  <FileImage className="h-4 w-4 text-red-500 mr-2" />
                  PDF Processing Results
                </h4>
                
                {(() => {
                  const pdfResults = uploadResult.results.pdf_results;
                  const metrics = calculatePDFMetrics(pdfResults);
                  
                  return (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                      {/* PDF Processing Summary */}
                      <div className="bg-red-50 p-3 rounded border border-red-200">
                        <h5 className="font-medium text-red-800 mb-2 flex items-center">
                          <FileImage className="h-4 w-4 mr-1" />
                          PDF Summary
                        </h5>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span>Tables Found:</span>
                            <span className="font-medium">{metrics.tablesFound}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Total PDF Rows:</span>
                            <span className="font-medium">{metrics.totalPdfRows.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Processed Rows:</span>
                            <span className="font-medium text-green-600">{metrics.processedRows.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Error Rows:</span>
                            <span className="font-medium text-red-600">{metrics.errorRows.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* PDF Success Metrics */}
                      <div className="bg-purple-50 p-3 rounded border border-purple-200">
                        <h5 className="font-medium text-purple-800 mb-2 flex items-center">
                          <TrendingUp className="h-4 w-4 mr-1" />
                          Processing Metrics
                        </h5>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span>Success Rate:</span>
                            <span className="font-medium text-green-600">{metrics.successRate}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Extraction Method:</span>
                            <span className="font-medium text-blue-600">{metrics.extractionMethod}</span>
                          </div>
                        </div>
                      </div>

                      {/* Extracted Columns */}
                      <div className="bg-indigo-50 p-3 rounded border border-indigo-200">
                        <h5 className="font-medium text-indigo-800 mb-2">Extracted Columns</h5>
                        <div className="text-xs max-h-20 overflow-y-auto">
                          {metrics.columnsExtracted?.slice(0, 5).map((col, idx) => (
                            <div key={idx} className="text-indigo-700">• {col}</div>
                          ))}
                          {metrics.columnsExtracted?.length > 5 && (
                            <div className="text-indigo-600 italic">... and {metrics.columnsExtracted.length - 5} more</div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* CSV Results - NEW */}
            {uploadResult.success && uploadResult.results?.csv_results && (
              <div className="mb-6">
                <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                  <BarChart3 className="h-4 w-4 text-purple-500 mr-2" />
                  CSV Processing Results
                </h4>
                
                {(() => {
                  const csvResults = uploadResult.results.csv_results;
                  const metrics = calculateCSVMetrics(csvResults);
                  
                  return (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                      {/* CSV Processing Summary */}
                      <div className="bg-purple-50 p-3 rounded border border-purple-200">
                        <h5 className="font-medium text-purple-800 mb-2 flex items-center">
                          <BarChart3 className="h-4 w-4 mr-1" />
                          CSV Summary
                        </h5>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span>Total Rows:</span>
                            <span className="font-medium">{metrics.totalRows.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Clean Rows:</span>
                            <span className="font-medium text-green-600">{metrics.cleanRows.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Error Rows:</span>
                            <span className="font-medium text-red-600">{metrics.errorRows.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Success Rate:</span>
                            <span className="font-medium text-blue-600">{metrics.successRate}%</span>
                          </div>
                        </div>
                      </div>

                      {/* Data Cleaning Stats */}
                      <div className="bg-indigo-50 p-3 rounded border border-indigo-200">
                        <h5 className="font-medium text-indigo-800 mb-2">Data Cleaning</h5>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span>Duplicates Removed:</span>
                            <span className="font-medium text-orange-600">{metrics.duplicatesRemoved}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Empty Rows Removed:</span>
                            <span className="font-medium text-red-600">{metrics.emptyRowsRemoved}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Delimiter:</span>
                            <span className="font-medium">{metrics.fileInfo.delimiter || 'Auto-detected'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Encoding:</span>
                            <span className="font-medium">{metrics.fileInfo.encoding || 'Auto-detected'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Column Types */}
                      <div className="bg-teal-50 p-3 rounded border border-teal-200">
                        <h5 className="font-medium text-teal-800 mb-2">Column Analysis</h5>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span>Numeric Columns:</span>
                            <span className="font-medium text-blue-600">{metrics.columnTypes.numeric?.length || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Date Columns:</span>
                            <span className="font-medium text-green-600">{metrics.columnTypes.date?.length || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Text Columns:</span>
                            <span className="font-medium text-purple-600">{metrics.columnTypes.text?.length || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Total Columns:</span>
                            <span className="font-medium">{csvResults.columns_processed?.length || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Output Files - Updated */}
            {uploadResult.success && uploadResult.output_files && (
              <div className="bg-gray-100 p-4 rounded">
                <h4 className="font-medium text-gray-800 mb-3">Output Files Generated</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                  
                  {/* XML Output Files */}
                  {uploadResult.output_files.xml_files && (
                    <div>
                      <h5 className="font-medium text-gray-700 mb-2">XML Processing Files:</h5>
                      <div className="space-y-1">
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                          <span className="text-green-700 font-mono">cleaned_customers_final.json</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                          <span className="text-red-700 font-mono">error_log_final.json</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Excel Output Files */}
                  {uploadResult.output_files.excel_files && (
                    <div>
                      <h5 className="font-medium text-gray-700 mb-2">Excel Processing Files:</h5>
                      <div className="space-y-1">
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                          <span className="text-green-700 font-mono">clean_excel_data.json</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                          <span className="text-red-700 font-mono">excel_errors.json</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* PDF Output Files */}
                  {uploadResult.output_files.pdf_files && (
                    <div>
                      <h5 className="font-medium text-gray-700 mb-2">PDF Processing Files:</h5>
                      <div className="space-y-1">
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                          <span className="text-green-700 font-mono">processed_pdf_data.json</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                          <span className="text-red-700 font-mono">pdf_errors.json</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* CSV Output Files - NEW */}
                  {uploadResult.output_files.csv_files && (
                    <div>
                      <h5 className="font-medium text-gray-700 mb-2">CSV Processing Files:</h5>
                      <div className="space-y-1">
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                          <span className="text-green-700 font-mono">clean_csv_data.json</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                          <span className="text-red-700 font-mono">csv_errors.json</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="col-span-1 md:col-span-4 text-gray-600 italic mt-2">
                    📁 All files saved in: <code>backend/output/</code> directory<br/>
                    📁 Uploaded files stored in: <code>backend/data/</code> directory
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Processing Information - Updated */}
        <div className="p-6 border-t bg-gray-50">
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            Multi-File Processing Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-sm text-gray-600">
            <div>
              <h5 className="font-medium text-gray-800 mb-2">XML Processing</h5>
              <ul className="space-y-1">
                <li>• Requires JSON master data for validation</li>
                <li>• Cross-validation between XML and master data</li>
                <li>• Median imputation for missing values</li>
                <li>• Credit card transaction analysis</li>
                <li>• Comprehensive error logging</li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium text-gray-800 mb-2">Excel Processing</h5>
              <ul className="space-y-1">
                <li>• UPI transaction data validation</li>
                <li>• Transaction ID format checking</li>
                <li>• Timestamp and status validation</li>
                <li>• Device and network type verification</li>
                <li>• Column-wise error tracking</li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium text-gray-800 mb-2">PDF Processing</h5>
              <ul className="space-y-1">
                <li>• Standalone processing (no master data required)</li>
                <li>• Multiple extraction methods (tabula, camelot, OCR)</li>
                <li>• Automatic table detection and extraction</li>
                <li>• Image-based PDF support with OCR</li>
                <li>• Smart data quality validation</li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium text-gray-800 mb-2">CSV Processing</h5>
              <ul className="space-y-1">
                <li>• Automatic delimiter and encoding detection</li>
                <li>• Intelligent data type detection</li>
                <li>• Comprehensive data cleaning and validation</li>
                <li>• Duplicate and empty row removal</li>
                <li>• Column-wise statistics and quality scoring</li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium text-gray-800 mb-2">Combined Benefits</h5>
              <ul className="space-y-1">
                <li>• Process multiple file types simultaneously</li>
                <li>• Independent processing for each type</li>
                <li>• Separate output files for each processor</li>
                <li>• Comprehensive error reporting</li>
                <li>• Real-time progress tracking</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadForm;
