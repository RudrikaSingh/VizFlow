import axios from 'axios';

// Base API configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error);
    
    // Handle specific error cases
    if (error.response?.status === 401) {
      // Unauthorized - remove token and redirect to login
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// Upload API
export const uploadAPI = {
  // Upload file (multi-format support)
  uploadFile: async (file, options = {}) => {
    const formData = new FormData();
    formData.append('file', file);
    
    // Add file type if specified
    if (options.fileType) {
      formData.append('fileType', options.fileType);
    }
    
    // Add any additional options (excluding functions and file type)
    Object.keys(options).forEach(key => {
      if (key !== 'onUploadProgress' && key !== 'fileType' && options[key] !== undefined) {
        formData.append(key, typeof options[key] === 'object' ? JSON.stringify(options[key]) : options[key]);
      }
    });

    const response = await api.post('/upload/file', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: options.onUploadProgress,
      timeout: 120000, // 2 minutes for large file processing
    });
    return response.data;
  },

  // Get supported file formats
  getSupportedFormats: async () => {
    const response = await api.get('/upload/formats');
    return response.data;
  },

  // Upload cleaned data (legacy)
  uploadCleaned: async (data, metadata = {}) => {
    const response = await api.post('/upload/cleaned', {
      data,
      metadata
    });
    return response.data;
  },

  // Upload error data (legacy)
  uploadErrors: async (data, metadata = {}) => {
    const response = await api.post('/upload/errors', {
      data,
      metadata
    });
    return response.data;
  },

  // Get upload status
  getStatus: async () => {
    const response = await api.get('/upload/status');
    return response.data;
  }
};

// Customers API
export const customersAPI = {
  // Get customers with pagination and filters
  getCustomers: async (params = {}) => {
    const response = await api.get('/customers', { params });
    return response.data;
  },

  // Get customer by ID
  getCustomerById: async (id) => {
    const response = await api.get(`/customers/${id}`);
    return response.data;
  },

  // Get customer statistics
  getCustomerStats: async (params = {}) => {
    const response = await api.get('/customers/stats/summary', { params });
    return response.data;
  },

  // Get unique field values
  getUniqueFieldValues: async (field) => {
    const response = await api.get('/customers/fields/unique', {
      params: { field }
    });
    return response.data;
  }
};

// Errors API
export const errorsAPI = {
  // Get error logs with pagination and filters
  getErrors: async (params = {}) => {
    const response = await api.get('/errors', { params });
    return response.data;
  },

  // Get error by ID
  getErrorById: async (id) => {
    const response = await api.get(`/errors/${id}`);
    return response.data;
  },

  // Get error statistics
  getErrorStats: async (params = {}) => {
    const response = await api.get('/errors/stats/summary', { params });
    return response.data;
  },

  // Update error status
  updateErrorStatus: async (id, status, resolvedBy, resolutionNotes) => {
    const response = await api.patch(`/errors/${id}/status`, {
      status,
      resolvedBy,
      resolutionNotes
    });
    return response.data;
  },

  // Get unique field values
  getUniqueFieldValues: async (field) => {
    const response = await api.get('/errors/fields/unique', {
      params: { field }
    });
    return response.data;
  }
};

// Download API
export const downloadAPI = {
  // Download customers data
  downloadCustomers: async (params = {}) => {
    const response = await api.get('/download/customers', {
      params,
      responseType: 'blob'
    });
    return response;
  },

  // Download error logs
  downloadErrors: async (params = {}) => {
    const response = await api.get('/download/errors', {
      params,
      responseType: 'blob'
    });
    return response;
  },

  // Download combined data
  downloadCombined: async (params = {}) => {
    const response = await api.get('/download/combined', {
      params,
      responseType: 'blob'
    });
    return response;
  },

  // Download summary report
  downloadSummary: async (params = {}) => {
    const response = await api.get('/download/summary', {
      params,
      responseType: 'blob'
    });
    return response;
  },

  // Get available formats
  getFormats: async () => {
    const response = await api.get('/download/formats');
    return response.data;
  }
};

// General API functions
export const generalAPI = {
  // Health check
  healthCheck: async () => {
    const response = await api.get('/health');
    return response.data;
  },

  // Get API info
  getApiInfo: async () => {
    const response = await axios.get(API_BASE_URL.replace('/api', ''));
    return response.data;
  }
};

// Utility function to handle file downloads
export const handleFileDownload = (response, defaultFilename = 'download') => {
  try {
    // Get filename from response headers
    const contentDisposition = response.headers['content-disposition'];
    let filename = defaultFilename;
    
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+)"/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }

    // Create blob and download
    const blob = new Blob([response.data], {
      type: response.headers['content-type']
    });
    
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return { success: true, filename };
  } catch (error) {
    console.error('Download error:', error);
    return { success: false, error: error.message };
  }
};

export default api;