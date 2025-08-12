import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    Home,
    Users,
    Grid3X3,
    Calendar,
    Settings,
    LogOut,
    Menu,
    X,
    Zap,
    TrendingUp
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import '../styles/sidebar.css';

const Sidebar = () => {
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { logout } = useAuth();

    useEffect(() => {
        // Close sidebar when route changes on mobile
        setIsSidebarOpen(false);

        // Handle outside clicks for mobile
        function handleClickOutside(event) {
            const sidebarElement = document.querySelector('.sidebar');
            const toggleButton = document.querySelector('.sidebar-toggle');

            if (
                isSidebarOpen &&
                sidebarElement &&
                !sidebarElement.contains(event.target) &&
                toggleButton &&
                !toggleButton.contains(event.target)
            ) {
                setIsSidebarOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [location.pathname, isSidebarOpen]);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const handleLogout = () => {
        logout();
        window.location.href = '/login';
    };

    const menuItems = [
        { path: '/', icon: Home, label: 'Dashboard' },
        { path: '/employees', icon: Users, label: 'Employees' },
        { path: '/matrix', icon: Grid3X3, label: 'Matrix View' },
        { path: '/holidays', icon: Calendar, label: 'Holidays' },
        { path: '/settings', icon: Settings, label: 'Settings' },
    ];

    return (
        <>
            {/* Mobile Toggle Button */}
            <button
                className="sidebar-toggle md:hidden"
                onClick={toggleSidebar}
                aria-label="Toggle sidebar"
            >
                {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Mobile Backdrop */}
            <div
                className={`sidebar-backdrop md:hidden ${isSidebarOpen ? 'open' : ''}`}
                onClick={() => setIsSidebarOpen(false)}
            />

            <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <div className="sidebar-logo">
                    </div>
                    <h1>AttendBot</h1>
                </div>

                <nav className="sidebar-menu">
                    <ul>
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path;

                            return (
                                <li key={item.path}>
                                    <Link
                                        to={item.path}
                                        className={isActive ? 'active' : ''}
                                        onClick={() => setIsSidebarOpen(false)}
                                    >
                                        <Icon />
                                        <span>{item.label}</span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                <div className="sidebar-footer">
                    <button onClick={handleLogout} aria-label="Logout">
                        <LogOut />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
