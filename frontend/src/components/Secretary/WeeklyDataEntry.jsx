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

    if (!isActuallyOnline) {
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
        checkPendingMembers();

        setMessage({ 
          type: 'warning', 
          text: '📴 Offline: Member added locally. Will sync when online.' 
        });

        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        return;
      } catch (offlineError) {
        setMessage({ type: 'error', text: `Offline save failed: ${offlineError.message}` });
        return;
      }
    }

    try {
      if (editingMember) {
        await classMemberService.update(editingMember.id, { member_name: newMemberName });
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
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to save member' });
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

    if (!isActuallyOnline) {
      setMembers(members.filter(m => m.id !== memberId));
      const localMembers = JSON.parse(localStorage.getItem('pendingMembers') || '[]');
      localMembers.push({
        action: 'delete',
        memberId: memberId,
        timestamp: Date.now()
      });
      localStorage.setItem('pendingMembers', JSON.stringify(localMembers));
      checkPendingMembers();
      setMessage({ type: 'warning', text: '📴 Offline: Member removed locally.' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return;
    }

    try {
      await classMemberService.delete(memberId);
      setMessage({ type: 'success', text: 'Member removed successfully!' });
      loadMembers();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to remove member.' });
    }
  };

  const syncPendingMembers = async (isAutoSync = false) => {
    try {
      const localMembers = JSON.parse(localStorage.getItem('pendingMembers') || '[]');
      if (localMembers.length === 0) return;

      setLoading(true);
      let syncedCount = 0;

      for (const item of localMembers) {
        try {
          if (item.action === 'create') {
            await classMemberService.create({
              class_id: item.data.class_id,
              member_name: item.data.member_name
            });
            syncedCount++;
          } else if (item.action === 'delete' && !item.memberId.startsWith('temp-')) {
            await classMemberService.delete(item.memberId);
            syncedCount++;
          }
        } catch (error) {
          console.error('Failed to sync member:', item, error);
        }
      }

      localStorage.removeItem('pendingMembers');
      checkPendingMembers();
      await loadMembers();
      
      if (!isAutoSync) {
        setMessage({ type: 'success', text: `✅ Synced ${syncedCount} members!` });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
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

  const getCumulativeTotal = (memberId, paymentType) => {
    const memberTotals = paymentTotals[memberId];
    if (!memberTotals) return 0;
    return memberTotals[paymentType] || 0;
  };

  const formatPaymentsForSave = (payments) => {
    if (!payments || Object.keys(payments).length === 0) return '';
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
      if (member && amount) payments[member.id] = parseFloat(amount);
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
        setMessage({ type: 'info', text: 'Editing existing data for this week.' });
      } else {
        setFormData({
          sabbath_date: '', total_attendance: 0, member_visits: 0,
          members_conducted_bible_studies: 0, members_helped_others: 0,
          members_studied_lesson: 0, number_of_visitors: 0,
          bible_study_guides_distributed: 0, offering_global_mission: 0,
          members_summary: '',
        });
        setPaymentsLessonEnglish({}); setPaymentsLessonLuganda({});
        setPaymentsMorningWatchEnglish({}); setPaymentsMorningWatchLuganda({});
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

    try {
      if (!isActuallyOnline) {
        await offlineStorage.savePendingData({ data: dataToSubmit });
        setMessage({ type: 'warning', text: '📴 Offline! Data saved locally and will sync later.' });
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => navigate('/secretary'), 3000);
        setLoading(false);
        return;
      }

      if (formData.id) {
        await weeklyDataService.update(formData.id, dataToSubmit);
        setMessage({ type: 'success', text: '✅ Data updated successfully!' });
      } else {
        await weeklyDataService.submit(dataToSubmit);
        setMessage({ type: 'success', text: '🎉 Data submitted successfully!' });
      }

      const quarterId = localStorage.getItem('selectedQuarterId');
      const allPayments = [
        ...Object.entries(paymentsLessonEnglish).map(([id, amount]) => ({ member_id: id, payment_type: 'lesson_english', amount })),
        ...Object.entries(paymentsLessonLuganda).map(([id, amount]) => ({ member_id: id, payment_type: 'lesson_luganda', amount })),
        ...Object.entries(paymentsMorningWatchEnglish).map(([id, amount]) => ({ member_id: id, payment_type: 'morning_watch_english', amount })),
        ...Object.entries(paymentsMorningWatchLuganda).map(([id, amount]) => ({ member_id: id, payment_type: 'morning_watch_luganda', amount }))
      ].filter(p => p.amount > 0);

      for (const payment of allPayments) {
        await paymentService.recordPayment({
          ...payment, quarter_id: quarterId, week_number: parseInt(weekNumber), payment_date: formData.sabbath_date
        });
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => navigate('/secretary'), 2000);
    } catch (error) {
      console.error('❌ Submit error:', error);
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Failed to save data';
                          
      setMessage({
        type: 'error',
        text: `❌ Error: ${errorMessage}. Please check your data and try again.`
      });
      
      window.scrollTo({ top: 0, behavior: 'smooth' });
      // Don't redirect on error - stay on page
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Toast and Offline Banner */}
      {showSuccessToast && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in bg-green-600 text-white px-6 py-3 rounded-lg shadow-xl flex items-center space-x-2">
          <CheckCircle className="h-5 w-5" />
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 bg-orange-600 text-white py-2 px-4 text-center text-sm font-medium z-40">
          <div className="flex items-center justify-center space-x-2">
            <WifiOff className="h-4 w-4" />
            <span>You're offline - Data will sync when you're back online</span>
          </div>
        </div>
      )}

      <div className={`flex items-center justify-between mb-8 ${!isOnline ? 'mt-12' : ''}`}>
        <h1 className="text-3xl font-bold text-gray-900">Weekly Data Entry</h1>
        <div className="flex items-center space-x-3">
          {pendingMembersCount > 0 && (
            <button onClick={() => syncPendingMembers(false)} className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center space-x-2 shadow-md">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Sync {pendingMembersCount} Members</span>
            </button>
          )}
          <div className={`px-4 py-2 rounded-lg border-2 ${isOnline && !manualOffline ? 'bg-green-100 border-green-500 text-green-800' : 'bg-orange-100 border-orange-500 text-orange-800'}`}>
            {isOnline && !manualOffline ? 'Online' : 'Offline'}
          </div>
        </div>
      </div>

      {message.text && !showSuccessToast && (
        <div className={`mb-6 p-4 rounded-lg flex items-center space-x-3 ${message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
          {message.type === 'error' ? <AlertCircle className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
          <p>{message.text}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Class</label>
            <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="w-full rounded-lg border-gray-300 focus:ring-indigo-500 focus:border-indigo-500" required>
              {classes.map((c) => (<option key={c.id} value={c.id}>{c.class_name}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Week Number</label>
            <input type="number" min="1" max="13" value={weekNumber} onChange={(e) => setWeekNumber(e.target.value)} className="w-full rounded-lg border-gray-300 focus:ring-indigo-500 focus:border-indigo-500" required />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Sabbath Date</label>
            <input type="date" name="sabbath_date" value={formData.sabbath_date} onChange={handleChange} className="w-full rounded-lg border-gray-300 focus:ring-indigo-500 focus:border-indigo-500" required />
          </div>
        </div>

        {/* Member Management Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-2">
              <Users className="h-6 w-6 text-indigo-600" />
              <h2 className="text-xl font-bold text-gray-800">Class Members</h2>
            </div>
            <button type="button" onClick={() => { setEditingMember(null); setNewMemberName(''); setShowMemberModal(true); }} className="px-4 py-2 bg-indigo-600 text-white rounded-lg flex items-center space-x-2 hover:bg-indigo-700 transition">
              <Plus className="h-4 w-4" />
              <span>Add Member</span>
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {members.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 group">
                <span className="font-medium text-gray-700">{member.member_name}</span>
                <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button type="button" onClick={() => handleEditMember(member)} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-md"><Edit2 className="h-4 w-4" /></button>
                  <button type="button" onClick={() => handleDeleteMember(member.id)} className="p-1.5 text-red-600 hover:bg-red-100 rounded-md"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lesson & Morning Watch Payment Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {[
            { title: 'Lesson Study Guides', eng: paymentsLessonEnglish, lug: paymentsLessonLuganda, setEng: setPaymentsLessonEnglish, setLug: setPaymentsLessonLuganda, typeEng: 'lesson_english', typeLug: 'lesson_luganda' },
            { title: 'Morning Watch', eng: paymentsMorningWatchEnglish, lug: paymentsMorningWatchLuganda, setEng: setPaymentsMorningWatchEnglish, setLug: setPaymentsMorningWatchLuganda, typeEng: 'morning_watch_english', typeLug: 'morning_watch_luganda' }
          ].map((section, idx) => (
            <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-indigo-50 px-6 py-4 border-b border-indigo-100 flex items-center justify-between">
                <h2 className="text-lg font-bold text-indigo-900">{section.title}</h2>
                <DollarSign className="h-5 w-5 text-indigo-600" />
              </div>
              <div className="p-6 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-500 border-b">
                      <th className="text-left py-2 font-semibold">Member</th>
                      <th className="text-right py-2 font-semibold">English</th>
                      <th className="text-right py-2 font-semibold">Luganda</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {members.map(m => (
                      <tr key={m.id}>
                        <td className="py-3">
                          <div className="font-medium text-gray-800">{m.member_name}</div>
                          <div className="text-xs text-gray-400">Total: {getCumulativeTotal(m.id, section.typeEng) + getCumulativeTotal(m.id, section.typeLug)}</div>
                        </td>
                        <td className="py-3"><input type="number" step="100" value={section.eng[m.id] || ''} onChange={(e) => handlePaymentChange(m.id, e.target.value, section.setEng)} className="w-20 text-right rounded border-gray-200 focus:ring-indigo-500" placeholder="0" /></td>
                        <td className="py-3"><input type="number" step="100" value={section.lug[m.id] || ''} onChange={(e) => handlePaymentChange(m.id, e.target.value, section.setLug)} className="w-20 text-right rounded border-gray-200 focus:ring-indigo-500" placeholder="0" /></td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50 font-bold">
                      <td className="py-2 px-2 text-indigo-700">Subtotals</td>
                      <td className="py-2 text-right px-2 text-indigo-700">{calculateTotal(section.eng).toLocaleString()}</td>
                      <td className="py-2 text-right px-2 text-indigo-700">{calculateTotal(section.lug).toLocaleString()}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          ))}
        </div>

        {/* Statistical Data Grid */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center space-x-2 mb-6"><TrendingUp className="h-6 w-6 text-indigo-600" /><h2 className="text-xl font-bold text-gray-800">Weekly Statistics</h2></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Attendance', name: 'total_attendance' },
              { label: 'Member Visits', name: 'member_visits' },
              { label: 'Bible Studies', name: 'members_conducted_bible_studies' },
              { label: 'Helped Others', name: 'members_helped_others' },
              { label: 'Studied Lesson', name: 'members_studied_lesson' },
              { label: 'Visitors', name: 'number_of_visitors' },
              { label: 'Guides Shared', name: 'bible_study_guides_distributed' },
              { label: 'Global Mission', name: 'offering_global_mission' }
            ].map(stat => (
              <div key={stat.name}>
                <label className="block text-sm font-medium text-gray-600 mb-1">{stat.label}</label>
                <input type="number" name={stat.name} value={formData[stat.name]} onChange={handleChange} className="w-full rounded-lg border-gray-300 focus:ring-indigo-500" min="0" />
              </div>
            ))}
          </div>
        </div>

        {/* Summary Notes */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <label className="block text-sm font-bold text-gray-700 mb-2">Weekly Summary / Testimony</label>
          <textarea name="members_summary" value={formData.members_summary} onChange={handleChange} rows="3" className="w-full rounded-xl border-gray-300 focus:ring-indigo-500" placeholder="Enter any notes, testimonies, or special events for the week..."></textarea>
        </div>

        {/* Submit Section */}
        <div className="flex flex-col md:flex-row items-center gap-4 py-8">
          <button type="submit" disabled={loading} className="w-full md:w-auto px-12 py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg hover:bg-indigo-700 transition flex items-center justify-center space-x-2 disabled:opacity-50 shadow-xl">
            {loading ? <RefreshCw className="h-6 w-6 animate-spin" /> : <Save className="h-6 w-6" />}
            <span>{formData.id ? 'Update Weekly Data' : 'Submit Weekly Data'}</span>
          </button>
          <button type="button" onClick={() => navigate('/secretary')} className="w-full md:w-auto px-8 py-4 bg-white text-gray-700 border-2 border-gray-200 rounded-xl font-bold text-lg hover:bg-gray-50 transition">Cancel</button>
        </div>
      </form>

      {/* Member Modal */}
      {showMemberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-6 py-4 bg-indigo-600 flex justify-between items-center text-white">
              <h3 className="text-xl font-bold">{editingMember ? 'Edit Member' : 'Add New Member'}</h3>
              <button onClick={() => setShowMemberModal(false)}><X className="h-6 w-6" /></button>
            </div>
            <div className="p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Member Name</label>
              <input type="text" value={newMemberName} onChange={(e) => setNewMemberName(e.target.value)} className="w-full rounded-xl border-gray-300 focus:ring-indigo-500 mb-6 text-lg py-3" placeholder="Enter full name" autoFocus />
              <div className="flex space-x-3">
                <button type="button" onClick={handleAddMember} className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition">Save Member</button>
                <button type="button" onClick={() => setShowMemberModal(false)} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeeklyDataEntry;