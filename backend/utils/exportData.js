const XLSX = require('xlsx');
const { Parser } = require('json2csv');

// Export data to CSV format
const exportToCSV = (data, filename = 'export') => {
  try {
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('No data to export');
    }

    // Flatten nested objects for CSV export
    const flattenedData = data.map(item => flattenObject(item));
    
    // Get all unique fields from the data
    const fields = getAllFields(flattenedData);
    
    const json2csvParser = new Parser({ 
      fields,
      defaultValue: '',
      quote: '"',
      delimiter: ','
    });
    
    const csv = json2csvParser.parse(flattenedData);
    
    return {
      data: csv,
      filename: `${filename}.csv`,
      mimeType: 'text/csv'
    };
  } catch (error) {
    throw new Error(`CSV export failed: ${error.message}`);
  }
};

// Export data to Excel format
const exportToExcel = (data, filename = 'export', sheetName = 'Data') => {
  try {
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('No data to export');
    }

    // Flatten nested objects for Excel export
    const flattenedData = data.map(item => flattenObject(item));
    
    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(flattenedData);
    
    // Auto-size columns
    const colWidths = autoSizeColumns(flattenedData);
    ws['!cols'] = colWidths;
    
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    
    // Generate buffer
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    
    return {
      data: buffer,
      filename: `${filename}.xlsx`,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    };
  } catch (error) {
    throw new Error(`Excel export failed: ${error.message}`);
  }
};

// Export data to JSON format
const exportToJSON = (data, filename = 'export', pretty = true) => {
  try {
    if (!Array.isArray(data)) {
      throw new Error('Data must be an array');
    }

    const jsonString = pretty ? 
      JSON.stringify(data, null, 2) : 
      JSON.stringify(data);
    
    return {
      data: jsonString,
      filename: `${filename}.json`,
      mimeType: 'application/json'
    };
  } catch (error) {
    throw new Error(`JSON export failed: ${error.message}`);
  }
};

// Export multiple sheets to Excel
const exportMultipleSheetsToExcel = (sheets, filename = 'export') => {
  try {
    const wb = XLSX.utils.book_new();
    
    sheets.forEach(({ data, sheetName }) => {
      if (!Array.isArray(data) || data.length === 0) {
        return; // Skip empty sheets
      }
      
      const flattenedData = data.map(item => flattenObject(item));
      const ws = XLSX.utils.json_to_sheet(flattenedData);
      
      // Auto-size columns
      const colWidths = autoSizeColumns(flattenedData);
      ws['!cols'] = colWidths;
      
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    });
    
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    
    return {
      data: buffer,
      filename: `${filename}.xlsx`,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    };
  } catch (error) {
    throw new Error(`Multi-sheet Excel export failed: ${error.message}`);
  }
};

// Helper function to flatten nested objects
const flattenObject = (obj, prefix = '', separator = '.') => {
  const flattened = {};
  
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const newKey = prefix ? `${prefix}${separator}${key}` : key;
      
      if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key]) && !(obj[key] instanceof Date)) {
        Object.assign(flattened, flattenObject(obj[key], newKey, separator));
      } else if (Array.isArray(obj[key])) {
        flattened[newKey] = obj[key].join(', ');
      } else if (obj[key] instanceof Date) {
        flattened[newKey] = obj[key].toISOString();
      } else {
        flattened[newKey] = obj[key];
      }
    }
  }
  
  return flattened;
};

// Helper function to get all unique fields from data
const getAllFields = (data) => {
  const fields = new Set();
  
  data.forEach(item => {
    Object.keys(item).forEach(key => fields.add(key));
  });
  
  return Array.from(fields);
};

// Helper function to auto-size Excel columns
const autoSizeColumns = (data) => {
  if (!data || data.length === 0) return [];
  
  const colWidths = [];
  const keys = Object.keys(data[0]);
  
  keys.forEach((key, index) => {
    let maxWidth = key.length;
    
    data.forEach(row => {
      const cellValue = row[key];
      if (cellValue) {
        const cellLength = cellValue.toString().length;
        if (cellLength > maxWidth) {
          maxWidth = cellLength;
        }
      }
    });
    
    // Set minimum and maximum column widths
    const width = Math.min(Math.max(maxWidth + 2, 10), 50);
    colWidths.push({ wch: width });
  });
  
  return colWidths;
};

// Generate summary statistics for export
const generateSummaryStats = (data) => {
  if (!Array.isArray(data) || data.length === 0) {
    return {};
  }

  const stats = {
    totalRecords: data.length,
    exportDate: new Date().toISOString(),
    fields: getAllFields(data.map(item => flattenObject(item))),
    fieldCount: 0
  };

  stats.fieldCount = stats.fields.length;

  return stats;
};

module.exports = {
  exportToCSV,
  exportToExcel,
  exportToJSON,
  exportMultipleSheetsToExcel,
  flattenObject,
  getAllFields,
  generateSummaryStats
};