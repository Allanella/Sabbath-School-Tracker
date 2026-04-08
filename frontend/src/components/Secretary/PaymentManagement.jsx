import React, { useState, useEffect } from 'react';
import { DollarSign, Users, Calendar, TrendingUp, Download, ChevronDown, ChevronUp, Filter } from 'lucide-react';
import MemberPaymentEntry from './MemberPaymentEntry';
import memberPaymentService from '../../services/memberPaymentService';
import api from '../../services/api';
import classService from '../../services/classService';
import quarterService from '../../services/quarterService';

const PaymentManagement = () => {
  const [classes, setClasses] = useState([]);
  const [quarters, setQuarters] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedQuarter, setSelectedQuarter] = useState('');
  const [weekNumber, setWeekNumber] = useState(1);
  const [members, setMembers] = useState([]);
  const [payments, setPayments] = useState({});
  const [totals, setTotals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedMember, setExpandedMember] = useState(null);
  const [summary, setSummary] = useState({
    totalCollected: 0,
    membersPaid: 0,
    totalMembers: 0
  });

  // Load classes and quarters on mount
  useEffect(() => {
    loadClasses();
    loadQuarters();
  }, []);

  // Load data when class/quarter/week changes
  useEffect(() => {
    if (selectedClass && selectedQuarter) {
      loadData();
    }
  }, [selectedClass, selectedQuarter, weekNumber]);

  const loadQuarters = async () => {
    try {
      const response = await quarterService.getAll();
      const quartersList = Array.isArray(response) ? response : (response.data || []);
      setQuarters(quartersList);

      // Auto-select most recent quarter if nothing is selected
      if (quartersList.length > 0 && !selectedQuarter) {
        const sortedQuarters = [...quartersList].sort((a, b) => {
          if (a.year !== b.year) return b.year - a.year;
          return b.name.localeCompare(a.name);
        });
        setSelectedQuarter(sortedQuarters[0].id);
      }
    } catch (error) {
      console.error('Failed to load quarters:', error);
      setQuarters([]);
    }
  };

  const loadClasses = async () => {
    try {
      const response = await classService.getAll();
      const classList = Array.isArray(response) ? response : (response.data || []);
      setClasses(classList);

      // Auto-select first class if nothing is selected
      if (classList.length > 0 && !selectedClass) {
        setSelectedClass(classList[0].id);
      }
    } catch (error) {
      console.error('Failed to load classes:', error);
      setClasses([]);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);

      // Load class members
      const membersResponse = await api.get(`/class-members?class_id=${selectedClass}`);
      setMembers(membersResponse.data.data || []);

      // Load payment totals for all members
      const totalsResponse = await memberPaymentService.getClassPaymentTotals(selectedClass, selectedQuarter);
      setTotals(totalsResponse.data || []);

      // Load payments for current week
      const paymentsResponse = await memberPaymentService.getQuarterPayments(selectedQuarter, weekNumber);
      const paymentsMap = {};
      
      if (paymentsResponse.data) {
        paymentsResponse.data.forEach(payment => {
          paymentsMap[payment.member_id] = payment;
        });
      }
      
      setPayments(paymentsMap);

      // Calculate summary
      const totalCollected = totalsResponse.data?.reduce((sum, member) => 
        sum + (member.totals?.quarter_grand_total || 0), 0
      ) || 0;
      
      const membersPaid = Object.keys(paymentsMap).length;

      setSummary({
        totalCollected,
        membersPaid,
        totalMembers: membersResponse.data.data?.length || 0
      });

    } catch (error) {
      console.error('Failed to load payment data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleMember = (memberId) => {
    setExpandedMember(expandedMember === memberId ? null : memberId);
  };

  const handlePaymentSaved = () => {
    loadData(); // Reload all data after payment is saved
  };

  const exportToCSV = () => {
    const headers = ['Member Name', 'Quarter Total', 'Year Total', 'Weeks Paid'];
    const rows = totals.map(member => [
      member.member_name,
      member.totals?.quarter_grand_total || 0,
      member.totals?.year_grand_total || 0,
      member.totals?.weeks_paid || 0
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payment-report-week-${weekNumber}.csv`;
    a.click();
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Management</h1>
        <p className="text-gray-600">Track and manage member payments</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Filter className="inline h-4 w-4 mr-1" />
              Class
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Class</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.class_name} - {cls.teacher_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="inline h-4 w-4 mr-1" />
              Quarter
            </label>
            <select
              value={selectedQuarter}
              onChange={(e) => setSelectedQuarter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Quarter</option>
              {quarters.map((quarter) => (
                <option key={quarter.id} value={quarter.id}>
                  {quarter.name} {quarter.year}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Week Number
            </label>
            <input
              type="number"
              min="1"
              max="13"
              value={weekNumber}
              onChange={(e) => setWeekNumber(parseInt(e.target.value) || 1)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {!selectedClass || !selectedQuarter ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <Filter className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Select Class and Quarter</h3>
          <p className="text-gray-600">Choose a class and quarter above to manage payments</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="h-8 w-8 opacity-80" />
                <TrendingUp className="h-6 w-6 opacity-60" />
              </div>
              <p className="text-blue-100 text-sm font-medium mb-1">Total Collected (Quarter)</p>
              <p className="text-3xl font-bold">
                {memberPaymentService.formatCurrency(summary.totalCollected)}
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <Users className="h-8 w-8 opacity-80" />
                <Calendar className="h-6 w-6 opacity-60" />
              </div>
              <p className="text-green-100 text-sm font-medium mb-1">Members Paid This Week</p>
              <p className="text-3xl font-bold">
                {summary.membersPaid} / {summary.totalMembers}
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <Calendar className="h-8 w-8 opacity-80" />
                <button
                  onClick={exportToCSV}
                  className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition flex items-center gap-1"
                >
                  <Download className="h-4 w-4" />
                  Export
                </button>
              </div>
              <p className="text-purple-100 text-sm font-medium mb-1">Current Week</p>
              <p className="text-3xl font-bold">Week {weekNumber}</p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {/* Payment Entry for Each Member */}
              <div className="space-y-4">
                {members.map((member) => {
                  const memberTotal = totals.find(t => t.id === member.id);
                  const existingPayment = payments[member.id];
                  const isExpanded = expandedMember === member.id;
                  const hasPaid = !!existingPayment;

                  return (
                    <div key={member.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                      {/* Member Header - Clickable */}
                      <button
                        onClick={() => toggleMember(member.id)}
                        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            hasPaid ? 'bg-green-100' : 'bg-gray-100'
                          }`}>
                            <Users className={`h-5 w-5 ${hasPaid ? 'text-green-600' : 'text-gray-400'}`} />
                          </div>
                          <div className="text-left">
                            <h3 className="font-semibold text-gray-900">{member.member_name}</h3>
                            <p className="text-sm text-gray-600">
                              {hasPaid ? '✓ Paid this week' : 'Not paid yet'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="text-sm text-gray-600">Quarter Total</p>
                            <p className="font-bold text-blue-600">
                              {memberPaymentService.formatCurrency(memberTotal?.totals?.quarter_grand_total || 0)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-600">Year Total</p>
                            <p className="font-bold text-purple-600">
                              {memberPaymentService.formatCurrency(memberTotal?.totals?.year_grand_total || 0)}
                            </p>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="h-6 w-6 text-gray-400" />
                          ) : (
                            <ChevronDown className="h-6 w-6 text-gray-400" />
                          )}
                        </div>
                      </button>

                      {/* Expandable Payment Entry */}
                      {isExpanded && (
                        <div className="border-t px-6 py-6 bg-gray-50">
                          <MemberPaymentEntry
                            member={member}
                            quarterId={selectedQuarter}
                            weekNumber={weekNumber}
                            existingPayment={existingPayment}
                            onPaymentSaved={handlePaymentSaved}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* No Members Message */}
              {members.length === 0 && (
                <div className="bg-white rounded-lg shadow-md p-12 text-center">
                  <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Members Found</h3>
                  <p className="text-gray-600">Add members to this class to start tracking payments.</p>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default PaymentManagement;