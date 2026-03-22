import React, { useState, useEffect } from 'react';
import { DollarSign, Plus, Trash2, Save, AlertCircle, CheckCircle } from 'lucide-react';
import memberPaymentService from '../../services/memberPaymentService';

const MemberPaymentEntry = ({ 
  member, 
  quarterId, 
  weekNumber, 
  onPaymentSaved, 
  existingPayment 
}) => {
  const [payment, setPayment] = useState({
    lesson_english: 0,
    lesson_luganda: 0,
    adult_lesson_english_10k: false,
    adult_lesson_english_20k: false,
    adult_lesson_luganda_10k: false,
    adult_lesson_luganda_20k: false,
    morning_watch_english: 0,
    morning_watch_luganda: 0,
    notes: ''
  });

  const [totals, setTotals] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [weekTotal, setWeekTotal] = useState(0);

  // Load existing payment if available
  useEffect(() => {
    if (existingPayment) {
      setPayment({
        lesson_english: existingPayment.lesson_english || 0,
        lesson_luganda: existingPayment.lesson_luganda || 0,
        adult_lesson_english_10k: existingPayment.adult_lesson_english_10k || false,
        adult_lesson_english_20k: existingPayment.adult_lesson_english_20k || false,
        adult_lesson_luganda_10k: existingPayment.adult_lesson_luganda_10k || false,
        adult_lesson_luganda_20k: existingPayment.adult_lesson_luganda_20k || false,
        morning_watch_english: existingPayment.morning_watch_english || 0,
        morning_watch_luganda: existingPayment.morning_watch_luganda || 0,
        notes: existingPayment.notes || ''
      });
    }
  }, [existingPayment]);

  // Load member totals
  useEffect(() => {
    const loadTotals = async () => {
      try {
        setLoading(true);
        const response = await memberPaymentService.getMemberTotals(member.id, quarterId);
        setTotals(response.data);
      } catch (err) {
        console.error('Failed to load totals:', err);
      } finally {
        setLoading(false);
      }
    };

    if (member && quarterId) {
      loadTotals();
    }
  }, [member, quarterId]);

  // Calculate week total whenever payment changes
  useEffect(() => {
    const total = memberPaymentService.calculateWeekTotal(payment);
    setWeekTotal(total);
  }, [payment]);

  const handleCheckboxChange = (field) => {
    // Handle mutual exclusivity for adult lessons
    if (field === 'adult_lesson_english_10k' && payment.adult_lesson_english_20k) {
      setPayment({
        ...payment,
        adult_lesson_english_10k: true,
        adult_lesson_english_20k: false
      });
    } else if (field === 'adult_lesson_english_20k' && payment.adult_lesson_english_10k) {
      setPayment({
        ...payment,
        adult_lesson_english_10k: false,
        adult_lesson_english_20k: true
      });
    } else if (field === 'adult_lesson_luganda_10k' && payment.adult_lesson_luganda_20k) {
      setPayment({
        ...payment,
        adult_lesson_luganda_10k: true,
        adult_lesson_luganda_20k: false
      });
    } else if (field === 'adult_lesson_luganda_20k' && payment.adult_lesson_luganda_10k) {
      setPayment({
        ...payment,
        adult_lesson_luganda_10k: false,
        adult_lesson_luganda_20k: true
      });
    } else {
      setPayment({
        ...payment,
        [field]: !payment[field]
      });
    }
  };

  const handleQuickAdd = (field) => {
    const amounts = {
      lesson_english: 3000,
      lesson_luganda: 3000,
      morning_watch_english: 3000,
      morning_watch_luganda: 3000
    };

    setPayment({
      ...payment,
      [field]: parseFloat(payment[field] || 0) + amounts[field]
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess(false);

      const paymentData = {
        member_id: member.id,
        quarter_id: quarterId,
        week_number: weekNumber,
        payment_date: new Date().toISOString().split('T')[0],
        ...payment
      };

      await memberPaymentService.recordPayment(paymentData);

      // Reload totals
      const response = await memberPaymentService.getMemberTotals(member.id, quarterId);
      setTotals(response.data);

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);

      if (onPaymentSaved) {
        onPaymentSaved();
      }
    } catch (err) {
      console.error('Failed to save payment:', err);
      setError(err.response?.data?.message || 'Failed to save payment');
    } finally {
      setSaving(false);
    }
  };

  const handleClear = () => {
    setPayment({
      lesson_english: 0,
      lesson_luganda: 0,
      adult_lesson_english_10k: false,
      adult_lesson_english_20k: false,
      adult_lesson_luganda_10k: false,
      adult_lesson_luganda_20k: false,
      morning_watch_english: 0,
      morning_watch_luganda: 0,
      notes: ''
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-4">
      {/* Member Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{member.member_name}</h3>
          <p className="text-sm text-gray-600">Week {weekNumber} Payment</p>
        </div>
        <div className="text-right">
          {totals && (
            <>
              <p className="text-sm text-gray-600">Quarter Total</p>
              <p className="text-xl font-bold text-blue-600">
                {memberPaymentService.formatCurrency(totals.quarter_grand_total)}
              </p>
              <p className="text-xs text-gray-500">
                Year: {memberPaymentService.formatCurrency(totals.year_grand_total)}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Payment Form */}
      <div className="space-y-4">
        {/* Regular Lessons */}
        <div className="border rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-3">Regular Lessons (3,000 UGX)</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">English</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={payment.lesson_english}
                  onChange={(e) => setPayment({ ...payment, lesson_english: parseFloat(e.target.value) || 0 })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                  step="1000"
                />
                <button
                  onClick={() => handleQuickAdd('lesson_english')}
                  className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition"
                  title="Add 3,000"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Luganda</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={payment.lesson_luganda}
                  onChange={(e) => setPayment({ ...payment, lesson_luganda: parseFloat(e.target.value) || 0 })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                  step="1000"
                />
                <button
                  onClick={() => handleQuickAdd('lesson_luganda')}
                  className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition"
                  title="Add 3,000"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Adult Lessons */}
        <div className="border rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-3">Adult Lessons</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">English</label>
              <div className="space-y-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={payment.adult_lesson_english_10k}
                    onChange={() => handleCheckboxChange('adult_lesson_english_10k')}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm">10,000 UGX</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={payment.adult_lesson_english_20k}
                    onChange={() => handleCheckboxChange('adult_lesson_english_20k')}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm">20,000 UGX</span>
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Luganda</label>
              <div className="space-y-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={payment.adult_lesson_luganda_10k}
                    onChange={() => handleCheckboxChange('adult_lesson_luganda_10k')}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm">10,000 UGX</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={payment.adult_lesson_luganda_20k}
                    onChange={() => handleCheckboxChange('adult_lesson_luganda_20k')}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm">20,000 UGX</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Morning Watch */}
        <div className="border rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-3">Morning Watch (3,000 UGX)</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">English</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={payment.morning_watch_english}
                  onChange={(e) => setPayment({ ...payment, morning_watch_english: parseFloat(e.target.value) || 0 })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                  step="1000"
                />
                <button
                  onClick={() => handleQuickAdd('morning_watch_english')}
                  className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition"
                  title="Add 3,000"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Luganda</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={payment.morning_watch_luganda}
                  onChange={(e) => setPayment({ ...payment, morning_watch_luganda: parseFloat(e.target.value) || 0 })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                  step="1000"
                />
                <button
                  onClick={() => handleQuickAdd('morning_watch_luganda')}
                  className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition"
                  title="Add 3,000"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
          <textarea
            value={payment.notes}
            onChange={(e) => setPayment({ ...payment, notes: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows="2"
            placeholder="Add any notes about this payment..."
          />
        </div>

        {/* Week Total */}
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-gray-900">This Week Total:</span>
            <span className="text-2xl font-bold text-blue-600">
              {memberPaymentService.formatCurrency(weekTotal)}
            </span>
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
            <p className="text-sm text-green-800">Payment saved successfully!</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving || weekTotal === 0}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
          >
            <Save className="h-5 w-5" />
            {saving ? 'Saving...' : 'Save Payment'}
          </button>
          <button
            onClick={handleClear}
            disabled={saving}
            className="px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MemberPaymentEntry;