#!/usr/bin/env python3
"""
PDF Processor - Template for your teammate's implementation
Expected output: JSON with processedData and errorLogs arrays
"""

import sys
import json
import PyPDF2
import re
from pathlib import Path

def process_pdf_file(file_path):
    """
    Process PDF file and return structured data
    Your teammate should replace this with their actual implementation
    """
    processed_data = []
    error_logs = []
    
    try:
        with open(file_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            
            # Extract text from all pages
            full_text = ""
            for page_num, page in enumerate(pdf_reader.pages):
                try:
                    page_text = page.extract_text()
                    full_text += page_text + "\n"
                except Exception as e:
                    error_logs.append({
                        'error_type': 'page_extraction_error',
                        'message': str(e),
                        'page_number': page_num + 1
                    })
            
            # Your teammate's text processing logic goes here
            extracted_data = extract_structured_data(full_text)
            
            for item in extracted_data:
                try:
                    if validate_pdf_record(item):
                        processed_data.append(item)
                    else:
                        error_logs.append({
                            'error_type': 'validation_failed',
                            'message': 'PDF data validation failed',
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
            'error_type': 'file_parsing_error',
            'message': str(e),
            'file_path': file_path
        })
    
    return {
        'processedData': processed_data,
        'errorLogs': error_logs
    }

def extract_structured_data(text):
    """
    Extract structured data from PDF text
    Your teammate should implement their text extraction logic here
    """
    # Example extraction - replace with actual logic
    data = []
    
    # Example: Extract email addresses
    emails = re.findall(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', text)
    for email in emails:
        data.append({
            'type': 'email',
            'value': email
        })
    
    # Example: Extract phone numbers
    phones = re.findall(r'\b\d{3}-\d{3}-\d{4}\b|\b\(\d{3}\)\s*\d{3}-\d{4}\b', text)
    for phone in phones:
        data.append({
            'type': 'phone',
            'value': phone
        })
    
    # If no structured data found, return full text
    if not data:
        data.append({
            'type': 'full_text',
            'content': text.strip()
        })
    
    return data

def validate_pdf_record(record):
    """
    Validate PDF record
    Your teammate should implement their validation logic here
    """
    # Example validation - replace with actual logic
    return 'type' in record and 'value' in record or 'content' in record

def main():
    if len(sys.argv) != 2:
        print(json.dumps({
            'processedData': [],
            'errorLogs': [{
                'error_type': 'usage_error',
                'message': 'Usage: python pdf_processor.py <file_path>'
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
    result = process_pdf_file(file_path)
    
    # Output JSON result
    print(json.dumps(result, indent=2))

if __name__ == '__main__':
    main()