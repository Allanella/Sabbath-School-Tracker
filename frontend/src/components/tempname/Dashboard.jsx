import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, FileText, Clock } from 'lucide-react';
import classService from '../../services/classService';
import weeklyDataService from '../../services/WeeklyDataService';

const SecretaryDashboard = () => {
  const [myClasses, setMyClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMyClasses();
  }, []);

  const loadMyClasses = async () => {
    try {
      const response = await classService.getMyClasses();

      // Load weekly data for each class
      const classesWithData = await Promise.all(
        response.data.map(async (cls) => {
          try {
            const weeklyRes = await weeklyDataService.getByClass(cls.id);
            return {
              ...cls,
              weeksReported: weeklyRes.data?.length || 0,
            };
          } catch (error) {
            return { ...cls, weeksReported: 0 };
          }
        })
      );

      setMyClasses(classesWithData);
    } catch (error) {
      console.error('Failed to load classes:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Secretary Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">My Classes</p>
              <p className="text-2xl font-bold">{myClasses.length}</p>
            </div>
            <BookOpen className="h-8 w-8 text-primary-600" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Reports</p>
              <p className="text-2xl font-bold">
                {myClasses.reduce((sum, cls) => sum + cls.weeksReported, 0)}
              </p>
            </div>
            <FileText className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <Link
          to="/secretary/entry"
          className="card hover:shadow-md transition cursor-pointer bg-primary-50"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-primary-700">Enter Data</p>
              <p className="text-2xl font-bold text-primary-900">Add New</p>
            </div>
            <Clock className="h-8 w-8 text-primary-600" />
          </div>
        </Link>
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold mb-4">My Classes</h2>
        {myClasses.length === 0 ? (
          <p className="text-gray-600">No classes assigned yet.</p>
        ) : (
          <div className="space-y-3">
            {myClasses.map((cls) => (
              <div key={cls.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-lg">{cls.class_name}</h3>
                    <p className="text-sm text-gray-600">Teacher: {cls.teacher_name}</p>
                    <p className="text-sm text-gray-600">
                      Quarter: {cls.quarter?.name} {cls.quarter?.year}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Weeks Reported</p>
                    <p className="text-2xl font-bold text-primary-600">{cls.weeksReported}/13</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SecretaryDashboard;
