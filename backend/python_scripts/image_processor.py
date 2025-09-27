#!/usr/bin/env python3
"""
Image Processor - Template for your teammate's implementation
Expected output: JSON with processedData and errorLogs arrays
"""

import sys
import json
import pytesseract
from PIL import Image
from pathlib import Path

def process_image_file(file_path):
    """
    Process image file and return structured data
    Your teammate should replace this with their actual implementation
    """
    processed_data = []
    error_logs = []
    
    try:
        # Open and process image
        image = Image.open(file_path)
        
        # Extract text using OCR
        try:
            extracted_text = pytesseract.image_to_string(image)
            
            # Your teammate's text processing logic goes here
            structured_data = extract_data_from_ocr(extracted_text)
            
            for item in structured_data:
                try:
                    if validate_image_record(item):
                        processed_data.append(item)
                    else:
                        error_logs.append({
                            'error_type': 'validation_failed',
                            'message': 'OCR data validation failed',
                            'data': item
                        })
                except Exception as e:
                    error_logs.append({
                        'error_type': 'processing_error',
                        'message': str(e),
                        'data': item
                    })
                    
        except Exception as e:
            error_logs.append({
                'error_type': 'ocr_error',
                'message': str(e),
                'file_path': file_path
            })
        
    except Exception as e:
        error_logs.append({
            'error_type': 'file_parsing_error',
            'message': str(e),
            'file_path': file_path
        })
    
    return {
        'processedData': processed_data,
        'errorLogs': error_logs
    }

def extract_data_from_ocr(text):
    """
    Extract structured data from OCR text
    Your teammate should implement their text extraction logic here
    """
    # Example extraction - replace with actual logic
    data = []
    
    if text.strip():
        # Example: Simple text extraction
        data.append({
            'type': 'ocr_text',
            'content': text.strip(),
            'word_count': len(text.split())
        })
        
        # Your teammate can add more sophisticated extraction here
        # Example: Extract specific patterns, forms, receipts, etc.
    
    return data

def validate_image_record(record):
    """
    Validate image record
    Your teammate should implement their validation logic here
    """
    # Example validation - replace with actual logic
    return 'type' in record and ('content' in record or 'value' in record)

def main():
    if len(sys.argv) != 2:
        print(json.dumps({
            'processedData': [],
            'errorLogs': [{
                'error_type': 'usage_error',
                'message': 'Usage: python image_processor.py <file_path>'
            }]
        }))
        sys.exit(1)
    
    file_path = sys.argv[1]
    
    if not Path(file_path).exists():
        print(json.dumps({
            'processedData': [],
            'errorLogs': [{
                'error_type': 'file_not_found',
                'message': f'File not found: {file_path}'
            }]
        }))
        sys.exit(1)
    
    # Process the file
    result = process_image_file(file_path)
    
    # Output JSON result
    print(json.dumps(result, indent=2))

if __name__ == '__main__':
    main()