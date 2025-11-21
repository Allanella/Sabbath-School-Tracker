import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import classService from '../../services/classService';
import weeklyDataService from '../../services/WeeklyDataService';
import { Save, AlertCircle, CheckCircle } from 'lucide-react';

const WeeklyDataEntry = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [weekNumber, setWeekNumber] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

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
    members_paid_lesson_english: 0,
    members_paid_lesson_luganda: 0,
    members_paid_morning_watch_english: 0,
    members_paid_morning_watch_luganda: 0,
    members_summary: '',
    objectives_next_week: '',
    challenges_faced: '',
    way_forward: '',
  });

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    if (selectedClass && weekNumber) {
      checkExistingData();
    }
  }, [selectedClass, weekNumber]);

  const loadClasses = async () => {
    try {
      const response = await classService.getMyClasses();
      setClasses(response.data);
      if (response.data.length > 0) {
        setSelectedClass(response.data[0].id);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load classes' });
    }
  };

  const checkExistingData = async () => {
    try {
      const response = await weeklyDataService.getByWeek(selectedClass, weekNumber);
      if (response.data) {
        // Populate form with existing data
        setFormData(response.data);
        setMessage({
          type: 'info',
          text: 'Editing existing data for this week. Click Update to save changes.',
        });
      } else {
        // Reset form for new entry
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
          members_paid_lesson_english: 0,
          members_paid_lesson_luganda: 0,
          members_paid_morning_watch_english: 0,
          members_paid_morning_watch_luganda: 0,
          members_summary: '',
          objectives_next_week: '',
          challenges_faced: '',
          way_forward: '',
        });
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

    try {
      const dataToSubmit = {
        class_id: selectedClass,
        week_number: parseInt(weekNumber),
        ...formData,
      };

      if (formData.id) {
        // Update existing
        await weeklyDataService.update(formData.id, dataToSubmit);
        setMessage({ type: 'success', text: 'Data updated successfully!' });
      } else {
        // Create new
        await weeklyDataService.submit(dataToSubmit);
        setMessage({ type: 'success', text: 'Data submitted successfully!' });
      }

      setTimeout(() => {
        navigate('/secretary');
      }, 2000);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to save data. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Weekly Data Entry</h1>

      {message.text && (
        <div
          className={`mb-6 p-4 rounded-lg flex items-start ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200'
              : message.type === 'error'
              ? 'bg-red-50 border border-red-200'
              : 'bg-blue-50 border border-blue-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
          ) : (
            <AlertCircle
              className={`h-5 w-5 mr-2 mt-0.5 ${
                message.type === 'error' ? 'text-red-600' : 'text-blue-600'
              }`}
            />
          )}
          <p
            className={`text-sm ${
              message.type === 'success'
                ? 'text-green-800'
                : message.type === 'error'
                ? 'text-red-800'
                : 'text-blue-800'
            }`}
          >
            {message.text}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Class and Week Selection */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Class Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">Select Class</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="input"
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
              <label className="label">Week Number</label>
              <select
                value={weekNumber}
                onChange={(e) => setWeekNumber(e.target.value)}
                className="input"
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
              <label className="label">Sabbath Date</label>
              <input
                type="date"
                name="sabbath_date"
                value={formData.sabbath_date}
                onChange={handleChange}
                className="input"
                required
              />
            </div>
          </div>
        </div>

        {/* Attendance & Participation */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Attendance & Participation</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Total Attendance</label>
              <input
                type="number"
                name="total_attendance"
                value={formData.total_attendance}
                onChange={handleChange}
                className="input"
                min="0"
                required
              />
            </div>

            <div>
              <label className="label">Number of Member Visits</label>
              <input
                type="number"
                name="member_visits"
                value={formData.member_visits}
                onChange={handleChange}
                className="input"
                min="0"
              />
            </div>

            <div>
              <label className="label">Members Who Conducted Bible Studies</label>
              <input
                type="number"
                name="members_conducted_bible_studies"
                value={formData.members_conducted_bible_studies}
                onChange={handleChange}
                className="input"
                min="0"
              />
            </div>

            <div>
              <label className="label">Members Who Helped Others</label>
              <input
                type="number"
                name="members_helped_others"
                value={formData.members_helped_others}
                onChange={handleChange}
                className="input"
                min="0"
              />
            </div>

            <div>
              <label className="label">Members Who Studied Lesson During Week</label>
              <input
                type="number"
                name="members_studied_lesson"
                value={formData.members_studied_lesson}
                onChange={handleChange}
                className="input"
                min="0"
              />
            </div>

            <div>
              <label className="label">Number of Visitors</label>
              <input
                type="number"
                name="number_of_visitors"
                value={formData.number_of_visitors}
                onChange={handleChange}
                className="input"
                min="0"
              />
            </div>

            <div>
              <label className="label">Bible Study Guides Distributed</label>
              <input
                type="number"
                name="bible_study_guides_distributed"
                value={formData.bible_study_guides_distributed}
                onChange={handleChange}
                className="input"
                min="0"
              />
            </div>
          </div>
        </div>

        {/* Financial Data */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Financial Data</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="label">Offering Given for Global Mission (UGX)</label>
              <input
                type="number"
                name="offering_global_mission"
                value={formData.offering_global_mission}
                onChange={handleChange}
                className="input"
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <label className="label">Members Who Paid for Lesson (English)</label>
              <input
                type="number"
                name="members_paid_lesson_english"
                value={formData.members_paid_lesson_english}
                onChange={handleChange}
                className="input"
                min="0"
              />
            </div>

            <div>
              <label className="label">Members Who Paid for Lesson (Luganda)</label>
              <input
                type="number"
                name="members_paid_lesson_luganda"
                value={formData.members_paid_lesson_luganda}
                onChange={handleChange}
                className="input"
                min="0"
              />
            </div>

            <div>
              <label className="label">Members Who Paid for Morning Watch (English)</label>
              <input
                type="number"
                name="members_paid_morning_watch_english"
                value={formData.members_paid_morning_watch_english}
                onChange={handleChange}
                className="input"
                min="0"
              />
            </div>

            <div>
              <label className="label">Members Who Paid for Morning Watch (Luganda)</label>
              <input
                type="number"
                name="members_paid_morning_watch_luganda"
                value={formData.members_paid_morning_watch_luganda}
                onChange={handleChange}
                className="input"
                min="0"
              />
            </div>
          </div>
        </div>

        {/* Secretary Notes */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Secretary Notes</h2>
          <div className="space-y-4">
            <div>
              <label className="label">Sabbath School Members Summary</label>
              <textarea
                name="members_summary"
                value={formData.members_summary}
                onChange={handleChange}
                className="input"
                rows="3"
                placeholder="Brief summary of class members and attendance patterns..."
              />
            </div>

            <div>
              <label className="label">Objectives for Next Week</label>
              <textarea
                name="objectives_next_week"
                value={formData.objectives_next_week}
                onChange={handleChange}
                className="input"
                rows="3"
                placeholder="Goals and plans for the upcoming week..."
              />
            </div>

            <div>
              <label className="label">Challenges Faced</label>
              <textarea
                name="challenges_faced"
                value={formData.challenges_faced}
                onChange={handleChange}
                className="input"
                rows="3"
                placeholder="Any difficulties or issues encountered..."
              />
            </div>

            <div>
              <label className="label">Way Forward</label>
              <textarea
                name="way_forward"
                value={formData.way_forward}
                onChange={handleChange}
                className="input"
                rows="3"
                placeholder="Action plans and solutions..."
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <button type="button" onClick={() => navigate('/secretary')} className="btn-secondary">
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex items-center space-x-2"
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
