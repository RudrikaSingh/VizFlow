# VizFlow - Python Integration Guide

## 🐍 **Python Script Integration for Teammates**

This guide explains how to integrate your existing Python scripts into the VizFlow Node.js backend.

## 📋 **Requirements**

### **Expected Output Format**
Your Python scripts MUST output JSON in this exact format:

```json
{
  "processedData": [
    {
      "field1": "value1",
      "field2": "value2",
      "custom_field": "custom_value"
    }
  ],
  "errorLogs": [
    {
      "error_type": "validation_failed",
      "message": "Descriptive error message",
      "row_number": 5,
      "data": {"problematic": "data"}
    }
  ]
}
```

### **Script Input**
- Your script receives the uploaded file path as the first command line argument
- Access it with: `sys.argv[1]`

## 🔧 **Integration Steps**

### **Step 1: Replace Template Script**
1. Navigate to: `backend/python_scripts/`
2. Replace the appropriate template with your code:
   - `csv_processor.py` - For CSV files
   - `excel_processor.py` - For Excel files  
   - `xml_processor.py` - For XML files
   - `pdf_processor.py` - For PDF files
   - `image_processor.py` - For Image files with OCR

### **Step 2: Maintain Script Structure**
Keep this structure in your script:

```python
#!/usr/bin/env python3
import sys
import json
from pathlib import Path

def process_[format]_file(file_path):
    """Your processing logic goes here"""
    processed_data = []
    error_logs = []
    
    # YOUR CODE HERE
    # Process the file and populate arrays
    
    return {
        'processedData': processed_data,
        'errorLogs': error_logs
    }

def main():
    if len(sys.argv) != 2:
        print(json.dumps({
            'processedData': [],
            'errorLogs': [{'error_type': 'usage_error', 'message': 'Usage error'}]
        }))
        sys.exit(1)
    
    file_path = sys.argv[1]
    result = process_[format]_file(file_path)
    print(json.dumps(result, indent=2))

if __name__ == '__main__':
    main()
```

### **Step 3: Install Python Dependencies**
Create `requirements.txt` in the `python_scripts` folder:

```txt
pandas>=1.5.0
PyPDF2>=3.0.0
pytesseract>=0.3.10
Pillow>=9.0.0
openpyxl>=3.0.0
```

Install with: `pip install -r requirements.txt`

## 📊 **Data Schema Guidelines**

### **Processed Data Records**
Each record in `processedData` should be a flat JSON object:

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "age": 30,
  "department": "Engineering",
  "custom_field": "any_value"
}
```

### **Error Log Records**
Each error in `errorLogs` should include:

```json
{
  "error_type": "validation_failed|processing_error|file_parsing_error",
  "message": "Human-readable error description",
  "row_number": 5,          // Optional: for CSV/Excel
  "page_number": 2,         // Optional: for PDF
  "data": {},               // Optional: problematic data
  "additional_info": "any"  // Optional: extra context
}
```

## 🧪 **Testing Your Integration**

### **Test Script Locally**
```bash
# Test your script directly
python csv_processor.py /path/to/test/file.csv

# Expected output: Valid JSON with processedData and errorLogs
```

### **Test in VizFlow**
1. Start the VizFlow backend: `npm start`
2. Upload a file through the frontend
3. Check the processing results
4. Verify data appears in MongoDB
5. Check error logs if needed

## 🔍 **Common Issues & Solutions**

### **Issue: "Python script failed"**
- **Solution**: Ensure Python is in your system PATH
- **Alternative**: Update the processor to use specific Python path:
  ```javascript
  const pythonProcess = spawn('C:\\Python39\\python.exe', [scriptPath, ...args]);
  ```

### **Issue: "Failed to parse Python output as JSON"**
- **Solution**: Ensure your script ONLY prints the JSON output
- **Debug**: Add error handling and use `sys.stderr` for debug messages

### **Issue: "Import modules not found"**
- **Solution**: Install required Python packages
- **Create virtual environment** (recommended):
  ```bash
  python -m venv venv
  venv\\Scripts\\activate  # Windows
  pip install -r requirements.txt
  ```

## 📁 **File Structure**
```
backend/
├── python_scripts/
│   ├── csv_processor.py      ← Replace with your CSV logic
│   ├── excel_processor.py    ← Replace with your Excel logic
│   ├── xml_processor.py      ← Replace with your XML logic
│   ├── pdf_processor.py      ← Replace with your PDF logic
│   ├── image_processor.py    ← Replace with your Image logic
│   └── requirements.txt      ← Add your Python dependencies
├── processors/
│   ├── csvProcessor.js       ← Already configured to call your script
│   ├── excelProcessor.js     ← Already configured to call your script
│   ├── xmlProcessor.js       ← Already configured to call your script
│   ├── pdfProcessor.js       ← Already configured to call your script
│   └── imageProcessor.js     ← Already configured to call your script
└── ...
```

## 🚀 **Quick Start Checklist**

- [ ] Copy your Python script to appropriate file in `python_scripts/`
- [ ] Ensure output format matches required JSON structure
- [ ] Test script locally with sample file
- [ ] Install Python dependencies (`pip install -r requirements.txt`)
- [ ] Restart VizFlow backend (`npm start`)
- [ ] Test file upload through frontend
- [ ] Verify data in MongoDB/Dashboard

## 💡 **Tips**

1. **Error Handling**: Wrap your code in try-catch blocks
2. **Validation**: Include data validation in your processing logic
3. **Performance**: For large files, consider processing in chunks
4. **Debugging**: Use `sys.stderr.write()` for debug output (won't interfere with JSON)
5. **Testing**: Create small test files for each format to verify integration

## 🆘 **Need Help?**

If you encounter issues:
1. Check the Node.js console for error messages
2. Test your Python script independently
3. Verify the JSON output format
4. Check Python dependencies are installed
5. Ensure file paths are accessible

Your Python expertise combined with this Node.js integration creates a powerful, multi-format data processing platform! 🎉