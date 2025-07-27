import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, Clock, Star, LogOut, Eye, Grid, Calendar, Target, Award } from 'lucide-react';
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
  };
  month: {
    active_employees: number;
    completed_days: number;
    month_avg_rating: number;
    month_avg_hours: number;
  };
  year: {
    active_employees: number;
    completed_days: number;
    year_avg_rating: number;
    year_avg_hours: number;
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
}

export default function Dashboard() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData[]>([]);
  const [kpis, setKpis] = useState<KPIData | null>(null);
  const [todayRecords, setTodayRecords] = useState<TodayRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [employeesRes, analyticsRes, kpisRes, todayRes] = await Promise.all([
        axios.get('/api/employees'),
        axios.get('/api/analytics/stats'),
        axios.get('/api/analytics/kpis'),
        axios.get('/api/analytics/today-records')
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">Attendance Dashboard</h1>
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/matrix')}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Grid className="w-4 h-4" />
                Matrix View
              </button>
              <button
                onClick={logout}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Today's KPIs */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Today's Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Employees</p>
                  <p className="text-2xl font-bold text-gray-900">{kpis?.today.total_employees || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Check-ins</p>
                  <p className="text-2xl font-bold text-gray-900">{kpis?.today.today_checkins || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Check-outs</p>
                  <p className="text-2xl font-bold text-gray-900">{kpis?.today.today_checkouts || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Star className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg Rating</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {kpis?.today.today_avg_rating ? Number(kpis.today.today_avg_rating).toFixed(1) + '/5' : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Target className="w-6 h-6 text-indigo-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg Hours</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {kpis?.today.today_avg_hours ? Number(kpis.today.today_avg_hours).toFixed(1) + 'h' : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Monthly & Yearly KPIs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* This Month */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">This Month</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="p-2 bg-green-100 rounded-lg inline-flex mb-2">
                  <Calendar className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-sm text-gray-600">Active Employees</p>
                <p className="text-xl font-bold text-gray-900">{kpis?.month.active_employees || 0}</p>
              </div>
              <div className="text-center">
                <div className="p-2 bg-blue-100 rounded-lg inline-flex mb-2">
                  <Award className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-sm text-gray-600">Completed Days</p>
                <p className="text-xl font-bold text-gray-900">{kpis?.month.completed_days || 0}</p>
              </div>
              <div className="text-center">
                <div className="p-2 bg-purple-100 rounded-lg inline-flex mb-2">
                  <Star className="w-5 h-5 text-purple-600" />
                </div>
                <p className="text-sm text-gray-600">Avg Rating</p>
                <p className="text-xl font-bold text-gray-900">
                  {kpis?.month.month_avg_rating ? Number(kpis.month.month_avg_rating).toFixed(1) + '/5' : 'N/A'}
                </p>
              </div>
              <div className="text-center">
                <div className="p-2 bg-orange-100 rounded-lg inline-flex mb-2">
                  <Clock className="w-5 h-5 text-orange-600" />
                </div>
                <p className="text-sm text-gray-600">Avg Hours</p>
                <p className="text-xl font-bold text-gray-900">
                  {kpis?.month.month_avg_hours ? Number(kpis.month.month_avg_hours).toFixed(1) + 'h' : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* This Year */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">This Year</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="p-2 bg-green-100 rounded-lg inline-flex mb-2">
                  <Calendar className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-sm text-gray-600">Active Employees</p>
                <p className="text-xl font-bold text-gray-900">{kpis?.year.active_employees || 0}</p>
              </div>
              <div className="text-center">
                <div className="p-2 bg-blue-100 rounded-lg inline-flex mb-2">
                  <Award className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-sm text-gray-600">Completed Days</p>
                <p className="text-xl font-bold text-gray-900">{kpis?.year.completed_days || 0}</p>
              </div>
              <div className="text-center">
                <div className="p-2 bg-purple-100 rounded-lg inline-flex mb-2">
                  <Star className="w-5 h-5 text-purple-600" />
                </div>
                <p className="text-sm text-gray-600">Avg Rating</p>
                <p className="text-xl font-bold text-gray-900">
                  {kpis?.year.year_avg_rating ? Number(kpis.year.year_avg_rating).toFixed(1) + '/5' : 'N/A'}
                </p>
              </div>
              <div className="text-center">
                <div className="p-2 bg-orange-100 rounded-lg inline-flex mb-2">
                  <Clock className="w-5 h-5 text-orange-600" />
                </div>
                <p className="text-sm text-gray-600">Avg Hours</p>
                <p className="text-xl font-bold text-gray-900">
                  {kpis?.year.year_avg_hours ? Number(kpis.year.year_avg_hours).toFixed(1) + 'h' : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Attendance Trends (Last 30 Days)</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.slice().reverse()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => formatDate(value)}
                />
                <YAxis />
                <Tooltip
                  labelFormatter={(value) => formatDate(value)}
                />
                <Line
                  type="monotone"
                  dataKey="total_checkins"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Check-ins"
                />
                <Line
                  type="monotone"
                  dataKey="total_checkouts"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Check-outs"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Today's Employee Records */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Today's Employee Records</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check-in</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check-out</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hours</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Today's Plan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {todayRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">
                              {(record.display_name || record.username).charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {record.display_name || record.username}
                          </div>
                          <div className="text-sm text-gray-500">@{record.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatTime(record.check_in_time)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatTime(record.check_out_time)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.hours_worked ? `${record.hours_worked}h` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {record.overall_rating ? (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRatingColor(record.overall_rating)}`}>
                          {record.overall_rating}/5
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                      <span className="truncate block" title={record.current_status}>
                        {record.current_status || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                      <span className="truncate block" title={record.today_plan}>
                        {record.today_plan || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => navigate(`/employee/${record.id}`)}
                        className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
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
            <div className="px-6 py-8 text-center">
              <p className="text-gray-500">No employee records found for today.</p>
            </div>
          )}
        </div>

        {/* Employee List */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">All Employees</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Username
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Attendance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Check-in
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {employees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">
                              {(employee.display_name || employee.username).charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {employee.display_name || employee.username}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {employee.username}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {employee.total_attendance} days
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {employee.last_checkin ? formatDate(employee.last_checkin) : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => navigate(`/employee/${employee.id}`)}
                        className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}