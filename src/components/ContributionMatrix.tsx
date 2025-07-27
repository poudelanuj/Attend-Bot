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
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5005';
export default function ContributionMatrix() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendanceData, setAttendanceData] = useState<AttendanceData>({});
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [hoveredCell, setHoveredCell] = useState<{
    employeeId: number;
    date: string;
    level: number;
    attendance: { hasCheckin: boolean; hasCheckout: boolean; rating?: number }
  } | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const navigate = useNavigate();
  const { logout } = useAuth();

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  useEffect(() => {
    fetchData();
  }, [selectedYear]);

  const fetchData = async () => {
    try {
      const [employeesRes, attendanceRes] = await Promise.all([
        axios.get(`${API_URL}/api/employees`),
        axios.get(`${API_URL}/api/attendance/matrix?year=${selectedYear}`)
      ]);
      setEmployees(employeesRes.data);
      setAttendanceData(attendanceRes.data);
    } catch (error) {
      console.error('Error fetching matrix data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateYearGrid = (year: number) => {
    const weeks = [];
    const firstDay = new Date(year, 0, 1);
    const lastDay = new Date(year, 11, 31);

    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - firstDay.getDay());

    let currentDate = new Date(startDate);

    while (currentDate <= lastDay || currentDate.getFullYear() === year) {
      const week = [];
      const weekStart = new Date(currentDate);

      for (let day = 0; day < 7; day++) {
        const dayDate = new Date(currentDate);
        week.push({
          date: dayDate,
          dateStr: dayDate.toISOString().split('T')[0],
          isCurrentYear: dayDate.getFullYear() === year,
          month: dayDate.getMonth(),
          day: dayDate.getDate()
        });
        currentDate.setDate(currentDate.getDate() + 1);
      }

      weeks.push({
        weekStart: weekStart,
        days: week
      });

      if (weekStart.getFullYear() > year) break;
    }

    return weeks;
  };

  const getContributionLevel = (employeeId: number, date: string): number => {
    const attendance = attendanceData[employeeId]?.[date];
    if (!attendance) return 0;
    if (attendance.hasCheckin && attendance.hasCheckout) {
      if (attendance.rating) {
        if (attendance.rating >= 5) return 4;
        if (attendance.rating >= 4) return 3;
        return 2;
      }
      return 2;
    } else if (attendance.hasCheckin || attendance.hasCheckout) {
      return 1;
    }
    return 0;
  };

  const getLevelColor = (level: number): string => {
    const colors = {
      0: 'bg-gray-100',
      1: 'bg-green-100',
      2: 'bg-green-200',
      3: 'bg-green-400',
      4: 'bg-green-600'
    };
    return colors[level] || colors[0];
  };

  const getLevelTooltip = (level: number, hasCheckin: boolean, hasCheckout: boolean, rating: number | undefined, dateStr: string): string => {
    const date = new Date(dateStr).toLocaleDateString();
    if (level === 0) return `${date}: No activity`;
    if (level === 1) {
      if (hasCheckin && !hasCheckout) return `${date}: Check-in only`;
      if (hasCheckout && !hasCheckin) return `${date}: Check-out only`;
    }
    if (level === 2 && !rating) return `${date}: Check-in + Check-out`;
    if (level === 2) return `${date}: Check-in + Check-out (Rating: ${rating}/5)`;
    if (level === 3) return `${date}: Good day (Rating: ${rating}/5)`;
    if (level === 4) return `${date}: Excellent day (Rating: ${rating}/5)`;
    return `${date}: Activity recorded`;
  };

  const yearGrid = generateYearGrid(selectedYear);

  const totalEmployees = employees.length;
  const totalActiveDays = Object.values(attendanceData).reduce((total, empData) => {
    return total + Object.keys(empData).filter(date => {
      const dateObj = new Date(date);
      return dateObj.getFullYear() === selectedYear && (empData[date].hasCheckin || empData[date].hasCheckout);
    }).length;
  }, 0);

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePosition({ x: e.clientX, y: e.clientY });
  };

  if (loading) {
    return <div className="min-h-screen bg-white text-gray-900 flex items-center justify-center text-xl">Loading...</div>;
  }

  return (
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
            <div className="flex items-center">
              <button onClick={() => navigate('/')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <h1 className="ml-4 text-2xl font-bold text-gray-900">Team Attendance Matrix</h1>
            </div>
            <div className="flex gap-4 items-center">
              <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(+e.target.value)}
                  className="bg-white border border-gray-300 rounded px-3 py-2 text-gray-900"
              >
                {[...Array(3)].map((_, i) => {
                  const year = new Date().getFullYear() - i;
                  return <option key={year} value={year}>{year}</option>;
                })}
              </select>
              <button onClick={logout} className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900">
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl border border-gray-200 p-6 flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="text-blue-600 w-6 h-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Employees</p>
                <p className="text-2xl font-bold text-gray-900">{totalEmployees}</p>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6 flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Calendar className="text-green-600 w-6 h-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Active Days</p>
                <p className="text-2xl font-bold text-gray-900">{totalActiveDays}</p>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6 flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="text-purple-600 w-6 h-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Year</p>
                <p className="text-2xl font-bold text-gray-900">{selectedYear}</p>
              </div>
            </div>
          </div>

          {employees.map((employee) => {
            const employeeActiveDays = Object.keys(attendanceData[employee.id] || {}).filter(date => {
              const dateObj = new Date(date);
              return dateObj.getFullYear() === selectedYear && (attendanceData[employee.id][date].hasCheckin || attendanceData[employee.id][date].hasCheckout);
            }).length;

            return (
                <div key={employee.id} className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        {employee.display_name || employee.username}
                      </h2>
                      <p className="text-sm text-gray-600">@{employee.username}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {employeeActiveDays} days active in {selectedYear}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>Less</span>
                      <div className="flex gap-1">
                        <div className="w-3 h-3 rounded-sm bg-gray-100 border border-gray-300"></div>
                        <div className="w-3 h-3 rounded-sm bg-green-100"></div>
                        <div className="w-3 h-3 rounded-sm bg-green-200"></div>
                        <div className="w-3 h-3 rounded-sm bg-green-400"></div>
                        <div className="w-3 h-3 rounded-sm bg-green-600"></div>
                      </div>
                      <span>More</span>
                    </div>
                  </div>

                  <div className="overflow-x-auto" onMouseMove={handleMouseMove}>
                    <div className="inline-block min-w-full">
                      <div className="flex mb-2 ml-[80px]">
                        {months.map((month, monthIndex) => {
                          const monthWeeks = yearGrid.filter(week => {
                            const midWeek = new Date(week.weekStart);
                            midWeek.setDate(midWeek.getDate() + 3);
                            return midWeek.getMonth() === monthIndex && midWeek.getFullYear() === selectedYear;
                          });
                          const weeksWidth = monthWeeks.length * 14; // 14px per week
                          if (monthWeeks.length === 0) return <div key={monthIndex} className="w-4"></div>;

                          return (
                              <div
                                  key={monthIndex}
                                  className="text-xs text-gray-600 font-medium text-center"
                                  style={{ minWidth: `${weeksWidth}px`, padding: '0 32px' }}
                              >
                                {month}
                              </div>
                          );
                        })}
                      </div>

                      <div className="flex">
                        <div className="flex flex-col pr-4">
                          {dayLabels.map((day, index) => (
                              <div key={index} className="h-[12px] mb-[2px] flex items-center justify-end" style={{ width: '40px' }}>
                                <span className="text-xs text-gray-600 font-medium">{day}</span>
                              </div>
                          ))}
                        </div>

                        <div className="flex gap-0.5">
                          {yearGrid.reduce((acc: JSX.Element[], week, weekIndex) => {
                            const isMonthStart = week.days[0].month !== (weekIndex > 0 ? yearGrid[weekIndex - 1].days[0].month : -1);

                            if (isMonthStart && weekIndex > 0) {
                              acc.push(<div key={`spacer-${weekIndex}`} className="w-6"></div>); // Increased gap
                            }

                            acc.push(
                                <div key={weekIndex} className="flex flex-col gap-[2px]">
                                  {week.days.map((dayData, dayIndex) => {
                                    const level = dayData.isCurrentYear ? getContributionLevel(employee.id, dayData.dateStr) : 0;
                                    const attendance = attendanceData[employee.id]?.[dayData.dateStr] || { hasCheckin: false, hasCheckout: false };

                                    return (
                                        <div
                                            key={dayIndex}
                                            className={`w-3 h-3 rounded-sm cursor-pointer transition-all hover:ring-1 hover:ring-gray-400 ${getLevelColor(level)}`}
                                            onMouseEnter={() => setHoveredCell({
                                              employeeId: employee.id,
                                              date: dayData.dateStr,
                                              level,
                                              attendance
                                            })}
                                            onMouseLeave={() => setHoveredCell(null)}
                                        />
                                    );
                                  })}
                                </div>
                            );
                            return acc;
                          }, [])}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
            );
          })}

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Legend</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded-sm"></div>
                <span className="text-gray-600">No Activity</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-100 rounded-sm"></div>
                <span className="text-gray-600">Check-in or Check-out</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-200 rounded-sm"></div>
                <span className="text-gray-600">Check-in + Check-out</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-400 rounded-sm"></div>
                <span className="text-gray-600">Good Day (4+ Rating)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-600 rounded-sm"></div>
                <span className="text-gray-600">Excellent Day (5 Rating)</span>
              </div>
            </div>
          </div>
        </main>

        {hoveredCell && (
            <div
                className="fixed bg-gray-800 text-white text-xs px-3 py-2 rounded shadow-lg pointer-events-none z-50 border border-gray-700"
                style={{
                  left: mousePosition.x + 10,
                  top: mousePosition.y - 30,
                  transform: mousePosition.x > window.innerWidth - 200 ? 'translateX(-100%)' : 'none'
                }}
            >
              {getLevelTooltip(
                  hoveredCell.level,
                  hoveredCell.attendance.hasCheckin,
                  hoveredCell.attendance.hasCheckout,
                  hoveredCell.attendance.rating,
                  hoveredCell.date
              )}
            </div>
        )}
      </div>
  );
}
