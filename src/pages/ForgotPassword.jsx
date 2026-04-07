import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../services/api';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [devResetUrl, setDevResetUrl] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setDevResetUrl('');
        setLoading(true);

        try {
            const response = await authAPI.forgotPassword(email);
            setMessage(response.message);
            // For development: show the reset URL
            if (response.dev_reset_url) {
                setDevResetUrl(response.dev_reset_url);
            }
        } catch (err) {
            setError(err.message || 'An error occurred. Please try again.');
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
                        <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-primary text-white shadow-lg transform -rotate-3">
                            <span className="material-symbols-outlined text-[32px]">lock_reset</span>
                        </div>
                        <div className="text-center">
                            <h2 className="text-3xl font-display font-bold tracking-tight text-slate-900 dark:text-white uppercase">Reset Password</h2>
                            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Enter your email to receive recovery instructions</p>
                        </div>
                    </div>

                    {message && (
                        <div className="mb-6 p-4 rounded-sm bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 text-sm font-medium">
                            {message}
                        </div>
                    )}

                    {devResetUrl && (
                        <div className="mb-6 p-4 rounded-sm bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-sm">
                            <p className="font-bold mb-2">🔧 Development Mode - Reset Link:</p>
                            <a
                                href={devResetUrl}
                                className="text-primary underline break-all"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                {devResetUrl}
                            </a>
                        </div>
                    )}

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

                        <button
                            className="inline-flex h-12 w-full items-center justify-center rounded-sm bg-primary px-8 py-2 text-base font-bold text-white border-2 border-slate-900 dark:border-white shadow-3d hover:shadow-3d-hover hover:translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            type="submit"
                            disabled={loading || !!message}
                        >
                            {loading ? (
                                <>
                                    <span className="material-symbols-outlined animate-spin mr-2 text-[20px]">progress_activity</span>
                                    Sending...
                                </>
                            ) : (
                                'Send Reset Link'
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center text-sm">
                        <span className="text-slate-600 dark:text-slate-400 font-medium">Remember your password?</span>
                        <Link className="ml-2 font-bold text-primary hover:underline uppercase" to="/login">
                            Back to Login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
