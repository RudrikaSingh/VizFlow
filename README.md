# VizFlow - Data Processing & Visualization Platform

VizFlow is a comprehensive full-stack application designed for data processing, validation, and visualization. It handles customer data from multiple formats (CSV, Excel, XML, JSON, PDF) and provides real-time insights through interactive dashboards.

##  Features

- **Multi-format Data Processing**: Support for CSV, Excel, XML, JSON, and PDF files
- **Real-time Validation**: Instant data validation with detailed error reporting
- **Interactive Dashboard**: Rich visualizations with charts and metrics
- **Data Management**: Advanced filtering, searching, and pagination
- **Error Tracking**: Comprehensive error logging and resolution tracking
- **Export Capabilities**: Download data in CSV, Excel, or JSON formats
- **Team Collaboration**: Multi-user support with role-based processing

##  Architecture

### Backend (Node.js + Express)
- **Database**: MongoDB Atlas for scalable data storage
- **API Routes**: RESTful APIs for data upload, retrieval, and management
- **Security**: CORS, rate limiting, helmet security headers
- **Validation**: Joi schema validation for data integrity
- **Export**: Support for CSV, Excel, and JSON export formats

### Frontend (React + Tailwind CSS)
- **Dashboard**: Interactive charts using Recharts
- **File Upload**: Drag-and-drop interface with React Dropzone
- **Data Tables**: Paginated, searchable, and sortable tables
- **Error Management**: Detailed error logs with status tracking
- **Responsive Design**: Mobile-first responsive design with Tailwind CSS

##  Project Structure

```
VizFlow/
├── backend/
│   ├── config/
│   │   └── database.js          # MongoDB connection
│   ├── models/
│   │   ├── ProcessedData.js     # Customer data schema
│   │   └── ErrorLog.js          # Error logging schema
│   ├── routes/
│   │   ├── upload.js            # Data upload endpoints
│   │   ├── customers.js         # Customer data endpoints
│   │   ├── errors.js            # Error log endpoints
│   │   └── download.js          # Export endpoints
│   ├── utils/
│   │   ├── validateData.js      # Data validation utilities
│   │   └── exportData.js        # Export utilities
│   ├── server.js                # Express server entry point
│   ├── package.json
│   └── .env.example             # Environment variables template
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── components/
    │   │   ├── Dashboard.jsx     # Main dashboard component
    │   │   ├── UploadForm.jsx    # File upload component
    │   │   ├── DataTable.jsx     # Customer data table
    │   │   ├── ErrorLogs.jsx     # Error logs component
    │   │   └── Navbar.jsx        # Navigation component
    │   ├── pages/
    │   │   ├── Home.jsx          # Landing page
    │   │   ├── DashboardPage.jsx # Dashboard page
    │   │   ├── UploadPage.jsx    # Upload page
    │   │   ├── DataPage.jsx      # Data management page
    │   │   └── ErrorsPage.jsx    # Error logs page
    │   ├── services/
    │   │   └── api.js            # API service layer
    │   ├── utils/
    │   │   └── helpers.js        # Utility functions
    │   ├── App.js               # Main App component
    │   ├── index.js             # React entry point
    │   └── index.css            # Global styles
    ├── package.json
    ├── tailwind.config.js       # Tailwind configuration
    └── postcss.config.js        # PostCSS configuration
```

## 🛠 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB Atlas account
- Git

### Backend Setup

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Configuration**:
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your configuration:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster0.mongodb.net/vizflow?retryWrites=true&w=majority
   DB_NAME=vizflow
   PORT=5000
   NODE_ENV=development
   JWT_SECRET=your_super_secret_jwt_key_here
   JWT_EXPIRE=7d
   CLIENT_URL=http://localhost:3000
   ```

4. **Start the server**:
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

   Server will run on `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Configuration** (Optional):
   Create `.env` file for custom API URL:
   ```env
   REACT_APP_API_URL=http://localhost:5000/api
   ```

4. **Start the development server**:
   ```bash
   npm start
   ```

   Frontend will run on `http://localhost:3000`

## 📊 API Endpoints

### Upload APIs
- `POST /api/upload/cleaned` - Upload processed customer data
- `POST /api/upload/errors` - Upload error logs
- `GET /api/upload/status` - Get system status

### Customer Data APIs
- `GET /api/customers` - Get customer data (with pagination & filters)
- `GET /api/customers/:id` - Get specific customer
- `GET /api/customers/stats/summary` - Get customer statistics
- `GET /api/customers/fields/unique` - Get unique field values

### Error Log APIs
- `GET /api/errors` - Get error logs (with pagination & filters)
- `GET /api/errors/:id` - Get specific error
- `GET /api/errors/stats/summary` - Get error statistics
- `PATCH /api/errors/:id/status` - Update error status
- `GET /api/errors/fields/unique` - Get unique field values

### Download APIs
- `GET /api/download/customers` - Download customer data
- `GET /api/download/errors` - Download error logs
- `GET /api/download/combined` - Download combined Excel file
- `GET /api/download/summary` - Download summary report
- `GET /api/download/formats` - Get available export formats

##  Usage Examples

### 1. Upload Customer Data
```javascript
// Example JSON structure for cleaned customer data
{
  "data": [
    {
      "customerId": "CUST001",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@email.com",
      "phone": "+1234567890",
      "address": {
        "street": "123 Main St",
        "city": "New York",
        "state": "NY",
        "zipCode": "10001",
        "country": "USA"
      },
      "sourceFormat": "CSV",
      "processedBy": "TeamMember1"
    }
  ]
}
```

### 2. Upload Error Data
```javascript
// Example JSON structure for error logs
{
  "data": [
    {
      "errorType": "MISSING_FIELD",
      "errorMessage": "Required field 'email' is missing",
      "sourceFormat": "Excel",
      "fieldName": "email",
      "lineNumber": 15,
      "processedBy": "TeamMember2",
      "rawData": {
        "firstName": "Jane",
        "lastName": "Smith"
      }
    }
  ]
}
```

### 3. API Integration Examples
```javascript
// Fetch customer statistics
const response = await fetch('/api/customers/stats/summary?startDate=2024-01-01');
const stats = await response.json();

// Download customer data as Excel
const downloadResponse = await fetch('/api/download/customers?format=excel&limit=1000');
const blob = await downloadResponse.blob();
// Handle file download...
```

##  Frontend Components

### Dashboard Features
- **Summary Cards**: Total records, errors, success rate, resolution rate
- **Interactive Charts**: 
  - Pie chart for records by source format
  - Bar chart for errors by type
  - Line chart for daily processing trends
- **Processing Summary**: Statistics by processor and error status

### Data Management
- **Advanced Filtering**: Search, date range, source format, processor
- **Sorting**: Multi-column sorting with visual indicators
- **Pagination**: Efficient handling of large datasets
- **Export Options**: Multiple format support with custom filters

### Error Tracking
- **Status Management**: Unresolved, Resolved, Ignored status tracking
- **Detailed Views**: Complete error information with raw data
- **Bulk Operations**: Mass status updates and exports
- **Visual Indicators**: Color-coded error types and status icons

##  Customization

### Adding New Data Fields
1. Update MongoDB schemas in `backend/models/`
2. Modify validation schemas in `backend/utils/validateData.js`
3. Update frontend forms and tables to handle new fields

### Custom Error Types
Add new error types to the enum in `backend/models/ErrorLog.js`:
```javascript
errorType: {
  type: String,
  enum: [
    'MISSING_FIELD',
    'INVALID_FORMAT',
    // Add your custom error types here
    'CUSTOM_ERROR_TYPE'
  ]
}
```

### Extending Export Formats
Add new export functions in `backend/utils/exportData.js` and update the download routes.

##  Deployment

### Backend Deployment
1. Set up MongoDB Atlas cluster
2. Configure environment variables for production
3. Deploy to platforms like Heroku, DigitalOcean, or AWS
4. Ensure proper CORS configuration for your frontend domain

### Frontend Deployment
1. Build the production bundle: `npm run build`
2. Deploy to platforms like Netlify, Vercel, or serve with nginx
3. Update API URL in environment variables

### Production Environment Variables
```env
NODE_ENV=production
MONGODB_URI=your_production_mongodb_uri
PORT=5000
JWT_SECRET=your_secure_jwt_secret
CLIENT_URL=https://your-frontend-domain.com
```

## 🛡 Security Features

- **Rate Limiting**: Prevents API abuse
- **CORS Protection**: Configured for specific origins
- **Helmet Security**: Security headers for protection
- **Input Validation**: Joi schema validation for all inputs
- **MongoDB Injection Protection**: Mongoose built-in protection

##  Performance Optimizations

- **Database Indexing**: Optimized indexes for fast queries
- **Pagination**: Efficient data loading with limits
- **Caching**: HTTP headers for static content caching
- **Lazy Loading**: React components loaded on demand
- **Bundle Optimization**: Code splitting and minification

##  Testing

### Backend Testing
```bash
cd backend
npm test
```

### Frontend Testing
```bash
cd frontend
npm test
```

##  Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/AmazingFeature`
3. Commit your changes: `git commit -m 'Add some AmazingFeature'`
4. Push to the branch: `git push origin feature/AmazingFeature`
5. Open a Pull Request

##  License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

##  Support

If you encounter any issues or have questions:
1. Check the existing issues on GitHub
2. Create a new issue with detailed information
3. Include error logs and steps to reproduce

##  Version History

- **v1.0.0** - Initial release with core functionality
  - Data upload and validation
  - Dashboard with interactive charts
  - Error tracking and management
  - Multi-format export capabilities

---
