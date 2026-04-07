import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { outletsAPI } from '../services/api';

const Register = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        outletName: '',
        outletType: '',
        email: '',
        phone: '',
        city: '',
        country: '',
        password: '',
        confirmPassword: '',
        terms: false
    });

    const handleChange = (e) => {
        const { id, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [id]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validation
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (!formData.terms) {
            setError('Please accept the Terms of Service and Privacy Policy');
            return;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        try {
            const response = await outletsAPI.register({
                name: formData.outletName || `${formData.firstName} ${formData.lastName}'s Outlet`,
                email: formData.email,
                password: formData.password,
                location: `${formData.city}, ${formData.country}`
            });

            if (response.success) {
                // Redirect to login with success message
                navigate('/login', { state: { registered: true } });
            }
        } catch (err) {
            setError(err.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen flex flex-col antialiased font-sans transition-colors duration-300">
            {/* Grid Pattern Background */}
            <div className="fixed inset-0 pointer-events-none z-0 bg-grid-pattern"></div>

            <main className="relative z-10 flex-grow flex items-center justify-center p-4 sm:p-6 lg:p-8">
                <div className="w-full max-w-[520px] bg-surface-light dark:bg-surface-dark rounded-sm shadow-3d border-2 border-slate-900 dark:border-white p-8 sm:p-10 flex flex-col gap-8">
                    <div className="flex flex-col items-center gap-4 text-center">
                        <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary text-white shadow-lg transform rotate-3">
                            <span className="material-symbols-outlined text-3xl">view_in_ar</span>
                        </div>
                        <div className="flex flex-col gap-2">
                            <h1 className="text-3xl font-display font-bold tracking-tight text-slate-900 dark:text-white uppercase">
                                Register Outlet
                            </h1>
                            <p className="text-slate-600 dark:text-slate-400 text-sm">
                                Start your VIRTUALFIT journey - Join 500+ Outlets
                            </p>
                        </div>
                    </div>

                    {error && (
                        <div className="p-4 rounded-sm bg-red-50 dark:bg-red-900/10 border-2 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-medium">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1 flex flex-col gap-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300" htmlFor="firstName">First Name</label>
                                <input
                                    className="w-full rounded-sm border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-primary py-2 px-3 text-sm transition-all duration-200 outline-none"
                                    id="firstName"
                                    placeholder="Jane"
                                    type="text"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="flex-1 flex flex-col gap-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300" htmlFor="lastName">Last Name</label>
                                <input
                                    className="w-full rounded-sm border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-primary py-2 px-3 text-sm transition-all duration-200 outline-none"
                                    id="lastName"
                                    placeholder="Doe"
                                    type="text"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300" htmlFor="outletName">Outlet Name</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 material-symbols-outlined text-[18px]">storefront</span>
                                <input
                                    className="w-full rounded-sm border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-primary py-2 pl-9 pr-3 text-sm transition-all duration-200 outline-none"
                                    id="outletName"
                                    placeholder="e.g. Fashion Forward"
                                    type="text"
                                    value={formData.outletName}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300" htmlFor="email">Work Email</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 material-symbols-outlined text-[18px]">mail</span>
                                <input
                                    className="w-full rounded-sm border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-primary py-2 pl-9 pr-3 text-sm transition-all duration-200 outline-none"
                                    id="email"
                                    placeholder="name@company.com"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1 flex flex-col gap-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300" htmlFor="city">City</label>
                                <input
                                    className="w-full rounded-sm border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-primary py-2 px-3 text-sm transition-all duration-200 outline-none"
                                    id="city"
                                    placeholder="New York"
                                    type="text"
                                    value={formData.city}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="flex-1 flex flex-col gap-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300" htmlFor="country">Country</label>
                                <input
                                    className="w-full rounded-sm border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-primary py-2 px-3 text-sm transition-all duration-200 outline-none"
                                    id="country"
                                    placeholder="USA"
                                    type="text"
                                    value={formData.country}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1 flex flex-col gap-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300" htmlFor="password">Password</label>
                                <input
                                    className="w-full rounded-sm border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-primary py-2 px-3 text-sm transition-all duration-200 outline-none"
                                    id="password"
                                    placeholder="Minimum 6 chars"
                                    type={showPassword ? "text" : "password"}
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    minLength={6}
                                />
                            </div>
                            <div className="flex-1 flex flex-col gap-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300" htmlFor="confirmPassword">Confirm</label>
                                <input
                                    className="w-full rounded-sm border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-primary py-2 px-3 text-sm transition-all duration-200 outline-none"
                                    id="confirmPassword"
                                    placeholder="Re-type password"
                                    type={showPassword ? "text" : "password"}
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex items-start gap-3 mt-2">
                            <div className="flex h-5 items-center">
                                <input
                                    className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
                                    id="terms"
                                    type="checkbox"
                                    checked={formData.terms}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <label className="text-[10px] sm:text-xs font-bold uppercase text-slate-500 leading-tight" htmlFor="terms">
                                I agree to the <a className="text-primary hover:underline" href="#">Terms</a> and <a className="text-primary hover:underline" href="#">Privacy</a>
                            </label>
                        </div>

                        <button
                            className="w-full mt-4 flex justify-center items-center py-3 px-4 rounded-sm bg-primary text-white font-bold text-base uppercase border-2 border-slate-900 dark:border-white shadow-3d hover:shadow-3d-hover hover:translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="material-symbols-outlined animate-spin mr-2 text-[20px]">progress_activity</span>
                                    Registering...
                                </>
                            ) : (
                                'Register Outlet'
                            )}
                        </button>
                    </form>
                    <div className="text-center text-sm">
                        <span className="text-slate-600 dark:text-slate-400 font-medium">Already have an account?</span>
                        <Link className="ml-2 font-bold text-primary hover:underline uppercase" to="/login">Log In</Link>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Register;
