import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { productsAPI, authAPI, gesturesAPI } from '../../services/api';

const DashboardHome = () => {
    const [channel, setChannel] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isLaunching, setIsLaunching] = useState(false);
    const [launchStatus, setLaunchStatus] = useState('');
    const [isScreenActive, setIsScreenActive] = useState(false);

    const outlet = authAPI.getOutlet();

    useEffect(() => {
        const newChannel = new BroadcastChannel('virtual-fit-app');
        newChannel.onmessage = (event) => {
            if (event.data.type === 'SCREEN_CLOSED') {
                setIsScreenActive(false);
                // ALWAYS stop gestures when screen is closed!
                gesturesAPI.stop().catch(err => console.error("Auto-stop failed:", err));
            }
        };
        setChannel(newChannel);

        return () => {
            // If the dashboard itself is closed, we should ideally stop gestures too
            gesturesAPI.stop().catch(() => { });
            newChannel.close();
        };
    }, []);

    // Fetch products on mount
    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const response = await productsAPI.getAll(outlet?.id);
            if (response.success) {
                setProducts(response.data);
            }
        } catch (err) {
            console.error('Failed to load products:', err);
        } finally {
            setLoading(false);
        }
    };

    const openCustomerScreen = async () => {
        if (isScreenActive) {
            try {
                setIsLaunching(true);
                setLaunchStatus('Stopping Virtual Try...');

                const res = await gesturesAPI.stop();
                if (res.success) {
                    setIsScreenActive(false);
                    setLaunchStatus('Virtual Try Stopped.');

                    // Notify the pop-up
                    if (channel) {
                        channel.postMessage({ type: 'CLOSE_SCREEN' });
                    }

                    setTimeout(() => {
                        setIsLaunching(false);
                        setLaunchStatus('');
                    }, 2000);
                }
            } catch (err) {
                console.error('Stop error:', err);
                setIsScreenActive(false);
                setIsLaunching(false);
                setLaunchStatus('');
            }
        } else {
            try {
                setIsLaunching(true);
                setLaunchStatus('Initializing AI Engine...');

                // Start the gesture engine in the backend
                const res = await gesturesAPI.start();

                if (res.success) {
                    setLaunchStatus('Engine Ready! Opening View...');
                    setIsScreenActive(true); // Update UI immediately

                    setTimeout(() => {
                        window.open('/try-on', 'CustomerScreen', 'width=1280,height=720,menubar=no,toolbar=no,location=no');
                        setIsLaunching(false);
                        setLaunchStatus('');
                    }, 1500);
                } else {
                    throw new Error(res.error || 'Failed to start engine');
                }
            } catch (err) {
                console.error('Launch error:', err);
                const errorMessage = err.message || 'Error: Backend not responding.';
                setLaunchStatus(errorMessage);
                // Keep the error visible longer
                setTimeout(() => {
                    setIsLaunching(false);
                    setLaunchStatus('');
                }, 5000);
            }
        }
    };

    const sendToCustomerScreen = (item) => {
        if (channel) {
            channel.postMessage({ type: 'SELECT_ITEM', payload: item });
        }
    };

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div>
                    <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-white uppercase tracking-tight">Overview</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Welcome back{outlet?.name ? `, ${outlet.name}` : ''}! Manage your AI store below.</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <div className="flex gap-4">
                        <Link
                            to="/dashboard/inventory"
                            className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 border-2 border-slate-900 dark:border-white rounded-sm text-slate-900 dark:text-white font-bold uppercase text-xs hover:translate-y-1 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] transition-all"
                        >
                            <span className="material-symbols-outlined text-[20px]">add</span>
                            Add Item
                        </Link>
                        <button
                            onClick={openCustomerScreen}
                            disabled={isLaunching}
                            className={`flex items-center gap-2 px-6 py-3 border-2 border-slate-900 dark:border-white rounded-sm font-bold uppercase text-xs transition-all ${isLaunching
                                ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                                : isScreenActive
                                    ? 'bg-red-500 text-white border-red-600 hover:bg-red-600 shadow-[4px_4px_0px_0px_rgba(153,27,27,1)]'
                                    : 'bg-primary text-white hover:translate-y-1 shadow-3d hover:shadow-3d-hover'
                                }`}
                        >
                            <span className={`material-symbols-outlined text-[20px] ${isLaunching ? 'animate-spin' : ''}`}>
                                {isLaunching ? 'progress_activity' : isScreenActive ? 'stop_circle' : 'smart_display'}
                            </span>
                            {isLaunching ? 'Processing...' : isScreenActive ? 'Stop Virtual Try' : 'Launch Screen'}
                        </button>
                    </div>
                    {launchStatus && (
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${launchStatus.includes('Error') ? 'text-red-500' : 'text-primary'}`}>
                            {launchStatus}
                        </span>
                    )}
                </div>
            </div>

            {/* Remote Control Section */}
            <div className="mb-10 p-8 bg-surface-light dark:bg-surface-dark border-2 border-slate-900 dark:border-white rounded-sm shadow-3d">
                <h3 className="font-display font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2 uppercase tracking-wider">
                    <span className="material-symbols-outlined text-primary">cast</span>
                    Remote Control
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 font-medium">
                    Launch the customer screen on another monitor, then tap products to display them instantly.
                </p>

                {loading ? (
                    <div className="flex items-center gap-2 text-blue-600">
                        <span className="material-symbols-outlined animate-spin">progress_activity</span>
                        Loading products...
                    </div>
                ) : products.length === 0 ? (
                    <div className="text-blue-700">
                        <p className="mb-2">No products registered yet.</p>
                        <Link to="/dashboard/inventory" className="inline-flex items-center gap-1 text-primary font-medium hover:underline">
                            <span className="material-symbols-outlined text-[18px]">add</span>
                            Add your first product
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {products.slice(0, 12).map(product => (
                            <button
                                key={product.id}
                                onClick={() => sendToCustomerScreen({
                                    id: product.id,
                                    name: product.name,
                                    image: product.image_url || `https://via.placeholder.com/150/2D3FE7/FFFFFF?text=${encodeURIComponent(product.name.charAt(0))}`
                                })}
                                className="flex flex-col items-center p-3 bg-white rounded-lg border border-blue-200 hover:border-primary hover:shadow-md transition-all group"
                            >
                                <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center mb-2 overflow-hidden">
                                    {product.image_url ? (
                                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="material-symbols-outlined text-gray-400">checkroom</span>
                                    )}
                                </div>
                                <span className="text-xs font-medium text-heading text-center line-clamp-2 group-hover:text-primary">
                                    {product.name}
                                </span>
                                <span className="text-xs text-body">${product.price.toFixed(2)}</span>
                            </button>
                        ))}
                    </div>
                )}

                {products.length > 12 && (
                    <p className="text-xs text-blue-600 mt-3">
                        Showing 12 of {products.length} products. <Link to="/dashboard/inventory" className="underline">View all in Inventory</Link>
                    </p>
                )}
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
                <MetricCard
                    title="Total Products"
                    value={products.length.toString()}
                    trend="In inventory"
                    trendUp={true}
                    icon="checkroom"
                    color="text-blue-600"
                    bg="bg-blue-50"
                />
                <MetricCard
                    title="Total Scans"
                    value="0"
                    trend="Today"
                    trendUp={true}
                    icon="person_search"
                    color="text-teal-600"
                    bg="bg-teal-50"
                />
                <MetricCard
                    title="Items Tried On"
                    value="0"
                    trend="Today"
                    trendUp={true}
                    icon="accessibility_new"
                    color="text-purple-600"
                    bg="bg-purple-50"
                />
                <MetricCard
                    title="Categories"
                    value={[...new Set(products.map(p => p.category))].length.toString()}
                    trend="Product types"
                    trendUp={true}
                    icon="category"
                    color="text-indigo-600"
                    bg="bg-indigo-50"
                />
            </div>

            {/* Recent Activity / Inventory Snapshot */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Quick Actions */}
                <div className="bg-surface-light dark:bg-surface-dark rounded-sm border-2 border-slate-900 dark:border-white shadow-3d p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="font-display font-bold text-lg text-slate-900 dark:text-white uppercase tracking-wider">Quick Actions</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Link
                            to="/dashboard/inventory"
                            className="flex items-center gap-3 p-4 rounded-sm border-2 border-slate-200 dark:border-slate-700 hover:border-primary dark:hover:border-primary hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-bold group"
                        >
                            <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">inventory_2</span>
                            <div>
                                <p className="text-xs text-slate-900 dark:text-white uppercase tracking-tight">Inventory</p>
                                <p className="text-[10px] text-slate-500 uppercase">{products.length} items</p>
                            </div>
                        </Link>
                        <button
                            onClick={openCustomerScreen}
                            disabled={isLaunching}
                            className={`flex items-center gap-3 p-4 rounded-sm border-2 transition-all text-left font-bold group ${isLaunching
                                ? 'bg-slate-50 border-slate-200 opacity-50 cursor-not-allowed'
                                : isScreenActive
                                    ? 'bg-red-50 border-red-200 hover:border-red-500 text-red-700'
                                    : 'border-slate-200 dark:border-slate-700 hover:border-primary dark:hover:border-primary hover:bg-slate-50 dark:hover:bg-slate-800'
                                }`}
                        >
                            <span className={`material-symbols-outlined group-hover:scale-110 transition-transform ${isScreenActive ? 'text-red-500' : 'text-primary'}`}>
                                {isLaunching ? 'progress_activity' : isScreenActive ? 'stop_circle' : 'cast'}
                            </span>
                            <div>
                                <p className="text-xs text-slate-900 dark:text-white uppercase tracking-tight">
                                    {isScreenActive ? 'Stop Try-On' : 'Try-On'}
                                </p>
                                <p className={`text-[10px] uppercase ${isScreenActive ? 'text-red-500/70' : 'text-slate-500'}`}>
                                    {isLaunching ? 'Processing...' : isScreenActive ? 'Close session' : 'Customer window'}
                                </p>
                            </div>
                        </button>
                        <Link
                            to="/dashboard/analytics"
                            className="flex items-center gap-3 p-4 rounded-sm border-2 border-slate-200 dark:border-slate-700 hover:border-primary dark:hover:border-primary hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-bold group"
                        >
                            <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">analytics</span>
                            <div>
                                <p className="text-xs text-slate-900 dark:text-white uppercase tracking-tight">Analytics</p>
                                <p className="text-[10px] text-slate-500 uppercase">Performance</p>
                            </div>
                        </Link>
                        <Link
                            to="/dashboard/settings"
                            className="flex items-center gap-3 p-4 rounded-sm border-2 border-slate-200 dark:border-slate-700 hover:border-primary dark:hover:border-primary hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-bold group"
                        >
                            <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">settings</span>
                            <div>
                                <p className="text-xs text-slate-900 dark:text-white uppercase tracking-tight">Settings</p>
                                <p className="text-[10px] text-slate-500 uppercase">Configure</p>
                            </div>
                        </Link>
                    </div>
                </div>

                {/* Recent Products */}
                <div className="bg-surface-light dark:bg-surface-dark rounded-sm border-2 border-slate-900 dark:border-white shadow-3d p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="font-display font-bold text-lg text-slate-900 dark:text-white uppercase tracking-wider">Recent Products</h2>
                        <Link to="/dashboard/inventory" className="text-xs font-bold text-primary hover:underline uppercase">View All</Link>
                    </div>
                    {products.length === 0 ? (
                        <div className="text-center py-12">
                            <span className="material-symbols-outlined text-5xl text-slate-200 dark:text-slate-700 mb-4">inventory_2</span>
                            <p className="text-slate-500 font-bold uppercase text-[10px]">No products yet</p>
                            <Link to="/dashboard/inventory" className="text-primary hover:underline text-[10px] font-bold uppercase mt-2 block">Add products</Link>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {products.slice(0, 5).map((product, index) => (
                                <div key={product.id} className="flex items-center justify-between p-3 rounded-sm border-2 border-transparent hover:border-slate-900 dark:hover:border-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group">
                                    <div className="flex items-center gap-4">
                                        <span className="text-xs font-bold text-slate-400 w-4 font-display">0{index + 1}</span>
                                        <div className="w-12 h-12 rounded-sm border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-center overflow-hidden group-hover:rotate-3 transition-transform">
                                            {product.image_url ? (
                                                <img src={product.image_url} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="material-symbols-outlined text-xl text-slate-300">checkroom</span>
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-tight">{product.name}</p>
                                            <p className="text-[10px] font-bold text-slate-500 uppercase">{product.category}</p>
                                        </div>
                                    </div>
                                    <div className="text-sm font-display font-bold text-primary">
                                        ${product.price.toFixed(2)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};


const MetricCard = ({ title, value, trend, icon, color, bg }) => (
    <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-sm border-2 border-slate-900 dark:border-white shadow-3d flex items-start justify-between">
        <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">{title}</p>
            <h3 className="text-3xl font-display font-bold text-slate-900 dark:text-white mb-1">{value}</h3>
            <span className="text-[10px] font-bold text-primary uppercase">
                {trend}
            </span>
        </div>
        <div className={`size-12 rounded-lg border-2 border-slate-900 dark:border-white flex items-center justify-center transform rotate-3 shadow-lg ${bg} ${color}`}>
            <span className="material-symbols-outlined text-2xl">{icon}</span>
        </div>
    </div>
);

export default DashboardHome;
