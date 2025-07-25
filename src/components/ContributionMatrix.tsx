import React, { useState, useEffect } from 'react';
import { Calendar, Users, TrendingUp, ArrowLeft, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

interface Employee {
  id: number;
  username: string;
  display_name: string;
}

interface AttendanceData {
  [employeeId: number]: {
    [date: string]: {
      hasCheckin: boolean;
      hasCheckout: boolean;
      rating?: number;
    };
  };
}

interface WeekData {
  weekStart: string;
  days: {
    date: string;
    level: number;
    hasCheckin: boolean;
    hasCheckout: boolean;
    rating?: number;
  }[];
}

export default function ContributionMatrix() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendanceData, setAttendanceData] = useState<AttendanceData>({});
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    fetchData();
  }, [selectedYear]);

  const fetchData = async () => {
    try {
      const [employeesRes, attendanceRes] = await Promise.all([
        axios.get('/api/employees'),
        axios.get(`/api/attendance/matrix?year=${selectedYear}`)
      ]);

      setEmployees(employeesRes.data);
      setAttendanceData(attendanceRes.data);
    } catch (error) {
      console.error('Error fetching matrix data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateWeekData = (year: number): WeekData[] => {
    const weeks: WeekData[] = [];
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);
    
    // Find the first Sunday of the year (or the year start if it's already Sunday)
    const firstSunday = new Date(startDate);
    firstSunday.setDate(startDate.getDate() - startDate.getDay());
    
    let currentWeekStart = new Date(firstSunday);
    
    while (currentWeekStart <= endDate) {
      const weekDays: WeekData['days'] = [];
      
      for (let i = 0; i < 7; i++) {
        const currentDay = new Date(currentWeekStart);
        currentDay.setDate(currentWeekStart.getDate() + i);
        
        if (currentDay.getFullYear() === year) {
          weekDays.push({
            date: currentDay.toISOString().split('T')[0],
            level: 0,
            hasCheckin: false,
            hasCheckout: false
          });
        }
      }
      
      if (weekDays.length > 0) {
        weeks.push({
          weekStart: currentWeekStart.toISOString().split('T')[0],
          days: weekDays
        });
      }
      
      currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    }
    
    return weeks;
  };

  const getContributionLevel = (employeeId: number, date: string): number => {
    const attendance = attendanceData[employeeId]?.[date];
    if (!attendance) return 0;
    
    if (attendance.hasCheckin && attendance.hasCheckout) {
      if (attendance.rating) {
        if (attendance.rating >= 4) return 4;
        if (attendance.rating >= 3) return 3;
        return 2;
      }
      return 2;
    } else if (attendance.hasCheckin) {
      return 1;
    }
    
    return 0;
  };

  const getLevelColor = (level: number): string => {
    const colors = [
      'bg-gray-100', // No activity
      'bg-green-200', // Check-in only
      'bg-green-300', // Check-in + Check-out
      'bg-green-400', // Good rating
      'bg-green-500'  // Excellent rating
    ];
    return colors[level] || colors[0];
  };

  const getLevelTooltip = (level: number, hasCheckin: boolean, hasCheckout: boolean, rating?: number): string => {
    if (level === 0) return 'No activity';
    if (level === 1) return 'Check-in only';
    if (level === 2 && !rating) return 'Check-in + Check-out';
    if (level === 2) return `Check-in + Check-out (Rating: ${rating}/5)`;
    if (level === 3) return `Good day (Rating: ${rating}/5)`;
    if (level === 4) return `Excellent day (Rating: ${rating}/5)`;
    return 'Activity recorded';
  };

  const getDayOfWeekLabels = (): string[] => {
    return ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  };

  const formatWeekLabel = (weekStart: string): string => {
    const date = new Date(weekStart);
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const day = date.getDate();
    return `${month} ${day}`;
  };

  const weekData = generateWeekData(selectedYear);
  const dayLabels = getDayOfWeekLabels();

  // Calculate stats
  const totalEmployees = employees.length;
  const totalPossibleDays = weekData.reduce((total, week) => total + week.days.length, 0) * totalEmployees;
  const totalActiveDays = Object.values(attendanceData).reduce((total, employeeData) => {
    return total + Object.keys(employeeData).length;
  }, 0);
  const activityRate = totalPossibleDays > 0 ? (totalActiveDays / totalPossibleDays * 100).toFixed(1) : '0';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Loading contribution matrix...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mr-4"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Attendance Matrix</h1>
            </div>
            <div className="flex items-center gap-4">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {[2024, 2023, 2022].map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
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
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Employees</p>
                <p className="text-2xl font-bold text-gray-900">{totalEmployees}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Days</p>
                <p className="text-2xl font-bold text-gray-900">{totalActiveDays}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Activity Rate</p>
                <p className="text-2xl font-bold text-gray-900">{activityRate}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Legend</h3>
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-100 rounded-sm"></div>
              <span className="text-sm text-gray-600">No activity</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-200 rounded-sm"></div>
              <span className="text-sm text-gray-600">Check-in only</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-300 rounded-sm"></div>
              <span className="text-sm text-gray-600">Complete day</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-400 rounded-sm"></div>
              <span className="text-sm text-gray-600">Good day (3-4★)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
              <span className="text-sm text-gray-600">Excellent day (5★)</span>
            </div>
          </div>
        </div>

        {/* Contribution Matrix */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Attendance Contributions for {selectedYear}
            </h2>
          </div>
          
          <div className="p-6">
            {/* Day of week headers */}
            <div className="flex mb-4">
              <div className="w-40 flex-shrink-0"></div>
              <div className="w-16 flex-shrink-0 text-center text-xs text-gray-500 font-medium">Week</div>
              <div className="flex gap-1">
                {dayLabels.map((day, index) => (
                  <div key={index} className="w-4 h-4 text-xs text-gray-500 flex items-center justify-center font-medium">
                    {day}
                  </div>
                ))}
              </div>
            </div>

            {/* Employee sections */}
            {employees.map((employee) => (
              <div key={employee.id} className="mb-8">
                {/* Employee header */}
                <div className="flex items-center mb-3">
                  <div className="w-40 flex-shrink-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {employee.display_name || employee.username}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      @{employee.username}
                    </div>
                  </div>
                </div>
                
                {/* Weekly rows for this employee */}
                {weekData.map((week, weekIndex) => (
                  <div key={week.weekStart} className="flex items-center mb-1">
                    <div className="w-40 flex-shrink-0"></div>
                    <div className="w-16 flex-shrink-0 text-xs text-gray-400 text-center">
                      {formatWeekLabel(week.weekStart)}
                    </div>
                    <div className="flex gap-1">
                      {week.days.map((day) => {
                        const level = getContributionLevel(employee.id, day.date);
                        const attendance = attendanceData[employee.id]?.[day.date];
                        const tooltip = getLevelTooltip(
                          level, 
                          attendance?.hasCheckin || false, 
                          attendance?.hasCheckout || false, 
                          attendance?.rating
                        );
                        
                        return (
                          <div
                            key={day.date}
                            className={`w-4 h-4 rounded-sm ${getLevelColor(level)} border border-gray-200 hover:border-gray-400 transition-colors cursor-pointer`}
                            title={`${day.date}: ${tooltip}`}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ))}
            </div>
        </div>
      </div>
    </div>
  );
}