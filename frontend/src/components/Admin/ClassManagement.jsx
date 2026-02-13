import React, { useState, useEffect } from 'react';
import classService from '../../services/classService';
import classMemberService from '../../services/classMemberService';
import quarterService from '../../services/quarterService';
import { Plus, Trash2, Edit2, Users, Save, X, AlertCircle, CheckCircle } from 'lucide-react';

const ClassManagement = () => {
  const [quarters, setQuarters] = useState([]);
  const [classes, setClasses] = useState([]);
  const [classMembers, setClassMembers] = useState([]);
  const [selectedClassForMembers, setSelectedClassForMembers] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [formData, setFormData] = useState({
    class_name: '',
    teacher_name: '',
    secretary_name: '',
    quarter_id: ''
  });

  useEffect(() => {
    loadQuarters();
    loadClasses();
  }, []);

  const loadQuarters = async () => {
    try {
      const response = await quarterService.getAll();
      setQuarters(response.data);
    } catch (error) {
      console.error('Failed to load quarters:', error);
      setError('Failed to load quarters');
    }
  };

  const loadClasses = async () => {
    setLoading(true);
    try {
      const response = await classService.getAll();
      setClasses(response.data);
      setError('');
    } catch (error) {
      console.error('Failed to load classes:', error);
      setError('Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  const loadClassMembers = async (classId) => {
    setLoading(true);
    try {
      const response = await classMemberService.getByClass(classId);
      setClassMembers(response.data || []);
      setError('');
    } catch (error) {
      console.error('Failed to load class members:', error);
      setError('Failed to load class members');
      setClassMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (editingClass) {
        await classService.update(editingClass.id, formData);
        setSuccess('Class updated successfully!');
      } else {
        await classService.create(formData);
        setSuccess('Class created successfully!');
      }

      loadClasses();
      resetForm();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error saving class:', error);
      const errorMessage = error.response?.data?.message || 'Failed to save class';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (classItem) => {
    setEditingClass(classItem);
    setFormData({
      class_name: classItem.class_name,
      teacher_name: classItem.teacher_name,
      secretary_name: classItem.secretary_name,
      quarter_id: classItem.quarter_id
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this class?')) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await classService.delete(id);
      setSuccess('Class deleted successfully!');
      loadClasses();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error deleting class:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete class';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      class_name: '',
      teacher_name: '',
      secretary_name: '',
      quarter_id: ''
    });
    setEditingClass(null);
    setShowForm(false);
  };

  const handleAddMember = async () => {
    if (!newMemberName.trim()) {
      setError('Member name cannot be empty');
      return;
    }

    if (!selectedClassForMembers) {
      setError('Please select a class first');
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await classMemberService.create({
        class_id: selectedClassForMembers,
        member_name: newMemberName.trim()
      });

      const memberName = newMemberName.trim();
      setNewMemberName('');
      loadClassMembers(selectedClassForMembers);
      setSuccess(`"${memberName}" added successfully!`);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error adding member:', error);
      
      // Get error message from backend response
      const errorMessage = error.response?.data?.message 
        || error.response?.data?.error
        || error.message 
        || 'Failed to add member. Please try again.';
      
      setError(errorMessage);
      
      // Don't auto-clear error - let user read it
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMember = async (memberId) => {
    if (!window.confirm('Are you sure you want to remove this member?')) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await classMemberService.delete(memberId);
      setSuccess('Member removed successfully!');
      loadClassMembers(selectedClassForMembers);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error deleting member:', error);
      const errorMessage = error.response?.data?.message || 'Failed to remove member';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClassSelectForMembers = (classId) => {
    setSelectedClassForMembers(classId);
    setError('');
    setSuccess('');
    if (classId) {
      loadClassMembers(classId);
    } else {
      setClassMembers([]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Class Management</h1>
          <p className="text-gray-600 mt-1">Manage Sabbath School classes and members</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary flex items-center space-x-2"
        >
          {showForm ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
          <span>{showForm ? 'Cancel' : 'Add Class'}</span>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">Error</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg">
          <div className="flex items-start">
            <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-800">Success</p>
              <p className="text-sm text-green-700 mt-1">{success}</p>
            </div>
          </div>
        </div>
      )}

      {/* Class Form */}
      {showForm && (
        <div className="card">
          <h2 className="text-xl font-semibold mb-6">
            {editingClass ? 'Edit Class' : 'Add New Class'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Class Name *</label>
                <input
                  type="text"
                  required
                  className="input"
                  value={formData.class_name}
                  onChange={(e) => setFormData({ ...formData, class_name: e.target.value })}
                  placeholder="e.g., Bible Class 3"
                />
              </div>

              <div>
                <label className="label">Quarter *</label>
                <select
                  required
                  className="input"
                  value={formData.quarter_id}
                  onChange={(e) => setFormData({ ...formData, quarter_id: e.target.value })}
                >
                  <option value="">Select Quarter</option>
                  {quarters.map((quarter) => (
                    <option key={quarter.id} value={quarter.id}>
                      {quarter.name} {quarter.year} {quarter.is_active ? '(Active)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Teacher Name *</label>
                <input
                  type="text"
                  required
                  className="input"
                  value={formData.teacher_name}
                  onChange={(e) => setFormData({ ...formData, teacher_name: e.target.value })}
                  placeholder="Teacher's full name"
                />
              </div>

              <div>
                <label className="label">Secretary Name *</label>
                <input
                  type="text"
                  required
                  className="input"
                  value={formData.secretary_name}
                  onChange={(e) => setFormData({ ...formData, secretary_name: e.target.value })}
                  placeholder="Secretary's full name"
                />
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex items-center space-x-2"
              >
                <Save className="h-5 w-5" />
                <span>{editingClass ? 'Update Class' : 'Create Class'}</span>
              </button>
              
              {editingClass && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Classes List */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-6">Existing Classes</h2>
        
        {loading && !classes.length ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          </div>
        ) : classes.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No classes found. Create your first class above.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teacher</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Secretary</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quarter</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {classes.map((classItem) => {
                  const quarter = quarters.find(q => q.id === classItem.quarter_id);
                  return (
                    <tr key={classItem.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{classItem.class_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">{classItem.teacher_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">{classItem.secretary_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {quarter ? `${quarter.name} ${quarter.year}` : 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleEdit(classItem)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit class"
                          >
                            <Edit2 className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(classItem.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete class"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Class Members Management */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-6 flex items-center">
          <Users className="h-6 w-6 mr-2 text-indigo-600" />
          Manage Class Members
        </h2>

        <div className="space-y-4">
          {/* Class Selection */}
          <div>
            <label className="label">Select Class</label>
            <select
              className="input max-w-md"
              value={selectedClassForMembers}
              onChange={(e) => handleClassSelectForMembers(e.target.value)}
            >
              <option value="">Choose a class to manage members</option>
              {classes.map((classItem) => (
                <option key={classItem.id} value={classItem.id}>
                  {classItem.class_name} - {classItem.teacher_name}
                </option>
              ))}
            </select>
          </div>

          {/* Add Member Form */}
          {selectedClassForMembers && (
            <>
              <div className="flex space-x-2">
                <input
                  type="text"
                  className="input flex-1 max-w-md"
                  placeholder="Enter member name (e.g., John Doe)"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddMember();
                    }
                  }}
                />
                <button
                  onClick={handleAddMember}
                  disabled={loading || !newMemberName.trim()}
                  className="btn-primary flex items-center space-x-2"
                >
                  <Plus className="h-5 w-5" />
                  <span>Add Member</span>
                </button>
              </div>

              {/* Members List */}
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  Class Members ({classMembers.length})
                </h3>
                
                {loading && !classMembers.length ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                  </div>
                ) : classMembers.length === 0 ? (
                  <p className="text-gray-500 text-sm">No members in this class yet.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {classMembers.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100"
                      >
                        <span className="text-sm font-medium text-gray-900">
                          {member.member_name}
                        </span>
                        <button
                          onClick={() => handleDeleteMember(member.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Remove member"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClassManagement;