import React, { useState, useEffect } from 'react';
import { Calendar, Save, X } from 'lucide-react';
import axios from 'axios';
import { ProjectSettings } from '../types/ProjectSettings';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5005';

interface ProjectSettingsManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProjectSettingsManager({ isOpen, onClose }: ProjectSettingsManagerProps) {
  const [settings, setSettings] = useState<ProjectSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [startDate, setStartDate] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchSettings();
    }
  }, [isOpen]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/settings`);
      setSettings(response.data);
      if (response.data?.start_date) {
        setStartDate(response.data.start_date.split('T')[0]);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!startDate) {
      alert('Please select a start date');
      return;
    }

    try {
      setSaving(true);
      await axios.put(`${API_URL}/api/settings/start-date`, { startDate });
      alert('Project start date updated successfully!');
      fetchSettings();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error updating start date');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Project Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="text-gray-500">Loading settings...</div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Start Date
                </label>
                <p className="text-sm text-gray-600 mb-3">
                  This date determines when the contribution matrix starts showing data. 
                  Dates before this will appear as white/inactive.
                </p>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {settings?.start_date && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">
                    <strong>Current Start Date:</strong> {new Date(settings.start_date).toLocaleDateString()}
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}