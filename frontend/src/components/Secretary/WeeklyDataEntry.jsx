import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import classService from '../../services/classService';
import weeklyDataService from '../../services/WeeklyDataService';
import classMemberService from '../../services/classMemberService';
import offlineStorage from '../../utils/offlineStorage';

import {
  Save,
  AlertCircle,
  CheckCircle,
  Plus,
  Edit2,
  Trash2,
  X,
  Users,
  DollarSign,
  WifiOff,
  RefreshCw
} from 'lucide-react';

const WeeklyDataEntry = () => {

  const navigate = useNavigate();

  /* ===============================
     STATE
  =============================== */

  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [weekNumber, setWeekNumber] = useState(1);
  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState({ type: '', text: '' });

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [manualOffline, setManualOffline] = useState(false);

  const [pendingMembersCount, setPendingMembersCount] = useState(0);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  /* Members state */
  const [members, setMembers] = useState([]);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [editingMember, setEditingMember] = useState(null);

  /* Payments */
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


  /* ===============================
     EFFECTS
  =============================== */

  // Load classes on mount
  useEffect(() => {
    loadClasses();
    checkPendingMembers();
  }, []);

  // Quarter change listener
  useEffect(() => {
    const handleQuarterChange = () => {
      loadClasses();
    };

    window.addEventListener('quarterChanged', handleQuarterChange);

    return () => {
      window.removeEventListener('quarterChanged', handleQuarterChange);
    };
  }, []);

  // Online / Offline detection
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

  // Load members when class or week changes
  useEffect(() => {

    if (selectedClass) {
      loadMembersWithLocal();

      if (weekNumber) {
        checkExistingData();
      }
    }

  }, [selectedClass, weekNumber]);


  /* ===============================
     UTILITY FUNCTIONS
  =============================== */

  const showToast = (msg) => {
    setShowSuccessToast(true);
    setMessage({ type: 'success', text: msg });

    setTimeout(() => {
      setShowSuccessToast(false);
      setMessage({ type: '', text: '' });
    }, 3000);
  };

  const calculateTotal = (payments) => {
    return Object.values(payments).reduce(
      (sum, amount) => sum + (parseFloat(amount) || 0),
      0
    );
  };


  /* ===============================
     DATA LOADING FUNCTIONS
  =============================== */

  const loadClasses = async () => {

    try {

      const quarterId = localStorage.getItem('selectedQuarterId');

      if (!quarterId) {
        setMessage({
          type: 'error',
          text: 'Please select a quarter first from the sidebar'
        });
        return;
      }

      if (isDevelopment)
        console.log('Loading classes for quarter:', quarterId);

      const response = await api.get(`/classes?quarter_id=${quarterId}`);

      const classesData = response.data?.data || response.data || [];

      if (Array.isArray(classesData)) {

        setClasses(classesData);

        if (classesData.length > 0) {
          setSelectedClass(classesData[0].id);
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

      setMessage({
        type: 'error',
        text: 'Failed to load classes'
      });

    }

  };


  const loadMembers = async () => {

    try {

      if (isDevelopment)
        console.log('Loading members for class:', selectedClass);

      const response = await classMemberService.getByClass(selectedClass);

      const membersData = response.data?.data || response.data || [];

      if (Array.isArray(membersData)) {
        setMembers(membersData);
      } else {
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

      const localMembers = JSON.parse(
        localStorage.getItem('pendingMembers') || '[]'
      );

      const pendingAdds = localMembers.filter(
        m => m.action === 'create' && m.data.class_id === selectedClass
      );

      if (pendingAdds.length > 0) {

        const tempMembers = pendingAdds.map(item => item.data);

        setMembers(prev => [...prev, ...tempMembers]);

        if (isDevelopment)
          console.log('Loaded pending local members:', tempMembers);
      }

    } catch (error) {

      console.error('Error loading members with local:', error);

    }

  };


  /* ===============================
     MEMBER MANAGEMENT
  =============================== */

  const handleEditMember = (member) => {
    setEditingMember(member);
    setNewMemberName(member.member_name);
    setShowMemberModal(true);
  };

  const handlePaymentChange = (memberId, amount, setPayments) => {
    setPayments(prev => ({
      ...prev,
      [memberId]: parseFloat(amount) || 0
    }));
  };


  /* ===============================
     RETURN UI
  =============================== */

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold">
        Weekly Data Entry
      </h1>
    </div>
  );
};

export default WeeklyDataEntry;