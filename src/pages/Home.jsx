import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const Home = () => {
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDarkMode]);

    const toggleDarkMode = () => {
        setIsDarkMode(!isDarkMode);
    };

    return (
        <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-sans antialiased overflow-x-hidden transition-colors duration-300">
            {/* Grid Pattern Background */}
            <div className="fixed inset-0 pointer-events-none z-0 bg-grid-pattern"></div>

            {/* Navigation */}
            <nav className="fixed w-full z-50 top-0 border-b border-border-light dark:border-border-dark bg-surface-light/80 dark:bg-surface-dark/80 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white shadow-lg transform rotate-3">
                                <span className="material-symbols-outlined text-xl">view_in_ar</span>
                            </div>
                            <span className="font-display font-bold text-2xl tracking-tight text-primary">VIRTUAL<span className="text-slate-900 dark:text-white">FIT</span></span>
                        </div>
                        <div className="hidden md:flex space-x-8 items-center">
                            <a className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-primary transition-colors" href="#home">Home</a>
                            <a className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-primary transition-colors" href="#features">Features</a>
                            <a className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-primary transition-colors" href="#pricing">Pricing</a>
                            <a className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-primary transition-colors" href="#about">About</a>
                        </div>
                        <div className="flex items-center space-x-4">
                            <Link className="hidden md:block text-sm font-medium text-slate-900 dark:text-white hover:text-primary" to="/login">Log in</Link>
                            <Link
                                className="bg-primary text-white px-5 py-2.5 text-sm font-bold border-2 border-transparent hover:bg-blue-700 dark:hover:bg-blue-600 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] hover:translate-y-0.5 hover:shadow-none rounded-sm"
                                to="/register"
                            >
                                Register Outlet
                            </Link>
                            <button
                                className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                                onClick={toggleDarkMode}
                            >
                                <span className="material-symbols-outlined text-xl">{isDarkMode ? 'brightness_7' : 'brightness_4'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden border-b border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark" id="home">
                <div className="absolute top-20 right-0 w-1/2 h-full opacity-10 dark:opacity-20 pointer-events-none">
                    <div className="w-96 h-96 bg-primary rounded-full blur-3xl absolute top-0 right-20 animate-pulse"></div>
                    <div className="w-72 h-72 bg-purple-500 rounded-full blur-3xl absolute bottom-20 right-60"></div>
                </div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            <div className="inline-flex items-center px-3 py-1 rounded-full border border-primary/30 bg-primary/5 text-primary text-xs font-bold uppercase tracking-wider mb-6">
                                <span className="w-2 h-2 rounded-full bg-primary mr-2 animate-ping"></span>
                                AI-Powered Fitting Room
                            </div>
                            <motion.h1
                                initial={{ opacity: 0, y: 40 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                                className="font-display font-bold text-6xl lg:text-7xl leading-[0.9] text-slate-900 dark:text-white mb-6 tracking-tighter"
                            >
                                VIRTUAL <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600">TRY-ON</span> <br />
                                REVOLUTION
                            </motion.h1>
                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.4 }}
                                className="text-lg text-slate-600 dark:text-slate-400 mb-8 max-w-lg leading-relaxed"
                            >
                                Transform your outlet into a digital experience. Enable customers to try before they buy using our cutting-edge 3D generative AI technology.
                            </motion.p>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.6 }}
                                className="flex flex-col sm:flex-row gap-4"
                            >
                                <Link className="bg-primary text-white px-8 py-4 text-base font-bold border-2 border-slate-900 dark:border-white shadow-3d hover:shadow-3d-hover hover:translate-y-1 transition-all rounded-sm text-center" to="/register">
                                    Register Your Outlet
                                </Link>
                                <a className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-8 py-4 text-base font-bold border-2 border-slate-900 dark:border-slate-600 shadow-3d hover:shadow-3d-hover hover:translate-y-1 transition-all rounded-sm flex items-center justify-center gap-2" href="#">
                                    <span className="material-symbols-outlined">play_circle</span> Watch Demo
                                </a>
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 1, delay: 1 }}
                                className="mt-10 flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400 font-mono"
                            >
                                <div className="flex -space-x-2">
                                    <img alt="User" className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBbcz5g4sLT1DDLrfFsanNBkUVvSHpWFBQs4Eo1jBabVwF_O9ng3HF0ynfEG7CFBgncGUaYwjU7NNFL27LaGpsqyCeVz5SH7Lnr11rR7hgu8xGiBu14S4gj9jJL4ghl51f3g_1_Qr4-jY--5Qr-JAdq7AXQiMMH3Zl4RFiysktVeOEnCxFjz9_feJ3tdBzZ97eKddlp3S79wyDZgSrsD_iAVx_nRe_UHNO33Zu2QALqXfFzRC5-G9ydqHqmsjV3vFpDiwxAi8WEo1bq" />
                                    <img alt="User" className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAfTpHaLxouoLgRXe_17yst7o3-X8KvyPlS7vLdOGweLVEnzHNdRGHbWU3B4Jx4gFVYz1Br00abA7rO9gzOXQq4HtxGF1ZjNv5MUPR1ngYCQPSkY0C0xsGrJV2uCT3CudGVCQGA54hDEzzvhV1ZM-0UhMc_VTI0P9CcdOaWkYZ-dJt6eqX-wah7NkBDMqKLx_l3Gf1r9KWPrwCX0o-wUeAnC1vBnxcAomPjj-DrKJsz-sK_0ikoZHG8N4yguWtODKYBR80mhkA8Ns3m" />
                                    <img alt="User" className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB7_p_E4o9Azn76KaUnwkn-G47zexeFzLM4lkGJOTg7Wdrrsj-qttOUXtIptRlMNuH1KYhZbEbf7GHg3qyVkha4xKcBe9XdPxPG0y67eGG6UYcCxSYFQH05J5NJPU98vQKo-DcbfoVXw5yVU8SPBxeEtb0ptxCJfe8u2PQnzLt5m7adYMyb5eGhXJxpMVvhbC7lFmWJBBrJFNbvd2U4si1NJWWj-xdA6YJFujtbfV3EltHsy7svqHvgro8f-BwVGzh3oLoKA5GFAvMA" />
                                </div>
                                <p>Trusted by 500+ Outlets</p>
                            </motion.div>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 1, delay: 0.5 }}
                            className="relative h-[500px] w-full flex items-center justify-center"
                        >
                            <motion.div
                                animate={{ y: [0, -15, 0], rotate: [-6, -5, -6] }}
                                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute w-80 h-96 bg-slate-900 rounded-2xl transform -rotate-6 translate-x-[-40px] border border-slate-700 shadow-2xl z-10 opacity-80"
                            ></motion.div>
                            <motion.div
                                animate={{ y: [0, 15, 0], rotate: [6, 7, 6] }}
                                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute w-80 h-96 bg-slate-100 dark:bg-slate-800 rounded-2xl transform rotate-6 translate-x-[40px] border border-slate-300 dark:border-slate-600 shadow-2xl z-10 opacity-80"
                            ></motion.div>
                            <motion.div
                                animate={{ y: [0, -10, 0] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                className="relative w-80 h-[420px] bg-white dark:bg-slate-900 rounded-2xl border-2 border-primary shadow-[0_20px_50px_rgba(45,63,231,0.3)] z-20 overflow-hidden"
                            >
                                <div className="h-10 border-b border-border-light dark:border-border-dark flex items-center px-4 justify-between bg-slate-50 dark:bg-slate-800">
                                    <div className="flex gap-1.5">
                                        <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-400"></div>
                                        <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
                                    </div>
                                    <span className="text-[10px] font-mono text-slate-400">virtualfit.com/demo</span>
                                </div>
                                <div className="p-4 flex flex-col items-center h-full">
                                    <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-800 dark:to-slate-700 rounded-lg mb-4 relative overflow-hidden group">
                                        <img alt="Fashion Model" className="w-full h-full object-cover mix-blend-overlay opacity-50" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCEKVERcZIU61paZofoFZTzYUoQXZOK-6EBFOXibt8igBMzrCIc-cRcIXJxHkAB34PWZNbF80xiYThwM3R5b4R_ChnxyRKslH-_iqw7VRoh5vXN9ebqft4WhFACZ68qXnRRRTMANJZwqSo3TMDZZCrwTokC0YCtq8p42crVnfnJMAjXm8V0F84xm_5WI25ZZMgWVvi4boppFqLMk7XmbGqdff6JqUR1CbbHhlZgJ8RHVyZlMXyCy4LPqv-0qvAHf1_s5gQh7MZhEqCM" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="bg-white/90 text-slate-900 text-xs font-bold px-3 py-1 rounded shadow-lg backdrop-blur">Scanning...</span>
                                        </div>
                                        <div className="absolute top-0 left-0 w-full h-1 bg-primary shadow-[0_0_10px_#2D3FE7] animate-scan"></div>
                                    </div>
                                    <div className="w-full space-y-2">
                                        <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded w-3/4"></div>
                                        <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded w-1/2"></div>
                                    </div>
                                    <button className="mt-8 w-full py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded text-xs uppercase tracking-wider shadow-lg">Try On</button>
                                </div>
                            </motion.div>
                        </motion.div>
                    </div>
                </div>
                <div className="absolute left-0 bottom-0 w-8 h-8 border-l border-b border-slate-300 dark:border-slate-700"></div>
                <div className="absolute right-0 top-0 w-8 h-8 border-r border-t border-slate-300 dark:border-slate-700"></div>
            </section>

            <motion.section
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1 }}
                className="border-b border-border-light dark:border-border-dark bg-white dark:bg-slate-900 py-8"
            >
                <div className="max-w-7xl mx-auto px-4 overflow-hidden">
                    <p className="text-center text-xs font-mono text-slate-400 uppercase tracking-widest mb-6">Powering Modern Retailers</p>
                    <div className="flex justify-between items-center opacity-60 grayscale hover:grayscale-0 transition-all duration-500 flex-wrap gap-12">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/a/a6/Logo_NIKE.svg" alt="Nike" className="h-6 w-auto dark:invert" />
                        <img src="https://upload.wikimedia.org/wikipedia/commons/2/20/Adidas_Logo.svg" alt="Adidas" className="h-10 w-auto dark:invert" />
                        <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/H%26M-Logo.svg" alt="H&M" className="h-8 w-auto dark:invert" />
                        <img src="https://upload.wikimedia.org/wikipedia/commons/f/fd/Zara_Logo.svg" alt="Zara" className="h-8 w-auto dark:invert" />
                        <img src="https://upload.wikimedia.org/wikipedia/commons/9/92/UNIQLO_logo.svg" alt="Uniqlo" className="h-8 w-auto" />
                    </div>
                </div>
            </motion.section>

            {/* Workflow Section */}
            <section className="py-24 relative bg-background-light dark:bg-background-dark overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="text-center mb-16"
                    >
                        <h2 className="font-display font-bold text-4xl lg:text-5xl text-slate-900 dark:text-white mb-4 uppercase">Workflow</h2>
                        <div className="w-20 h-1 bg-primary mx-auto"></div>
                    </motion.div>
                    <div className="relative">
                        <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-px bg-slate-300 dark:bg-slate-700 hidden md:block"></div>

                        {/* Step 1 */}
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, delay: 0.1 }}
                            className="flex flex-col md:flex-row items-center justify-between mb-16 md:mb-0 relative group"
                        >
                            <div className="w-full md:w-5/12 order-2 md:order-1">
                                <div className="bg-white dark:bg-slate-800 p-8 border border-border-light dark:border-border-dark shadow-lg relative corner-border text-slate-800 dark:text-slate-200">
                                    <span className="absolute top-4 right-4 text-6xl font-display font-bold text-slate-100 dark:text-slate-700 -z-10 group-hover:text-primary/10 transition-colors">01</span>
                                    <h3 className="text-2xl font-bold mb-3 font-display">Register Outlet</h3>
                                    <p className="text-slate-600 dark:text-slate-400">Create your business profile and define your brand identity. Set up your digital storefront in minutes.</p>
                                </div>
                            </div>
                            <div className="absolute left-1/2 transform -translate-x-1/2 w-8 h-8 bg-primary rounded-full border-4 border-white dark:border-background-dark hidden md:flex items-center justify-center z-10"></div>
                            <div className="w-full md:w-5/12 order-1 md:order-2 px-8 py-4 text-center md:text-left">
                                <div className="w-24 h-24 bg-gradient-to-tr from-blue-100 to-white dark:from-slate-800 dark:to-slate-900 rounded-xl border border-dashed border-slate-300 flex items-center justify-center mx-auto md:mx-0">
                                    <span className="material-symbols-outlined text-4xl text-primary">storefront</span>
                                </div>
                            </div>
                        </motion.div>

                        {/* Step 2 */}
                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="flex flex-col md:flex-row items-center justify-between mb-16 md:mb-0 relative group"
                        >
                            <div className="w-full md:w-5/12 order-2 md:order-2">
                                <div className="bg-white dark:bg-slate-800 p-8 border border-border-light dark:border-border-dark shadow-lg relative corner-border text-slate-800 dark:text-slate-200">
                                    <span className="absolute top-4 right-4 text-6xl font-display font-bold text-slate-100 dark:text-slate-700 -z-10 group-hover:text-primary/10 transition-colors">02</span>
                                    <h3 className="text-2xl font-bold mb-3 font-display">Upload Inventory</h3>
                                    <p className="text-slate-600 dark:text-slate-400">Bulk upload your apparel images. Our AI automatically generates 3D models and sizing data from flat lay photos.</p>
                                </div>
                            </div>
                            <div className="absolute left-1/2 transform -translate-x-1/2 w-8 h-8 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-full hidden md:flex items-center justify-center z-10">
                                <div className="w-3 h-3 bg-primary rounded-full"></div>
                            </div>
                            <div className="w-full md:w-5/12 order-1 md:order-1 px-8 py-4 text-center md:text-right">
                                <div className="w-24 h-24 bg-gradient-to-tr from-blue-100 to-white dark:from-slate-800 dark:to-slate-900 rounded-xl border border-dashed border-slate-300 flex items-center justify-center mx-auto md:ml-auto">
                                    <span className="material-symbols-outlined text-4xl text-primary">cloud_upload</span>
                                </div>
                            </div>
                        </motion.div>

                        {/* Step 3 */}
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, delay: 0.3 }}
                            className="flex flex-col md:flex-row items-center justify-between relative group"
                        >
                            <div className="w-full md:w-5/12 order-2 md:order-1">
                                <div className="bg-white dark:bg-slate-800 p-8 border border-border-light dark:border-border-dark shadow-lg relative corner-border text-slate-800 dark:text-slate-200">
                                    <span className="absolute top-4 right-4 text-6xl font-display font-bold text-slate-100 dark:text-slate-700 -z-10 group-hover:text-primary/10 transition-colors">03</span>
                                    <h3 className="text-2xl font-bold mb-3 font-display">Go Live</h3>
                                    <p className="text-slate-600 dark:text-slate-400">Activate the virtual try-on button on your site. Watch engagement and conversion rates skyrocket.</p>
                                </div>
                            </div>
                            <div className="absolute left-1/2 transform -translate-x-1/2 w-8 h-8 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-full hidden md:flex items-center justify-center z-10">
                                <div className="w-3 h-3 bg-primary rounded-full"></div>
                            </div>
                            <div className="w-full md:w-5/12 order-1 md:order-2 px-8 py-4 text-center md:text-left">
                                <div className="w-24 h-24 bg-gradient-to-tr from-blue-100 to-white dark:from-slate-800 dark:to-slate-900 rounded-xl border border-dashed border-slate-300 flex items-center justify-center mx-auto md:mx-0">
                                    <span className="material-symbols-outlined text-4xl text-primary">rocket_launch</span>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-24 border-y border-border-light dark:border-border-dark bg-white dark:bg-slate-900" id="features">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row justify-between items-end mb-16">
                        <h2 className="font-display font-bold text-4xl lg:text-5xl text-slate-900 dark:text-white max-w-xl">
                            POWERFUL FEATURES FOR MODERN RETAIL
                        </h2>
                        <a className="mt-4 md:mt-0 text-primary font-bold hover:underline flex items-center" href="#">
                            View all capabilities <span className="material-symbols-outlined ml-1 text-sm">arrow_forward</span>
                        </a>
                    </div>
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        variants={{
                            visible: { transition: { staggerChildren: 0.1 } },
                            hidden: {}
                        }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                    >
                        {[
                            { icon: 'view_in_ar', title: 'Real-time Rendering', desc: 'High-fidelity fabric simulation that adapts to user movements instantly.' },
                            { icon: 'straighten', title: 'AI Size Recommendation', desc: 'Reduce returns by 40% with precise body measurements and size matching.' },
                            { icon: 'insights', title: 'Analytics Dashboard', desc: 'Track which items are tried on most and conversion rates per SKU.' },
                            { icon: 'integration_instructions', title: 'Easy Integration', desc: 'Plug-and-play widgets for Shopify, WooCommerce, and custom stacks.' },
                            { icon: 'devices', title: 'Cross-Platform', desc: 'Seamless experience across desktop, mobile web, and native apps.' },
                            { icon: 'shield', title: 'Enterprise Security', desc: 'GDPR compliant data handling and secure cloud infrastructure.' },
                        ].map((feature, idx) => (
                            <motion.div
                                key={idx}
                                variants={{
                                    hidden: { opacity: 0, y: 20 },
                                    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
                                }}
                                className="group bg-background-light dark:bg-background-dark p-8 border border-border-light dark:border-border-dark hover:border-primary dark:hover:border-primary transition-all duration-300 hover:shadow-3d relative"
                            >
                                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-slate-400"></div>
                                <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-slate-400"></div>
                                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors text-primary">
                                    <span className="material-symbols-outlined">{feature.icon}</span>
                                </div>
                                <h3 className="text-xl font-bold mb-3 font-display text-slate-900 dark:text-white">{feature.title}</h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400">{feature.desc}</p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* Pricing Section */}
            <section className="py-24 bg-background-light dark:bg-background-dark relative" id="pricing">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="font-display font-bold text-4xl lg:text-5xl text-slate-900 dark:text-white mb-4">SCALABLE PRICING</h2>
                        <p className="text-slate-500 max-w-2xl mx-auto">Choose the plan that fits your inventory size and traffic needs.</p>
                    </div>
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={{
                            visible: { transition: { staggerChildren: 0.15 } },
                            hidden: {}
                        }}
                        className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start"
                    >
                        {/* Pricing Cards */}
                        <motion.div
                            variants={{
                                hidden: { opacity: 0, y: 30 },
                                visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
                            }}
                            className="bg-white dark:bg-slate-800 p-8 border border-border-light dark:border-border-dark rounded-sm"
                        >
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Starter</h3>
                            <div className="text-4xl font-display font-bold text-slate-900 dark:text-white mb-6">$99<span className="text-lg text-slate-500 font-sans font-normal">/mo</span></div>
                            <ul className="space-y-4 mb-8 text-sm text-slate-600 dark:text-slate-300">
                                <li className="flex items-center"><span className="material-symbols-outlined text-primary text-sm mr-2">check</span> Up to 50 items</li>
                                <li className="flex items-center"><span className="material-symbols-outlined text-primary text-sm mr-2">check</span> Basic Analytics</li>
                                <li className="flex items-center"><span className="material-symbols-outlined text-primary text-sm mr-2">check</span> Email Support</li>
                            </ul>
                            <a className="block w-full py-3 text-center border-2 border-slate-200 dark:border-slate-600 hover:border-primary text-slate-900 dark:text-white font-bold rounded-sm transition-colors" href="#">Get Started</a>
                        </motion.div>
                        <motion.div
                            variants={{
                                hidden: { opacity: 0, scale: 0.95 },
                                visible: { opacity: 1, scale: 1, transition: { duration: 0.6 } }
                            }}
                            className="bg-white dark:bg-slate-800 p-8 border-2 border-primary rounded-sm transform lg:-translate-y-4 shadow-3d relative"
                        >
                            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-primary text-white text-xs font-bold uppercase tracking-wider px-4 py-1 rounded-full">
                                Most Popular
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Growth</h3>
                            <div className="text-4xl font-display font-bold text-slate-900 dark:text-white mb-6">$299<span className="text-lg text-slate-500 font-sans font-normal">/mo</span></div>
                            <ul className="space-y-4 mb-8 text-sm text-slate-600 dark:text-slate-300">
                                <li className="flex items-center"><span className="material-symbols-outlined text-primary text-sm mr-2">check</span> Up to 500 items</li>
                                <li className="flex items-center"><span className="material-symbols-outlined text-primary text-sm mr-2">check</span> Advanced Analytics</li>
                                <li className="flex items-center"><span className="material-symbols-outlined text-primary text-sm mr-2">check</span> Priority Support</li>
                                <li className="flex items-center"><span className="material-symbols-outlined text-primary text-sm mr-2">check</span> Custom Branding</li>
                            </ul>
                            <a className="block w-full py-3 text-center bg-primary text-white font-bold rounded-sm shadow-md hover:bg-blue-700 transition-colors" href="#">Get Started</a>
                        </motion.div>
                        <motion.div
                            variants={{
                                hidden: { opacity: 0, y: 30 },
                                visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
                            }}
                            className="bg-white dark:bg-slate-800 p-8 border border-border-light dark:border-border-dark rounded-sm"
                        >
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Enterprise</h3>
                            <div className="text-4xl font-display font-bold text-slate-900 dark:text-white mb-6">Custom</div>
                            <ul className="space-y-4 mb-8 text-sm text-slate-600 dark:text-slate-300">
                                <li className="flex items-center"><span className="material-symbols-outlined text-primary text-sm mr-2">check</span> Unlimited items</li>
                                <li className="flex items-center"><span className="material-symbols-outlined text-primary text-sm mr-2">check</span> API Access</li>
                                <li className="flex items-center"><span className="material-symbols-outlined text-primary text-sm mr-2">check</span> Dedicated Account Manager</li>
                            </ul>
                            <a className="block w-full py-3 text-center border-2 border-slate-200 dark:border-slate-600 hover:border-primary text-slate-900 dark:text-white font-bold rounded-sm transition-colors" href="#">Contact Sales</a>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="py-24 border-t border-border-light dark:border-border-dark">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.h2
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="font-display font-bold text-4xl mb-12 text-center text-slate-900 dark:text-white"
                    >
                        RETAILER STORIES
                    </motion.h2>
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={{
                            visible: { transition: { staggerChildren: 0.2 } },
                            hidden: {}
                        }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-8"
                    >
                        <motion.div
                            variants={{
                                hidden: { opacity: 0, x: -30 },
                                visible: { opacity: 1, x: 0, transition: { duration: 0.8 } }
                            }}
                            className="p-8 bg-slate-50 dark:bg-slate-800/50 border border-border-light dark:border-border-dark rounded-sm relative"
                        >
                            <span className="material-icons absolute top-8 right-8 text-4xl text-slate-200 dark:text-slate-700">format_quote</span>
                            <p className="text-lg text-slate-700 dark:text-slate-300 italic mb-6">"Since integrating VirtualFit, our return rates dropped by 35% and customers spend twice as long on product pages. It's a game changer."</p>
                            <div className="flex items-center">
                                <img alt="Sarah J" className="w-12 h-12 rounded-full mr-4 border border-slate-300" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBF-Gspv2WfUj4bnrl9pdwgSJmuqY6A9Dc9V1cNmfP5RC-oh0o3UPC0FJyw2S9OemJE8qkTYRgmYtxzJjBelRPBcuy8WV_7dETAV4fGypCjg2OjURMXYdOWf8Q4IpdMoKol-cfUvdkmlpEgqRumRDaNjwxAl44A57Xl4_tx3gQi4KzUYrhuV0NIgOHUZkfTEdp6c3TRPSpFt6Ox_PdAPB2OKR6NwdefEc1tLZqZ_jefPf6UeBfHnKpZFDyEHppEry00Smz16KJoxKcj" />
                                <div>
                                    <h4 className="font-bold text-slate-900 dark:text-white">Sarah Jenkins</h4>
                                    <p className="text-sm text-slate-500">CTO, FashionForward</p>
                                </div>
                            </div>
                        </motion.div>
                        <motion.div
                            variants={{
                                hidden: { opacity: 0, x: 30 },
                                visible: { opacity: 1, x: 0, transition: { duration: 0.8 } }
                            }}
                            className="p-8 bg-slate-50 dark:bg-slate-800/50 border border-border-light dark:border-border-dark rounded-sm relative"
                        >
                            <span className="material-icons absolute top-8 right-8 text-4xl text-slate-200 dark:text-slate-700">format_quote</span>
                            <p className="text-lg text-slate-700 dark:text-slate-300 italic mb-6">"The implementation was surprisingly easy. We were live with 200 SKUs in under a week. The tech support is phenomenal."</p>
                            <div className="flex items-center">
                                <img alt="Mark D" className="w-12 h-12 rounded-full mr-4 border border-slate-300" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD50tRWHZe3EN42h0him44uq8XNIbbUB_dELi31UqMSgT2R_MddKx16KSwZAQb4qLaHhAEBfgWPwWENqWWOq-LVglNPAMc7AMr-HmrtKWOSMFsdadYgb9y_h-JHCbO8G3SEoQ5NJ7h44w9umyRzesQRsFai0fgE5q51O8IkWT5m1DnsRGz364YIXmOKxWoMKA8fbGN3_I8wfnDdWP8WXpf4pg2zCLZO008YfkBXQFendxgAfVdd5HO3HpEEnOF_193_hUjUjnbjI5a0" />
                                <div>
                                    <h4 className="font-bold text-slate-900 dark:text-white">Mark Davis</h4>
                                    <p className="text-sm text-slate-500">Founder, StreetWear Co.</p>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* Final CTA */}
            <motion.section
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="py-20 bg-gradient-to-r from-blue-900 to-slate-900 text-white relative overflow-hidden"
            >
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImEiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTTAgNDBWMHjwIj48L3BhdGg+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2EpIj48L3JlY3Q+PC9zdmc+')] opacity-10"></div>
                <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
                    <h2 className="font-display font-bold text-5xl mb-6">READY TO TRANSFORM YOUR OUTLET?</h2>
                    <p className="text-xl text-blue-100 mb-10">Join the future of retail today. Start your 14-day free trial.</p>
                    <Link className="inline-block bg-primary text-white px-10 py-5 text-lg font-bold border-2 border-white shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] hover:shadow-none hover:translate-y-1 transition-all rounded-sm" to="/register">
                        Get Started Now
                    </Link>
                </div>
            </motion.section>

            {/* Footer */}
            <footer className="bg-background-light dark:bg-background-dark border-t border-border-light dark:border-border-dark pt-16 pb-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
                        <div>
                            <h3 className="font-bold text-slate-900 dark:text-white mb-4">Product</h3>
                            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                                <li><a className="hover:text-primary" href="#">Features</a></li>
                                <li><a className="hover:text-primary" href="#">Pricing</a></li>
                                <li><a className="hover:text-primary" href="#">API</a></li>
                                <li><a className="hover:text-primary" href="#">Showcase</a></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 dark:text-white mb-4">Company</h3>
                            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                                <li><a className="hover:text-primary" href="#">About Us</a></li>
                                <li><a className="hover:text-primary" href="#">Careers</a></li>
                                <li><a className="hover:text-primary" href="#">Blog</a></li>
                                <li><a className="hover:text-primary" href="#">Contact</a></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 dark:text-white mb-4">Resources</h3>
                            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                                <li><a className="hover:text-primary" href="#">Documentation</a></li>
                                <li><a className="hover:text-primary" href="#">Community</a></li>
                                <li><a className="hover:text-primary" href="#">Help Center</a></li>
                                <li><a className="hover:text-primary" href="#">Status</a></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 dark:text-white mb-4">Legal</h3>
                            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                                <li><a className="hover:text-primary" href="#">Privacy Policy</a></li>
                                <li><a className="hover:text-primary" href="#">Terms of Service</a></li>
                                <li><a className="hover:text-primary" href="#">Cookie Policy</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-border-light dark:border-border-dark pt-8 flex flex-col md:flex-row justify-between items-center">
                        <div className="flex items-center gap-2 mb-4 md:mb-0">
                            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-lg transform rotate-3">
                                <span className="material-symbols-outlined text-xl">view_in_ar</span>
                            </div>
                            <span className="font-display font-bold text-lg text-slate-900 dark:text-white">VIRTUALFIT</span>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-500">Â© 2023 VirtualFit Inc. All rights reserved.</p>
                        <div className="flex space-x-4 mt-4 md:mt-0">
                            <a className="text-slate-400 hover:text-primary" href="#"><span className="material-symbols-outlined">facebook</span></a>
                            <a className="text-slate-400 hover:text-primary" href="#"><span className="material-symbols-outlined">flutter_dash</span></a>
                            <a className="text-slate-400 hover:text-primary" href="#"><span className="material-symbols-outlined">videocam</span></a>
                        </div>
                    </div>
                    <div className="mt-16 text-center opacity-5 select-none pointer-events-none">
                        <h1 className="text-[10vw] font-display font-black text-slate-900 dark:text-white leading-none tracking-tighter">FUTURE</h1>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Home;
