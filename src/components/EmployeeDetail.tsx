import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, Star, TrendingUp } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import axios from 'axios';
import { ProjectSettings } from '../types/ProjectSettings';

interface Employee {
    id: number;
    username: string;
    display_name: string;
    email: string | null;
    department: string | null;
    position: string | null;
    created_at: string;
}

interface AttendanceRecord {
    id: number;
    employee_id: number;
    date: string;
    check_in_time: string | null;
    check_out_time: string | null;
    today_plan: string | null;
    yesterday_task: string | null;
    current_status: string | null;
    work_from: string | null;
    accomplishments: string | null;
    blockers: string | null;
    tomorrow_priorities: string | null;
    overall_rating: number | null;
}

interface LeaveRecord {
    id: number;
    employee_id: number;
    date: string;
    description: string;
    status: string;
}

interface EmployeeStats {
    total_days: number;
    completed_days: number;
    avg_rating: number | null;
    avg_hours: number | null;
}

interface AttendanceData {
    [employeeId: number]: {
        [date: string]: {
            hasCheckin: boolean;
            hasCheckout: boolean;
            rating?: number;
            workFrom?: string;
            status?: string;
            isLeave?: boolean;
            leaveDescription?: string;
        };
    };
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5005';

export default function EmployeeDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [employee, setEmployee] = useState<Employee | null>(null);
    const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
    const [leaveHistory, setLeaveHistory] = useState<LeaveRecord[]>([]);
    const [stats, setStats] = useState<EmployeeStats | null>(null);
    const [attendanceData, setAttendanceData] = useState<AttendanceData>({});
    const [holidays, setHolidays] = useState<any[]>([]);
    const [projectSettings, setProjectSettings] = useState<ProjectSettings | null>(null);
    const [monthlyStats, setMonthlyStats] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [hoveredCell, setHoveredCell] = useState<{
        employeeId: number;
        date: string;
        level: number;
        attendance: { hasCheckin: boolean; hasCheckout: boolean; rating?: number; workFrom?: string; status?: string; isLeave?: boolean; leaveDescription?: string };
    } | null>(null);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        fetchEmployeeDetail();
    }, [id]);

    const fetchEmployeeDetail = async () => {
        try {
            const [employeeRes, matrixRes, holidaysRes, settingsRes, leaveRes] = await Promise.all([
                axios.get(`${API_URL}/api/employees/${id}`),
                axios.get(`${API_URL}/api/attendance/matrix?year=${new Date().getFullYear()}&employeeId=${id}`),
                axios.get(`${API_URL}/api/holidays`),
                axios.get(`${API_URL}/api/settings`),
                axios.get(`${API_URL}/api/leaves/${id}`)
            ]);

            setEmployee(employeeRes.data.employee);
            setAttendanceHistory(employeeRes.data.attendanceHistory);
            setLeaveHistory(leaveRes.data);
            setStats(employeeRes.data.stats);
            // Map attendance data to match ContributionMatrix.tsx structure
            setAttendanceData({ [parseInt(id!)]: matrixRes.data.attendance });
            setHolidays(holidaysRes.data);
            setProjectSettings({ start_date: settingsRes.data.setting_value });

            // Generate monthly stats
            const monthlyData = generateMonthlyStats(employeeRes.data.attendanceHistory, leaveRes.data);
            setMonthlyStats(monthlyData);
        } catch (error) {
            console.error('Error fetching employee details:', error);
        } finally {
            setLoading(false);
        }
    };

    const generateMonthlyStats = (attendanceRecords: AttendanceRecord[], leaveRecords: LeaveRecord[]) => {
        const monthlyMap = new Map();
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        // Process attendance records
        attendanceRecords.forEach(record => {
            const date = new Date(record.date);
            const monthKey = `${months[date.getMonth()]} ${date.getFullYear()}`;

            if (!monthlyMap.has(monthKey)) {
                monthlyMap.set(monthKey, {
                    month: monthKey,
                    totalDays: 0,
                    completedDays: 0,
                    leaveDays: 0,
                    avgRating: 0,
                    totalRating: 0,
                    ratingCount: 0
                });
            }

            const monthData = monthlyMap.get(monthKey);
            monthData.totalDays++;

            if (record.check_out_time) {
                monthData.completedDays++;
            }

            if (record.overall_rating) {
                monthData.totalRating += record.overall_rating;
                monthData.ratingCount++;
            }
        });

        // Process leave records
        leaveRecords.forEach(record => {
            const date = new Date(record.date);
            const monthKey = `${months[date.getMonth()]} ${date.getFullYear()}`;

            if (!monthlyMap.has(monthKey)) {
                monthlyMap.set(monthKey, {
                    month: monthKey,
                    totalDays: 0,
                    completedDays: 0,
                    leaveDays: 0,
                    avgRating: 0,
                    totalRating: 0,
                    ratingCount: 0
                });
            }

            const monthData = monthlyMap.get(monthKey);
            monthData.leaveDays++;
        });

        return Array.from(monthlyMap.values()).map(month => ({
            ...month,
            avgRating: month.ratingCount > 0 ? (month.totalRating / month.ratingCount).toFixed(1) : 0
        })).slice(-12);
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
                    day: dayDate.getDate(),
                });
                currentDate.setDate(currentDate.getDate() + 1);
            }

            weeks.push({
                weekStart: weekStart,
                days: week,
            });

            if (weekStart.getFullYear() > year) break;
        }

        return weeks;
    };

    const getContributionLevel = (employeeId: number, date: string): number => {
        const attendance = attendanceData[employeeId]?.[date];
        const dateObj = new Date(date);
        const today = new Date();
        const projectStartDate = projectSettings?.start_date ? new Date(projectSettings.start_date) : null;

        // Future dates or before project start date
        if (dateObj > today || (projectStartDate && dateObj < projectStartDate)) return 0;

        // Check if it's a holiday (Saturday)
        const isHoliday = holidays.some((holiday) => holiday.date === date);
        const isSaturday = dateObj.getDay() === 6;

        if (isHoliday || isSaturday) {
            return 6; // Gray for Saturdays/holidays
        }

        if (!attendance) return 8; // No activity on a working day

        if (attendance.isLeave) return 7; // Blue for leave

        if (attendance.hasCheckin && attendance.hasCheckout) {
            if (attendance.rating) {
                if (attendance.rating >= 5) return 4; // Dark green for rating 5
                if (attendance.rating >= 4) return 3; // Medium green for rating 4
                return 2; // Light green for check-in + check-out
            }
            return 2;
        } else if (attendance.hasCheckin || attendance.hasCheckout) {
            return 1; // Lightest green for partial attendance
        }

        return 8; // Red for no activity on a working day
    };

    const getLevelColor = (level: number): string => {
        const colors = {
            0: 'bg-gray-100', // Future or pre-project
            1: 'bg-green-100', // Partial attendance
            2: 'bg-green-200', // Check-in + check-out
            3: 'bg-green-400', // Rating 4
            4: 'bg-green-600', // Rating 5
            6: 'bg-gray-200', // Saturday/holiday
            7: 'bg-blue-400', // Leave
            8: 'bg-red-400', // No activity on working day
        };
        return colors[level] || colors[0];
    };

    const getLevelTooltip = (
        level: number,
        hasCheckin: boolean,
        hasCheckout: boolean,
        rating: number | undefined,
        dateStr: string,
        isLeave?: boolean,
        leaveDescription?: string
    ): string => {
        const date = new Date(dateStr).toLocaleDateString();
        const dateObj = new Date(dateStr);
        const today = new Date();
        const projectStartDate = projectSettings?.start_date ? new Date(projectSettings.start_date) : null;

        if (dateObj > today) return `${date}: Future date`;
        if (projectStartDate && dateObj < projectStartDate) return `${date}: Before project start`;

        const holiday = holidays.find((h) => h.date === dateStr);
        const isSaturday = dateObj.getDay() === 6;

        if (holiday || isSaturday) {
            return `${date}: Saturday (Holiday)${holiday?.description ? ` - ${holiday.description}` : ''}`;
        }

        if (isLeave) {
            return `${date}: On Leave${leaveDescription ? ` - ${leaveDescription}` : ''}`;
        }

        if (level === 0) return `${date}: No activity`;
        if (level === 8) return `${date}: No activity (Working day)`;
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

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString();
    };

    const formatTime = (dateString: string | null) => {
        return dateString ? new Date(dateString).toLocaleTimeString() : '-';
    };

    const getRatingColor = (rating: number | null) => {
        if (rating === null) return 'text-gray-600 bg-gray-100';
        if (rating >= 4) return 'text-green-600 bg-green-100';
        if (rating >= 3) return 'text-yellow-600 bg-yellow-100';
        return 'text-red-600 bg-red-100';
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        setMousePosition({ x: e.clientX, y: e.clientY });
    };

    // Pie chart data for ratings distribution
    const ratingDistribution = [
        { name: '5 Stars', value: attendanceHistory.filter(r => r.overall_rating === 5).length, color: '#10b981' },
        { name: '4 Stars', value: attendanceHistory.filter(r => r.overall_rating === 4).length, color: '#3b82f6' },
        { name: '3 Stars', value: attendanceHistory.filter(r => r.overall_rating === 3).length, color: '#f59e0b' },
        { name: '2 Stars', value: attendanceHistory.filter(r => r.overall_rating === 2).length, color: '#ef4444' },
        { name: '1 Star', value: attendanceHistory.filter(r => r.overall_rating === 1).length, color: '#6b7280' },
    ].filter(item => item.value > 0);

    // Combine attendance and leave history for display
    const combinedHistory = [
        ...attendanceHistory.map(record => ({
            type: 'attendance',
            date: record.date,
            check_in_time: record.check_in_time || '-',
            check_out_time: record.check_out_time || '-',
            hours: record.check_in_time && record.check_out_time
                ? `${Math.round((new Date(record.check_out_time).getTime() - new Date(record.check_in_time).getTime()) / (1000 * 60 * 60) * 10) / 10}h`
                : '-',
            rating: record.overall_rating,
            work_from: record.work_from || '-',
            current_status: record.current_status || '-',
            today_plan: record.today_plan || '-',
            accomplishments: record.accomplishments || '-',
            blockers: record.blockers || '-'
        })),
        ...leaveHistory.map(record => ({
            type: 'leave',
            date: record.date,
            check_in_time: '-',
            check_out_time: '-',
            hours: '-',
            rating: null,
            work_from: '-',
            current_status: `Leave (${record.status})`,
            today_plan: record.description || '-',
            accomplishments: '-',
            blockers: '-'
        }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-xl">Loading employee details...</div>
            </div>
        );
    }

    if (!employee) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-xl text-red-600">Employee not found</div>
            </div>
        );
    }

    const yearGrid = generateYearGrid(new Date().getFullYear());
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
                    <div className="flex items-center">
                        <button
                            onClick={() => navigate('/')}
                            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mr-4"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Dashboard
                        </button>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Employee Details - {employee.display_name || employee.username}
                        </h1>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Employee Info */}
                <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
                    <div className="flex items-center mb-4">
                        <div className="h-16 w-16 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-xl font-medium text-gray-700">
                                {(employee.display_name || employee.username).charAt(0).toUpperCase()}
                            </span>
                        </div>
                        <div className="ml-4">
                            <h2 className="text-xl font-bold text-gray-900">
                                {employee.display_name || employee.username}
                            </h2>
                            <p className="text-gray-600">@{employee.username}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <p className="text-sm text-gray-600">Email</p>
                            <p className="font-medium">{employee.email || 'Not provided'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Department</p>
                            <p className="font-medium">{employee.department || 'Not specified'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Position</p>
                            <p className="font-medium">{employee.position || 'Not specified'}</p>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <div className="flex items-center">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <Calendar className="w-6 h-6 text-blue-600" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Total Days</p>
                                    <p className="text-2xl font-bold text-gray-900">{stats.total_days}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <div className="flex items-center">
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <TrendingUp className="w-6 h-6 text-green-600" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Completed Days</p>
                                    <p className="text-2xl font-bold text-gray-900">{stats.completed_days}</p>
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
                                        {stats.avg_rating && !isNaN(parseFloat(stats.avg_rating)) ? parseFloat(stats.avg_rating).toFixed(1) : '0.0'}/5
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <div className="flex items-center">
                                <div className="p-2 bg-orange-100 rounded-lg">
                                    <Clock className="w-6 h-6 text-orange-600" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Avg Hours</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {stats.avg_hours && !isNaN(parseFloat(stats.avg_hours)) ? parseFloat(stats.avg_hours).toFixed(1) : '0.0'}h
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Contribution Matrix */}
                <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-gray-900">Contribution Matrix ({new Date().getFullYear()})</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>Less</span>
                            <div className="flex gap-1">
                                <div className="w-3 h-3 rounded-sm bg-gray-100 border border-gray-300"></div>
                                <div className="w-3 h-3 rounded-sm bg-green-100"></div>
                                <div className="w-3 h-3 rounded-sm bg-green-200"></div>
                                <div className="w-3 h-3 rounded-sm bg-green-400"></div>
                                <div className="w-3 h-3 rounded-sm bg-green-600"></div>
                                <div className="w-3 h-3 rounded-sm bg-blue-400"></div>
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
                                        return midWeek.getMonth() === monthIndex && midWeek.getFullYear() === new Date().getFullYear();
                                    });
                                    const weeksWidth = monthWeeks.length * 14;
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
                                            acc.push(<div key={`spacer-${weekIndex}`} className="w-6"></div>);
                                        }

                                        acc.push(
                                            <div key={weekIndex} className="flex flex-col gap-[2px]">
                                                {week.days.map((dayData, dayIndex) => {
                                                    const level = dayData.isCurrentYear ? getContributionLevel(employee.id, dayData.dateStr) : 0;
                                                    const attendance = attendanceData[employee.id]?.[dayData.dateStr] || {
                                                        hasCheckin: false,
                                                        hasCheckout: false,
                                                        rating: undefined,
                                                        isLeave: false
                                                    };

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

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* Rating Distribution */}
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Rating Distribution</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={ratingDistribution}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {ratingDistribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex flex-wrap gap-4 mt-4">
                            {ratingDistribution.map((item, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                                    <span className="text-sm text-gray-600">{item.name}: {item.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Monthly Trends */}
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Attendance Trends</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={monthlyStats}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="completedDays" fill="#3b82f6" name="Completed Days" />
                                    <Bar dataKey="totalDays" fill="#e5e7eb" name="Total Days" />
                                    <Bar dataKey="leaveDays" fill="#60a5fa" name="Leave Days" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Monthly Work Summary */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-8">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900">Monthly Work Summary</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Days</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completed Days</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leave Days</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completion Rate</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Rating</th>
                            </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                            {monthlyStats.map((month, index) => (
                                <tr key={index} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {month.month}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {month.totalDays}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {month.completedDays}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {month.leaveDays}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {month.totalDays > 0 ? Math.round((month.completedDays / month.totalDays) * 100) : 0}%
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {month.avgRating > 0 ? (
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRatingColor(parseFloat(month.avgRating))}`}>
                                                {month.avgRating}/5
                                            </span>
                                        ) : '-'}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Attendance and Leave History */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900">Attendance and Leave History</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check-in</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check-out</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hours</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Work From</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Accomplishments</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Blockers</th>
                            </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                            {combinedHistory.map((record, index) => (
                                <tr key={index} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {formatDate(record.date)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            record.type === 'leave' ? 'text-blue-600 bg-blue-100' : 'text-green-600 bg-green-100'
                                        }`}>
                                            {record.type === 'leave' ? 'Leave' : 'Attendance'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {record.check_in_time}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {record.check_out_time}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {record.hours}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {record.rating !== null ? (
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRatingColor(record.rating)}`}>
                                                {record.rating}/5
                                            </span>
                                        ) : '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            record.work_from === 'office' ? 'text-blue-600 bg-blue-100' : record.work_from === 'remote' ? 'text-green-600 bg-green-100' : 'text-gray-600 bg-gray-100'
                                        }`}>
                                            {record.work_from}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {record.current_status}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                                        <span className="truncate block" title={record.today_plan}>
                                            {record.today_plan}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                                        <span className="truncate block" title={record.accomplishments}>
                                            {record.accomplishments}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                                        <span className="truncate block" title={record.blockers}>
                                            {record.blockers}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>

                    {combinedHistory.length === 0 && (
                        <div className="px-6 py-8 text-center">
                            <p className="text-gray-500">No attendance or leave records found for this employee.</p>
                        </div>
                    )}
                </div>
            </div>

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
                        hoveredCell.date,
                        hoveredCell.attendance.isLeave,
                        hoveredCell.attendance.leaveDescription
                    )}
                </div>
            )}
        </div>
    );
}
