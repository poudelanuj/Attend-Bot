import React, {useState, useEffect} from 'react';
import {BrowserRouter as Router, Routes, Route, Navigate} from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import EmployeeDetail from './components/EmployeeDetail';
import ContributionMatrix from './components/ContributionMatrix';
import Sidebar from './components/Sidebar';
import {AuthProvider, useAuth} from './contexts/AuthContext';
import './styles/sidebar.css';
import Employees from "./components/Employees.tsx";
import ProjectSettingsPage from "./components/ProjectSettingsPage.tsx";
import HolidayManagerPage from "./components/HolidayManagerPage.tsx";

function AppRoutes() {
    const {token, loading} = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-soft mb-4 animate-bounce-soft">
                        <div className="w-6 h-6 border-3 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    <div className="text-xl font-semibold text-secondary-900 mb-2">Loading AttendBot</div>
                    <div className="text-secondary-600">Preparing your dashboard...</div>
                </div>
            </div>
        );
    }

    if (!token) {
        return (
            <Routes>
                <Route path="/login" element={<Login/>}/>
                <Route path="*" element={<Navigate to="/login"/>}/>
            </Routes>
        );
    }

    return (
        <>
            <Sidebar/>
            <main className="main-content">
                <Routes>
                    <Route path="/" element={<Dashboard/>}/>
                    <Route path="/employee/:id" element={<EmployeeDetail/>}/>
                    <Route path="/matrix" element={<ContributionMatrix/>}/>
                    <Route path="/login" element={<Navigate to="/"/>}/>
                    <Route path="/employees" element={<Employees/>}/>
                    <Route path="/settings" element={<ProjectSettingsPage/>}/>
                    <Route path="/holidays" element={<HolidayManagerPage/>}/>
                </Routes>
            </main>
        </>
    );
}

function App() {
    return (
        <AuthProvider>
            <Router>
                <div className="min-h-screen">
                    <AppRoutes/>
                </div>
            </Router>
        </AuthProvider>
    );
}

export default App;
