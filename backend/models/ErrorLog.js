const mongoose = require('mongoose');

// Schema for error logs and invalid records
const errorLogSchema = new mongoose.Schema({
  // Error identification
  errorId: {
    type: String,
    required: true,
    unique: true,
    default: () => new mongoose.Types.ObjectId().toString()
  },
  // Error details
  errorType: {
    type: String,
    enum: [
      'MISSING_FIELD',
      'INVALID_FORMAT',
      'DUPLICATE_RECORD',
      'VALIDATION_ERROR',
      'PARSING_ERROR',
      'DATA_TYPE_ERROR',
      'BUSINESS_RULE_ERROR'
    ],
    required: true
  },
  errorMessage: {
    type: String,
    required: true
  },
  errorDetails: {
    type: String,
    required: false
  },
  // Source information
  sourceFormat: {
    type: String,
    enum: ['CSV', 'Excel', 'XML', 'JSON', 'PDF'],
    required: true
  },
  sourceFile: {
    type: String,
    required: false
  },
  lineNumber: {
    type: Number,
    required: false
  },
  // Raw data that caused the error
  rawData: {
    type: mongoose.Schema.Types.Mixed,
    required: false
  },
  // Validation details
  fieldName: {
    type: String,
    required: false
  },
  expectedValue: {
    type: String,
    required: false
  },
  actualValue: {
    type: String,
    required: false
  },
  // Processing metadata
  processedBy: {
    type: String,
    required: true
  },
  processedAt: {
    type: Date,
    default: Date.now
  },
  // Resolution status
  status: {
    type: String,
    enum: ['UNRESOLVED', 'RESOLVED', 'IGNORED'],
    default: 'UNRESOLVED'
  },
  resolvedAt: {
    type: Date,
    required: false
  },
  resolvedBy: {
    type: String,
    required: false
  },
  resolutionNotes: {
    type: String,
    required: false
  }
}, {
  timestamps: true
});

// Indexes for better performance
errorLogSchema.index({ errorType: 1 });
errorLogSchema.index({ sourceFormat: 1 });
errorLogSchema.index({ processedAt: -1 });
errorLogSchema.index({ status: 1 });
errorLogSchema.index({ processedBy: 1 });

module.exports = mongoose.model('ErrorLog', errorLogSchema);