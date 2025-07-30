import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5005';

interface Settings {
    annualLeaveDays: number;
    annualLeaveResetDate: string;
    projectStartDate: string;
}

const ProjectSettingsPage: React.FC = () => {
    const [settings, setSettings] = useState<Settings>({
        annualLeaveDays: 14,
        annualLeaveResetDate: '07-16',
        projectStartDate: '2025-01-01',
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('adminToken');
            const response = await axios.get(`${API_URL}/api/settings`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setSettings({
                annualLeaveDays: response.data.annualLeaveDays || 14,
                annualLeaveResetDate: response.data.annualLeaveResetDate || '07-16',
                projectStartDate: response.data.projectStartDate || '2025-01-01',
            });
        } catch (error) {
            console.error('Error fetching settings:', error);
            setMessage({ text: 'Failed to load settings', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSaving(true);
            setMessage({ text: '', type: '' });

            const token = localStorage.getItem('adminToken');
            await axios.put(
                `${API_URL}/api/settings/`,
                {
                    days: settings.annualLeaveDays,
                    resetDate: settings.annualLeaveResetDate,
                    projectStartDate: settings.projectStartDate,
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            setMessage({ text: 'Settings saved successfully', type: 'success' });
        } catch (error) {
            console.error('Error saving settings:', error);
            setMessage({ text: 'Failed to save settings', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const validateResetDate = (value: string) => {
        const dateRegex = /^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/;
        return dateRegex.test(value);
    };

    if (loading) {
        return <div className="text-center my-6">Loading settings...</div>;
    }

    return (
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6 mt-6">
            <h2 className="text-2xl font-semibold mb-6">Project Settings</h2>

            {message.text && (
                <div
                    className={`p-3 mb-4 rounded ${
                        message.type === 'success'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                    }`}
                >
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                {/* Annual Leave Days */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Annual Leave Days Per Employee
                    </label>
                    <input
                        type="number"
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        value={settings.annualLeaveDays}
                        onChange={(e) =>
                            setSettings({ ...settings, annualLeaveDays: parseInt(e.target.value) || 0 })
                        }
                        required
                    />
                    <p className="mt-1 text-xs text-gray-500">
                        Default leave days allocated per employee per year.
                    </p>
                </div>

                {/* Annual Leave Reset Date */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Annual Leave Reset Date
                    </label>
                    <input
                        type="text"
                        placeholder="MM-DD"
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                            !validateResetDate(settings.annualLeaveResetDate) ? 'border-red-500' : 'border-gray-300'
                        }`}
                        value={settings.annualLeaveResetDate}
                        onChange={(e) =>
                            setSettings({ ...settings, annualLeaveResetDate: e.target.value })
                        }
                        required
                    />
                    {!validateResetDate(settings.annualLeaveResetDate) && (
                        <p className="mt-1 text-xs text-red-500">
                            Please use MM-DD format (e.g., 07-16 for July 16)
                        </p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                        Date when the leave days reset annually.
                    </p>
                </div>

                {/* Project Start Date */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Project Start Date
                    </label>
                    <input
                        type="date"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        value={settings.projectStartDate}
                        onChange={(e) =>
                            setSettings({ ...settings, projectStartDate: e.target.value })
                        }
                        required
                    />
                    <p className="mt-1 text-xs text-gray-500">
                        The date when this project was officially started.
                    </p>
                </div>

                <div className="flex justify-end">
                    <button
                        type="submit"
                        className={`px-5 py-2 rounded-md text-white ${
                            saving ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                        disabled={saving || !validateResetDate(settings.annualLeaveResetDate)}
                    >
                        {saving ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ProjectSettingsPage;
