import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

const DashboardLayout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Get real outlet data from localStorage
    const outlet = authAPI.getOutlet();

    // Get initials from outlet name
    const getInitials = (name) => {
        if (!name) return 'VF';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    // Handle logout
    const handleLogout = () => {
        authAPI.logout();
        navigate('/login');
    };

    // Protect Dashboard Routes
    React.useEffect(() => {
        const currentOutlet = authAPI.getOutlet();
        const token = localStorage.getItem('token');

        if (!currentOutlet || !token) {
            navigate('/login');
        }
    }, [navigate]);

    const navigation = [
        { name: 'Dashboard', href: '/dashboard', icon: 'dashboard' },
        { name: 'Inventory', href: '/dashboard/inventory', icon: 'checkroom' },
        { name: 'Sessions', href: '/dashboard/sessions', icon: 'history' },
        { name: 'Analytics', href: '/dashboard/analytics', icon: 'analytics' },
        { name: 'Subscription', href: '/dashboard/subscription', icon: 'payments' },
        { name: 'Settings', href: '/dashboard/settings', icon: 'settings' },
    ];

    const isActive = (path) => {
        if (path === '/dashboard' && location.pathname === '/dashboard') return true;
        if (path !== '/dashboard' && location.pathname.startsWith(path)) return true;
        return false;
    };

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-sans flex text-sm transition-colors duration-300">
            {/* Grid Pattern Background */}
            <div className="fixed inset-0 pointer-events-none z-0 bg-grid-pattern opacity-50"></div>

            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-64 bg-surface-light dark:bg-surface-dark border-r-2 border-slate-900 dark:border-white transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <div className="flex flex-col h-full relative z-10">
                    {/* Sidebar Header */}
                    <div className="h-20 flex items-center px-6 border-b-2 border-slate-900 dark:border-white">
                        <div className="flex items-center gap-3 text-slate-900 dark:text-white">
                            <div className="size-10 rounded-lg bg-primary flex items-center justify-center shadow-lg border-2 border-slate-900 dark:border-white transform -rotate-3">
                                <span className="material-symbols-outlined text-white text-2xl">view_in_ar</span>
                            </div>
                            <span className="font-display font-bold text-xl tracking-tight uppercase">VirtualFit</span>
                        </div>
                        <button
                            className="ml-auto lg:hidden text-slate-500 hover:text-slate-900 dark:hover:text-white"
                            onClick={() => setIsSidebarOpen(false)}
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>

                    {/* Navigation Links */}
                    <nav className="flex-1 overflow-y-auto py-8 px-4 space-y-2">
                        {navigation.map((item) => (
                            <Link
                                key={item.name}
                                to={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-sm font-bold uppercase tracking-wider transition-all border-2 ${isActive(item.href)
                                    ? 'bg-primary text-white border-slate-900 dark:border-white shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] translate-y-[-2px]'
                                    : 'text-slate-500 dark:text-slate-400 border-transparent hover:border-slate-900 dark:hover:border-white hover:text-slate-900 dark:hover:text-white hover:translate-x-1'
                                    }`}
                            >
                                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                                <span className="text-xs">{item.name}</span>
                            </Link>
                        ))}
                    </nav>

                    {/* User Profile / Logout */}
                    <div className="border-t-2 border-slate-900 dark:border-white p-6 bg-slate-50 dark:bg-slate-900/50">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="size-10 rounded-sm bg-primary border-2 border-slate-900 dark:border-white flex items-center justify-center text-white font-bold shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
                                {getInitials(outlet?.name)}
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-sm font-bold text-slate-900 dark:text-white truncate uppercase">{outlet?.name || 'Guest'}</p>
                                <p className="text-[10px] font-bold text-slate-500 truncate">{outlet?.email || 'Not logged in'}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 font-bold uppercase text-[10px] text-slate-500 hover:text-red-600 transition-colors"
                        >
                            <span className="material-symbols-outlined text-[18px]">logout</span>
                            Sign Out
                        </button>
                    </div>
                </div>
            </aside>

            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden backdrop-blur-sm"
                    onClick={() => setIsSidebarOpen(false)}
                ></div>
            )}

            {/* Main Content Wrapper */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
                {/* Top Header */}
                <header className="h-16 bg-surface-light dark:bg-surface-dark border-b-2 border-slate-900 dark:border-white flex items-center justify-between px-4 lg:px-8">
                    <button
                        className="lg:hidden p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                        onClick={() => setIsSidebarOpen(true)}
                    >
                        <span className="material-symbols-outlined">menu</span>
                    </button>

                    <div className="flex items-center gap-4 ml-auto">
                        <button className="relative p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all rounded-sm border-2 border-transparent hover:border-slate-900 dark:hover:border-white">
                            <span className="material-symbols-outlined text-[22px]">notifications</span>
                            <span className="absolute top-1.5 right-1.5 size-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
