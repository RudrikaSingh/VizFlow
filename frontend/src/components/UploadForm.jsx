import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, AlertCircle, CheckCircle, X, File, Image, Database, FileSpreadsheet, FileImage, Package } from 'lucide-react';
import { uploadAPI } from '../services/api';
import toast from 'react-hot-toast';

const UploadForm = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState([]);
  const [supportedFormats, setSupportedFormats] = useState({});
  const [uploadProgress, setUploadProgress] = useState({});
  const [selectedFileType, setSelectedFileType] = useState('');

  // Load supported formats on component mount
  useEffect(() => {
    const fetchSupportedFormats = async () => {
      try {
        const response = await uploadAPI.getSupportedFormats();
        setSupportedFormats(response.data || {});
      } catch (error) {
        console.error('Failed to fetch supported formats:', error);
      }
    };
    
    fetchSupportedFormats();
  }, []);

  // File type options for dropdown
  const fileTypeOptions = [
    { value: '', label: 'Auto-detect file type', icon: Package },
    { value: 'csv', label: 'CSV File', icon: FileSpreadsheet, accept: '.csv', description: 'Comma-separated values file' },
    { value: 'excel', label: 'Excel File', icon: FileSpreadsheet, accept: '.xlsx,.xls', description: 'Microsoft Excel spreadsheet' },
    { value: 'xml', label: 'XML File', icon: FileText, accept: '.xml', description: 'Extensible Markup Language file' },
    { value: 'pdf', label: 'PDF File', icon: FileText, accept: '.pdf', description: 'Portable Document Format' },
    { value: 'image', label: 'Image File', icon: FileImage, accept: '.jpg,.jpeg,.png,.gif,.bmp,.tiff', description: 'Image file (OCR processing)' },
    { value: 'json', label: 'JSON File', icon: Database, accept: '.json', description: 'JavaScript Object Notation (legacy)' }
  ];

  // Handle file drop
  const onDrop = useCallback(async (acceptedFiles) => {
    setUploading(true);
    const results = [];

    for (const file of acceptedFiles) {
      try {
        // Update progress
        setUploadProgress(prev => ({
          ...prev,
          [file.name]: { status: 'uploading', progress: 0 }
        }));

        // Determine file type
        const fileType = selectedFileType || detectFileType(file);
        
        // Update progress to processing
        setUploadProgress(prev => ({
          ...prev,
          [file.name]: { status: 'processing', progress: 50 }
        }));

        // Upload and process file
        const result = await uploadAPI.uploadFile(file, {
          fileType: fileType,
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 50) / progressEvent.total);
            setUploadProgress(prev => ({
              ...prev,
              [file.name]: { status: 'uploading', progress: percentCompleted }
            }));
          }
        });

        // Update progress to complete
        setUploadProgress(prev => ({
          ...prev,
          [file.name]: { status: 'completed', progress: 100 }
        }));

        results.push({
          filename: file.name,
          success: result.success,
          response: result,
          fileType: fileType
        });

        if (result.success) {
          toast.success(`${file.name} processed successfully! ${result.summary?.successfulInserts || 0} records saved.`);
        } else {
          toast.error(`${file.name} processing completed with errors.`);
        }

      } catch (error) {
        console.error('Upload error:', error);
        
        setUploadProgress(prev => ({
          ...prev,
          [file.name]: { status: 'error', progress: 0 }
        }));

        results.push({
          filename: file.name,
          success: false,
          error: error.response?.data?.message || error.message,
          fileType: selectedFileType || detectFileType(file)
        });

        toast.error(`Failed to process ${file.name}: ${error.response?.data?.message || error.message}`);
      }
    }

    setUploadResults(results);
    setUploading(false);
    setUploadProgress({});
  }, [selectedFileType]);

  // Auto-detect file type based on file extension and mime type
  const detectFileType = (file) => {
    const extension = file.name.split('.').pop().toLowerCase();
    const mimeType = file.type;

    if (extension === 'csv' || mimeType === 'text/csv') return 'csv';
    if (extension === 'xlsx' || extension === 'xls' || mimeType.includes('spreadsheet')) return 'excel';
    if (extension === 'xml' || mimeType === 'text/xml') return 'xml';
    if (extension === 'pdf' || mimeType === 'application/pdf') return 'pdf';
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff'].includes(extension) || mimeType.startsWith('image/')) return 'image';
    if (extension === 'json' || mimeType === 'application/json') return 'json';
    
    return 'unknown';
  };

  // Get accept types based on selected file type
  const getAcceptTypes = () => {
    if (!selectedFileType) {
      return {
        'text/csv': ['.csv'],
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
        'application/vnd.ms-excel': ['.xls'],
        'text/xml': ['.xml'],
        'application/xml': ['.xml'],
        'application/pdf': ['.pdf'],
        'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff'],
        'application/json': ['.json']
      };
    }

    const selectedOption = fileTypeOptions.find(opt => opt.value === selectedFileType);
    if (selectedOption?.accept) {
      const extensions = selectedOption.accept.split(',');
      return {
        '*': extensions
      };
    }

    return {};
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: getAcceptTypes(),
    multiple: true,
    disabled: uploading
  });

  const clearResults = () => {
    setUploadResults([]);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Upload Data Files
          </h2>
          <p className="text-gray-600">
            Upload JSON files containing processed customer data or error logs.
          </p>
        </div>

        <div className="p-6">
          {/* File Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              File Type Selection
            </label>
            <div className="relative">
              <select
                value={selectedFileType}
                onChange={(e) => setSelectedFileType(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                disabled={uploading}
              >
                {fileTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <div className="mt-2 text-sm text-gray-600">
                {selectedFileType ? (
                  <>
                    {fileTypeOptions.find(opt => opt.value === selectedFileType)?.description}
                    {fileTypeOptions.find(opt => opt.value === selectedFileType)?.accept && (
                      <span className="block text-xs text-gray-500 mt-1">
                        Accepted formats: {fileTypeOptions.find(opt => opt.value === selectedFileType)?.accept}
                      </span>
                    )}
                  </>
                ) : (
                  'File type will be automatically detected based on file extension and content'
                )}
              </div>
            </div>
          </div>

          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
              transition-colors duration-200 ease-in-out
              ${isDragActive 
                ? 'border-primary-500 bg-primary-50' 
                : 'border-gray-300 hover:border-gray-400'
              }
              ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <input {...getInputProps()} />
            
            <div className="flex flex-col items-center">
              <Upload className={`
                h-12 w-12 mb-4 
                ${isDragActive ? 'text-primary-500' : 'text-gray-400'}
              `} />
              
              {uploading ? (
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Processing files...</p>
                  <div className="mt-4 space-y-2">
                    {Object.entries(uploadProgress).map(([filename, progress]) => (
                      <div key={filename} className="text-left">
                        <div className="flex items-center justify-between text-sm">
                          <span className="truncate text-gray-700">{filename}</span>
                          <span className="text-gray-500 capitalize">{progress.status}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              progress.status === 'error' ? 'bg-red-500' :
                              progress.status === 'completed' ? 'bg-green-500' :
                              'bg-blue-500'
                            }`}
                            style={{ width: `${progress.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    {isDragActive 
                      ? `Drop your ${selectedFileType ? fileTypeOptions.find(opt => opt.value === selectedFileType)?.label : 'files'} here` 
                      : `Drag & drop ${selectedFileType ? fileTypeOptions.find(opt => opt.value === selectedFileType)?.label : 'files'} here`
                    }
                  </p>
                  <p className="text-sm text-gray-600 mb-4">
                    or click to browse files
                  </p>
                  <p className="text-xs text-gray-500">
                    {selectedFileType 
                      ? `Supports ${fileTypeOptions.find(opt => opt.value === selectedFileType)?.accept || 'selected format'}` 
                      : 'Supports CSV, Excel, XML, PDF, Images, and JSON files'
                    }
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Upload Results */}
          {uploadResults.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Upload Results
                </h3>
                <button
                  onClick={clearResults}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Clear Results
                </button>
              </div>

              <div className="space-y-3">
                {uploadResults.map((result, index) => (
                  <div
                    key={index}
                    className={`
                      flex items-start p-4 rounded-lg border
                      ${result.success 
                        ? 'border-success-200 bg-success-50' 
                        : 'border-error-200 bg-error-50'
                      }
                    `}
                  >
                    <div className="flex-shrink-0 mr-3">
                      {result.success ? (
                        <CheckCircle className="h-5 w-5 text-success-500" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-error-500" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          {result.fileType === 'csv' && <FileSpreadsheet className="h-4 w-4 text-green-500 mr-2" />}
                          {result.fileType === 'excel' && <FileSpreadsheet className="h-4 w-4 text-blue-500 mr-2" />}
                          {result.fileType === 'xml' && <FileText className="h-4 w-4 text-orange-500 mr-2" />}
                          {result.fileType === 'pdf' && <FileText className="h-4 w-4 text-red-500 mr-2" />}
                          {result.fileType === 'image' && <FileImage className="h-4 w-4 text-purple-500 mr-2" />}
                          {result.fileType === 'json' && <Database className="h-4 w-4 text-gray-500 mr-2" />}
                          {!['csv', 'excel', 'xml', 'pdf', 'image', 'json'].includes(result.fileType) && <File className="h-4 w-4 text-gray-400 mr-2" />}
                          <p className="text-sm font-medium text-gray-900">
                            {result.filename}
                          </p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          result.fileType === 'csv' ? 'bg-green-100 text-green-800' :
                          result.fileType === 'excel' ? 'bg-blue-100 text-blue-800' :
                          result.fileType === 'xml' ? 'bg-orange-100 text-orange-800' :
                          result.fileType === 'pdf' ? 'bg-red-100 text-red-800' :
                          result.fileType === 'image' ? 'bg-purple-100 text-purple-800' :
                          result.fileType === 'json' ? 'bg-gray-100 text-gray-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {result.fileType?.toUpperCase() || 'UNKNOWN'}
                        </span>
                      </div>

                      {result.success ? (
                        <div className="mt-2 text-sm text-green-700">
                          <p>✓ Processing completed successfully</p>
                          {result.response?.summary && (
                            <div className="mt-2 space-y-1 text-xs bg-green-50 p-2 rounded">
                              <div className="flex justify-between">
                                <span>Records processed:</span>
                                <span className="font-medium">{result.response.summary.totalRecords || 0}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Successfully saved:</span>
                                <span className="font-medium text-green-600">{result.response.summary.successfulInserts || 0}</span>
                              </div>
                              {(result.response.summary.failedRecords || 0) > 0 && (
                                <div className="flex justify-between">
                                  <span>Failed records:</span>
                                  <span className="font-medium text-red-600">{result.response.summary.failedRecords}</span>
                                </div>
                              )}
                              <div className="flex justify-between">
                                <span>Processor used:</span>
                                <span className="font-medium">{result.response.summary.processor || 'Unknown'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Processing time:</span>
                                <span className="font-medium">{result.response.summary.processingTime || 'N/A'}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="mt-2 text-sm text-red-700">
                          <p>✗ Processing failed</p>
                          <p className="mt-1 text-xs bg-red-50 p-2 rounded">{result.error}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Guidelines */}
          <div className="mt-8 bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">
              Supported File Types & Processing
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <h5 className="font-medium text-gray-800 mb-2">Data Files</h5>
                <ul className="space-y-1">
                  <li className="flex items-center">
                    <FileSpreadsheet className="h-3 w-3 text-green-500 mr-2" />
                    <span>CSV - Comma-separated values</span>
                  </li>
                  <li className="flex items-center">
                    <FileSpreadsheet className="h-3 w-3 text-blue-500 mr-2" />
                    <span>Excel - .xlsx, .xls spreadsheets</span>
                  </li>
                  <li className="flex items-center">
                    <FileText className="h-3 w-3 text-orange-500 mr-2" />
                    <span>XML - Structured data files</span>
                  </li>
                </ul>
              </div>
              <div>
                <h5 className="font-medium text-gray-800 mb-2">Document Files</h5>
                <ul className="space-y-1">
                  <li className="flex items-center">
                    <FileText className="h-3 w-3 text-red-500 mr-2" />
                    <span>PDF - Text extraction processing</span>
                  </li>
                  <li className="flex items-center">
                    <FileImage className="h-3 w-3 text-purple-500 mr-2" />
                    <span>Images - OCR text recognition</span>
                  </li>
                  <li className="flex items-center">
                    <Database className="h-3 w-3 text-gray-500 mr-2" />
                    <span>JSON - Direct data insertion</span>
                  </li>
                </ul>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-200">
              <h5 className="font-medium text-gray-800 mb-2">Processing Information</h5>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Files are processed using AI-powered Python models</li>
                <li>• Extracted data is converted to structured JSON format</li>
                <li>• Data is automatically validated and stored in database</li>
                <li>• Processing progress is shown in real-time</li>
                <li>• Maximum file size: 50MB per file</li>
                <li>• Multiple files can be processed simultaneously</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadForm;