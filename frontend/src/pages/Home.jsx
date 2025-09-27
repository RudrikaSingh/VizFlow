import React from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart3, Upload, Database, AlertTriangle, 
  ArrowRight, CheckCircle, Zap, Shield 
} from 'lucide-react';

const Home = () => {
  const features = [
    {
      icon: Upload,
      title: 'Easy Data Upload',
      description: 'Drag and drop JSON files containing processed customer data or error logs',
      color: 'text-primary-600'
    },
    {
      icon: BarChart3,
      title: 'Real-time Dashboard',
      description: 'Monitor processing metrics, success rates, and error trends with interactive charts',
      color: 'text-success-600'
    },
    {
      icon: Database,
      title: 'Data Management',
      description: 'View, search, and export processed customer data with advanced filtering',
      color: 'text-purple-600'
    },
    {
      icon: AlertTriangle,
      title: 'Error Tracking',
      description: 'Track and resolve data processing errors with detailed error logs',
      color: 'text-error-600'
    }
  ];

  const benefits = [
    'Multi-format data processing support (CSV, Excel, XML, JSON, PDF)',
    'Real-time validation and error detection',
    'Comprehensive data visualization and reporting',
    'Export capabilities in multiple formats',
    'Team collaboration and workflow management',
    'Secure data storage with MongoDB Atlas'
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 to-purple-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              VizFlow
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              A comprehensive data processing, validation, and visualization platform 
              for streamlined customer data management and error tracking.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/dashboard"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 transition-colors duration-200"
              >
                View Dashboard
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                to="/upload"
                className="inline-flex items-center px-6 py-3 border border-primary-600 text-base font-medium rounded-md text-primary-600 bg-white hover:bg-primary-50 transition-colors duration-200"
              >
                <Upload className="mr-2 h-5 w-5" />
                Upload Data
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Powerful Features for Data Management
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Everything you need to process, validate, and visualize your customer data efficiently.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="text-center">
                  <div className="flex justify-center mb-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <Icon className={`h-8 w-8 ${feature.color}`} />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Why Choose VizFlow?
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Built for teams who need reliable data processing with comprehensive 
                error tracking and beautiful visualizations.
              </p>
              
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start">
                    <CheckCircle className="h-6 w-6 text-success-500 flex-shrink-0 mt-0.5" />
                    <span className="ml-3 text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <Zap className="h-8 w-8 text-warning-500 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Fast Processing
                </h3>
                <p className="text-gray-600">
                  Efficient data processing with real-time validation and instant feedback.
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <Shield className="h-8 w-8 text-primary-500 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Secure Storage
                </h3>
                <p className="text-gray-600">
                  Your data is securely stored in MongoDB Atlas with enterprise-grade security.
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <BarChart3 className="h-8 w-8 text-purple-500 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Rich Analytics
                </h3>
                <p className="text-gray-600">
                  Comprehensive charts and metrics to understand your data processing trends.
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <Database className="h-8 w-8 text-success-500 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Easy Export
                </h3>
                <p className="text-gray-600">
                  Export your data in multiple formats including CSV, Excel, and JSON.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Start processing and visualizing your customer data today with VizFlow.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/upload"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-primary-600 bg-white hover:bg-gray-50 transition-colors duration-200"
            >
              <Upload className="mr-2 h-5 w-5" />
              Upload Your First File
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex items-center px-6 py-3 border border-white text-base font-medium rounded-md text-white bg-transparent hover:bg-primary-700 transition-colors duration-200"
            >
              <BarChart3 className="mr-2 h-5 w-5" />
              Explore Dashboard
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;