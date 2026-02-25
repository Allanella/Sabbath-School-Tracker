import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import classService from '../../services/classService';
import weeklyDataService from '../../services/WeeklyDataService';
import classMemberService from '../../services/classMemberService';
import offlineStorage from '../../utils/offlineStorage';
import { Save, AlertCircle, CheckCircle, Plus, Edit2, Trash2, X, Users, DollarSign, WifiOff } from 'lucide-react';

const WeeklyDataEntry = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [weekNumber, setWeekNumber] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Members management state
  const [members, setMembers] = useState([]);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [editingMember, setEditingMember] = useState(null);

  // Payment tracking - stores {memberId: amount}
  const [paymentsLessonEnglish, setPaymentsLessonEnglish] = useState({});
  const [paymentsLessonLuganda, setPaymentsLessonLuganda] = useState({});
  const [paymentsMorningWatchEnglish, setPaymentsMorningWatchEnglish] = useState({});
  const [paymentsMorningWatchLuganda, setPaymentsMorningWatchLuganda] = useState({});

  const [formData, setFormData] = useState({
    sabbath_date: '',
    total_attendance: 0,
    member_visits: 0,
    members_conducted_bible_studies: 0,
    members_helped_others: 0,
    members_studied_lesson: 0,
    number_of_visitors: 0,
    bible_study_guides_distributed: 0,
    offering_global_mission: 0,
    members_summary: '',
  });

  useEffect(() => {
    loadClasses();

    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (selectedClass) {
      loadMembers();
      if (weekNumber) {
        checkExistingData();
      }
    }
  }, [selectedClass, weekNumber]);

  const loadClasses = async () => {
    try {
      console.log('Loading classes...');
      const response = await classService.getAll();
      console.log('Classes response:', response);
      
      const classesData = response.data?.data || response.data || [];
      console.log('Extracted classes data:', classesData);
      
      if (Array.isArray(classesData)) {
        setClasses(classesData);
        if (classesData.length > 0) {
          setSelectedClass(classesData[0].id);
        } else {
          setMessage({ 
            type: 'error', 
            text: 'No classes available. Please create classes in Admin → Classes first.' 
          });
        }
      } else {
        console.error('Classes data is not an array:', classesData);
        setClasses([]);
        setMessage({ 
          type: 'error', 
          text: 'Invalid data format received for classes.' 
        });
      }
    } catch (error) {
      console.error('Failed to load classes:', error);
      setClasses([]);
      setMessage({ type: 'error', text: 'Failed to load classes' });
    }
  };

  const loadMembers = async () => {
    try {
      console.log('Loading members for class:', selectedClass);
      const response = await classMemberService.getByClass(selectedClass);
      console.log('Members response:', response);
      
      const membersData = response.data?.data || response.data || [];
      console.log('Extracted members data:', membersData);
      
      if (Array.isArray(membersData)) {
        setMembers(membersData);
      } else {
        console.error('Members data is not an array:', membersData);
        setMembers([]);
      }
    } catch (error) {
      console.error('Failed to load members:', error);
      setMembers([]);
    }
  };

  const handleAddMember = async () => {
    if (!newMemberName.trim()) return;

    try {
      if (editingMember) {
        await classMemberService.update(editingMember.id, {
          member_name: newMemberName,
        });
        setMessage({ type: 'success', text: 'Member updated successfully!' });
      } else {
        await classMemberService.create({
          class_id: selectedClass,
          member_name: newMemberName,
        });
        setMessage({ type: 'success', text: 'Member added successfully!' });
      }
      
      setNewMemberName('');
      setEditingMember(null);
      setShowMemberModal(false);
      loadMembers();
      
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Error adding member:', error);
      
      const errorMessage = error.response?.data?.message 
        || error.response?.data?.error
        || 'Failed to save member. Please try again.';
      
      setMessage({ type: 'error', text: errorMessage });
    }
  };

  const handleEditMember = (member) => {
    setEditingMember(member);
    setNewMemberName(member.member_name);
    setShowMemberModal(true);
  };

  const handleDeleteMember = async (memberId) => {
    if (!window.confirm('Are you sure you want to remove this member?')) return;

    try {
      await classMemberService.delete(memberId);
      setMessage({ type: 'success', text: 'Member removed successfully!' });
      loadMembers();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Error deleting member:', error);
      const errorMessage = error.response?.data?.message || 'Failed to remove member.';
      setMessage({ type: 'error', text: errorMessage });
    }
  };

  const handlePaymentChange = (memberId, amount, setPayments) => {
    setPayments(prev => ({
      ...prev,
      [memberId]: parseFloat(amount) || 0
    }));
  };

  const calculateTotal = (payments) => {
    return Object.values(payments).reduce((sum, amount) => sum + (parseFloat(amount) || 0), 0);
  };

  const formatPaymentsForSave = (payments) => {
    if (!payments || Object.keys(payments).length === 0) {
      return '';
    }
    
    const entries = Object.entries(payments)
      .filter(([id, amount]) => amount && amount > 0)
      .map(([id, amount]) => {
        const member = members.find(m => m.id === id);
        return member ? `${member.member_name}: ${amount}` : null;
      })
      .filter(Boolean);
    
    return entries.length > 0 ? entries.join(', ') : '';
  };

  const parsePaymentsFromSaved = (paymentString) => {
    if (!paymentString || paymentString.trim() === '') return {};
    
    const payments = {};
    const entries = paymentString.split(',').map(s => s.trim()).filter(Boolean);
    
    entries.forEach(entry => {
      const [name, amount] = entry.split(':').map(s => s.trim());
      const member = members.find(m => m.member_name === name);
      if (member && amount) {
        payments[member.id] = parseFloat(amount);
      }
    });
    
    return payments;
  };

  const checkExistingData = async () => {
    try {
      const response = await weeklyDataService.getByWeek(selectedClass, weekNumber);
      if (response.data) {
        const data = response.data;
        setFormData(data);
        
        setPaymentsLessonEnglish(parsePaymentsFromSaved(data.members_paid_lesson_english));
        setPaymentsLessonLuganda(parsePaymentsFromSaved(data.members_paid_lesson_luganda));
        setPaymentsMorningWatchEnglish(parsePaymentsFromSaved(data.members_paid_morning_watch_english));
        setPaymentsMorningWatchLuganda(parsePaymentsFromSaved(data.members_paid_morning_watch_luganda));
        
        setMessage({
          type: 'info',
          text: 'Editing existing data for this week. Click Update to save changes.',
        });
      } else {
        setFormData({
          sabbath_date: '',
          total_attendance: 0,
          member_visits: 0,
          members_conducted_bible_studies: 0,
          members_helped_others: 0,
          members_studied_lesson: 0,
          number_of_visitors: 0,
          bible_study_guides_distributed: 0,
          offering_global_mission: 0,
          members_summary: '',
        });
        setPaymentsLessonEnglish({});
        setPaymentsLessonLuganda({});
        setPaymentsMorningWatchEnglish({});
        setPaymentsMorningWatchLuganda({});
        setMessage({ type: '', text: '' });
      }
    } catch (error) {
      console.error('Error checking existing data:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    const dataToSubmit = {
      class_id: selectedClass,
      week_number: parseInt(weekNumber),
      ...formData,
      members_paid_lesson_english: formatPaymentsForSave(paymentsLessonEnglish),
      members_paid_lesson_luganda: formatPaymentsForSave(paymentsLessonLuganda),
      members_paid_morning_watch_english: formatPaymentsForSave(paymentsMorningWatchEnglish),
      members_paid_morning_watch_luganda: formatPaymentsForSave(paymentsMorningWatchLuganda),
    };

    try {
      // Check if online
      if (!isOnline) {
        // Save offline
        await offlineStorage.savePendingData({ data: dataToSubmit });
        setMessage({ 
          type: 'warning', 
          text: '📴 You\'re offline! Data saved locally and will sync when you\'re back online.' 
        });
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        setTimeout(() => {
          navigate('/secretary');
        }, 3000);
        
        return;
      }

      // Online - submit normally
      if (formData.id) {
        await weeklyDataService.update(formData.id, dataToSubmit);
        setMessage({ type: 'success', text: '✅ Data updated successfully! Redirecting...' });
      } else {
        await weeklyDataService.submit(dataToSubmit);
        setMessage({ type: 'success', text: '🎉 Data submitted successfully! Redirecting...' });
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });

      setTimeout(() => {
        navigate('/secretary');
      }, 2000);
    } catch (error) {
      console.error('Submit error:', error);
      
      // If online but request failed, offer to save offline
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Network error. Saving offline...'
      });
      
      try {
        await offlineStorage.savePendingData({ data: dataToSubmit });
        setMessage({ 
          type: 'warning', 
          text: '⚠️ Could not reach server. Data saved offline and will sync later.' 
        });
        
        setTimeout(() => {
          navigate('/secretary');
        }, 3000);
      } catch (offlineError) {
        console.error('Offline save failed:', offlineError);
        setMessage({
          type: 'error',
          text: 'Failed to save data. Please try again.'
        });
      }
      
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Weekly Data Entry</h1>
        
        {/* Offline Indicator */}
        {!isOnline && (
          <div className="flex items-center space-x-2 px-4 py-2 bg-orange-100 border-2 border-orange-500 rounded-lg">
            <WifiOff className="h-5 w-5 text-orange-600" />
            <span className="text-sm font-medium text-orange-800">Offline Mode</span>
          </div>
        )}
      </div>

      {message.text && (
        <div
          className={`mb-6 p-4 rounded-lg flex items-start animate-fade-in ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200'
              : message.type === 'error'
              ? 'bg-red-50 border border-red-200'
              : message.type === 'warning'
              ? 'bg-orange-50 border border-orange-200'
              : 'bg-blue-50 border border-blue-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
          ) : message.type === 'warning' ? (
            <WifiOff className="h-5 w-5 text-orange-600 mr-2 mt-0.5" />
          ) : (
            <AlertCircle
              className={`h-5 w-5 mr-2 mt-0.5 ${
                message.type === 'error' ? 'text-red-600' : 'text-blue-600'
              }`}
            />
          )}
          <p
            className={`text-sm font-medium ${
              message.type === 'success'
                ? 'text-green-800'
                : message.type === 'error'
                ? 'text-red-800'
                : message.type === 'warning'
                ? 'text-orange-800'
                : 'text-blue-800'
            }`}
          >
            {message.text}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Class and Week Selection */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Class Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Select Class</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all bg-white"
                required
              >
                <option value="">Choose a class</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.class_name} ({cls.quarter?.name} {cls.quarter?.year})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Week Number</label>
              <select
                value={weekNumber}
                onChange={(e) => setWeekNumber(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all bg-white"
                required
              >
                {[...Array(13)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    Week {i + 1}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Sabbath Date</label>
              <input
                type="date"
                name="sabbath_date"
                value={formData.sabbath_date}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                required
              />
            </div>
          </div>
        </div>

        {/* Rest of the form remains exactly the same... */}
        {/* I'm keeping the rest of your existing form code unchanged */}
        {/* Just showing the key changes above */}

        {/* Class Members Management */}
        {selectedClass && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Users className="h-6 w-6 text-indigo-600" />
                <h2 className="text-xl font-semibold">Class Members</h2>
                <span className="text-sm text-gray-500">({members.length} members)</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingMember(null);
                  setNewMemberName('');
                  setShowMemberModal(true);
                }}
                className="flex items-center space-x-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                <Plus className="h-4 w-4" />
                <span>Add Member</span>
              </button>
            </div>

            {members.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <span className="text-sm font-medium text-gray-900">{member.member_name}</span>
                    <div className="flex space-x-1">
                      <button
                        type="button"
                        onClick={() => handleEditMember(member)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition"
                        title="Edit"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteMember(member.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition"
                        title="Remove"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-4">
                No members added yet. Click "Add Member" to get started.
              </p>
            )}
          </div>
        )}

        {/* Continue with all your existing form sections... */}
        {/* Attendance, Payments, Notes, etc. - keep all existing code */}

        {/* Submit Button - keep your existing one */}
        <div className="flex justify-end space-x-4">
          <button 
            type="button" 
            onClick={() => navigate('/secretary')} 
            className="px-4 py-2 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            <Save className="h-5 w-5" />
            <span>{loading ? 'Saving...' : formData.id ? 'Update Data' : 'Submit Data'}</span>
          </button>
        </div>
      </form>

      {/* Keep your existing modal code */}
      {showMemberModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          {/* Your existing modal code */}
        </div>
      )}

      {/* Keep your existing CSS */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default WeeklyDataEntry;