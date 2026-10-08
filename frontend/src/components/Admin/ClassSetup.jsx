import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Users, BookOpen, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import api from '../../services/api'; // Adjust path based on your project structure
import classService from '../../services/classService';
import quarterService from '../../services/quarterService';

const ClassSetup = () => {
  const [quarters, setQuarters] = useState([]);
  const [selectedQuarter, setSelectedQuarter] = useState(null);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Modal States
  const [showClassModal, setShowClassModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);

  // Form States
  const [classForm, setClassForm] = useState({ class_name: '', teacher_name: '' });
  const [memberForm, setMemberForm] = useState({ member_name: '' });

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
      setLoading(true);
      const res = await quarterService.getAll();
      const qList = Array.isArray(res) ? res : (res?.data?.data || res?.data || []);
      setQuarters(qList);

      // Select active quarter by default or fallback to first quarter
      const active = qList.find(q => q.is_active) || qList[0];
      if (active) setSelectedQuarter(active);
    } catch (err) {
      console.error('Failed to load quarters:', err);
      setMessage({ type: 'error', text: 'Failed to fetch quarters.' });
    } finally {
      setLoading(false);
    }
  };

  const loadClasses = async () => {
    if (!selectedQuarter) return;
    try {
      setLoading(true);
      const quarterId = typeof selectedQuarter === 'object' ? selectedQuarter.id : selectedQuarter;
      const res = await classService.getByQuarter(quarterId);
      const cList = Array.isArray(res) ? res : (res?.data?.data || res?.data || []);
      
      setClasses(cList);

      // Sync active selectedClass state if member modal is currently open
      if (selectedClass) {
        const updatedSelected = cList.find(c => c.id === selectedClass.id);
        if (updatedSelected) setSelectedClass(updatedSelected);
      }
    } catch (err) {
      console.error('Failed to load classes:', err);
      setMessage({ type: 'error', text: 'Failed to fetch classes for selected quarter.' });
    } finally {
      setLoading(false);
    }
  };

  // Add Class Handler
  const handleCreateClass = async (e) => {
    e.preventDefault();
    if (!classForm.class_name.trim()) return;

    try {
      setSubmitting(true);
      setMessage({ type: '', text: '' });

      const payload = {
        class_name: classForm.class_name,
        teacher_name: classForm.teacher_name,
        quarter_id: selectedQuarter.id
      };

      await classService.create(payload);
      setMessage({ type: 'success', text: 'Class created successfully!' });
      setClassForm({ class_name: '', teacher_name: '' });
      setShowClassModal(false);
      await loadClasses();
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to create class.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Add Member Handler
  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!memberForm.member_name.trim() || !selectedClass) return;

    try {
      setSubmitting(true);
      setMessage({ type: '', text: '' });

      await api.post('/class-members', {
        class_id: selectedClass.id,
        member_name: memberForm.member_name.trim()
      });

      setMessage({ type: 'success', text: 'Member added successfully!' });
      setMemberForm({ member_name: '' });

      // Reload class list to reflect changes in UI and update selectedClass count
      await loadClasses();
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to add member.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Member Handler
  const handleDeleteMember = async (memberId) => {
    if (!window.confirm('Are you sure you want to remove this member?')) return;

    try {
      setMessage({ type: '', text: '' });
      await api.delete(`/class-members/${memberId}`);
      setMessage({ type: 'success', text: 'Member removed successfully!' });
      await loadClasses();
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to delete member.'
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Quarter Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Class Setup & Members</h1>
          <p className="text-sm text-gray-500">Manage Sabbath School classes and registered members</p>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={selectedQuarter?.id || ''}
            onChange={(e) => {
              const q = quarters.find(item => item.id === e.target.value);
              setSelectedQuarter(q);
            }}
            className="px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
          >
            {quarters.map((q) => (
              <option key={q.id} value={q.id}>
                {q.name} ({q.year})
              </option>
            ))}
          </select>

          <button
            onClick={() => {
              setClassForm({ class_name: '', teacher_name: '' });
              setShowClassModal(true);
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow-sm text-sm font-medium"
          >
            <Plus className="h-4 w-4" />
            <span>Add Class</span>
          </button>
        </div>
      </div>

      {/* Global Status Message */}
      {message.text && (
        <div
          className={`p-4 rounded-lg flex items-center space-x-3 text-sm ${
            message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.type === 'success' ? <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" /> : <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Main Content Area */}
      {loading ? (
        <div className="flex justify-center items-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : classes.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No Classes Found</h3>
          <p className="text-gray-500 text-sm mb-4">No Sabbath School classes registered for this quarter yet.</p>
          <button
            onClick={() => setShowClassModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium inline-flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Create First Class</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((cls) => {
            const memberList = cls.members || cls.ClassMembers || [];
            return (
              <div key={cls.id} className="bg-white rounded-lg shadow hover:shadow-md transition flex flex-col justify-between border border-gray-100">
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{cls.class_name}</h3>
                      {cls.teacher_name && (
                        <p className="text-xs text-gray-500 mt-0.5">Teacher: {cls.teacher_name}</p>
                      )}
                    </div>
                    <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold flex items-center space-x-1">
                      <Users className="h-3 w-3" />
                      <span>{memberList.length}</span>
                    </span>
                  </div>

                  <p className="text-xs text-gray-500 mt-4 mb-2 font-medium">
                    {memberList.length === 1 ? '1 member registered' : `${memberList.length} members registered in this class`}
                  </p>

                  {/* Member Preview List */}
                  {memberList.length === 0 ? (
                    <div className="p-4 bg-gray-50 rounded-lg text-center text-xs text-gray-500 border border-dashed border-gray-200 my-2">
                      No members registered in this class. Click "Add Member" to register members.
                    </div>
                  ) : (
                    <ul className="divide-y divide-gray-100 max-h-40 overflow-y-auto pr-1">
                      {memberList.map((m) => (
                        <li key={m.id} className="py-2 flex items-center justify-between text-sm">
                          <span className="text-gray-700 font-medium">{m.member_name}</span>
                          <button
                            onClick={() => handleDeleteMember(m.id)}
                            className="text-gray-400 hover:text-red-600 transition p-1"
                            title="Remove member"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="p-4 bg-gray-50 border-t border-gray-100 rounded-b-lg">
                  <button
                    onClick={() => {
                      setSelectedClass(cls);
                      setMemberForm({ member_name: '' });
                      setShowMemberModal(true);
                    }}
                    className="w-full flex items-center justify-center space-x-2 py-2 px-3 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-indigo-600 transition shadow-sm"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Member</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Class Modal */}
      {showClassModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
            <h2 className="text-xl font-bold mb-4">Add Sabbath School Class</h2>
            <form onSubmit={handleCreateClass} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Class Name</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={classForm.class_name}
                  onChange={(e) => setClassForm({ ...classForm, class_name: e.target.value })}
                  placeholder="e.g., Class 1, Adult Class, Youth"
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teacher / Leader Name</label>
                <input
                  type="text"
                  value={classForm.teacher_name}
                  onChange={(e) => setClassForm({ ...classForm, teacher_name: e.target.value })}
                  placeholder="e.g., Elder Mukasa"
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowClassModal(false)}
                  className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center space-x-2"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>Save Class</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showMemberModal && selectedClass && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Manage Members</h2>
                <p className="text-xs text-gray-500">Class: {selectedClass.class_name}</p>
              </div>
              <span className="text-xs font-semibold bg-indigo-100 text-indigo-800 px-2.5 py-1 rounded-full">
                {(selectedClass.members || selectedClass.ClassMembers || []).length} registered
              </span>
            </div>

            <form onSubmit={handleAddMember} className="space-y-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Member Full Name</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    autoFocus
                    value={memberForm.member_name}
                    onChange={(e) => setMemberForm({ member_name: e.target.value })}
                    placeholder="Enter member name"
                    className="flex-1 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  />
                  <button
                    type="submit"
                    disabled={submitting || !memberForm.member_name.trim()}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center space-x-1"
                  >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    <span>Add</span>
                  </button>
                </div>
              </div>
            </form>

            {/* List of currently registered members inside modal */}
            <div className="border-t pt-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Registered Class Members</p>
              <div className="max-h-48 overflow-y-auto divide-y divide-gray-100 pr-1">
                {(selectedClass.members || selectedClass.ClassMembers || []).length === 0 ? (
                  <p className="text-xs text-gray-400 py-2 text-center">No members added yet.</p>
                ) : (
                  (selectedClass.members || selectedClass.ClassMembers || []).map((m) => (
                    <div key={m.id} className="py-2 flex items-center justify-between text-sm">
                      <span className="text-gray-800 font-medium">{m.member_name}</span>
                      <button
                        onClick={() => handleDeleteMember(m.id)}
                        className="text-red-500 hover:text-red-700 text-xs flex items-center space-x-1 p-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t mt-4">
              <button
                type="button"
                onClick={() => {
                  setShowMemberModal(false);
                  setSelectedClass(null);
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassSetup;