import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Trash2,
  Edit2,
  X,
  Save,
  CheckCircle,
  AlertCircle,
  Calendar,
  UserPlus,
  Search
} from 'lucide-react';
import api from '../../services/api';
import quarterService from '../../services/quarterService';

const ClassSetup = () => {
  const [quarters, setQuarters] = useState([]);
  const [selectedQuarter, setSelectedQuarter] = useState(null);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showClassModal, setShowClassModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [searchQuery, setSearchQuery] = useState('');

  const [classForm, setClassForm] = useState({
    class_name: '',
    teacher_name: ''
  });

  const [memberForm, setMemberForm] = useState({
    member_name: ''
  });

  useEffect(() => {
    loadQuarters();
  }, []);

  useEffect(() => {
    if (selectedQuarter) {
      loadClasses();
    }
  }, [selectedQuarter]);

  const loadQuarters = async () => {
    try {
      const response = await quarterService.getAll();
      setQuarters(response.data || []);
      
      // Auto-select active quarter or first quarter
      const activeQuarter = response.data.find(q => q.is_active);
      if (activeQuarter) {
        // Auto-select from localStorage if available
const savedQuarterId = localStorage.getItem('selectedQuarterId');
if (savedQuarterId) {
  const savedQuarter = response.data.find(q => q.id === savedQuarterId);
  if (savedQuarter) {
    setSelectedQuarter(savedQuarter);
    return;
  }
}
        setSelectedQuarter(activeQuarter);
      } else if (response.data.length > 0) {
        setSelectedQuarter(response.data[0]);
      }
    } catch (error) {
      console.error('Failed to load quarters:', error);
      setMessage({ type: 'error', text: 'Failed to load quarters' });
    } finally {
      setLoading(false);
    }
  };

  const loadClasses = async () => {
    if (!selectedQuarter) return;

    try {
      setLoading(true);
      const response = await api.get(`/classes?quarter_id=${selectedQuarter.id}`);
      
      // Load members for each class
      const classesWithMembers = await Promise.all(
        response.data.data.map(async (cls) => {
          try {
            // Try the working route, fallback to empty if it fails
let membersResponse;
try {
  membersResponse = await api.get(`/classes/${cls.id}/members`);
} catch (error) {
  // Route doesn't work, fetch directly from class_members table
  membersResponse = { data: { data: [] } };
}
            return {
              ...cls,
              members: membersResponse.data.data || []
            };
          } catch (error) {
            console.error(`Failed to load members for class ${cls.id}:`, error);
            return {
              ...cls,
              members: []
            };
          }
        })
      );

      setClasses(classesWithMembers);
    } catch (error) {
      console.error('Failed to load classes:', error);
      setMessage({ type: 'error', text: 'Failed to load classes' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenClassModal = (classToEdit = null) => {
    if (classToEdit) {
      setEditingClass(classToEdit);
      setClassForm({
        class_name: classToEdit.class_name,
        teacher_name: classToEdit.teacher_name
      });
    } else {
      setEditingClass(null);
      setClassForm({
        class_name: '',
        teacher_name: ''
      });
    }
    setShowClassModal(true);
    setMessage({ type: '', text: '' });
  };

  const handleCloseClassModal = () => {
    setShowClassModal(false);
    setEditingClass(null);
    setClassForm({
      class_name: '',
      teacher_name: ''
    });
  };

  const handleSubmitClass = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    try {
      if (editingClass) {
        // Update existing class
        await api.put(`/classes/${editingClass.id}`, classForm);
        setMessage({ type: 'success', text: 'Class updated successfully!' });
      } else {
        // Create new class
        await api.post('/classes', {
          ...classForm,
          quarter_id: selectedQuarter.id
        });
        setMessage({ type: 'success', text: 'Class created successfully!' });
      }

      setTimeout(() => {
        handleCloseClassModal();
        loadClasses();
      }, 1500);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to save class'
      });
    }
  };

  const handleDeleteClass = async (classId, className) => {
    if (!window.confirm(`Delete class "${className}"? This will remove all associated members!`)) {
      return;
    }

    try {
      await api.delete(`/classes/${classId}`);
      setMessage({ type: 'success', text: 'Class deleted successfully' });
      loadClasses();
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Failed to delete class. It may have associated data.'
      });
    }
  };

  const handleOpenMemberModal = (classData) => {
    setSelectedClass(classData);
    setMemberForm({ member_name: '' });
    setShowMemberModal(true);
    setMessage({ type: '', text: '' });
  };

  const handleCloseMemberModal = () => {
    setShowMemberModal(false);
    setSelectedClass(null);
    setMemberForm({ member_name: '' });
  };

  const handleSubmitMember = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    try {
      await api.post('/class-members', {
        class_id: selectedClass.id,
        member_name: memberForm.member_name
      });

      setMessage({ type: 'success', text: 'Member added successfully!' });
      setMemberForm({ member_name: '' });

      // Reload classes to update member count
      loadClasses();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to add member'
      });
    }
  };

  const handleDeleteMember = async (memberId, memberName) => {
    if (!window.confirm(`Remove "${memberName}" from this class?`)) {
      return;
    }

    try {
      await api.delete(`/class-members/${memberId}`);
      setMessage({ type: 'success', text: 'Member removed successfully' });
      loadClasses();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to remove member' });
    }
  };

  const filteredClasses = classes.filter(cls =>
    cls.class_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cls.teacher_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading && !selectedQuarter) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Class Management</h1>
        <p className="text-gray-600">Manage classes and members for each quarter</p>
      </div>

      {/* QUARTER SELECTOR */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Quarter
            </label>
            <select
              value={selectedQuarter?.id || ''}
              onChange={(e) => {
                const quarter = quarters.find(q => q.id === e.target.value);
                setSelectedQuarter(quarter);
              }}
              className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {quarters.map(q => (
                <option key={q.id} value={q.id}>
                  {q.name} {q.year} {q.is_active ? '(Active)' : ''}
                </option>
              ))}
            </select>
          </div>

          {selectedQuarter && (
            <button
              onClick={() => handleOpenClassModal()}
              className="btn-primary flex items-center justify-center space-x-2"
            >
              <Plus className="h-5 w-5" />
              <span>Add Class</span>
            </button>
          )}
        </div>
      </div>

      {/* ALERT */}
      {message.text && (
        <div
          className={`mb-6 p-4 rounded-lg flex items-start ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
          )}
          <p
            className={`text-sm ${
              message.type === 'success' ? 'text-green-800' : 'text-red-800'
            }`}
          >
            {message.text}
          </p>
        </div>
      )}

      {/* SEARCH */}
      {selectedQuarter && classes.length > 0 && (
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search classes by name or teacher..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>
      )}

      {/* CLASSES LIST */}
      {selectedQuarter ? (
        loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : filteredClasses.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery ? 'No classes match your search' : 'No classes yet'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchQuery
                ? 'Try a different search term'
                : `Create your first class for ${selectedQuarter.name} ${selectedQuarter.year}`}
            </p>
            {!searchQuery && (
              <button
                onClick={() => handleOpenClassModal()}
                className="btn-primary inline-flex items-center space-x-2"
              >
                <Plus className="h-5 w-5" />
                <span>Add Class</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredClasses.map((cls) => (
              <div key={cls.id} className="bg-white rounded-lg shadow-md p-6">
                {/* CLASS HEADER */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                      {cls.class_name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Teacher: {cls.teacher_name}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {cls.members?.length || 0} members
                    </p>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleOpenClassModal(cls)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      title="Edit Class"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteClass(cls.id, cls.class_name)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Delete Class"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* MEMBERS LIST */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-gray-700">Members</h4>
                    <button
                      onClick={() => handleOpenMemberModal(cls)}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1"
                    >
                      <UserPlus className="h-4 w-4" />
                      <span>Add Member</span>
                    </button>
                  </div>

                  {cls.members && cls.members.length > 0 ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {cls.members.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                        >
                          <span className="text-sm text-gray-900">
                            {member.member_name}
                          </span>
                          <button
                            onClick={() =>
                              handleDeleteMember(member.id, member.member_name)
                            }
                            className="text-red-600 hover:text-red-700"
                            title="Remove Member"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No members yet</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No quarters available
          </h3>
          <p className="text-gray-600">
            Create a quarter first to manage classes
          </p>
        </div>
      )}

      {/* CLASS MODAL */}
      {showClassModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-semibold text-gray-900">
                {editingClass ? 'Edit Class' : 'Add New Class'}
              </h3>
              <button
                onClick={handleCloseClassModal}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmitClass} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Class Name
                </label>
                <input
                  type="text"
                  value={classForm.class_name}
                  onChange={(e) =>
                    setClassForm({ ...classForm, class_name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="e.g., Beginners, Youth, Adults"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teacher Name
                </label>
                <input
                  type="text"
                  value={classForm.teacher_name}
                  onChange={(e) =>
                    setClassForm({ ...classForm, teacher_name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Teacher's full name"
                  required
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseClassModal}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium flex items-center space-x-2"
                >
                  <Save className="h-5 w-5" />
                  <span>{editingClass ? 'Update' : 'Create'} Class</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD MEMBER MODAL */}
      {showMemberModal && selectedClass && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-semibold text-gray-900">
                Add Member to {selectedClass.class_name}
              </h3>
              <button
                onClick={handleCloseMemberModal}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmitMember} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Member Name
                </label>
                <input
                  type="text"
                  value={memberForm.member_name}
                  onChange={(e) =>
                    setMemberForm({ member_name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Full name"
                  required
                  autoFocus
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseMemberModal}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium flex items-center space-x-2"
                >
                  <UserPlus className="h-5 w-5" />
                  <span>Add Member</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassSetup;