import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

const Login = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await authAPI.login(email, password);
            if (response.success) {
                navigate('/dashboard');
            }
        } catch (err) {
            setError(err.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen flex flex-col antialiased font-sans transition-colors duration-300">
            {/* Grid Pattern Background */}
            <div className="fixed inset-0 pointer-events-none z-0 bg-grid-pattern"></div>

            <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-6 sm:p-12">
                <div className="relative z-10 w-full max-w-[480px] rounded-sm bg-surface-light dark:bg-surface-dark p-8 shadow-3d border-2 border-slate-900 dark:border-white sm:p-10">
                    <div className="mb-8 flex flex-col items-center justify-center">
                        <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-primary text-white shadow-lg transform rotate-3">
                            <span className="material-symbols-outlined text-[32px]">view_in_ar</span>
                        </div>
                        <div className="text-center">
                            <h2 className="text-3xl font-display font-bold tracking-tight text-slate-900 dark:text-white uppercase">Welcome Back</h2>
                            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Login to your VIRTUALFIT dashboard</p>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 rounded-sm bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-medium">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300" htmlFor="email">
                                Email Address
                            </label>
                            <div className="relative">
                                <input
                                    className="flex h-12 w-full rounded-sm border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-primary transition-all duration-200"
                                    id="email"
                                    placeholder="name@outlet.com"
                                    required
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                                <div className="absolute right-3 top-3 text-slate-400 pointer-events-none">
                                    <span className="material-symbols-outlined text-[20px]">mail</span>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300" htmlFor="password">
                                    Password
                                </label>
                            </div>
                            <div className="relative">
                                <input
                                    className="flex h-12 w-full rounded-sm border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-primary transition-all duration-200"
                                    id="password"
                                    placeholder="Enter your password"
                                    required
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button
                                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    <span className="material-symbols-outlined text-[20px]">
                                        {showPassword ? 'visibility_off' : 'visibility'}
                                    </span>
                                </button>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <input className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary" id="remember" type="checkbox" />
                                <label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400" htmlFor="remember">
                                    Remember me
                                </label>
                            </div>
                            <Link className="text-xs font-bold text-primary hover:underline uppercase" to="/forgot-password">
                                Forgot password?
                            </Link>
                        </div>
                        <button
                            className="inline-flex h-12 w-full items-center justify-center rounded-sm bg-primary px-8 py-2 text-base font-bold text-white border-2 border-slate-900 dark:border-white shadow-3d hover:shadow-3d-hover hover:translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="material-symbols-outlined animate-spin mr-2 text-[20px]">progress_activity</span>
                                    Logging in...
                                </>
                            ) : (
                                'Log In'
                            )}
                        </button>
                    </form>

                    {/* Demo credentials hint */}
                    <div className="mt-6 p-4 rounded-sm bg-blue-50 dark:bg-primary/10 border-2 border-blue-200 dark:border-primary/30 text-blue-700 dark:text-blue-300 text-xs">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="material-symbols-outlined text-sm">info</span>
                            <strong className="uppercase">Demo Credentials</strong>
                        </div>
                        test@store.com / password123
                    </div>

                    <div className="mt-8 text-center text-sm">
                        <span className="text-slate-600 dark:text-slate-400 font-medium">Don't have an account?</span>
                        <Link className="ml-2 font-bold text-primary hover:underline uppercase" to="/register">
                            Register outlet
                        </Link>
                    </div>
                </div>
                <div className="mt-8 flex gap-6 text-xs font-bold uppercase tracking-widest text-slate-500">
                    <a className="hover:text-primary transition-colors" href="#">Privacy</a>
                    <a className="hover:text-primary transition-colors" href="#">Terms</a>
                    <a className="hover:text-primary transition-colors" href="#">Help</a>
                </div>
            </div>
        </div>
    );
};

export default Login;
