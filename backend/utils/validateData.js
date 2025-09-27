const Joi = require('joi');

// Validation schema for processed data
const processedDataSchema = Joi.object({
  customerId: Joi.string().optional().allow(''),
  firstName: Joi.string().min(1).max(50).optional().allow(''),
  lastName: Joi.string().min(1).max(50).optional().allow(''),
  email: Joi.string().email().optional().allow(''),
  phone: Joi.string().pattern(/^[\+]?[1-9][\d]{0,15}$/).optional().allow(''),
  address: Joi.object({
    street: Joi.string().optional().allow(''),
    city: Joi.string().optional().allow(''),
    state: Joi.string().optional().allow(''),
    zipCode: Joi.string().optional().allow(''),
    country: Joi.string().optional().allow('')
  }).optional(),
  dateOfBirth: Joi.date().optional(),
  sourceFormat: Joi.string().valid('CSV', 'Excel', 'XML', 'JSON', 'PDF').required(),
  processedBy: Joi.string().required(),
  additionalData: Joi.object().optional()
});

// Validation schema for error logs
const errorLogSchema = Joi.object({
  errorType: Joi.string().valid(
    'MISSING_FIELD',
    'INVALID_FORMAT',
    'DUPLICATE_RECORD',
    'VALIDATION_ERROR',
    'PARSING_ERROR',
    'DATA_TYPE_ERROR',
    'BUSINESS_RULE_ERROR'
  ).required(),
  errorMessage: Joi.string().required(),
  errorDetails: Joi.string().optional(),
  sourceFormat: Joi.string().valid('CSV', 'Excel', 'XML', 'JSON', 'PDF').required(),
  sourceFile: Joi.string().optional(),
  lineNumber: Joi.number().integer().min(1).optional(),
  rawData: Joi.any().optional(),
  fieldName: Joi.string().optional(),
  expectedValue: Joi.string().optional(),
  actualValue: Joi.string().optional(),
  processedBy: Joi.string().required()
});

// Validation functions
const validateProcessedData = (data) => {
  return processedDataSchema.validate(data, { abortEarly: false });
};

const validateErrorLog = (data) => {
  return errorLogSchema.validate(data, { abortEarly: false });
};

// Batch validation for arrays
const validateProcessedDataBatch = (dataArray) => {
  const results = {
    valid: [],
    invalid: [],
    errors: []
  };

  dataArray.forEach((item, index) => {
    const { error, value } = validateProcessedData(item);
    if (error) {
      results.invalid.push({
        index,
        data: item,
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    } else {
      results.valid.push(value);
    }
  });

  return results;
};

const validateErrorLogBatch = (errorArray) => {
  const results = {
    valid: [],
    invalid: [],
    errors: []
  };

  errorArray.forEach((item, index) => {
    const { error, value } = validateErrorLog(item);
    if (error) {
      results.invalid.push({
        index,
        data: item,
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    } else {
      results.valid.push(value);
    }
  });

  return results;
};

// Data sanitization
const sanitizeData = (data) => {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      sanitized[key] = value.trim();
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(sanitizeData);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeData(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};

module.exports = {
  validateProcessedData,
  validateErrorLog,
  validateProcessedDataBatch,
  validateErrorLogBatch,
  sanitizeData
};