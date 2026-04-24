import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import classService from '../../services/classService';
import weeklyDataService from '../../services/WeeklyDataService';
import classMemberService from '../../services/classMemberService';
import paymentService from '../../services/paymentService';
import offlineStorage from '../../utils/offlineStorage';
import { Save, AlertCircle, CheckCircle, Plus, Edit2, Trash2, X, Users, DollarSign, WifiOff, RefreshCw, TrendingUp } from 'lucide-react';

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
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Members management state
  const [members, setMembers] = useState([]);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [editingMember, setEditingMember] = useState(null);

  // Payment totals state - cumulative totals from database
  const [paymentTotals, setPaymentTotals] = useState({});
  const [loadingTotals, setLoadingTotals] = useState(false);

  // Payment tracking - stores THIS WEEK's payment amounts {memberId: amount}
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

  const isDevelopment = process.env.NODE_ENV === 'development';

  // Listen for quarter changes from Layout
  useEffect(() => {
    const handleQuarterChange = () => {
      loadClasses();
    };

    window.addEventListener('quarterChanged', handleQuarterChange);

    return () => {
      window.removeEventListener('quarterChanged', handleQuarterChange);
    };
  }, []);

  useEffect(() => {
    loadClasses();
    checkPendingMembers();
  }, []);

  // Enhanced online/offline detection with auto-sync
  useEffect(() => {
    const updateOnlineStatus = () => {
      const actualStatus = navigator.onLine;
      const wasOffline = !isOnline;
      const nowOnline = actualStatus && !manualOffline;

      if (isDevelopment) {
        console.log('Browser reports online:', actualStatus);
        console.log('Manual offline mode:', manualOffline);
      }

      setIsOnline(nowOnline);

      if (wasOffline && nowOnline) {
        autoSyncPendingData();
      }
    };

    updateOnlineStatus();

    const handleOnline = () => {
      if (isDevelopment) console.log('🟢 ONLINE event fired');
      updateOnlineStatus();
    };

    const handleOffline = () => {
      if (isDevelopment) console.log('🔴 OFFLINE event fired');
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
  }, [isOnline, manualOffline]);

  useEffect(() => {
    if (selectedClass) {
      loadMembersWithLocal();
      loadPaymentTotals();
      if (weekNumber) {
        checkExistingData();
      }
    }
  }, [selectedClass, weekNumber]);

  const checkPendingMembers = () => {
    try {
      const localMembers = JSON.parse(localStorage.getItem('pendingMembers') || '[]');
      setPendingMembersCount(localMembers.length);
      if (isDevelopment) console.log('Pending members count:', localMembers.length);
    } catch (error) {
      console.error('Error checking pending members:', error);
      setPendingMembersCount(0);
    }
  };

  const autoSyncPendingData = async () => {
    try {
      const localMembers = JSON.parse(localStorage.getItem('pendingMembers') || '[]');
      const pendingData = await offlineStorage.getPendingCount();

      if (localMembers.length > 0 || pendingData > 0) {
        if (isDevelopment) console.log('🔄 Auto-syncing pending data...');

        if (localMembers.length > 0) {
          await syncPendingMembers(true);
        }

        showToast('✅ Data synced successfully!');
      }
    } catch (error) {
      console.error('Auto-sync error:', error);
    }
  };

  const showToast = (msg) => {
    setShowSuccessToast(true);
    setMessage({ type: 'success', text: msg });
    setTimeout(() => {
      setShowSuccessToast(false);
      setMessage({ type: '', text: '' });
    }, 3000);
  };

  const loadClasses = async () => {
    try {
      const quarterId = localStorage.getItem('selectedQuarterId');

      if (!quarterId) {
        setMessage({ type: 'error', text: 'Please select a quarter first from the sidebar' });
        setClasses([]);
        return;
      }

      if (isDevelopment) console.log('Loading classes for quarter:', quarterId);
      const response = await api.get(`/classes?quarter_id=${quarterId}`);

      const classesData = response.data?.data || response.data || [];

      if (Array.isArray(classesData)) {
        setClasses(classesData);
        if (classesData.length > 0) {
          setSelectedClass(classesData[0].id);
        } else {
          setMessage({
            type: 'error',
            text: 'No classes available for this quarter. Please create classes first.'
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
      setMessage({ type: 'error', text: 'Failed to load classes for selected quarter' });
    }
  };

  const loadMembers = async () => {
    try {
      if (isDevelopment) console.log('Loading members for class:', selectedClass);
      const response = await classMemberService.getByClass(selectedClass);

      const membersData = Array.isArray(response) ? response : (response.data || []);

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

  const loadPaymentTotals = async () => {
    try {
      setLoadingTotals(true);
      const quarterId = localStorage.getItem('selectedQuarterId');

      if (!quarterId || !selectedClass) {
        setPaymentTotals({});
        return;
      }

      const response = await paymentService.getClassPaymentTotals(selectedClass, quarterId);

      // Convert array to object keyed by member_id for easy lookup
      const totalsMap = {};
      if (response.data && Array.isArray(response.data)) {
        response.data.forEach(memberData => {
          totalsMap[memberData.id] = memberData.totals;
        });
      }

      setPaymentTotals(totalsMap);
    } catch (error) {
      console.error('Failed to load payment totals:', error);
      setPaymentTotals({});
    } finally {
      setLoadingTotals(false);
    }
  };

  const loadMembersWithLocal = async () => {
    try {
      await loadMembers();

      const localMembers = JSON.parse(localStorage.getItem('pendingMembers') || '[]');
      const pendingAdds = localMembers.filter(m => m.action === 'create' && m.data.class_id === selectedClass);

      if (pendingAdds.length > 0) {
        const tempMembers = pendingAdds.map(item => item.data);
        setMembers(prev => [...prev, ...tempMembers]);

        if (isDevelopment) console.log('Loaded pending local members:', tempMembers);
      }
    } catch (error) {
      console.error('Error loading members with local:', error);
    }
  };

  const handleAddMember = async () => {
    if (!newMemberName.trim()) {
      setMessage({ type: 'error', text: 'Please enter a member name.' });
      return;
    }

    const isActuallyOnline = navigator.onLine && !manualOffline;

    if (isDevelopment) {
      console.log('=== ADD MEMBER DEBUG ===');
      console.log('Is Online:', isActuallyOnline);
      console.log('Member Name:', newMemberName);
      console.log('Selected Class:', selectedClass);
    }

    if (!isActuallyOnline) {
      if (isDevelopment) console.log('🔴 OFFLINE MODE - Adding member locally');

      try {
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

        const localMembers = JSON.parse(localStorage.getItem('pendingMembers') || '[]');
        localMembers.push({
          action: 'create',
          data: newMember,
          timestamp: Date.now()
        });
        localStorage.setItem('pendingMembers', JSON.stringify(localMembers));

        if (isDevelopment) console.log('✅ Saved to localStorage');

        checkPendingMembers();

        setMessage({
          type: 'warning',
          text: '📴 Offline: Member added locally. Will sync when online.'
        });

        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        return;

      } catch (offlineError) {
        console.error('❌ OFFLINE SAVE ERROR:', offlineError);
        setMessage({
          type: 'error',
          text: `Offline save failed: ${offlineError.message}`
        });
        return;
      }
    }

    if (isDevelopment) console.log('🟢 ONLINE MODE - Saving to server');

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
      console.error('❌ ONLINE SAVE ERROR:', error);

      const errorMessage = error.response?.data?.message
        || error.response?.data?.error
        || `Failed to save member: ${error.message}`;

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

    const isActuallyOnline = navigator.onLine && !manualOffline;

    if (isDevelopment) {
      console.log('=== DELETE MEMBER DEBUG ===');
      console.log('Is Online:', isActuallyOnline);
      console.log('Member ID:', memberId);
    }

    if (!isActuallyOnline) {
      if (isDevelopment) console.log('🔴 OFFLINE MODE - Removing member locally');

      try {
        setMembers(members.filter(m => m.id !== memberId));

        const localMembers = JSON.parse(localStorage.getItem('pendingMembers') || '[]');
        localMembers.push({
          action: 'delete',
          memberId: memberId,
          timestamp: Date.now()
        });
        localStorage.setItem('pendingMembers', JSON.stringify(localMembers));

        if (isDevelopment) console.log('✅ Saved delete to localStorage');

        checkPendingMembers();

        setMessage({
          type: 'warning',
          text: '📴 Offline: Member removed locally. Will sync when online.'
        });

        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        return;

      } catch (offlineError) {
        console.error('❌ OFFLINE DELETE ERROR:', offlineError);
        setMessage({
          type: 'error',
          text: `Offline delete failed: ${offlineError.message}`
        });
        return;
      }
    }

    if (isDevelopment) console.log('🟢 ONLINE MODE - Deleting from server');

    try {
      await classMemberService.delete(memberId);
      setMessage({ type: 'success', text: 'Member removed successfully!' });
      loadMembers();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('❌ ONLINE DELETE ERROR:', error);
      const errorMessage = error.response?.data?.message || 'Failed to remove member.';
      setMessage({ type: 'error', text: errorMessage });
    }
  };

  const syncPendingMembers = async (isAutoSync = false) => {
    try {
      const localMembers = JSON.parse(localStorage.getItem('pendingMembers') || '[]');

      if (localMembers.length === 0) {
        if (!isAutoSync) {
          setMessage({ type: 'info', text: 'No pending members to sync.' });
          setTimeout(() => setMessage({ type: '', text: '' }), 2000);
        }
        return;
      }

      setLoading(true);
      if (isDevelopment) console.log('Syncing pending members:', localMembers);

      let syncedCount = 0;
      let failedCount = 0;

      for (const item of localMembers) {
        try {
          if (item.action === 'create') {
            await classMemberService.create({
              class_id: item.data.class_id,
              member_name: item.data.member_name
            });
            if (isDevelopment) console.log('✅ Synced member:', item.data.member_name);
            syncedCount++;
          } else if (item.action === 'delete') {
            if (!item.memberId.startsWith('temp-')) {
              await classMemberService.delete(item.memberId);
              if (isDevelopment) console.log('✅ Synced delete:', item.memberId);
              syncedCount++;
            } else {
              if (isDevelopment) console.log('⏭️ Skipped temp member delete:', item.memberId);
            }
          }
        } catch (error) {
          console.error('Failed to sync member:', item, error);
          failedCount++;
        }
      }

      localStorage.removeItem('pendingMembers');
      checkPendingMembers();

      await loadMembers();

      if (!isAutoSync) {
        setMessage({
          type: 'success',
          text: `✅ Synced ${syncedCount} member(s)${failedCount > 0 ? `, ${failedCount} failed` : ''}!`
        });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }

    } catch (error) {
      console.error('Sync error:', error);
      if (!isAutoSync) {
        setMessage({ type: 'error', text: 'Failed to sync members.' });
      }
    } finally {
      setLoading(false);
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

  // Get cumulative total for a member and payment type
  const getCumulativeTotal = (memberId, paymentType) => {
    const memberTotals = paymentTotals[memberId];
    if (!memberTotals) return 0;

    const typeMap = {
      'lesson_english': 'lesson_english',
      'lesson_luganda': 'lesson_luganda',
      'morning_watch_english': 'morning_watch_english',
      'morning_watch_luganda': 'morning_watch_luganda'
    };

    return memberTotals[typeMap[paymentType]] || 0;
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

  const resetForm = () => {
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
  };

  // Add this helper to show after successful save
  const clearFormAfterSave = () => {
    resetForm();
    setMessage({
      type: 'success',
      text: '✅ Ready to enter data for another week!'
    });
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
    if (isDevelopment) {
      console.log('=== SUBMIT DEBUG ===');
      console.log('Is Actually Online:', isActuallyOnline);
      console.log('Data to submit:', dataToSubmit);
    }
    try {
      if (!isActuallyOnline) {
        if (isDevelopment) console.log('🔴 OFFLINE MODE - Saving to IndexedDB...');
        await offlineStorage.savePendingData({ data: dataToSubmit });
        if (isDevelopment) console.log('✅ Saved offline successfully');
        setMessage({
          type: 'warning',
          text: '📴 You\'re offline! Data saved locally and will sync when you\'re back online.'
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setLoading(false);
        return;
      }
      if (isDevelopment) console.log('🟢 ONLINE MODE - Submitting to server...');
      // Save weekly data
      let savedData;
      if (formData.id) {
        savedData = await weeklyDataService.update(formData.id, dataToSubmit);
        showToast('✅ Data updated successfully!');
      } else {
        savedData = await weeklyDataService.submit(dataToSubmit);
        showToast('🎉 Data submitted successfully!');
      }
      // Record payments to cumulative system
      const quarterId = localStorage.getItem('selectedQuarterId');
      const paymentDate = formData.sabbath_date;

      // Record all payments
      const allPayments = [
        ...Object.entries(paymentsLessonEnglish).map(([memberId, amount]) => ({
          member_id: memberId,
          payment_type: 'lesson_english',
          amount
        })),
        ...Object.entries(paymentsLessonLuganda).map(([memberId, amount]) => ({
          member_id: memberId,
          payment_type: 'lesson_luganda',
          amount
        })),
        ...Object.entries(paymentsMorningWatchEnglish).map(([memberId, amount]) => ({
          member_id: memberId,
          payment_type: 'morning_watch_english',
          amount
        })),
        ...Object.entries(paymentsMorningWatchLuganda).map(([memberId, amount]) => ({
          member_id: memberId,
          payment_type: 'morning_watch_luganda',
          amount
        }))
      ].filter(p => p.amount > 0);
      // Record each payment
      for (const payment of allPayments) {
        try {
          await paymentService.recordPayment({
            ...payment,
            quarter_id: quarterId,
            week_number: parseInt(weekNumber),
            payment_date: paymentDate
          });
        } catch (paymentError) {
          console.error('Failed to record payment:', paymentError);
        }
      }
      // Update formData with the saved data ID if it's a new entry
      if (savedData && savedData.data && !formData.id) {
        setFormData(prev => ({ ...prev, id: savedData.data.id }));
      }
      // Reload payment totals to show updated cumulative amounts
      await loadPaymentTotals();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('❌ Submit error:', error);
      try {
        await offlineStorage.savePendingData({ data: dataToSubmit });
        setMessage({
          type: 'warning',
          text: '⚠️ Could not reach server. Data saved offline and will sync later.'
        });
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
      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className="bg-green-600 text-white px-6 py-3 rounded-lg shadow-xl flex items-center space-x-2">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">{message.text}</span>
          </div>
        </div>
      )}

      {/* Persistent Offline Banner */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 bg-orange-600 text-white py-2 px-4 text-center text-sm font-medium z-40 shadow-lg">
          <div className="flex items-center justify-center space-x-2">
            <WifiOff className="h-4 w-4" />
            <span>You're offline - Data will be saved locally and synced when you're back online</span>
          </div>
        </div>
      )}

      <div className={`flex items-center justify-between mb-8 ${!isOnline ? 'mt-12' : ''}`}>
        <h1 className="text-3xl font-bold text-gray-900">Weekly Data Entry</h1>

        <div className="flex items-center space-x-3">
          {pendingMembersCount > 0 && (
            <button
              type="button"
              onClick={() => syncPendingMembers(false)}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm flex items-center space-x-2 disabled:opacity-50 shadow-md hover:shadow-lg transition"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Sync {pendingMembersCount} Member{pendingMembersCount > 1 ? 's' : ''}</span>
            </button>
          )}

          {isDevelopment && (
            <button
              type="button"
              onClick={() => setManualOffline(!manualOffline)}
              className={`px-4 py-2 rounded-lg border-2 font-medium transition-all text-sm ${manualOffline
                ? 'bg-orange-100 border-orange-500 text-orange-800 hover:bg-orange-200'
                : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                }`}
            >
              {manualOffline ? '🔴 Test Offline' : '🟢 Test Online'}
            </button>
          )}

          <div className={`px-4 py-2 rounded-lg border-2 ${isOnline && !manualOffline
            ? 'bg-green-50 border-green-500'
            : 'bg-red-50 border-red-500'
            }`}>
            <div className="flex items-center space-x-2">
              <div className={`h-2.5 w-2.5 rounded-full ${isOnline && !manualOffline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              <span className={`text-sm font-bold ${isOnline && !manualOffline ? 'text-green-700' : 'text-red-700'}`}>
                {isOnline && !manualOffline ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 pb-20">
        {/* Form fields would go here... (omitted for brevity based on your request) */}

        {/* Submit Button Section */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/secretary')}
            className="px-4 py-2 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all"
          >
            Back to Dashboard
          </button>

          {formData.id && (
            <button
              type="button"
              onClick={clearFormAfterSave}
              className="px-4 py-2 border-2 border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-all"
            >
              Clear Form
            </button>
          )}

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
    </div>
  );
};

export default WeeklyDataEntry;
// Force update 2026-04-24