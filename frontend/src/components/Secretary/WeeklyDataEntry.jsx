import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import classMemberService from '../../services/classMemberService';
import weeklyDataService from '../../services/WeeklyDataService';
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
  const [quarterId, setQuarterId] = useState(localStorage.getItem('selectedQuarterId') || '');

  const [members, setMembers] = useState([]);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [editingMember, setEditingMember] = useState(null);

  const [paymentTotals, setPaymentTotals] = useState({});
  const [loadingTotals, setLoadingTotals] = useState(false);

  const [paymentsLessonEnglish, setPaymentsLessonEnglish] = useState({});
  const [paymentsLessonLuganda, setPaymentsLessonLuganda] = useState({});
  const [paymentsMorningWatchEnglish, setPaymentsMorningWatchEnglish] = useState({});
  const [paymentsMorningWatchLuganda, setPaymentsMorningWatchLuganda] = useState({});
  const [existingPaymentIds, setExistingPaymentIds] = useState({});

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

  // Load permanent classes across all quarters
  const loadClasses = useCallback(async () => {
    try {
      const res = await api.get('/classes');
      const rawData = res.data;

      let classList = [];
      if (Array.isArray(rawData)) {
        classList = rawData;
      } else if (Array.isArray(rawData?.data)) {
        classList = rawData.data;
      } else if (Array.isArray(rawData?.classes)) {
        classList = rawData.classes;
      } else if (Array.isArray(rawData?.data?.classes)) {
        classList = rawData.data.classes;
      }

      if (!classList || classList.length === 0) {
        setClasses([]);
        setMessage({ type: 'error', text: 'No permanent classes found in system. Please create classes first.' });
        return;
      }

      setClasses(classList);
      setMessage({ type: '', text: '' });
      setSelectedClass((prev) => {
        const exists = classList.some((c) => String(c.id) === String(prev));
        return exists ? prev : (classList[0]?.id || '');
      });
    } catch (error) {
      console.error('Failed to load classes:', error);
      setClasses([]);
      setMessage({ type: 'error', text: 'Failed to retrieve classes from server.' });
    }
  }, []);

  useEffect(() => {
    loadClasses();

    const handleQuarterChange = (e) => {
      const newQuarterId = e.detail?.quarterId || localStorage.getItem('selectedQuarterId');
      if (newQuarterId) {
        setQuarterId(newQuarterId);
      }
    };

    window.addEventListener('quarterChanged', handleQuarterChange);
    return () => window.removeEventListener('quarterChanged', handleQuarterChange);
  }, [loadClasses]);

  useEffect(() => {
    checkPendingMembers();
  }, []);

  useEffect(() => {
    const updateOnlineStatus = () => {
      const actualStatus = navigator.onLine;
      const wasOffline = !isOnline;
      const nowOnline = actualStatus && !manualOffline;
      setIsOnline(nowOnline);
      if (wasOffline && nowOnline) { autoSyncPendingData(); }
    };
    updateOnlineStatus();
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    const intervalId = setInterval(updateOnlineStatus, 3000);
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      clearInterval(intervalId);
    };
  }, [isOnline, manualOffline]);

  useEffect(() => {
    if (selectedClass) {
      loadMembersWithLocal();
      loadPaymentTotals();
      if (weekNumber) { checkExistingData(); }
    }
  }, [selectedClass, weekNumber, quarterId]);

  const checkPendingMembers = () => {
    try {
      const localMembers = JSON.parse(localStorage.getItem('pendingMembers') || '[]');
      setPendingMembersCount(localMembers.length);
    } catch (error) {
      setPendingMembersCount(0);
    }
  };

  const autoSyncPendingData = async () => {
    try {
      const localMembers = JSON.parse(localStorage.getItem('pendingMembers') || '[]');
      const pendingData = await offlineStorage.getPendingCount();
      if (localMembers.length > 0 || pendingData > 0) {
        if (localMembers.length > 0) { await syncPendingMembers(true); }
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

  const loadMembers = async () => {
    try {
      const currentQuarterId = quarterId || localStorage.getItem('selectedQuarterId');
      const response = await classMemberService.getByClass(selectedClass, currentQuarterId);
      const membersData = Array.isArray(response) ? response : (response?.data || []);
      setMembers(Array.isArray(membersData) ? membersData : []);
    } catch (error) {
      console.error('Failed to load members:', error);
      setMembers([]);
    }
  };

  const loadPaymentTotals = async () => {
    try {
      setLoadingTotals(true);
      const currentQuarterId = quarterId || localStorage.getItem('selectedQuarterId');
      if (!currentQuarterId || !selectedClass) { setPaymentTotals({}); return; }
      const response = await paymentService.getClassPaymentTotals(selectedClass, currentQuarterId);
      const totalsArray = Array.isArray(response) ? response : (response?.data || []);
      const totalsMap = {};
      if (Array.isArray(totalsArray)) {
        totalsArray.forEach(memberData => {
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
      const pendingAdds = localMembers.filter(m => m.action === 'create' && m.data?.class_id === selectedClass);
      if (pendingAdds.length > 0) {
        const tempMembers = pendingAdds.map(item => item.data);
        setMembers(prev => [...prev, ...tempMembers]);
      }
    } catch (error) {
      console.error('Error loading members with local:', error);
    }
  };

  const checkExistingData = async () => {
    try {
      const currentQuarterId = quarterId || localStorage.getItem('selectedQuarterId');
      const response = await weeklyDataService.getByWeek(selectedClass, weekNumber, currentQuarterId);
      if (response && response.data) {
        setFormData(response.data);
        setMessage({ type: 'info', text: '📝 Editing existing data for this week.' });
      } else {
        setFormData({
          sabbath_date: '', total_attendance: 0, member_visits: 0,
          members_conducted_bible_studies: 0, members_helped_others: 0,
          members_studied_lesson: 0, number_of_visitors: 0,
          bible_study_guides_distributed: 0, offering_global_mission: 0,
          members_summary: '',
        });
        setMessage({ type: '', text: '' });
      }

      setPaymentsLessonEnglish({});
      setPaymentsLessonLuganda({});
      setPaymentsMorningWatchEnglish({});
      setPaymentsMorningWatchLuganda({});
      setExistingPaymentIds({});

      if (currentQuarterId) {
        try {
          const weekPaymentsRes = await api.get(
            `/member-payments/class/${selectedClass}/week?quarter_id=${currentQuarterId}&week_number=${weekNumber}`
          );
          const weekPayments = weekPaymentsRes.data?.data || weekPaymentsRes.data || [];
          const newLessonEng = {};
          const newLessonLug = {};
          const newMwEng = {};
          const newMwLug = {};
          const paymentIds = {};

          if (Array.isArray(weekPayments)) {
            weekPayments.forEach(member => {
              if (member.payment) {
                paymentIds[member.id] = member.payment.id;
                if (member.payment.lesson_english > 0) newLessonEng[member.id] = member.payment.lesson_english;
                if (member.payment.lesson_luganda > 0) newLessonLug[member.id] = member.payment.lesson_luganda;
                if (member.payment.morning_watch_english > 0) newMwEng[member.id] = member.payment.morning_watch_english;
                if (member.payment.morning_watch_luganda > 0) newMwLug[member.id] = member.payment.morning_watch_luganda;
              }
            });
          }

          setPaymentsLessonEnglish(newLessonEng);
          setPaymentsLessonLuganda(newLessonLug);
          setPaymentsMorningWatchEnglish(newMwEng);
          setPaymentsMorningWatchLuganda(newMwLug);
          setExistingPaymentIds(paymentIds);

          if (Object.keys(paymentIds).length > 0) {
            setMessage({ type: 'info', text: '📝 Existing payments loaded — you can edit and save.' });
          }
        } catch (err) {
          console.error('Could not load week payments:', err);
        }
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

  const handlePaymentChange = (memberId, amount, setPayments) => {
    setPayments(prev => ({ ...prev, [memberId]: parseFloat(amount) || 0 }));
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

  const handleAddMember = async () => {
    if (!newMemberName.trim()) {
      setMessage({ type: 'error', text: 'Please enter a member name.' });
      return;
    }
    const currentQuarterId = quarterId || localStorage.getItem('selectedQuarterId');
    const isActuallyOnline = navigator.onLine && !manualOffline;

    if (!isActuallyOnline) {
      try {
        const tempId = `temp-${Date.now()}`;
        const newMember = { id: tempId, member_name: newMemberName.trim(), class_id: selectedClass, quarter_id: currentQuarterId, isLocal: true };
        setMembers([...members, newMember]);
        setNewMemberName(''); setEditingMember(null); setShowMemberModal(false);
        const localMembers = JSON.parse(localStorage.getItem('pendingMembers') || '[]');
        localMembers.push({ action: 'create', data: newMember, timestamp: Date.now() });
        localStorage.setItem('pendingMembers', JSON.stringify(localMembers));
        checkPendingMembers();
        showToast('📴 Offline: Member added locally. Will sync when online.');
        return;
      } catch (offlineError) {
        setMessage({ type: 'error', text: `Offline save failed: ${offlineError.message}` });
        return;
      }
    }
    try {
      if (editingMember) {
        await classMemberService.update(editingMember.id, { member_name: newMemberName });
        showToast('✅ Member updated successfully!');
      } else {
        await classMemberService.create({ class_id: selectedClass, quarter_id: currentQuarterId, member_name: newMemberName });
        showToast('✅ Member added successfully!');
      }
      setNewMemberName(''); setEditingMember(null); setShowMemberModal(false);
      loadMembers();
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
      localMembers.push({ action: 'delete', memberId, timestamp: Date.now() });
      localStorage.setItem('pendingMembers', JSON.stringify(localMembers));
      checkPendingMembers();
      showToast('📴 Offline: Member removed locally.');
      return;
    }
    try {
      await classMemberService.delete(memberId);
      showToast('✅ Member removed successfully!');
      loadMembers();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to remove member.' });
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
            await classMemberService.create({ class_id: item.data.class_id, quarter_id: item.data.quarter_id, member_name: item.data.member_name });
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
      if (!isAutoSync) showToast(`✅ Synced ${syncedCount} members!`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    const currentQuarterId = quarterId || localStorage.getItem('selectedQuarterId');

    if (!currentQuarterId) {
      setMessage({ type: 'error', text: 'Please select a quarter from the sidebar first.' });
      setLoading(false);
      return;
    }

    const dataToSubmit = {
      class_id: selectedClass,
      quarter_id: currentQuarterId,
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
      } else {
        await weeklyDataService.submit(dataToSubmit);
      }

      const currentWeek = parseInt(weekNumber);
      const memberIds = new Set([
        ...Object.keys(paymentsLessonEnglish),
        ...Object.keys(paymentsLessonLuganda),
        ...Object.keys(paymentsMorningWatchEnglish),
        ...Object.keys(paymentsMorningWatchLuganda),
      ]);

      for (const memberId of memberIds) {
        const lessonEng = parseFloat(paymentsLessonEnglish[memberId] || 0);
        const lessonLug = parseFloat(paymentsLessonLuganda[memberId] || 0);
        const mwEng = parseFloat(paymentsMorningWatchEnglish[memberId] || 0);
        const mwLug = parseFloat(paymentsMorningWatchLuganda[memberId] || 0);
        const weekTotal = lessonEng + lessonLug + mwEng + mwLug;

        const existingPaymentId = existingPaymentIds[memberId];
        if (existingPaymentId) {
          await paymentService.deletePayment(existingPaymentId);
        }

        if (weekTotal === 0) continue;

        await paymentService.recordPayment({
          member_id: memberId,
          quarter_id: currentQuarterId,
          week_number: currentWeek,
          payment_date: formData.sabbath_date,
          lesson_english: lessonEng,
          lesson_luganda: lessonLug,
          morning_watch_english: mwEng,
          morning_watch_luganda: mwLug,
          offering: 0,
        });
      }

      await checkExistingData();
      await loadPaymentTotals();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      showToast(formData.id ? '✅ Data updated successfully!' : '🎉 Data submitted successfully!');
    } catch (error) {
      console.error('❌ Submit error:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to save data';
      setMessage({ type: 'error', text: `❌ Error: ${errorMessage}. Please check your data and try again.` });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 bg-gray-50/50 min-h-screen">
      {showSuccessToast && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-600 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center space-x-3 transition-all transform animate-bounce">
          <CheckCircle className="h-6 w-6" />
          <span className="font-semibold text-sm">{message.text}</span>
        </div>
      )}

      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 bg-amber-500 text-white py-2.5 px-4 text-center text-sm font-semibold z-40 shadow-md">
          <div className="flex items-center justify-center space-x-2">
            <WifiOff className="h-4 w-4 animate-pulse" />
            <span>Working Offline — All changes will sync once your connection is restored</span>
          </div>
        </div>
      )}

      <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-gray-200 ${!isOnline ? 'mt-10' : ''}`}>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Weekly Data Entry</h1>
          <p className="text-sm text-slate-500 mt-1">Record Sabbath school attendance, guide study metrics, and payments.</p>
        </div>
        <div className="flex items-center space-x-3 self-end sm:self-center">
          {pendingMembersCount > 0 && (
            <button 
              onClick={() => syncPendingMembers(false)} 
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl flex items-center space-x-2 shadow-lg shadow-indigo-100 transition duration-150"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Sync {pendingMembersCount} Pending</span>
            </button>
          )}
          <div className={`flex items-center space-x-1.5 px-4 py-2 rounded-full border text-xs font-bold tracking-wider uppercase ${isOnline && !manualOffline ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
            <span className={`h-2.5 w-2.5 rounded-full ${isOnline && !manualOffline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span>{isOnline && !manualOffline ? 'Online' : 'Offline'}</span>
          </div>
        </div>
      </div>

      {message.text && !showSuccessToast && (
        <div className={`p-4 rounded-xl flex items-start space-x-3 border ${
          message.type === 'error' ? 'bg-rose-50 text-rose-800 border-rose-200' :
          message.type === 'info' ? 'bg-indigo-50 text-indigo-800 border-indigo-200' :
          'bg-emerald-50 text-emerald-800 border-emerald-200'
        }`}>
          {message.type === 'error' ? <AlertCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" /> : <CheckCircle className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />}
          <p className="text-sm font-medium leading-relaxed">{message.text}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Class</label>
            <select 
              value={selectedClass} 
              onChange={(e) => setSelectedClass(e.target.value)} 
              className="w-full rounded-xl border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
              required
            >
              {classes.length === 0 && <option value="">No classes found</option>}
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.class_name || c.name || `Class ${c.id}`}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Week Number (1-13)</label>
            <input 
              type="number" 
              min="1" 
              max="13" 
              value={weekNumber} 
              onChange={(e) => setWeekNumber(e.target.value)} 
              className="w-full rounded-xl border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-800 font-semibold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
              required 
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Sabbath Date</label>
            <input 
              type="date" 
              name="sabbath_date" 
              value={formData.sabbath_date} 
              onChange={handleChange} 
              className="w-full rounded-xl border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
              required 
            />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Class Members</h2>
                <p className="text-xs text-slate-500 mt-0.5">{members.length} members registered in this class</p>
              </div>
            </div>
            <button 
              type="button" 
              onClick={() => { setEditingMember(null); setNewMemberName(''); setShowMemberModal(true); }} 
              className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-sm rounded-xl flex items-center space-x-2 transition"
            >
              <Plus className="h-4 w-4" />
              <span>Add Member</span>
            </button>
          </div>

          {members.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              <p className="text-sm text-slate-500 font-medium">No members registered in this class. Click "Add Member" to register members.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between px-4 py-3 bg-slate-50/40 hover:bg-slate-50 rounded-xl border border-slate-200/60 group hover:border-indigo-300 transition-all duration-150">
                  <span className="font-semibold text-slate-800 text-sm">{member.member_name}</span>
                  <div className="flex space-x-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                    <button 
                      type="button" 
                      onClick={() => handleEditMember(member)} 
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      title="Edit Member"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button 
                      type="button" 
                      onClick={() => handleDeleteMember(member.id)} 
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Remove Member"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {[
            { title: 'Lesson Study Guides Offering', eng: paymentsLessonEnglish, lug: paymentsLessonLuganda, setEng: setPaymentsLessonEnglish, setLug: setPaymentsLessonLuganda, typeEng: 'lesson_english', typeLug: 'lesson_luganda' },
            { title: 'Morning Watch Offering', eng: paymentsMorningWatchEnglish, lug: paymentsMorningWatchLuganda, setEng: setPaymentsMorningWatchEnglish, setLug: setPaymentsMorningWatchLuganda, typeEng: 'morning_watch_english', typeLug: 'morning_watch_luganda' }
          ].map((section, idx) => (
            <div key={idx} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
                    <DollarSign className="h-4.5 w-4.5" />
                  </div>
                  <h2 className="font-bold text-slate-900 text-md">{section.title}</h2>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-slate-500 border-b border-slate-100 bg-slate-50/20 text-xs tracking-wider uppercase font-bold">
                      <th className="text-left py-3 px-6">Member</th>
                      <th className="text-center py-3 px-4 text-blue-700">
                        English
                        <div className="text-[10px] font-normal text-slate-400 normal-case mt-0.5">Prev / This week</div>
                      </th>
                      <th className="text-center py-3 px-4 text-purple-700">
                        Luganda
                        <div className="text-[10px] font-normal text-slate-400 normal-case mt-0.5">Prev / This week</div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {members.map(m => {
                      const prevEng = getCumulativeTotal(m.id, section.typeEng);
                      const prevLug = getCumulativeTotal(m.id, section.typeLug);
                      const hasPayments = prevEng > 0 || prevLug > 0;
                      return (
                        <tr key={m.id} className={hasPayments ? 'bg-emerald-50/20 hover:bg-emerald-50/40 transition' : 'hover:bg-slate-50/30 transition'}>
                          <td className="py-3.5 px-6">
                            <div className="font-semibold text-slate-800">{m.member_name}</div>
                            {hasPayments && (
                              <div className="text-xs text-emerald-600 font-medium mt-0.5">
                                Cumulative: {(prevEng + prevLug).toLocaleString()} UGX paid
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex flex-col items-center space-y-1.5">
                              {prevEng > 0 && (
                                <span className="text-[11px] text-blue-700 font-bold bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
                                  {prevEng.toLocaleString()}
                                </span>
                              )}
                              <input
                                type="number"
                                step="100"
                                value={section.eng[m.id] || ''}
                                onChange={(e) => handlePaymentChange(m.id, e.target.value, section.setEng)}
                                placeholder="0"
                                className="w-24 text-center rounded-lg border-slate-200 bg-slate-50/50 py-1.5 text-xs font-semibold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                              />
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex flex-col items-center space-y-1.5">
                              {prevLug > 0 && (
                                <span className="text-[11px] text-purple-700 font-bold bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-full">
                                  {prevLug.toLocaleString()}
                                </span>
                              )}
                              <input
                                type="number"
                                step="100"
                                value={section.lug[m.id] || ''}
                                onChange={(e) => handlePaymentChange(m.id, e.target.value, section.setLug)}
                                placeholder="0"
                                className="w-24 text-center rounded-lg border-slate-200 bg-slate-50/50 py-1.5 text-xs font-semibold focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition"
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50/80 font-bold text-slate-800 border-t border-slate-200">
                      <td className="py-3 px-6 text-xs uppercase tracking-wider">Weekly Total</td>
                      <td className="py-3 px-4 text-center text-blue-700">{calculateTotal(section.eng).toLocaleString()} UGX</td>
                      <td className="py-3 px-4 text-center text-purple-700">{calculateTotal(section.lug).toLocaleString()} UGX</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
          <div className="flex items-center space-x-2.5 pb-4 border-b border-slate-100">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Weekly Activity & Metrics</h2>
              <p className="text-xs text-slate-500 mt-0.5">Summary data for Sabbath school reporting</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { label: 'Total Attendance', name: 'total_attendance' },
              { label: 'Member Visits', name: 'member_visits' },
              { label: 'Conducted Bible Studies', name: 'members_conducted_bible_studies' },
              { label: 'Helped Others (Missionary Work)', name: 'members_helped_others' },
              { label: 'Daily Lesson Study Count', name: 'members_studied_lesson' },
              { label: 'Number of Visitors', name: 'number_of_visitors' },
              { label: 'Study Guides Distributed', name: 'bible_study_guides_distributed' },
              { label: 'Global Mission Offering (UGX)', name: 'offering_global_mission' },
            ].map((field) => (
              <div key={field.name}>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">{field.label}</label>
                <input
                  type="number"
                  name={field.name}
                  value={formData[field.name]}
                  onChange={handleChange}
                  min="0"
                  className="w-full rounded-xl border-slate-200 bg-slate-50/50 px-4 py-2.5 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                />
              </div>
            ))}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Members Summary / Notes</label>
            <textarea
              name="members_summary"
              rows="3"
              value={formData.members_summary}
              onChange={handleChange}
              placeholder="Enter additional class notes or weekly activity highlights..."
              className="w-full rounded-xl border-slate-200 bg-slate-50/50 p-4 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
            />
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-bold rounded-xl flex items-center space-x-2 shadow-xl shadow-indigo-100 transition duration-150"
          >
            <Save className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Saving Data...' : 'Save Weekly Report'}</span>
          </button>
        </div>
      </form>

      {showMemberModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">{editingMember ? 'Edit Class Member' : 'Add New Class Member'}</h3>
              <button 
                type="button" 
                onClick={() => setShowMemberModal(false)} 
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Member Name</label>
              <input
                type="text"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                placeholder="Enter full name"
                className="w-full rounded-xl border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                autoFocus
              />
            </div>
            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowMemberModal(false)}
                className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddMember}
                className="w-1/2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm shadow-md transition"
              >
                {editingMember ? 'Update Member' : 'Add Member'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeeklyDataEntry;