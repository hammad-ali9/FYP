import React, { useState, useEffect } from 'react';
import { productsAPI, authAPI } from '../../services/api';

const Analytics = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPeriod, setSelectedPeriod] = useState('7');

    const outlet = authAPI.getOutlet();

    useEffect(() => {
        fetchProducts();
    }, [selectedPeriod]);

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

    // Calculate category stats
    const getCategoryStats = () => {
        const categories = {};
        products.forEach(p => {
            categories[p.category] = (categories[p.category] || 0) + 1;
        });
        return Object.entries(categories).map(([name, count]) => ({
            name,
            count,
            percentage: Math.round((count / products.length) * 100)
        })).sort((a, b) => b.count - a.count);
    };

    // Calculate stock status stats
    const getStockStats = () => {
        const stats = { in_stock: 0, low_stock: 0, out_of_stock: 0 };
        products.forEach(p => {
            stats[p.stock_status] = (stats[p.stock_status] || 0) + 1;
        });
        return stats;
    };

    // Calculate total inventory value
    const getTotalValue = () => {
        return products.reduce((sum, p) => sum + parseFloat(p.price), 0);
    };

    const categoryStats = getCategoryStats();
    const stockStats = getStockStats();
    const categoryColors = ['bg-primary', 'bg-teal-400', 'bg-purple-400', 'bg-orange-400', 'bg-pink-400', 'bg-blue-300'];

    return (
        <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-white uppercase tracking-tight">Analytics</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium italic">Deep dive into your outlet's inventory performance.</p>
                </div>
                <div className="flex items-center bg-white dark:bg-slate-800 border-2 border-slate-900 dark:border-white rounded-sm p-1 shadow-3d-small">
                    <button
                        onClick={() => setSelectedPeriod('7')}
                        className={`px-4 py-1.5 text-xs font-bold uppercase rounded-sm transition-all ${selectedPeriod === '7' ? 'bg-primary text-white' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
                    >
                        7 Days
                    </button>
                    <button
                        onClick={() => setSelectedPeriod('30')}
                        className={`px-4 py-1.5 text-xs font-bold uppercase rounded-sm transition-all ${selectedPeriod === '30' ? 'bg-primary text-white' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
                    >
                        30 Days
                    </button>
                    <button
                        onClick={() => setSelectedPeriod('90')}
                        className={`px-4 py-1.5 text-xs font-bold uppercase rounded-sm transition-all ${selectedPeriod === '90' ? 'bg-primary text-white' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
                    >
                        90 Days
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-sm border-2 border-slate-900 dark:border-white shadow-3d flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Products</p>
                        <p className="text-2xl font-display font-bold text-slate-900 dark:text-white">{products.length}</p>
                    </div>
                    <div className="size-10 rounded-lg bg-blue-500 border-2 border-slate-900 dark:border-white text-white flex items-center justify-center transform rotate-3 shadow-lg">
                        <span className="material-symbols-outlined">checkroom</span>
                    </div>
                </div>
                <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-sm border-2 border-slate-900 dark:border-white shadow-3d flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Categories</p>
                        <p className="text-2xl font-display font-bold text-slate-900 dark:text-white">{categoryStats.length}</p>
                    </div>
                    <div className="size-10 rounded-lg bg-purple-500 border-2 border-slate-900 dark:border-white text-white flex items-center justify-center transform -rotate-3 shadow-lg">
                        <span className="material-symbols-outlined">category</span>
                    </div>
                </div>
                <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-sm border-2 border-slate-900 dark:border-white shadow-3d flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Value</p>
                        <p className="text-2xl font-display font-bold text-slate-900 dark:text-white">${getTotalValue().toFixed(2)}</p>
                    </div>
                    <div className="size-10 rounded-lg bg-green-500 border-2 border-slate-900 dark:border-white text-white flex items-center justify-center transform rotate-6 shadow-lg">
                        <span className="material-symbols-outlined">payments</span>
                    </div>
                </div>
                <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-sm border-2 border-slate-900 dark:border-white shadow-3d flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">In Stock</p>
                        <p className="text-2xl font-display font-bold text-slate-900 dark:text-white">{stockStats.in_stock}</p>
                    </div>
                    <div className="size-10 rounded-lg bg-teal-500 border-2 border-slate-900 dark:border-white text-white flex items-center justify-center transform -rotate-6 shadow-lg">
                        <span className="material-symbols-outlined">inventory_2</span>
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6 mb-8">
                {/* Stock Status Chart */}
                <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-sm border-2 border-slate-900 dark:border-white shadow-3d">
                    <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white uppercase tracking-tight mb-6">Stock Status Overview</h3>
                    {loading ? (
                        <div className="h-64 flex items-center justify-center">
                            <span className="material-symbols-outlined animate-spin text-4xl text-gray-300">progress_activity</span>
                        </div>
                    ) : products.length === 0 ? (
                        <div className="h-64 flex items-center justify-center text-body">
                            <div className="text-center">
                                <span className="material-symbols-outlined text-4xl text-gray-300">inventory_2</span>
                                <p className="mt-2">No products to analyze</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-body">In Stock</span>
                                    <span className="font-medium text-green-600">{stockStats.in_stock} items</span>
                                </div>
                                <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-green-500 rounded-full transition-all duration-500"
                                        style={{ width: `${products.length > 0 ? (stockStats.in_stock / products.length * 100) : 0}%` }}
                                    ></div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-body">Low Stock</span>
                                    <span className="font-medium text-orange-600">{stockStats.low_stock} items</span>
                                </div>
                                <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-orange-500 rounded-full transition-all duration-500"
                                        style={{ width: `${products.length > 0 ? (stockStats.low_stock / products.length * 100) : 0}%` }}
                                    ></div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-body">Out of Stock</span>
                                    <span className="font-medium text-red-600">{stockStats.out_of_stock} items</span>
                                </div>
                                <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-red-500 rounded-full transition-all duration-500"
                                        style={{ width: `${products.length > 0 ? (stockStats.out_of_stock / products.length * 100) : 0}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Categories Chart */}
                <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-sm border-2 border-slate-900 dark:border-white shadow-3d">
                    <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white uppercase tracking-tight mb-6">Products by Category</h3>
                    {loading ? (
                        <div className="h-64 flex items-center justify-center">
                            <span className="material-symbols-outlined animate-spin text-4xl text-gray-300">progress_activity</span>
                        </div>
                    ) : categoryStats.length === 0 ? (
                        <div className="h-64 flex items-center justify-center text-body">
                            <div className="text-center">
                                <span className="material-symbols-outlined text-4xl text-gray-300">category</span>
                                <p className="mt-2">No categories yet</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center justify-center h-48">
                                <div className="relative size-40 rounded-full bg-gray-100 flex items-center justify-center">
                                    <div className="text-center">
                                        <span className="block text-3xl font-bold text-heading">{products.length}</span>
                                        <span className="text-xs text-body uppercase tracking-wide">Total Items</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-wrap justify-center gap-4 mt-4">
                                {categoryStats.slice(0, 5).map((cat, i) => (
                                    <div key={cat.name} className="flex items-center gap-2">
                                        <span className={`size-3 rounded-full ${categoryColors[i] || 'bg-gray-400'}`}></span>
                                        <span className="text-sm text-body">{cat.name} ({cat.percentage}%)</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Products Table */}
            <div className="bg-surface-light dark:bg-surface-dark rounded-sm border-2 border-slate-900 dark:border-white shadow-3d overflow-hidden">
                <div className="px-6 py-4 border-b-2 border-slate-900 dark:border-white bg-slate-50 dark:bg-slate-800 flex items-center justify-between">
                    <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white uppercase tracking-tight">Product Inventory</h3>
                    <button onClick={fetchProducts} className="text-xs font-bold uppercase text-primary hover:underline flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">refresh</span>
                        Refresh
                    </button>
                </div>
                {loading ? (
                    <div className="p-12 text-center">
                        <span className="material-symbols-outlined animate-spin text-4xl text-gray-300">progress_activity</span>
                    </div>
                ) : products.length === 0 ? (
                    <div className="p-12 text-center text-body">
                        <span className="material-symbols-outlined text-4xl text-gray-300">inventory_2</span>
                        <p className="mt-2">No products in inventory</p>
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-page border-b border-border-gray text-xs uppercase tracking-wider text-body font-semibold">
                                <th className="px-6 py-3">Product</th>
                                <th className="px-6 py-3">Category</th>
                                <th className="px-6 py-3">Price</th>
                                <th className="px-6 py-3">Stock Status</th>
                                <th className="px-6 py-3">Type</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-gray">
                            {products.map(product => (
                                <tr key={product.id} className="hover:bg-page/50">
                                    <td className="px-6 py-3 font-medium text-heading">{product.name}</td>
                                    <td className="px-6 py-3 text-body">{product.category}</td>
                                    <td className="px-6 py-3 text-heading">${product.price.toFixed(2)}</td>
                                    <td className="px-6 py-3">
                                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${product.stock_status === 'in_stock' ? 'bg-green-50 text-green-600' :
                                            product.stock_status === 'low_stock' ? 'bg-orange-50 text-orange-600' :
                                                'bg-red-50 text-red-600'
                                            }`}>
                                            {product.stock_status === 'in_stock' ? 'In Stock' :
                                                product.stock_status === 'low_stock' ? 'Low Stock' : 'Out of Stock'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 text-body capitalize">{product.clothing_type}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default Analytics;
