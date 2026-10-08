import React, { useState, useEffect } from 'react';
import { Users, Plus, AlertCircle, CheckCircle2, Loader2, Save } from 'lucide-react';
import api from '../../services/api'; // Adjust to your API path
import classService from '../../services/classService';

const CLASSES_LIST = [
  'Beginner',
  'Bible Class 1A',
  'Bible Class 1B',
  'Bible Class 2',
  'Bible Class 3',
  'John',
  'Judah',
  'Kindergarten',
  'Luke',
  'Mark',
  'Mathias',
  'Matthew',
  'Peter',
  'Phillip',
  'Power Point',
  'Power Point(Boarding)',
  'Primary',
  'Semeon'
];

const WeeklyDataEntry = () => {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [activeClassData, setActiveClassData] = useState(null);

  // Form State
  const [entryMode, setEntryMode] = useState('Offline'); // 'Online' | 'Offline'
  const [weekNumber, setWeekNumber] = useState(1);
  const [sabbathDate, setSabbathDate] = useState(new Date().toISOString().split('T')[0]);

  // Modal State for Quick Add Member
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  // 1. Fetch classes from API
  useEffect(() => {
    loadClasses();
  }, []);

  // 2. Sync selected class data & members whenever selectedClassId changes
  useEffect(() => {
    if (!selectedClassId) {
      setActiveClassData(null);
      return;
    }

    const found = classes.find(
      (c) => String(c.id) === String(selectedClassId) || c.class_name === selectedClassId
    );
    setActiveClassData(found || null);
  }, [selectedClassId, classes]);

  const loadClasses = async () => {
    try {
      setLoading(true);
      const res = await classService.getAll();
      const list = Array.isArray(res) ? res : (res?.data?.data || res?.data || []);
      setClasses(list);

      if (list.length > 0) {
        setSelectedClassId(list[0].id);
      }
    } catch (err) {
      console.error('Failed to load classes:', err);
      setMessage({ type: 'error', text: 'Failed to fetch class records.' });
    } finally {
      setLoading(false);
    }
  };

  // Safely extract members array regardless of backend key name (members / ClassMembers / class_members)
  const getMembersList = (classObj) => {
    if (!classObj) return [];
    return classObj.members || classObj.ClassMembers || classObj.class_members || [];
  };

  const currentMembers = getMembersList(activeClassData);

  // Quick Add Member Handler
  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!newMemberName.trim() || !activeClassData) return;

    try {
      setSubmitting(true);
      setMessage({ type: '', text: '' });

      await api.post('/class-members', {
        class_id: activeClassData.id,
        member_name: newMemberName.trim()
      });

      setMessage({ type: 'success', text: 'Member added successfully!' });
      setNewMemberName('');
      setShowMemberModal(false);

      // Refresh class list to retrieve new member
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

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-4">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Weekly Data Entry</h1>
        <p className="text-sm text-gray-600">
          Record Sabbath school attendance, guide study metrics, and payments.
        </p>
      </div>

      {/* Status Alerts */}
      {message.text && (
        <div
          className={`p-4 rounded-lg flex items-center space-x-3 text-sm ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Main Entry Card */}
      <div className="bg-white rounded-xl shadow p-6 border border-gray-100 space-y-6">
        {/* Toggle Mode & Class Picker */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">
              Entry Mode
            </label>
            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setEntryMode('Offline')}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition ${
                  entryMode === 'Offline'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Offline
              </button>
              <button
                type="button"
                onClick={() => setEntryMode('Online')}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition ${
                  entryMode === 'Online'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Online
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">
              Class
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              {classes.length > 0
                ? classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.class_name}
                    </option>
                  ))
                : CLASSES_LIST.map((clsName) => (
                    <option key={clsName} value={clsName}>
                      {clsName}
                    </option>
                  ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">
                Week (1-13)
              </label>
              <input
                type="number"
                min="1"
                max="13"
                value={weekNumber}
                onChange={(e) => setWeekNumber(Number(e.target.value))}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">
                Sabbath Date
              </label>
              <input
                type="date"
                value={sabbathDate}
                onChange={(e) => setSabbathDate(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Class Members Section */}
        <div className="border-t pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-indigo-600" />
              <h2 className="text-lg font-semibold text-gray-900">Class Members</h2>
              <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
                {currentMembers.length} {currentMembers.length === 1 ? 'member' : 'members'} registered
              </span>
            </div>

            <button
              type="button"
              onClick={() => setShowMemberModal(true)}
              className="flex items-center space-x-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition shadow-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Add Member</span>
            </button>
          </div>

          {/* Member List or Empty Placeholder */}
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
            </div>
          ) : currentMembers.length === 0 ? (
            <div className="p-8 bg-gray-50 rounded-xl text-center border border-dashed border-gray-200">
              <Users className="h-10 w-10 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 font-medium">
                No members registered in this class.
              </p>
              <p className="text-xs text-gray-400 mt-1 mb-4">
                Click "Add Member" to register members.
              </p>
              <button
                type="button"
                onClick={() => setShowMemberModal(true)}
                className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition"
              >
                Add Member
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {currentMembers.map((m) => (
                <div
                  key={m.id}
                  className="p-3 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between text-sm"
                >
                  <span className="font-medium text-gray-800">{m.member_name}</span>
                  <span className="text-xs text-gray-400">Registered</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Member Quick Modal */}
      {showMemberModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h2 className="text-lg font-bold text-gray-900">
              Add Member to {activeClassData?.class_name || 'Class'}
            </h2>

            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                  Member Name
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Enter full name"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowMemberModal(false)}
                  className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg flex items-center space-x-1"
                >
                  {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Save Member</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeeklyDataEntry;