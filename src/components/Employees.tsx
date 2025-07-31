import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Eye, Users, Search, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Employee {
    id: number;
    username: string;
    display_name: string;
    total_attendance: number;
    last_checkin: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5005';

export default function Employees() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    const filteredEmployees = employees.filter(employee =>
        employee.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/employees`);
            setEmployees(res.data);
        } catch (err) {
            console.error('Failed to fetch employees:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString();
    };

    if (loading) {
        return (
                <div className="main-content-inner flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-soft mb-4 animate-bounce-soft">
                            <Users className="w-8 h-8 text-primary-600" />
                        </div>
                        <div className="text-xl font-semibold text-secondary-900 mb-2">Loading employees...</div>
                        <div className="text-secondary-600">Fetching team data</div>
                    </div>
                </div>
        );
    }

    return (
            <div className="main-content-inner">
                {/* Header */}
                <header className="mb-8">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold gradient-text mb-2">Team Members</h1>
                            <p className="text-secondary-600">Manage and view all team member profiles</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                                <input
                                    type="text"
                                    placeholder="Search employees..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="input-field pl-10 w-64"
                                />
                            </div>
                        </div>
                    </div>
                </header>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="stat-card">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 p-3 bg-gradient-to-br from-primary-100 to-primary-50 rounded-xl">
                                <Users className="w-6 h-6 text-primary-600" />
                            </div>
                            <div className="ml-4 flex-1">
                                <p className="text-sm font-medium text-secondary-600 mb-1">Total Employees</p>
                                <p className="text-2xl font-bold text-secondary-900">{employees.length}</p>
                            </div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 p-3 bg-gradient-to-br from-success-100 to-success-50 rounded-xl">
                                <Users className="w-6 h-6 text-success-600" />
                            </div>
                            <div className="ml-4 flex-1">
                                <p className="text-sm font-medium text-secondary-600 mb-1">Active Members</p>
                                <p className="text-2xl font-bold text-secondary-900">{employees.filter(e => e.last_checkin).length}</p>
                            </div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 p-3 bg-gradient-to-br from-warning-100 to-warning-50 rounded-xl">
                                <Users className="w-6 h-6 text-warning-600" />
                            </div>
                            <div className="ml-4 flex-1">
                                <p className="text-sm font-medium text-secondary-600 mb-1">Never Checked In</p>
                                <p className="text-2xl font-bold text-secondary-900">{employees.filter(e => !e.last_checkin).length}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Employee Table */}
                <div className="card overflow-hidden">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-secondary-900 mb-1">All Employees</h2>
                            <p className="text-secondary-600">
                                {filteredEmployees.length} of {employees.length} employees
                                {searchTerm && ` matching "${searchTerm}"`}
                            </p>
                        </div>
                    </div>

                    <div className="table-container">
                        <table className="table-modern">
                                <thead>
                                <tr>
                                    <th>Employee</th>
                                    <th>Username</th>
                                    <th>Total Attendance</th>
                                    <th>Last Check-in</th>
                                    <th>Actions</th>
                                </tr>
                                </thead>
                                <tbody>
                                {filteredEmployees.map((employee) => (
                                    <tr key={employee.id}>
                                        <td>
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-12 w-12">
                                                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center">
                                                        <span className="text-sm font-semibold text-primary-700">
                                                            {(employee.display_name || employee.username).charAt(0).toUpperCase()}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-semibold text-secondary-900">
                                                        {employee.display_name || employee.username}
                                                    </div>
                                                    <div className="text-sm text-secondary-500">Team Member</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="status-badge status-info">@{employee.username}</span>
                                        </td>
                                        <td>
                                            <span className="font-semibold text-secondary-900">{employee.total_attendance}</span>
                                            <span className="text-secondary-500 ml-1">days</span>
                                        </td>
                                        <td>
                                            <span className={`status-badge ${employee.last_checkin ? 'status-success' : 'status-warning'}`}>
                                                {employee.last_checkin ? formatDate(employee.last_checkin) : 'Never'}
                                            </span>
                                        </td>
                                        <td>
                                            <button
                                                onClick={() => navigate(`/employee/${employee.id}`)}
                                                className="btn-secondary text-sm py-2 px-3 flex items-center gap-2 hover:scale-105"
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

                    {filteredEmployees.length === 0 && (
                        <div className="text-center py-12">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-secondary-100 rounded-2xl mb-4">
                                <Users className="w-8 h-8 text-secondary-400" />
                            </div>
                            <p className="text-secondary-500 text-lg mb-2">
                                {searchTerm ? 'No employees found matching your search' : 'No employees found'}
                            </p>
                            <p className="text-secondary-400 text-sm">
                                {searchTerm ? 'Try adjusting your search criteria' : 'Employees will appear here when they join'}
                            </p>
                        </div>
                    )}
                </div>
            </div>
    );
}
