const mongoose = require('mongoose');

// Dynamic schema for processed data from various file formats
const processedDataSchema = new mongoose.Schema({
  // Data content - completely dynamic based on extracted data
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  
  // Processing metadata
  metadata: {
    // Source information
    originalFileName: {
      type: String,
      required: true
    },
    fileType: {
      type: String,
      enum: ['csv', 'excel', 'xml', 'pdf', 'image', 'json', 'unknown'],
      required: true
    },
    mimeType: {
      type: String,
      required: true
    },
    fileSize: {
      type: Number,
      required: true
    },
    
    // Processing information
    processor: {
      type: String,
      required: true
    },
    processingTime: {
      type: String,
      required: false
    },
    specifiedType: {
      type: String,
      required: false
    },
    detectedType: {
      type: String,
      required: false
    },
    
    // User information
    uploadedBy: {
      type: String,
      required: false
    },
    userId: {
      type: String,
      required: false
    },
    
    // Processing stats
    recordCount: {
      type: Number,
      default: 1
    },
    extractedFields: [{
      type: String
    }],
    
    // Additional processing options
    additionalOptions: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  
  // Timestamps
  processedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  strict: false // Allow completely dynamic structure
});

// Indexes for better performance
processedDataSchema.index({ processedAt: -1 });
processedDataSchema.index({ 'metadata.fileType': 1 });
processedDataSchema.index({ 'metadata.originalFileName': 1 });
processedDataSchema.index({ 'metadata.processor': 1 });
processedDataSchema.index({ 'metadata.uploadedBy': 1 });
processedDataSchema.index({ 'metadata.userId': 1 });

// Text index for searching within data content
processedDataSchema.index({ 
  'data': 'text',
  'metadata.originalFileName': 'text'
});

module.exports = mongoose.model('ProcessedData', processedDataSchema);