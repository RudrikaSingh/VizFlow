import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { clsx } from 'clsx';

/**
 * Utility function for conditional class names
 */
export const cn = (...inputs) => {
  return clsx(inputs);
};

/**
 * Date formatting utilities
 */
export const dateUtils = {
  // Format date to readable string
  formatDate: (date, formatStr = 'MMM dd, yyyy') => {
    if (!date) return 'N/A';
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, formatStr);
  },

  // Format date and time
  formatDateTime: (date, formatStr = 'MMM dd, yyyy HH:mm') => {
    if (!date) return 'N/A';
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, formatStr);
  },

  // Get relative time (e.g., "2 hours ago")
  getRelativeTime: (date) => {
    if (!date) return 'N/A';
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return formatDistanceToNow(dateObj, { addSuffix: true });
  },

  // Check if date is today
  isToday: (date) => {
    if (!date) return false;
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    const today = new Date();
    return dateObj.toDateString() === today.toDateString();
  }
};

/**
 * Number formatting utilities
 */
export const numberUtils = {
  // Format number with commas
  formatNumber: (num) => {
    if (num == null) return '0';
    return new Intl.NumberFormat().format(num);
  },

  // Format percentage
  formatPercentage: (num, decimals = 1) => {
    if (num == null) return '0%';
    return `${Number(num).toFixed(decimals)}%`;
  },

  // Calculate percentage
  calculatePercentage: (part, total) => {
    if (!total || total === 0) return 0;
    return (part / total) * 100;
  }
};

/**
 * String utilities
 */
export const stringUtils = {
  // Truncate string with ellipsis
  truncate: (str, length = 50) => {
    if (!str) return '';
    if (str.length <= length) return str;
    return str.substring(0, length) + '...';
  },

  // Capitalize first letter
  capitalize: (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  },

  // Convert to title case
  toTitleCase: (str) => {
    if (!str) return '';
    return str.replace(/\w\S*/g, (txt) => 
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
  },

  // Generate initials from name
  getInitials: (name) => {
    if (!name) return '';
    return name.split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }
};

/**
 * Color utilities for charts and UI
 */
export const colorUtils = {
  // Get color by error type
  getErrorTypeColor: (errorType) => {
    const colors = {
      'MISSING_FIELD': '#ef4444',
      'INVALID_FORMAT': '#f59e0b',
      'DUPLICATE_RECORD': '#8b5cf6',
      'VALIDATION_ERROR': '#ec4899',
      'PARSING_ERROR': '#06b6d4',
      'DATA_TYPE_ERROR': '#84cc16',
      'BUSINESS_RULE_ERROR': '#f97316'
    };
    return colors[errorType] || '#6b7280';
  },

  // Get color by source format
  getSourceFormatColor: (format) => {
    const colors = {
      'CSV': '#22c55e',
      'Excel': '#3b82f6',
      'XML': '#f59e0b',
      'JSON': '#8b5cf6',
      'PDF': '#ef4444'
    };
    return colors[format] || '#6b7280';
  },

  // Get color by status
  getStatusColor: (status) => {
    const colors = {
      'RESOLVED': '#22c55e',
      'UNRESOLVED': '#ef4444',
      'IGNORED': '#6b7280'
    };
    return colors[status] || '#6b7280';
  },

  // Generate random color
  getRandomColor: () => {
    const colors = [
      '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', 
      '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }
};

/**
 * File utilities
 */
export const fileUtils = {
  // Format file size
  formatFileSize: (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  // Get file extension
  getFileExtension: (filename) => {
    if (!filename) return '';
    return filename.split('.').pop().toLowerCase();
  },

  // Validate file type
  isValidFileType: (filename, allowedTypes = ['json']) => {
    const extension = fileUtils.getFileExtension(filename);
    return allowedTypes.includes(extension);
  }
};

/**
 * URL utilities
 */
export const urlUtils = {
  // Build query string from object
  buildQueryString: (params) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        searchParams.append(key, value);
      }
    });
    return searchParams.toString();
  },

  // Parse query string to object
  parseQueryString: (queryString) => {
    const params = new URLSearchParams(queryString);
    const result = {};
    for (const [key, value] of params.entries()) {
      result[key] = value;
    }
    return result;
  }
};

/**
 * Validation utilities
 */
export const validationUtils = {
  // Validate email
  isValidEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Validate phone number
  isValidPhone: (phone) => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  },

  // Check if object is empty
  isEmpty: (obj) => {
    return Object.keys(obj).length === 0;
  },

  // Check if value is null or undefined
  isNullOrUndefined: (value) => {
    return value === null || value === undefined;
  }
};

/**
 * Local storage utilities
 */
export const storageUtils = {
  // Set item in localStorage
  setItem: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  },

  // Get item from localStorage
  getItem: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return defaultValue;
    }
  },

  // Remove item from localStorage
  removeItem: (key) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  }
};

/**
 * Array utilities
 */
export const arrayUtils = {
  // Group array by key
  groupBy: (array, key) => {
    return array.reduce((groups, item) => {
      const group = item[key];
      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push(item);
      return groups;
    }, {});
  },

  // Sort array by key
  sortBy: (array, key, order = 'asc') => {
    return [...array].sort((a, b) => {
      const aVal = a[key];
      const bVal = b[key];
      
      if (order === 'desc') {
        return bVal > aVal ? 1 : -1;
      }
      return aVal > bVal ? 1 : -1;
    });
  },

  // Get unique values from array
  unique: (array, key = null) => {
    if (key) {
      return array.filter((item, index, self) => 
        index === self.findIndex(t => t[key] === item[key])
      );
    }
    return [...new Set(array)];
  }
};