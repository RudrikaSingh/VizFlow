#!/usr/bin/env python3
"""
CSV Processor - Template for your teammate's implementation
Expected output: JSON with processedData and errorLogs arrays
"""

import sys
import json
import csv
from pathlib import Path

def process_csv_file(file_path):
    """
    Process CSV file and return structured data
    Your teammate should replace this with their actual implementation
    """
    processed_data = []
    error_logs = []
    
    try:
        with open(file_path, 'r', newline='', encoding='utf-8') as csvfile:
            # Auto-detect delimiter
            sample = csvfile.read(1024)
            csvfile.seek(0)
            sniffer = csv.Sniffer()
            delimiter = sniffer.sniff(sample).delimiter
            
            # Read CSV
            reader = csv.DictReader(csvfile, delimiter=delimiter)
            
            for row_num, row in enumerate(reader, start=2):  # Start at 2 because of header
                try:
                    # Your teammate's processing logic goes here
                    cleaned_row = clean_csv_row(row)
                    
                    if validate_csv_record(cleaned_row):
                        processed_data.append(cleaned_row)
                    else:
                        error_logs.append({
                            'error_type': 'validation_failed',
                            'message': f'Row {row_num}: Validation failed',
                            'row_number': row_num,
                            'data': row
                        })
                        
                except Exception as e:
                    error_logs.append({
                        'error_type': 'processing_error',
                        'message': str(e),
                        'row_number': row_num,
                        'data': row
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

def clean_csv_row(row):
    """
    Clean and transform CSV row data
    Your teammate should implement their cleaning logic here
    """
    # Example cleaning - replace with actual logic
    cleaned = {}
    for key, value in row.items():
        if key:  # Skip empty column names
            cleaned[key.strip().lower()] = value.strip() if value else None
    return cleaned

def validate_csv_record(record):
    """
    Validate CSV record
    Your teammate should implement their validation logic here
    """
    # Example validation - replace with actual logic
    required_fields = []  # Define required fields
    return all(record.get(field) for field in required_fields)

def main():
    if len(sys.argv) != 2:
        print(json.dumps({
            'processedData': [],
            'errorLogs': [{
                'error_type': 'usage_error',
                'message': 'Usage: python csv_processor.py <file_path>'
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
    result = process_csv_file(file_path)
    
    # Output JSON result
    print(json.dumps(result, indent=2))

if __name__ == '__main__':
    main()