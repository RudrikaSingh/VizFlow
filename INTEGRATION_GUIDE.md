# VizFlow Multi-Format File Processing Integration

## 🎯 Overview

VizFlow now supports multiple file formats with dedicated processors for each type. Your teammates can integrate their individual format processors into this unified system.

## 📁 Project Structure

```
backend/
├── processors/
│   ├── index.js          # Main processor registry
│   ├── csvProcessor.js   # CSV processing (Team Member A)
│   ├── excelProcessor.js # Excel processing (Team Member B)
│   ├── xmlProcessor.js   # XML processing (Team Member C)
│   ├── pdfProcessor.js   # PDF processing (Team Member D)
│   └── imageProcessor.js # Image processing (Team Member E)
├── routes/
│   └── upload.js         # Enhanced upload route
└── uploads/              # Temporary file storage
```

## 🔧 Integration Guide for Team Members

### Step 1: Understand the Processor Interface

Each processor must implement this interface:

```javascript
const yourProcessor = {
  name: 'Your Processor Name',
  
  async process(file, metadata) {
    // Your processing logic here
    return {
      data: [], // Array of processed records
      errors: [], // Array of processing errors
      metadata: {} // Additional metadata
    };
  }
};
```

### Step 2: Input Parameters

- **file**: Multer file object with properties:
  - `file.path`: Path to uploaded file (if using disk storage)
  - `file.buffer`: File buffer (if using memory storage)
  - `file.originalname`: Original filename
  - `file.mimetype`: MIME type
  - `file.size`: File size in bytes

- **metadata**: Object containing:
  - `originalName`: Original filename
  - `mimeType`: File MIME type
  - `size`: File size
  - `processedAt`: Processing timestamp
  - Additional custom metadata

### Step 3: Expected Output Format

```javascript
{
  data: [
    {
      // Your processed record data
      field1: 'value1',
      field2: 'value2',
      _id: 'unique_id', // Generated ID
      _processedAt: new Date(), // Processing timestamp
      // ... other fields
    }
  ],
  errors: [
    {
      type: 'validation_error', // Error type
      message: 'Error description',
      row: 1, // Row/line number (if applicable)
      data: {}, // Original data that caused error
      timestamp: new Date()
    }
  ],
  metadata: {
    // Format-specific metadata
    totalRows: 100,
    validRows: 95,
    errorRows: 5,
    processingTime: 1500, // milliseconds
    // ... other metadata
  }
}
```

## 📝 Implementation Examples

### CSV Processor Template

```javascript
const csvProcessor = {
  name: 'CSV Processor',
  
  async process(file, metadata) {
    // 1. Read CSV file
    // 2. Parse CSV data
    // 3. Validate each record
    // 4. Return formatted result
    
    return {
      data: processedRecords,
      errors: validationErrors,
      metadata: {
        totalRows: totalCount,
        validRows: validCount,
        errorRows: errorCount,
        columns: columnNames
      }
    };
  }
};
```

### Image Processor Template

```javascript
const imageProcessor = {
  name: 'Image Processor',
  
  async process(file, metadata) {
    // 1. Extract image metadata
    // 2. Perform OCR (if needed)
    // 3. Process extracted text/data
    // 4. Return structured data
    
    return {
      data: extractedData,
      errors: processingErrors,
      metadata: {
        imageWidth: 1920,
        imageHeight: 1080,
        ocrConfidence: 0.95,
        textLength: 500
      }
    };
  }
};
```

## 🚀 Integration Steps

### For Each Team Member:

1. **Open your assigned processor file**:
   - CSV: `backend/processors/csvProcessor.js`
   - Excel: `backend/processors/excelProcessor.js`
   - XML: `backend/processors/xmlProcessor.js`
   - PDF: `backend/processors/pdfProcessor.js`
   - Image: `backend/processors/imageProcessor.js`

2. **Replace the template implementation** with your actual processing logic

3. **Test your processor**:
   ```bash
   # Install dependencies
   cd backend
   npm install
   
   # Start the server
   npm start
   
   # Test with your file format
   # Upload via frontend at http://localhost:3000
   ```

4. **Validate output format** matches the expected structure

## 🔍 Supported File Formats

| Category | Extensions | MIME Types | Processor |
|----------|------------|------------|-----------|
| Spreadsheet | .csv, .xlsx, .xls | text/csv, application/vnd.openxml... | CSV/Excel |
| Document | .xml, .pdf | application/xml, application/pdf | XML/PDF |
| Image | .jpg, .png, .gif, etc. | image/jpeg, image/png, etc. | Image |

## 🛠️ Available Dependencies

Already installed and ready to use:

```json
{
  "csv-parse": "^5.4.0",      // CSV parsing
  "xlsx": "^0.18.5",          // Excel processing  
  "xml2js": "^0.6.2",         // XML parsing
  "pdf-parse": "^1.1.1",      // PDF text extraction
  "sharp": "^0.32.6",         // Image processing
  "tesseract.js": "^5.0.2"    // OCR for images
}
```

## 📊 Testing Your Integration

### 1. Upload Test Files

Create test files for your format and upload them via:
- Frontend: `http://localhost:3000/upload`
- API: `POST http://localhost:5000/api/upload/file`

### 2. Check Processing Results

Monitor the results in:
- Frontend UI (upload results)
- MongoDB Compass (processed data)
- Console logs (debugging)

### 3. Validate Data Structure

Ensure your output matches:
```javascript
// Processed records should have:
{
  _id: 'unique_identifier',
  _processedAt: Date,
  // Your actual data fields...
}

// Error records should have:
{
  type: 'error_type',
  message: 'description',
  // Additional context...
}
```

## 🔧 Troubleshooting

### Common Issues:

1. **File Reading Errors**:
   ```javascript
   // Check if file.path exists
   if (file.path) {
     const content = fs.readFileSync(file.path);
   } else if (file.buffer) {
     const content = file.buffer;
   }
   ```

2. **Memory Issues with Large Files**:
   ```javascript
   // Process in chunks for large files
   // Use streams instead of loading entire file
   ```

3. **Validation Errors**:
   ```javascript
   // Ensure all required fields are present
   // Handle null/undefined values gracefully
   ```

## 📞 Integration Support

### Next Steps:

1. **Team Member A (CSV)**: Implement CSV parsing and validation logic
2. **Team Member B (Excel)**: Handle multiple worksheets and complex formatting
3. **Team Member C (XML)**: Parse XML structure and extract data elements
4. **Team Member D (PDF)**: Extract text and structured data from PDFs
5. **Team Member E (Image)**: Implement OCR and image data extraction

### Testing Checklist:

- [ ] Processor handles files correctly
- [ ] Data validation works as expected
- [ ] Error handling is comprehensive
- [ ] Output format matches specification
- [ ] Performance is acceptable for expected file sizes
- [ ] Integration with main system is seamless

## 🎉 Benefits of This Architecture

1. **Modularity**: Each format handler is independent
2. **Scalability**: Easy to add new formats
3. **Maintainability**: Clear separation of concerns
4. **Testability**: Each processor can be tested individually
5. **Flexibility**: Different validation rules per format
6. **Performance**: Optimized processing per file type

---

**Ready to integrate your processors? Start with your assigned file format and follow the template structure!** 🚀