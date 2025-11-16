import React, { useState, useEffect } from 'react';
import quarterService from '../../services/quarterService';
import { 
  Calendar, 
  Plus, 
  CheckCircle, 
  Trash2, 
  X, 
  Save, 
  AlertCircle,
  Star
} from 'lucide-react';

const QuarterSetup = () => {
  const [quarters, setQuarters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [formData, setFormData] = useState({
    name: 'Q1',
    year: new Date().getFullYear(),
    start_date: '',
    end_date: ''
  });

  useEffect(() => {
    loadQuarters();
  }, []);

  const loadQuarters = async () => {
    try {
      const response = await quarterService.getAll();
      setQuarters(response.data);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load quarters' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = () => {
    // Auto-calculate dates based on quarter selection
    const currentYear = new Date().getFullYear();
    setFormData({
      name: 'Q1',
      year: currentYear,
      start_date: `${currentYear}-01-01`,
      end_date: `${currentYear}-03-31`
    });
    setShowModal(true);
    setMessage({ type: '', text: '' });
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({
      name: 'Q1',
      year: new Date().getFullYear(),
      start_date: '',
      end_date: ''
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Auto-update dates when quarter name or year changes
    if (name === 'name' || name === 'year') {
      const year = name === 'year' ? value : formData.year;
      const quarterName = name === 'name' ? value : formData.name;
      const dates = getQuarterDates(quarterName, year);
      setFormData(prev => ({
        ...prev,
        start_date: dates.start,
        end_date: dates.end
      }));
    }
  };

  const getQuarterDates = (quarter, year) => {
    const quarters = {
      'Q1': { start: `${year}-01-01`, end: `${year}-03-31` },
      'Q2': { start: `${year}-04-01`, end: `${year}-06-30` },
      'Q3': { start: `${year}-07-01`, end: `${year}-09-30` },
      'Q4': { start: `${year}-10-01`, end: `${year}-12-31` }
    };
    return quarters[quarter];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    try {
      await quarterService.create(formData);
      setMessage({ type: 'success', text: 'Quarter created successfully!' });
      
      setTimeout(() => {
        handleCloseModal();
        loadQuarters();
      }, 1500);
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to create quarter. It may already exist.' 
      });
    }
  };

  const handleSetActive = async (quarterId) => {
    try {
      await quarterService.setActive(quarterId);
      setMessage({ type: 'success', text: 'Active quarter updated successfully!' });
      loadQuarters();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to set active quarter' });
    }
  };

  const handleDelete = async (quarterId, quarterName, year) => {
    if (!window.confirm(`Are you sure you want to delete ${quarterName} ${year}? This will also delete all associated classes and data!`)) {
      return;
    }

    try {
      await quarterService.delete(quarterId);
      setMessage({ type: 'success', text: 'Quarter deleted successfully' });
      loadQuarters();
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: 'Failed to delete quarter. It may have associated data.' 
      });
    }
  };

  const handleQuickCreate = async () => {
    const currentYear = new Date().getFullYear();
    const quartersToCreate = ['Q1', 'Q2', 'Q3', 'Q4'];

    try {
      for (const q of quartersToCreate) {
        const dates = getQuarterDates(q, currentYear);
        await quarterService.create({
          name: q,
          year: currentYear,
          start_date: dates.start,
          end_date: dates.end
        });
      }
      setMessage({ type: 'success', text: `All quarters for ${currentYear} created successfully!` });
      loadQuarters();
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: 'Some quarters may already exist or failed to create' 
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quarter Management</h1>
          <p className="text-gray-600 mt-1">Manage Sabbath School quarters (13 weeks each)</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleQuickCreate}
            className="btn-secondary flex items-center space-x-2"
          >
            <Calendar className="h-5 w-5" />
            <span>Create All for {new Date().getFullYear()}</span>
          </button>
          <button
            onClick={handleOpenModal}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Add Quarter</span>
          </button>
        </div>
      </div>

      {message.text && (
        <div className={`mb-6 p-4 rounded-lg flex items-start ${
          message.type === 'success' ? 'bg-green-50 border border-green-200' :
          'bg-red-50 border border-red-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-600 mr-2 mt-0.5" />
          )}
          <p className={`text-sm ${
            message.type === 'success' ? 'text-green-800' : 'text-red-800'
          }`}>{message.text}</p>
        </div>
      )}

      {/* Quarters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quarters.map((quarter) => (
          <div 
            key={quarter.id} 
            className={`card relative ${quarter.is_active ? 'ring-2 ring-primary-500 bg-primary-50' : ''}`}
          >
            {quarter.is_active && (
              <div className="absolute top-4 right-4">
                <Star className="h-6 w-6 text-primary-600 fill-current" />
              </div>
            )}

            <div className="mb-4">
              <div className="flex items-center space-x-2 mb-2">
                <Calendar className="h-6 w-6 text-primary-600" />
                <h3 className="text-2xl font-bold text-gray-900">
                  {quarter.name} {quarter.year}
                </h3>
              </div>
              
              {quarter.is_active && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                  Active Quarter
                </span>
              )}
            </div>

            <div className="space-y-2 text-sm text-gray-600 mb-4">
              <div className="flex justify-between">
                <span>Start Date:</span>
                <span className="font-medium text-gray-900">
                  {new Date(quarter.start_date).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span>End Date:</span>
                <span className="font-medium text-gray-900">
                  {new Date(quarter.end_date).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Duration:</span>
                <span className="font-medium text-gray-900">13 weeks</span>
              </div>
            </div>

            <div className="flex space-x-2 pt-4 border-t">
              {!quarter.is_active && (
                <button
                  onClick={() => handleSetActive(quarter.id)}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm"
                >
                  Set Active
                </button>
              )}
              <button
                onClick={() => handleDelete(quarter.id, quarter.name, quarter.year)}
                className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition text-sm"
                title="Delete Quarter"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}

        {quarters.length === 0 && (
          <div className="col-span-full text-center py-12">
            <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No quarters created yet</h3>
            <p className="text-gray-600 mb-4">Create your first quarter to start tracking Sabbath School data</p>
            <button
              onClick={handleOpenModal}
              className="btn-primary inline-flex items-center space-x-2"
            >
              <Plus className="h-5 w-5" />
              <span>Create Quarter</span>
            </button>
          </div>
        )}
      </div>

      {/* Add Quarter Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-semibold text-gray-900">Add New Quarter</h3>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {message.text && (
                <div className={`p-3 rounded-lg flex items-start text-sm ${
                  message.type === 'success' ? 'bg-green-50 text-green-800' :
                  'bg-red-50 text-red-800'
                }`}>
                  {message.type === 'success' ? (
                    <CheckCircle className="h-4 w-4 mr-2 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-4 w-4 mr-2 mt-0.5" />
                  )}
                  {message.text}
                </div>
              )}

              <div>
                <label className="label">Quarter</label>
                <select
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="input"
                  required
                >
                  <option value="Q1">Q1 (January - March)</option>
                  <option value="Q2">Q2 (April - June)</option>
                  <option value="Q3">Q3 (July - September)</option>
                  <option value="Q4">Q4 (October - December)</option>
                </select>
              </div>

              <div>
                <label className="label">Year</label>
                <input
                  type="number"
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  className="input"
                  min="2020"
                  max="2100"
                  required
                />
              </div>

              <div>
                <label className="label">Start Date</label>
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleChange}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="label">End Date</label>
                <input
                  type="date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleChange}
                  className="input"
                  required
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                <p className="font-medium mb-1">Note:</p>
                <p>Each quarter represents 13 weeks of Sabbath School. Dates are automatically calculated based on your selection.</p>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary flex items-center space-x-2"
                >
                  <Save className="h-5 w-5" />
                  <span>Create Quarter</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuarterSetup;