import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, Clock, Star, Eye, Calendar, Target, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

interface Employee {
  id: number;
  username: string;
  display_name: string;
  total_attendance: number;
  last_checkin: string;
}

interface AnalyticsData {
  date: string;
  total_checkins: number;
  total_checkouts: number;
  avg_rating: number;
}

interface KPIData {
  today: {
    total_employees: number;
    today_checkins: number;
    today_checkouts: number;
    today_avg_rating: number;
    today_avg_hours: number;
    today_leaves: number;
  };
  month: {
    active_employees: number;
    completed_days: number;
    month_avg_rating: number;
    month_avg_hours: number;
    total_leave_days: number;
  };
  year: {
    active_employees: number;
    completed_days: number;
    year_avg_rating: number;
    year_avg_hours: number;
    total_leave_days: number;
  };
}

interface TodayRecord {
  id: number;
  username: string;
  display_name: string;
  check_in_time: string;
  check_out_time: string;
  today_plan: string;
  yesterday_task: string;
  current_status: string;
  accomplishments: string;
  blockers: string;
  tomorrow_priorities: string;
  overall_rating: number;
  hours_worked: number;
  work_from: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5005';
export default function Dashboard() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData[]>([]);
  const [kpis, setKpis] = useState<KPIData | null>(null);
  const [todayRecords, setTodayRecords] = useState<TodayRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHolidayManager, setShowHolidayManager] = useState(false);
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [employeesRes, analyticsRes, kpisRes, todayRes] = await Promise.all([
        axios.get(`${API_URL}/api/employees`),
        axios.get(`${API_URL}/api/analytics/stats`),
        axios.get(`${API_URL}/api/analytics/kpis`),
        axios.get(`${API_URL}/api/analytics/today-records`)
      ]);

      setEmployees(employeesRes.data);
      setAnalytics(analyticsRes.data);
      setKpis(kpisRes.data);
      setTodayRecords(todayRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleTimeString();
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'text-green-600 bg-green-100';
    if (rating >= 3) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  if (loading) {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-xl">Loading dashboard...</div>
        </div>
    );
  }

  return (
        <div className="main-content-inner">
        {/* Header */}
        <header className="mb-8">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">Attendance Dashboard</h1>
            <p className="text-secondary-600">Monitor and manage your team's attendance in real-time</p>
          </div>
        </header>
          {/* Today's KPIs */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-secondary-900 mb-6">Today's Overview</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 xl:gap-6">
              <div className="stat-card group">
                <div className="flex items-center">
                  <div className="flex-shrink-0 p-3 bg-gradient-to-br from-primary-100 to-primary-50 rounded-xl group-hover:from-primary-200 group-hover:to-primary-100 transition-all duration-300">
                    <Users className="w-6 h-6 text-primary-600" />
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="text-sm font-medium text-secondary-600 mb-1">Total Employees</p>
                    <p className="text-2xl font-bold text-secondary-900">{kpis?.today.total_employees || 0}</p>
                  </div>
                </div>
              </div>

              <div className="stat-card group">
                <div className="flex items-center">
                  <div className="flex-shrink-0 p-3 bg-gradient-to-br from-success-100 to-success-50 rounded-xl group-hover:from-success-200 group-hover:to-success-100 transition-all duration-300">
                    <TrendingUp className="w-6 h-6 text-success-600" />
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="text-sm font-medium text-secondary-600 mb-1">Check-ins</p>
                    <p className="text-2xl font-bold text-secondary-900">{kpis?.today.today_checkins || 0}</p>
                  </div>
                </div>
              </div>

              <div className="stat-card group">
                <div className="flex items-center">
                  <div className="flex-shrink-0 p-3 bg-gradient-to-br from-orange-100 to-orange-50 rounded-xl group-hover:from-orange-200 group-hover:to-orange-100 transition-all duration-300">
                    <Clock className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="text-sm font-medium text-secondary-600 mb-1">Check-outs</p>
                    <p className="text-2xl font-bold text-secondary-900">{kpis?.today.today_checkouts || 0}</p>
                  </div>
                </div>
              </div>

              <div className="stat-card group">
                <div className="flex items-center">
                  <div className="flex-shrink-0 p-3 bg-gradient-to-br from-purple-100 to-purple-50 rounded-xl group-hover:from-purple-200 group-hover:to-purple-100 transition-all duration-300">
                    <Star className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="text-sm font-medium text-secondary-600 mb-1">Avg Rating</p>
                    <p className="text-2xl font-bold text-secondary-900">
                      {kpis?.today.today_avg_rating ? Number(kpis.today.today_avg_rating).toFixed(1) + '/5' : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="stat-card group">
                <div className="flex items-center">
                  <div className="flex-shrink-0 p-3 bg-gradient-to-br from-indigo-100 to-indigo-50 rounded-xl group-hover:from-indigo-200 group-hover:to-indigo-100 transition-all duration-300">
                    <Target className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="text-sm font-medium text-secondary-600 mb-1">Avg Hours</p>
                    <p className="text-2xl font-bold text-secondary-900">
                      {kpis?.today.today_avg_hours ? Number(kpis.today.today_avg_hours).toFixed(1) + 'h' : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="stat-card group">
                <div className="flex items-center">
                  <div className="flex-shrink-0 p-3 bg-gradient-to-br from-amber-100 to-amber-50 rounded-xl group-hover:from-amber-200 group-hover:to-amber-100 transition-all duration-300">
                    <Calendar className="w-6 h-6 text-amber-600" />
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="text-sm font-medium text-secondary-600 mb-1">On Leave</p>
                    <p className="text-2xl font-bold text-secondary-900">{kpis?.today.today_leaves || 0}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Monthly & Yearly KPIs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* This Month */}
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-secondary-900">This Month</h3>
                <div className="p-2 bg-gradient-to-br from-primary-100 to-primary-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-primary-600" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center p-4 bg-gradient-to-br from-success-50 to-success-25 rounded-xl">
                  <div className="p-2 bg-success-100 rounded-lg inline-flex mb-3">
                    <Users className="w-4 h-4 text-success-600" />
                  </div>
                  <p className="text-sm font-medium text-secondary-600 mb-1">Active Employees</p>
                  <p className="text-2xl font-bold text-secondary-900">{kpis?.month.active_employees || 0}</p>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-primary-50 to-primary-25 rounded-xl">
                  <div className="p-2 bg-primary-100 rounded-lg inline-flex mb-3">
                    <Award className="w-4 h-4 text-primary-600" />
                  </div>
                  <p className="text-sm font-medium text-secondary-600 mb-1">Completed Days</p>
                  <p className="text-2xl font-bold text-secondary-900">{kpis?.month.completed_days || 0}</p>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-warning-50 to-warning-25 rounded-xl">
                  <div className="p-2 bg-warning-100 rounded-lg inline-flex mb-3">
                    <Calendar className="w-4 h-4 text-warning-600" />
                  </div>
                  <p className="text-sm font-medium text-secondary-600 mb-1">Leave Days</p>
                  <p className="text-2xl font-bold text-secondary-900">{kpis?.month.total_leave_days || 0}</p>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-25 rounded-xl">
                  <div className="p-2 bg-purple-100 rounded-lg inline-flex mb-3">
                    <Star className="w-4 h-4 text-purple-600" />
                  </div>
                  <p className="text-sm font-medium text-secondary-600 mb-1">Avg Rating</p>
                  <p className="text-2xl font-bold text-secondary-900">
                    {kpis?.month.month_avg_rating ? Number(kpis.month.month_avg_rating).toFixed(1) + '/5' : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* This Year */}
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-secondary-900">This Year</h3>
                <div className="p-2 bg-gradient-to-br from-purple-100 to-purple-50 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center p-4 bg-gradient-to-br from-success-50 to-success-25 rounded-xl">
                  <div className="p-2 bg-success-100 rounded-lg inline-flex mb-3">
                    <Users className="w-4 h-4 text-success-600" />
                  </div>
                  <p className="text-sm font-medium text-secondary-600 mb-1">Active Employees</p>
                  <p className="text-2xl font-bold text-secondary-900">{kpis?.year.active_employees || 0}</p>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-primary-50 to-primary-25 rounded-xl">
                  <div className="p-2 bg-primary-100 rounded-lg inline-flex mb-3">
                    <Award className="w-4 h-4 text-primary-600" />
                  </div>
                  <p className="text-sm font-medium text-secondary-600 mb-1">Completed Days</p>
                  <p className="text-2xl font-bold text-secondary-900">{kpis?.year.completed_days || 0}</p>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-warning-50 to-warning-25 rounded-xl">
                  <div className="p-2 bg-warning-100 rounded-lg inline-flex mb-3">
                    <Calendar className="w-4 h-4 text-warning-600" />
                  </div>
                  <p className="text-sm font-medium text-secondary-600 mb-1">Leave Days</p>
                  <p className="text-2xl font-bold text-secondary-900">{kpis?.year.total_leave_days || 0}</p>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-25 rounded-xl">
                  <div className="p-2 bg-purple-100 rounded-lg inline-flex mb-3">
                    <Star className="w-4 h-4 text-purple-600" />
                  </div>
                  <p className="text-sm font-medium text-secondary-600 mb-1">Avg Rating</p>
                  <p className="text-2xl font-bold text-secondary-900">
                    {kpis?.year.year_avg_rating ? Number(kpis.year.year_avg_rating).toFixed(1) + '/5' : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Analytics Chart */}
          <div className="card mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-secondary-900 mb-1">Attendance Trends</h2>
                <p className="text-secondary-600">Performance overview for the last 30 days</p>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
                  <span className="text-secondary-600">Check-ins</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-success-500 rounded-full"></div>
                  <span className="text-secondary-600">Check-outs</span>
                </div>
              </div>
            </div>
            <div className="h-80 bg-gradient-to-br from-secondary-25 to-white rounded-xl p-4 w-full overflow-hidden">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.slice().reverse()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                      dataKey="date"
                      tickFormatter={(value) => formatDate(value)}
                      stroke="#64748b"
                      fontSize={12}
                  />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip
                      labelFormatter={(value) => formatDate(value)}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                      }}
                  />
                  <Line
                      type="monotone"
                      dataKey="total_checkins"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      name="Check-ins"
                      dot={{ fill: '#3b82f6', r: 4 }}
                      activeDot={{ r: 6, fill: '#3b82f6' }}
                  />
                  <Line
                      type="monotone"
                      dataKey="total_checkouts"
                      stroke="#10b981"
                      strokeWidth={3}
                      name="Check-outs"
                      dot={{ fill: '#10b981', r: 4 }}
                      activeDot={{ r: 6, fill: '#10b981' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Today's Employee Records */}
          <div className="card overflow-hidden mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-secondary-900 mb-1">Today's Employee Records</h2>
                <p className="text-secondary-600">Real-time attendance and performance data</p>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-success-400 rounded-full animate-pulse"></div>
                <span className="text-secondary-600">Live Updates</span>
              </div>
            </div>
            <div className="table-container">
              <table className="table-modern">
                  <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Check-in</th>
                    <th>Check-out</th>
                    <th>Hours</th>
                    <th>Rating</th>
                    <th>Status</th>
                    <th>Work From</th>
                    <th>Today's Plan</th>
                    <th>Accomplishments</th>
                    <th>Blockers</th>
                    <th>Tomorrow's Plan</th>
                    <th>Actions</th>
                  </tr>
                  </thead>
                  <tbody>
                  {todayRecords.map((record) => (
                      <tr key={record.id} className={`${
                          record.hours_worked && record.hours_worked < 6.5 ? 'bg-error-50' : ''
                      }`}>
                        <td>
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center">
                              <span className="text-sm font-semibold text-primary-700">
                                {(record.display_name || record.username).charAt(0).toUpperCase()}
                              </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-semibold text-secondary-900">
                                {record.display_name || record.username}
                              </div>
                              <div className="text-sm text-secondary-500">@{record.username}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="font-medium">{formatTime(record.check_in_time)}</span>
                        </td>
                        <td>
                          <span className="font-medium">{formatTime(record.check_out_time)}</span>
                        </td>
                        <td>
                          <span className="font-semibold">{record.hours_worked ? `${record.hours_worked}h` : '-'}</span>
                        </td>
                        <td>
                          {record.overall_rating ? (
                              <span className={`status-badge ${
                                record.overall_rating >= 4 ? 'status-success' : 
                                record.overall_rating >= 3 ? 'status-warning' : 'status-error'
                              }`}>
                            {record.overall_rating}/5
                          </span>
                          ) : '-'}
                        </td>
                        <td className="max-w-xs">
                        <span className="truncate block font-medium" title={record.current_status}>
                          {record.current_status || '-'}
                        </span>
                        </td>
                        <td>
                          {record.work_from ? (
                              <span className={`status-badge ${
                                  record.work_from === 'office' ? 'status-info' : 'status-success'
                              }`}>
                            {record.work_from}
                          </span>
                          ) : '-'}
                        </td>
                        <td className="max-w-xs">
                        <span className="truncate block" title={record.today_plan}>
                          {record.today_plan || '-'}
                        </span>
                        </td>
                        <td className="max-w-xs">
                        <span className="truncate block" title={record.accomplishments}>
                          {record.accomplishments || '-'}
                        </span>
                        </td>
                        <td className="max-w-xs">
                        <span className="truncate block" title={record.blockers}>
                          {record.blockers || '-'}
                        </span>
                        </td>
                        <td className="max-w-xs">
                        <span className="truncate block" title={record.tomorrow_priorities}>
                          {record.tomorrow_priorities || '-'}
                        </span>
                        </td>
                        <td>
                          <button
                              onClick={() => navigate(`/employee/${record.id}`)}
                              className="btn-secondary text-sm py-2 px-3 flex items-center gap-2 hover:scale-105"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </button>
                        </td>
                      </tr>
                  ))}
                  </tbody>
                </table>
            </div>
            {todayRecords.length === 0 && (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-secondary-100 rounded-2xl mb-4">
                    <Users className="w-8 h-8 text-secondary-400" />
                  </div>
                  <p className="text-secondary-500 text-lg">No employee records found for today</p>
                  <p className="text-secondary-400 text-sm mt-1">Records will appear here as employees check in</p>
                </div>
            )}
          </div>
        </div>
  );
}
