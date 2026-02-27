import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import classService from '../../services/classService';
import weeklyDataService from '../../services/WeeklyDataService';
import classMemberService from '../../services/classMemberService';
import offlineStorage from '../../utils/offlineStorage';
import { Save, AlertCircle, CheckCircle, Plus, Edit2, Trash2, X, Users, DollarSign, WifiOff, RefreshCw } from 'lucide-react';

const WeeklyDataEntry = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [weekNumber, setWeekNumber] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [manualOffline, setManualOffline] = useState(false);
  const [pendingMembersCount, setPendingMembersCount] = useState(0);
  
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
    checkPendingMembers();
  }, []);

  // Enhanced online/offline detection
  useEffect(() => {
    const updateOnlineStatus = () => {
      const actualStatus = navigator.onLine;
      console.log('Browser reports online:', actualStatus);
      console.log('Manual offline mode:', manualOffline);
      setIsOnline(actualStatus && !manualOffline);
    };

    updateOnlineStatus();

    const handleOnline = () => {
      console.log('🟢 ONLINE event fired');
      updateOnlineStatus();
    };
    
    const handleOffline = () => {
      console.log('🔴 OFFLINE event fired');
      updateOnlineStatus();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const intervalId = setInterval(updateOnlineStatus, 2000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intervalId);
    };
  }, [manualOffline]);

  useEffect(() => {
    if (selectedClass) {
      loadMembersWithLocal();
      if (weekNumber) {
        checkExistingData();
      }
    }
  }, [selectedClass, weekNumber]);

  const checkPendingMembers = () => {
    const localMembers = JSON.parse(localStorage.getItem('pendingMembers') || '[]');
    setPendingMembersCount(localMembers.length);
  };

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

  const loadMembersWithLocal = async () => {
    try {
      await loadMembers();
      
      // Load pending local members
      const localMembers = JSON.parse(localStorage.getItem('pendingMembers') || '[]');
      const pendingAdds = localMembers.filter(m => m.action === 'create' && m.data.class_id === selectedClass);
      
      if (pendingAdds.length > 0) {
        const tempMembers = pendingAdds.map(item => item.data);
        setMembers(prev => [...prev, ...tempMembers]);
        
        console.log('Loaded pending local members:', tempMembers);
      }
    } catch (error) {
      console.error('Error loading members with local:', error);
    }
  };

  const handleAddMember = async () => {
    if (!newMemberName.trim()) return;

    // Check if offline
    const isActuallyOnline = navigator.onLine && !manualOffline;

    if (!isActuallyOnline) {
      // Offline mode - just add to local state
      setMessage({ 
        type: 'warning', 
        text: '📴 Offline: Member added locally. Will sync when online.' 
      });

      const tempId = `temp-${Date.now()}`;
      const newMember = {
        id: tempId,
        member_name: newMemberName.trim(),
        class_id: selectedClass,
        isLocal: true
      };

      setMembers([...members, newMember]);
      setNewMemberName('');
      setEditingMember(null);
      setShowMemberModal(false);

      // Store in localStorage
      const localMembers = JSON.parse(localStorage.getItem('pendingMembers') || '[]');
      localMembers.push({
        action: 'create',
        data: newMember,
        timestamp: Date.now()
      });
      localStorage.setItem('pendingMembers', JSON.stringify(localMembers));
      checkPendingMembers();

      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return;
    }

    // Online mode - proceed normally
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

    // Check if offline
    const isActuallyOnline = navigator.onLine && !manualOffline;

    if (!isActuallyOnline) {
      // Offline mode - remove from local state
      setMessage({ 
        type: 'warning', 
        text: '📴 Offline: Member removed locally. Will sync when online.' 
      });

      setMembers(members.filter(m => m.id !== memberId));

      // Store in localStorage
      const localMembers = JSON.parse(localStorage.getItem('pendingMembers') || '[]');
      localMembers.push({
        action: 'delete',
        memberId: memberId,
        timestamp: Date.now()
      });
      localStorage.setItem('pendingMembers', JSON.stringify(localMembers));
      checkPendingMembers();

      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return;
    }

    // Online mode - proceed normally
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

  const syncPendingMembers = async () => {
    const localMembers = JSON.parse(localStorage.getItem('pendingMembers') || '[]');
    
    if (localMembers.length === 0) {
      setMessage({ type: 'info', text: 'No pending members to sync.' });
      setTimeout(() => setMessage({ type: '', text: '' }), 2000);
      return;
    }

    setLoading(true);
    console.log('Syncing pending members:', localMembers);

    let syncedCount = 0;
    let failedCount = 0;

    for (const item of localMembers) {
      try {
        if (item.action === 'create') {
          await classMemberService.create({
            class_id: item.data.class_id,
            member_name: item.data.member_name
          });
          console.log('✅ Synced member:', item.data.member_name);
          syncedCount++;
        } else if (item.action === 'delete') {
          // Skip if it was a temp member
          if (!item.memberId.startsWith('temp-')) {
            await classMemberService.delete(item.memberId);
            console.log('✅ Synced delete:', item.memberId);
            syncedCount++;
          }
        }
      } catch (error) {
        console.error('Failed to sync member:', item, error);
        failedCount++;
      }
    }

    // Clear pending members
    localStorage.removeItem('pendingMembers');
    checkPendingMembers();
    
    // Reload members from server
    await loadMembers();
    
    setMessage({ 
      type: 'success', 
      text: `✅ Synced ${syncedCount} member(s)${failedCount > 0 ? `, ${failedCount} failed` : ''}!` 
    });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    setLoading(false);
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

    const isActuallyOnline = navigator.onLine && !manualOffline;
    
    console.log('=== SUBMIT DEBUG ===');
    console.log('Navigator.onLine:', navigator.onLine);
    console.log('Manual Offline Mode:', manualOffline);
    console.log('Final Status (Actually Online):', isActuallyOnline);
    console.log('Data to submit:', dataToSubmit);

    try {
      if (!isActuallyOnline) {
        console.log('🔴 OFFLINE MODE - Saving to IndexedDB...');
        
        await offlineStorage.savePendingData({ data: dataToSubmit });
        
        console.log('✅ Saved offline successfully');
        
        setMessage({ 
          type: 'warning', 
          text: '📴 You\'re offline! Data saved locally and will sync when you\'re back online.' 
        });
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        setTimeout(() => {
          navigate('/secretary');
        }, 3000);
        
        setLoading(false);
        return;
      }

      console.log('🟢 ONLINE MODE - Submitting to server...');

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
      console.error('❌ Submit error:', error);
      
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
        
        {/* Enhanced Status Controls */}
        <div className="flex items-center space-x-3">
          {/* Sync Pending Members Button */}
          {pendingMembersCount > 0 && (
            <button
              type="button"
              onClick={syncPendingMembers}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm flex items-center space-x-2 disabled:opacity-50"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Sync {pendingMembersCount} Pending Member{pendingMembersCount > 1 ? 's' : ''}</span>
            </button>
          )}

          {/* Manual Offline Toggle */}
          <button
            type="button"
            onClick={() => setManualOffline(!manualOffline)}
            className={`px-4 py-2 rounded-lg border-2 font-medium transition-all text-sm ${
              manualOffline 
                ? 'bg-orange-100 border-orange-500 text-orange-800 hover:bg-orange-200' 
                : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {manualOffline ? '🔴 Test Offline Mode (Click for Online)' : '🟢 Online (Click to Test Offline)'}
          </button>

          {/* Status Indicator */}
          <div className={`px-4 py-2 rounded-lg border-2 ${
            isOnline && !manualOffline 
              ? 'bg-green-50 border-green-500' 
              : 'bg-red-50 border-red-500'
          }`}>
            <span className="text-sm font-medium">
              {isOnline && !manualOffline ? '🟢 Online' : '🔴 Offline'}
            </span>
          </div>

          {/* Debug Info */}
          <div className="text-xs text-gray-600 bg-gray-50 px-3 py-2 rounded border">
            <div>Browser: {navigator.onLine ? '✓ Online' : '✗ Offline'}</div>
            <div>Mode: {manualOffline ? '✗ Manual OFF' : '✓ Normal'}</div>
          </div>
        </div>
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

        {/* Class Members Management */}
        {selectedClass && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Users className="h-6 w-6 text-indigo-600" />
                <h2 className="text-xl font-semibold">Class Members</h2>
                <span className="text-sm text-gray-500">({members.length} members)</span>
                {members.some(m => m.isLocal) && (
                  <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                    {members.filter(m => m.isLocal).length} pending sync
                  </span>
                )}
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
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      member.isLocal 
                        ? 'bg-orange-50 border-orange-200' 
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center space-x-2 flex-1">
                      <span className="text-sm font-medium text-gray-900">{member.member_name}</span>
                      {member.isLocal && (
                        <span className="text-xs text-orange-600">●</span>
                      )}
                    </div>
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

        {/* Attendance & Participation */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Attendance & Participation</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border-2 border-green-200">
              <label className="block text-sm font-bold text-green-800 mb-2 flex items-center">
                <DollarSign className="h-5 w-5 mr-2" />
                Offering Given for Global Mission (UGX)
              </label>
              <input
                type="number"
                name="offering_global_mission"
                value={formData.offering_global_mission}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-green-300 rounded-lg focus:border-green-500 focus:ring-4 focus:ring-green-100 outline-none transition-all text-lg font-semibold"
                min="0"
                step="0.01"
                placeholder="Enter offering amount"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Total Attendance</label>
              <input
                type="number"
                name="total_attendance"
                value={formData.total_attendance}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                min="0"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Number of Member Visits</label>
              <input
                type="number"
                name="member_visits"
                value={formData.member_visits}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Members Who Conducted Bible Studies</label>
              <input
                type="number"
                name="members_conducted_bible_studies"
                value={formData.members_conducted_bible_studies}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Members Who Helped Others</label>
              <input
                type="number"
                name="members_helped_others"
                value={formData.members_helped_others}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Members Who Studied Lesson During Week</label>
              <input
                type="number"
                name="members_studied_lesson"
                value={formData.members_studied_lesson}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Number of Visitors</label>
              <input
                type="number"
                name="number_of_visitors"
                value={formData.number_of_visitors}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Bible Study Guides Distributed</label>
              <input
                type="number"
                name="bible_study_guides_distributed"
                value={formData.bible_study_guides_distributed}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                min="0"
              />
            </div>
          </div>
        </div>

        {/* Payment Tracking */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-2 mb-4">
            <DollarSign className="h-6 w-6 text-green-600" />
            <h2 className="text-xl font-semibold">Lesson & Morning Watch Payments</h2>
          </div>
          
          <div className="mb-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
            <p className="text-sm text-blue-800">
              <strong>Instructions:</strong> Enter the amount each member paid this week. Leave blank (0) for members who didn't pay.
            </p>
          </div>

          {members.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              Please add class members first to track payments.
            </p>
          ) : (
            <div className="space-y-8">
              {/* Lesson English */}
              <div className="border-2 border-green-200 rounded-lg p-4 bg-green-50">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center justify-between">
                  <span>📚 Lesson (English)</span>
                  <span className="bg-green-600 text-white px-4 py-1 rounded-full text-sm font-bold">
                    Total: {calculateTotal(paymentsLessonEnglish).toLocaleString()} UGX
                  </span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {members.map((member) => (
                    <div key={`le-${member.id}`} className="flex items-center space-x-3 bg-white p-3 rounded-lg">
                      <span className="text-sm font-medium text-gray-800 flex-1">{member.member_name}</span>
                      <div className="flex items-center space-x-1">
                        <input
                          type="number"
                          value={paymentsLessonEnglish[member.id] || ''}
                          onChange={(e) => handlePaymentChange(member.id, e.target.value, setPaymentsLessonEnglish)}
                          className="w-28 px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none text-right"
                          placeholder="0"
                          min="0"
                          step="100"
                        />
                        <span className="text-sm text-gray-600 font-medium">UGX</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Lesson Luganda */}
              <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center justify-between">
                  <span>📚 Lesson (Luganda)</span>
                  <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-bold">
                    Total: {calculateTotal(paymentsLessonLuganda).toLocaleString()} UGX
                  </span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {members.map((member) => (
                    <div key={`ll-${member.id}`} className="flex items-center space-x-3 bg-white p-3 rounded-lg">
                      <span className="text-sm font-medium text-gray-800 flex-1">{member.member_name}</span>
                      <div className="flex items-center space-x-1">
                        <input
                          type="number"
                          value={paymentsLessonLuganda[member.id] || ''}
                          onChange={(e) => handlePaymentChange(member.id, e.target.value, setPaymentsLessonLuganda)}
                          className="w-28 px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-right"
                          placeholder="0"
                          min="0"
                          step="100"
                        />
                        <span className="text-sm text-gray-600 font-medium">UGX</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Morning Watch English */}
              <div className="border-2 border-purple-200 rounded-lg p-4 bg-purple-50">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center justify-between">
                  <span>🌅 Morning Watch (English)</span>
                  <span className="bg-purple-600 text-white px-4 py-1 rounded-full text-sm font-bold">
                    Total: {calculateTotal(paymentsMorningWatchEnglish).toLocaleString()} UGX
                  </span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {members.map((member) => (
                    <div key={`mwe-${member.id}`} className="flex items-center space-x-3 bg-white p-3 rounded-lg">
                      <span className="text-sm font-medium text-gray-800 flex-1">{member.member_name}</span>
                      <div className="flex items-center space-x-1">
                        <input
                          type="number"
                          value={paymentsMorningWatchEnglish[member.id] || ''}
                          onChange={(e) => handlePaymentChange(member.id, e.target.value, setPaymentsMorningWatchEnglish)}
                          className="w-28 px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none text-right"
                          placeholder="0"
                          min="0"
                          step="100"
                        />
                        <span className="text-sm text-gray-600 font-medium">UGX</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Morning Watch Luganda */}
              <div className="border-2 border-orange-200 rounded-lg p-4 bg-orange-50">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center justify-between">
                  <span>🌅 Morning Watch (Luganda)</span>
                  <span className="bg-orange-600 text-white px-4 py-1 rounded-full text-sm font-bold">
                    Total: {calculateTotal(paymentsMorningWatchLuganda).toLocaleString()} UGX
                  </span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {members.map((member) => (
                    <div key={`mwl-${member.id}`} className="flex items-center space-x-3 bg-white p-3 rounded-lg">
                      <span className="text-sm font-medium text-gray-800 flex-1">{member.member_name}</span>
                      <div className="flex items-center space-x-1">
                        <input
                          type="number"
                          value={paymentsMorningWatchLuganda[member.id] || ''}
                          onChange={(e) => handlePaymentChange(member.id, e.target.value, setPaymentsMorningWatchLuganda)}
                          className="w-28 px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-100 outline-none text-right"
                          placeholder="0"
                          min="0"
                          step="100"
                        />
                        <span className="text-sm text-gray-600 font-medium">UGX</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Grand Total Summary */}
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4">📊 Week {weekNumber} Payment Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm opacity-90">Lesson (English)</p>
                    <p className="text-2xl font-bold">{calculateTotal(paymentsLessonEnglish).toLocaleString()}</p>
                    <p className="text-xs opacity-75">UGX</p>
                  </div>
                  <div>
                    <p className="text-sm opacity-90">Lesson (Luganda)</p>
                    <p className="text-2xl font-bold">{calculateTotal(paymentsLessonLuganda).toLocaleString()}</p>
                    <p className="text-xs opacity-75">UGX</p>
                  </div>
                  <div>
                    <p className="text-sm opacity-90">MW (English)</p>
                    <p className="text-2xl font-bold">{calculateTotal(paymentsMorningWatchEnglish).toLocaleString()}</p>
                    <p className="text-xs opacity-75">UGX</p>
                  </div>
                  <div>
                    <p className="text-sm opacity-90">MW (Luganda)</p>
                    <p className="text-2xl font-bold">{calculateTotal(paymentsMorningWatchLuganda).toLocaleString()}</p>
                    <p className="text-xs opacity-75">UGX</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-white/30">
                  <p className="text-sm opacity-90">Total Collections This Week</p>
                  <p className="text-3xl font-bold">
                    {(
                      calculateTotal(paymentsLessonEnglish) +
                      calculateTotal(paymentsLessonLuganda) +
                      calculateTotal(paymentsMorningWatchEnglish) +
                      calculateTotal(paymentsMorningWatchLuganda)
                    ).toLocaleString()} UGX
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Additional Notes */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Additional Notes (Optional)</h2>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Notes/Comments</label>
            <textarea
              name="members_summary"
              value={formData.members_summary}
              onChange={handleChange}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
              rows="4"
              placeholder="Any additional notes, comments, or observations..."
            />
          </div>
        </div>

        {/* Submit Button */}
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

      {/* Member Modal */}
      {showMemberModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-semibold text-gray-900">
                {editingMember ? 'Edit Member' : 'Add New Member'}
              </h3>
              <button
                onClick={() => {
                  setShowMemberModal(false);
                  setEditingMember(null);
                  setNewMemberName('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Member Name
              </label>
              <input
                type="text"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddMember();
                  }
                }}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                placeholder="Enter member's full name"
                autoFocus
              />
            </div>

            <div className="flex justify-end space-x-3 p-6 border-t">
              <button
                onClick={() => {
                  setShowMemberModal(false);
                  setEditingMember(null);
                  setNewMemberName('');
                }}
                className="px-4 py-2 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleAddMember}
                disabled={!newMemberName.trim()}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingMember ? 'Update' : 'Add'} Member
              </button>
            </div>
          </div>
        </div>
      )}

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