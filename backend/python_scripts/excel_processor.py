#!/usr/bin/env python3
"""
Excel Processor - Template for your teammate's implementation
Expected output: JSON with processedData and errorLogs arrays
"""

import sys
import json
import pandas as pd
from pathlib import Path

def process_excel_file(file_path):
    """
    Process Excel file and return structured data
    Your teammate should replace this with their actual implementation
    """
    processed_data = []
    error_logs = []
    
    try:
        # Read Excel file - handles both .xlsx and .xls
        excel_file = pd.ExcelFile(file_path)
        
        # Process each sheet
        for sheet_name in excel_file.sheet_names:
            try:
                df = pd.read_excel(excel_file, sheet_name=sheet_name)
                
                # Process each row
                for index, row in df.iterrows():
                    try:
                        # Your teammate's processing logic goes here
                        record = process_excel_row(row, sheet_name, index + 2)  # +2 for 1-based + header
                        
                        if validate_excel_record(record):
                            record['_sheet'] = sheet_name
                            record['_row'] = index + 2
                            processed_data.append(record)
                        else:
                            error_logs.append({
                                'error_type': 'validation_failed',
                                'message': f'Sheet "{sheet_name}", Row {index + 2}: Validation failed',
                                'sheet': sheet_name,
                                'row_number': index + 2,
                                'data': record
                            })
                            
                    except Exception as e:
                        error_logs.append({
                            'error_type': 'processing_error',
                            'message': str(e),
                            'sheet': sheet_name,
                            'row_number': index + 2,
                            'data': row.to_dict()
                        })
                        
            except Exception as e:
                error_logs.append({
                    'error_type': 'sheet_processing_error',
                    'message': str(e),
                    'sheet': sheet_name
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

def process_excel_row(row, sheet_name, row_number):
    """
    Process individual Excel row
    Your teammate should implement their row processing logic here
    """
    # Example processing - replace with actual logic
    record = {}
    
    for column, value in row.items():
        if pd.notna(value):  # Skip NaN values
            record[str(column).strip().lower()] = str(value).strip()
    
    return record

def validate_excel_record(record):
    """
    Validate Excel record
    Your teammate should implement their validation logic here
    """
    # Example validation - replace with actual logic
    return len(record) > 0  # At least one field should have data

def main():
    if len(sys.argv) != 2:
        print(json.dumps({
            'processedData': [],
            'errorLogs': [{
                'error_type': 'usage_error',
                'message': 'Usage: python excel_processor.py <file_path>'
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
    result = process_excel_file(file_path)
    
    # Output JSON result
    print(json.dumps(result, indent=2))

if __name__ == '__main__':
    main()