import React, { useState, useEffect } from 'react';
import classService from '../../services/classService';
import quarterService from '../../services/quarterService';
import { 
  BookOpen, 
  Plus, 
  Edit2, 
  Trash2, 
  X, 
  Save, 
  AlertCircle,
  CheckCircle,
  User,
  Calendar
} from 'lucide-react';

const ClassManagement = () => {
  const [classes, setClasses] = useState([]);
  const [quarters, setQuarters] = useState([]);
  const [selectedQuarter, setSelectedQuarter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [formData, setFormData] = useState({
    quarter_id: '',
    class_name: '',
    teacher_name: '',
    secretary_name: '',
    church_name: 'Kanyanya Seventh-day Adventist Church'
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadClasses();
  }, [selectedQuarter]);

  const loadData = async () => {
    try {
      const quartersRes = await quarterService.getAll();
      setQuarters(quartersRes.data);
      
      // Set default quarter to active quarter
      const activeQuarter = quartersRes.data.find(q => q.is_active);
      if (activeQuarter) {
        setSelectedQuarter(activeQuarter.id);
        setFormData(prev => ({ ...prev, quarter_id: activeQuarter.id }));
      }
      
      await loadClasses();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load data' });
    } finally {
      setLoading(false);
    }
  };

  const loadClasses = async () => {
    try {
      const quarterId = selectedQuarter === 'all' ? undefined : selectedQuarter;
      const response = await classService.getAll(quarterId);
      setClasses(response.data);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load classes' });
    }
  };

  const handleOpenModal = (classItem = null) => {
    if (classItem) {
      setEditingClass(classItem);
      setFormData({
        quarter_id: classItem.quarter_id,
        class_name: classItem.class_name,
        teacher_name: classItem.teacher_name,
        secretary_name: classItem.secretary_name,
        church_name: classItem.church_name
      });
    } else {
      setEditingClass(null);
      const activeQuarter = quarters.find(q => q.is_active);
      setFormData({
        quarter_id: activeQuarter?.id || '',
        class_name: '',
        teacher_name: '',
        secretary_name: '',
        church_name: 'Kanyanya Seventh-day Adventist Church'
      });
    }
    setShowModal(true);
    setMessage({ type: '', text: '' });
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingClass(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    try {
      if (editingClass) {
        await classService.update(editingClass.id, formData);
        setMessage({ type: 'success', text: 'Class updated successfully!' });
      } else {
        await classService.create(formData);
        setMessage({ type: 'success', text: 'Class created successfully!' });
      }

      setTimeout(() => {
        handleCloseModal();
        loadClasses();
      }, 1500);
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to save class' 
      });
    }
  };

  const handleDelete = async (classId, className) => {
    if (!window.confirm(`Are you sure you want to delete ${className}? This will also delete all weekly data for this class!`)) {
      return;
    }

    try {
      await classService.delete(classId);
      setMessage({ type: 'success', text: 'Class deleted successfully' });
      loadClasses();
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: 'Failed to delete class. It may have associated data.' 
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Class Management</h1>
          <p className="text-gray-600 mt-1">Manage Sabbath School classes and assignments</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all"
        >
          <Plus className="h-5 w-5" />
          <span>Add Class</span>
        </button>
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

      {/* Filter */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">Filter by Quarter:</label>
          <select
            value={selectedQuarter}
            onChange={(e) => setSelectedQuarter(e.target.value)}
            className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all bg-white max-w-xs"
          >
            <option value="all">All Quarters</option>
            {quarters.map(quarter => (
              <option key={quarter.id} value={quarter.id}>
                {quarter.name} {quarter.year} {quarter.is_active ? '(Active)' : ''}
              </option>
            ))}
          </select>
          <span className="text-sm text-gray-500">
            {classes.length} {classes.length === 1 ? 'class' : 'classes'} found
          </span>
        </div>
      </div>

      {/* Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map((classItem) => (
          <div key={classItem.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <BookOpen className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{classItem.class_name}</h3>
                  {classItem.quarter?.is_active && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                      Active Quarter
                    </span>
                  )}
                </div>
              </div>
              <div className="flex space-x-1">
                <button
                  onClick={() => handleOpenModal(classItem)}
                  className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                  title="Edit"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(classItem.id, classItem.class_name)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-sm">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">Quarter:</span>
                <span className="font-medium text-gray-900">
                  {classItem.quarter?.name} {classItem.quarter?.year}
                </span>
              </div>

              <div className="flex items-center space-x-2 text-sm">
                <User className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">Teacher:</span>
                <span className="font-medium text-gray-900">{classItem.teacher_name}</span>
              </div>

              <div className="flex items-center space-x-2 text-sm">
                <User className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">Secretary:</span>
                <span className="font-medium text-gray-900">{classItem.secretary_name}</span>
              </div>
            </div>
          </div>
        ))}

        {classes.length === 0 && (
          <div className="col-span-full text-center py-12">
            <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No classes found</h3>
            <p className="text-gray-600 mb-4">
              {selectedQuarter === 'all' 
                ? 'Create your first class to start tracking Sabbath School data'
                : 'No classes for selected quarter. Create one to get started.'}
            </p>
            <button
              onClick={() => handleOpenModal()}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all"
            >
              <Plus className="h-5 w-5" />
              <span>Add Class</span>
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Class Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-semibold text-gray-900">
                {editingClass ? 'Edit Class' : 'Add New Class'}
              </h3>
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
                <label className="block text-sm font-semibold text-gray-700 mb-2">Quarter</label>
                <select
                  name="quarter_id"
                  value={formData.quarter_id}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all bg-white"
                  required
                >
                  <option value="">Select Quarter</option>
                  {quarters.map(quarter => (
                    <option key={quarter.id} value={quarter.id}>
                      {quarter.name} {quarter.year} {quarter.is_active ? '(Active)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Class Name</label>
                <input
                  type="text"
                  name="class_name"
                  value={formData.class_name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                  placeholder="e.g., Young Adults, Women's Class, Men's Class"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Teacher Name</label>
                <input
                  type="text"
                  name="teacher_name"
                  value={formData.teacher_name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                  placeholder="Enter teacher's full name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Class Secretary Name</label>
                <input
                  type="text"
                  name="secretary_name"
                  value={formData.secretary_name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                  placeholder="Enter class secretary's full name"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  For record keeping only - class secretaries don't log in to the system
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Church Name</label>
                <input
                  type="text"
                  name="church_name"
                  value={formData.church_name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                  required
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all"
                >
                  <Save className="h-5 w-5" />
                  <span>{editingClass ? 'Update Class' : 'Create Class'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassManagement;