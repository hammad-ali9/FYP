import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
    return (
        <div className="bg-background-light text-text-main overflow-x-hidden antialiased font-sans">
            {/* Navigation */}
            <nav className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/90 backdrop-blur-md">
                <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-white">
                            <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>view_in_ar</span>
                        </div>
                        <span className="text-xl font-bold tracking-tight text-text-main">VirtualTryOn</span>
                    </div>
                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center gap-8">
                        <a className="text-sm font-medium text-text-main hover:text-primary transition-colors" href="#">Home</a>
                        <a className="text-sm font-medium text-text-muted hover:text-primary transition-colors" href="#features">Features</a>
                        <a className="text-sm font-medium text-text-muted hover:text-primary transition-colors" href="#pricing">Pricing</a>
                        <a className="text-sm font-medium text-text-muted hover:text-primary transition-colors" href="#about">About</a>
                    </div>
                    {/* Buttons */}
                    <div className="flex items-center gap-4">
                        <Link to="/login" className="hidden sm:flex items-center justify-center rounded-lg border border-gray-300 px-5 py-2 text-sm font-semibold text-text-main hover:bg-gray-50 transition-colors">
                            Log In
                        </Link>
                        <Link to="/register" className="flex items-center justify-center rounded-lg bg-primary px-5 py-2 text-sm font-bold text-white shadow-sm hover:bg-primary-dark transition-colors">
                            Register Outlet
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-16 pb-12 lg:pt-24 lg:pb-20 overflow-hidden">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        {/* Text Content */}
                        <div className="max-w-2xl text-center lg:text-left">
                            <div className="inline-flex items-center rounded-full border border-primary/10 bg-blue-50 px-3 py-1 text-xs font-medium text-primary mb-6">
                                <span className="flex h-2 w-2 rounded-full bg-primary mr-2"></span>
                                New AI Model V2.0 Released
                            </div>
                            <h1 className="text-4xl font-extrabold tracking-tight text-text-main sm:text-5xl lg:text-6xl mb-6 leading-tight">
                                Revolutionize Your Outlet with <span className="text-primary">AI Virtual Try-On</span>
                            </h1>
                            <p className="text-lg text-text-muted mb-8 leading-relaxed">
                                Boost sales and drastically reduce returns by letting customers try before they buy. Join thousands of modern outlets transforming their customer experience today.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12">
                                <Link to="/register" className="flex items-center justify-center rounded-lg bg-primary px-8 py-4 text-base font-bold text-white shadow-lg shadow-blue-500/20 hover:bg-primary-dark transition-all transform hover:-translate-y-0.5">
                                    Register Your Outlet
                                </Link>
                                <button className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-8 py-4 text-base font-bold text-text-main hover:border-gray-300 hover:bg-gray-50 transition-all">
                                    <span className="material-symbols-outlined text-primary">play_circle</span>
                                    Watch Demo
                                </button>
                            </div>
                            {/* Trust Indicators */}
                            <div className="border-t border-gray-100 pt-8">
                                <p className="text-sm font-semibold text-text-muted mb-4 uppercase tracking-wider">Trusted by top retailers</p>
                                <div className="flex flex-wrap justify-center lg:justify-start gap-8 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                                    {/* Logos placeholder using text for simplicity in this exercise, typically SVGs */}
                                    <span className="text-xl font-bold text-slate-800">ZARA</span>
                                    <span className="text-xl font-bold text-slate-800">H&M</span>
                                    <span className="text-xl font-bold text-slate-800">UNIQLO</span>
                                    <span className="text-xl font-bold text-slate-800">ASOS</span>
                                </div>
                            </div>
                        </div>
                        {/* Hero Image */}
                        <div className="relative mx-auto w-full max-w-[600px] lg:max-w-none">
                            <div className="relative aspect-[4/3] rounded-2xl bg-gray-100 overflow-hidden shadow-2xl ring-1 ring-gray-900/10">
                                <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCVO7sMuhbC1tHkkMxDIZtS8Tpv7zKmQzDQ_UdBUYZJ0MegvRkugAOlNqoe8LKwGAs8JHjQ8LzO_SmKym6Y7_fNER2jZajrT6oNw84WOvIQCPfBrXZxBrSZev--tJ0CefL94y8sp9II4tIpIVEL972Y1JwRDVhHzUjkK5S3W8OlxuxBhljFMSZyV7GDcaJhGa6oMSSjlbkATM6Joo9B4Fi95vOfHIkIiiHXizM-69Mk1Oeb5dfzg_MO4djVv4e-6i9vkj4BJcjoNQCt')" }} data-alt="Woman shopping for clothes in a modern bright store"></div>
                                {/* Overlay UI Mockup */}
                                <div className="absolute bottom-4 right-4 left-4 sm:bottom-8 sm:right-8 sm:left-auto sm:w-64 rounded-xl bg-white p-4 shadow-lg backdrop-blur-sm bg-white/95 ring-1 ring-black/5">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="size-10 rounded-lg bg-blue-100 flex items-center justify-center text-primary">
                                            <span className="material-symbols-outlined">magic_button</span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">Virtual Fit</p>
                                            <p className="text-xs text-green-600 font-medium">98% Match Confidence</p>
                                        </div>
                                    </div>
                                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-primary w-[98%]"></div>
                                    </div>
                                </div>
                            </div>
                            {/* Decorative background blob */}
                            <div className="absolute -top-12 -right-12 -z-10 size-72 rounded-full bg-blue-100 blur-3xl opacity-50"></div>
                            <div className="absolute -bottom-12 -left-12 -z-10 size-72 rounded-full bg-indigo-100 blur-3xl opacity-50"></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="py-20 bg-gradient-subtle">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl font-bold text-text-main mb-4">How It Works</h2>
                        <p className="text-text-muted text-lg">Go from physical stock to virtual try-on in three simple steps.</p>
                    </div>
                    <div className="relative grid md:grid-cols-3 gap-8 lg:gap-12">
                        {/* Connecting Line (Desktop) */}
                        <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 border-t-2 border-dashed border-gray-200 z-0"></div>
                        {/* Step 1 */}
                        <div className="relative z-10 flex flex-col items-center text-center">
                            <div className="flex size-24 items-center justify-center rounded-2xl bg-white border border-gray-100 shadow-lg mb-6 group hover:border-primary/50 transition-colors">
                                <span className="material-symbols-outlined text-4xl text-primary group-hover:scale-110 transition-transform">storefront</span>
                            </div>
                            <h3 className="text-xl font-bold text-text-main mb-2">1. Register Outlet</h3>
                            <p className="text-text-muted leading-relaxed">Create your business account and verify your store details in minutes.</p>
                        </div>
                        {/* Step 2 */}
                        <div className="relative z-10 flex flex-col items-center text-center">
                            <div className="flex size-24 items-center justify-center rounded-2xl bg-white border border-gray-100 shadow-lg mb-6 group hover:border-primary/50 transition-colors">
                                <span className="material-symbols-outlined text-4xl text-primary group-hover:scale-110 transition-transform">cloud_upload</span>
                            </div>
                            <h3 className="text-xl font-bold text-text-main mb-2">2. Upload Catalog</h3>
                            <p className="text-text-muted leading-relaxed">Sync your inventory photos. Our AI automatically generates 3D models.</p>
                        </div>
                        {/* Step 3 */}
                        <div className="relative z-10 flex flex-col items-center text-center">
                            <div className="flex size-24 items-center justify-center rounded-2xl bg-white border border-gray-100 shadow-lg mb-6 group hover:border-primary/50 transition-colors">
                                <span className="material-symbols-outlined text-4xl text-primary group-hover:scale-110 transition-transform">rocket_launch</span>
                            </div>
                            <h3 className="text-xl font-bold text-text-main mb-2">3. Go Live</h3>
                            <p className="text-text-muted leading-relaxed">Enable the try-on button on your site and watch conversions soar.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="py-20 bg-white" id="features">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <span className="text-primary font-bold tracking-wide uppercase text-sm">Features</span>
                        <h2 className="text-3xl md:text-4xl font-bold text-text-main mt-2 mb-4">Everything you need to sell smarter</h2>
                        <p className="text-text-muted text-lg">Powerful tools designed for modern fashion retailers.</p>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* Feature 1 */}
                        <div className="group p-8 rounded-2xl bg-white border border-gray-100 hover:border-primary/20 hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300">
                            <div className="size-12 rounded-lg bg-blue-50 flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                                <span className="material-symbols-outlined">3d_rotation</span>
                            </div>
                            <h3 className="text-xl font-bold text-text-main mb-3">Real-time Rendering</h3>
                            <p className="text-text-muted">High-fidelity 3D rendering that adapts to user movement instantly for a realistic look.</p>
                        </div>
                        {/* Feature 2 */}
                        <div className="group p-8 rounded-2xl bg-white border border-gray-100 hover:border-primary/20 hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300">
                            <div className="size-12 rounded-lg bg-blue-50 flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                                <span className="material-symbols-outlined">straighten</span>
                            </div>
                            <h3 className="text-xl font-bold text-text-main mb-3">Size Recommendation</h3>
                            <p className="text-text-muted">AI analyzes body measurements to suggest the perfect size, reducing return rates.</p>
                        </div>
                        {/* Feature 3 */}
                        <div className="group p-8 rounded-2xl bg-white border border-gray-100 hover:border-primary/20 hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300">
                            <div className="size-12 rounded-lg bg-blue-50 flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                                <span className="material-symbols-outlined">integration_instructions</span>
                            </div>
                            <h3 className="text-xl font-bold text-text-main mb-3">Easy Integration</h3>
                            <p className="text-text-muted">Drop-in code snippet works with Shopify, WooCommerce, and custom tech stacks.</p>
                        </div>
                        {/* Feature 4 */}
                        <div className="group p-8 rounded-2xl bg-white border border-gray-100 hover:border-primary/20 hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300">
                            <div className="size-12 rounded-lg bg-blue-50 flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                                <span className="material-symbols-outlined">smartphone</span>
                            </div>
                            <h3 className="text-xl font-bold text-text-main mb-3">Mobile Optimized</h3>
                            <p className="text-text-muted">Designed first for mobile browsers to capture sales from social media traffic.</p>
                        </div>
                        {/* Feature 5 */}
                        <div className="group p-8 rounded-2xl bg-white border border-gray-100 hover:border-primary/20 hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300">
                            <div className="size-12 rounded-lg bg-blue-50 flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                                <span className="material-symbols-outlined">monitoring</span>
                            </div>
                            <h3 className="text-xl font-bold text-text-main mb-3">Analytics Dashboard</h3>
                            <p className="text-text-muted">Track which items are tried on most and identify trends before they happen.</p>
                        </div>
                        {/* Feature 6 */}
                        <div className="group p-8 rounded-2xl bg-white border border-gray-100 hover:border-primary/20 hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300">
                            <div className="size-12 rounded-lg bg-blue-50 flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                                <span className="material-symbols-outlined">verified_user</span>
                            </div>
                            <h3 className="text-xl font-bold text-text-main mb-3">Secure & Private</h3>
                            <p className="text-text-muted">Customer photos are processed locally on device or instantly deleted after session.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section className="py-20 bg-gray-50" id="pricing">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl font-bold text-text-main mb-4">Simple, Transparent Pricing</h2>
                        <p className="text-text-muted text-lg">Choose the plan that fits your outlet's size.</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8 items-center">
                        {/* Starter Tier */}
                        <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                            <h3 className="text-lg font-bold text-text-main mb-2">Starter</h3>
                            <p className="text-text-muted text-sm mb-6">Perfect for small boutiques.</p>
                            <div className="mb-6">
                                <span className="text-4xl font-extrabold text-text-main">$99</span>
                                <span className="text-text-muted">/mo</span>
                            </div>
                            <button className="w-full py-3 px-4 rounded-lg border border-primary text-primary font-bold hover:bg-blue-50 transition-colors mb-8">Get Started</button>
                            <ul className="space-y-4">
                                <li className="flex items-center gap-3 text-sm text-text-main">
                                    <span className="material-symbols-outlined text-green-500 text-xl">check</span>
                                    Up to 50 Products
                                </li>
                                <li className="flex items-center gap-3 text-sm text-text-main">
                                    <span className="material-symbols-outlined text-green-500 text-xl">check</span>
                                    Basic Analytics
                                </li>
                                <li className="flex items-center gap-3 text-sm text-text-main">
                                    <span className="material-symbols-outlined text-green-500 text-xl">check</span>
                                    Email Support
                                </li>
                            </ul>
                        </div>
                        {/* Professional Tier (Highlighted) */}
                        <div className="relative bg-white rounded-2xl p-8 border-2 border-primary shadow-xl scale-105 z-10">
                            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                                Most Popular
                            </div>
                            <h3 class="text-lg font-bold text-text-main mb-2">Professional</h3>
                            <p className="text-text-muted text-sm mb-6">For growing outlets.</p>
                            <div className="mb-6">
                                <span className="text-4xl font-extrabold text-text-main">$249</span>
                                <span className="text-text-muted">/mo</span>
                            </div>
                            <button className="w-full py-3 px-4 rounded-lg bg-primary text-white font-bold hover:bg-primary-dark transition-colors mb-8">Get Started</button>
                            <ul className="space-y-4">
                                <li className="flex items-center gap-3 text-sm text-text-main">
                                    <span className="material-symbols-outlined text-green-500 text-xl">check</span>
                                    Up to 500 Products
                                </li>
                                <li className="flex items-center gap-3 text-sm text-text-main">
                                    <span className="material-symbols-outlined text-green-500 text-xl">check</span>
                                    Advanced Analytics
                                </li>
                                <li className="flex items-center gap-3 text-sm text-text-main">
                                    <span className="material-symbols-outlined text-green-500 text-xl">check</span>
                                    Priority 24/7 Support
                                </li>
                                <li className="flex items-center gap-3 text-sm text-text-main">
                                    <span className="material-symbols-outlined text-green-500 text-xl">check</span>
                                    Custom Branding
                                </li>
                            </ul>
                        </div>
                        {/* Enterprise Tier */}
                        <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                            <h3 className="text-lg font-bold text-text-main mb-2">Enterprise</h3>
                            <p className="text-text-muted text-sm mb-6">For large retail chains.</p>
                            <div className="mb-6">
                                <span className="text-4xl font-extrabold text-text-main">Custom</span>
                            </div>
                            <button className="w-full py-3 px-4 rounded-lg border border-primary text-primary font-bold hover:bg-blue-50 transition-colors mb-8">Contact Sales</button>
                            <ul className="space-y-4">
                                <li className="flex items-center gap-3 text-sm text-text-main">
                                    <span className="material-symbols-outlined text-green-500 text-xl">check</span>
                                    Unlimited Products
                                </li>
                                <li className="flex items-center gap-3 text-sm text-text-main">
                                    <span className="material-symbols-outlined text-green-500 text-xl">check</span>
                                    Dedicated Account Manager
                                </li>
                                <li className="flex items-center gap-3 text-sm text-text-main">
                                    <span className="material-symbols-outlined text-green-500 text-xl">check</span>
                                    API Access
                                </li>
                                <li className="flex items-center gap-3 text-sm text-text-main">
                                    <span className="material-symbols-outlined text-green-500 text-xl">check</span>
                                    On-premise Deployment
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="py-20 bg-white">
                <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <span className="material-symbols-outlined text-5xl text-primary/20 mb-4">format_quote</span>
                        <h3 className="text-2xl md:text-3xl font-bold text-text-main leading-relaxed">
                            "Since integrating VirtualTryOn, our online returns have dropped by 30% and customer engagement time has doubled. It's the most impactful tool we've added this year."
                        </h3>
                    </div>
                    <div className="flex items-center justify-center gap-4">
                        <div className="size-12 rounded-full overflow-hidden bg-gray-200">
                            <img alt="Portrait of Jane Doe" className="size-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDaUdYoPIjXQ8gGADhLueaBYHgjV40lXjxltIvlHfgdX0I4kvfylziJv97GasjOixQTczBKehHoGcVx4Wb4kscbvN8zgsfez1Ukrw_15s1ySqcAbkkKW4BCtvVVr0mpLtyvxF2K4W1RgT6BUwxap6pvvDiai_QMV7QimHY_WZ_N7-rbR-PlKrRZYrUYOkWruBCywF6HOFU2g6GBFj9ED5UGfc-24uUPiI30YjX2xF1Ze6sZo07g5z6KiSc3xeH1KFzgV_yZ1P8nuqnS" />
                        </div>
                        <div className="text-left">
                            <p className="font-bold text-text-main">Jane Doe</p>
                            <p className="text-sm text-text-muted">Owner, Urban Style Outlet</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-24 bg-gradient-blue relative overflow-hidden">
                {/* Abstract decorative shapes */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10">
                    <div className="absolute -top-[50%] -left-[10%] w-[50%] h-[150%] bg-white rounded-full mix-blend-overlay blur-3xl"></div>
                    <div className="absolute -bottom-[50%] -right-[10%] w-[50%] h-[150%] bg-white rounded-full mix-blend-overlay blur-3xl"></div>
                </div>
                <div className="relative mx-auto max-w-4xl px-4 text-center z-10">
                    <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-6">Ready to transform your customer experience?</h2>
                    <p className="text-blue-100 text-lg md:text-xl mb-10 max-w-2xl mx-auto">
                        Join the future of retail. Start your free 14-day trial today. No credit card required.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link to="/register" className="bg-white text-primary font-bold py-4 px-8 rounded-lg shadow-xl hover:bg-gray-50 transition-colors">
                            Get Started Free
                        </Link>
                        <button className="bg-primary-dark/30 backdrop-blur-sm border border-white/30 text-white font-bold py-4 px-8 rounded-lg hover:bg-primary-dark/50 transition-colors">
                            Schedule Demo
                        </button>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-background-dark text-white pt-16 pb-8">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
                        <div className="col-span-2 lg:col-span-2">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="material-symbols-outlined text-primary">view_in_ar</span>
                                <span className="text-xl font-bold">VirtualTryOn</span>
                            </div>
                            <p className="text-gray-400 max-w-sm mb-6">
                                Empowering outlets with cutting-edge AI technology to create immersive shopping experiences that convert.
                            </p>
                            <div className="flex gap-4">
                                <a className="text-gray-400 hover:text-white" href="#"><span className="sr-only">Twitter</span><svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path></svg></a>
                                <a className="text-gray-400 hover:text-white" href="#"><span className="sr-only">LinkedIn</span><svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"></path></svg></a>
                            </div>
                        </div>
                        <div>
                            <h4 className="font-bold mb-4 text-white">Product</h4>
                            <ul className="space-y-2 text-sm text-gray-400">
                                <li><a className="hover:text-primary" href="#">Features</a></li>
                                <li><a className="hover:text-primary" href="#">Integrations</a></li>
                                <li><a className="hover:text-primary" href="#">Pricing</a></li>
                                <li><a className="hover:text-primary" href="#">Showcase</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold mb-4 text-white">Company</h4>
                            <ul className="space-y-2 text-sm text-gray-400">
                                <li><a className="hover:text-primary" href="#">About Us</a></li>
                                <li><a className="hover:text-primary" href="#">Careers</a></li>
                                <li><a className="hover:text-primary" href="#">Blog</a></li>
                                <li><a className="hover:text-primary" href="#">Contact</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold mb-4 text-white">Legal</h4>
                            <ul className="space-y-2 text-sm text-gray-400">
                                <li><a className="hover:text-primary" href="#">Privacy Policy</a></li>
                                <li><a className="hover:text-primary" href="#">Terms of Service</a></li>
                                <li><a className="hover:text-primary" href="#">Cookie Policy</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
                        <p>© 2024 VirtualTryOn Inc. All rights reserved.</p>
                        <div className="mt-4 md:mt-0">
                            <p>Designed for Modern Retail</p>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Home;
