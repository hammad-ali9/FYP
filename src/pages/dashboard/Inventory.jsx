import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { productsAPI, authAPI, subscriptionsAPI } from '../../services/api';

const Inventory = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [previewImage, setPreviewImage] = useState(null); // { src, alt, allImages }
    const [saving, setSaving] = useState(false);
    const [productLimit, setProductLimit] = useState({ limit: null, current: 0, plan: 'trial' });

    const outlet = authAPI.getOutlet();
    const navigate = useNavigate();

    // Search & Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('All');

    // Derived state
    const defaultCategories = ['T-Shirts', 'Shirts', 'Pants', 'Jeans', 'Dresses', 'Outerwear'];
    // Combine defaults with any custom categories found in products
    const availableCategories = Array.from(new Set([
        ...defaultCategories,
        ...products.map(p => p.category).filter(Boolean)
    ])).sort();

    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.category.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = filterCategory === 'All' || product.category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        category: 'T-Shirts',
        price: '',
        stock_status: 'in_stock',
        clothing_type: 'upper',
        stock_status: 'in_stock',
        clothing_type: 'upper',
        image_url: '',
        additional_images_text: '' // For form input (one per line)
    });

    // Fetch products on mount
    useEffect(() => {
        fetchProducts();
        fetchProductLimit();
    }, []);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const response = await productsAPI.getAll(outlet?.id);
            if (response.success) {
                setProducts(response.data);
            }
        } catch (err) {
            setError('Failed to load products');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchProductLimit = async () => {
        try {
            const response = await subscriptionsAPI.checkProductLimit(outlet?.id);
            if (response.success) {
                setProductLimit({
                    limit: response.data.limit,
                    current: response.data.current_count,
                    canAdd: response.data.can_add,
                    remaining: response.data.remaining,
                    plan: response.data.plan
                });
            }
        } catch (err) {
            console.error('Failed to check product limit:', err);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const openAddModal = () => {
        // Check if at limit
        if (productLimit.limit !== null && products.length >= productLimit.limit) {
            setError(`Product limit reached (${productLimit.limit}). Please upgrade your plan to add more products.`);
            return;
        }
        setEditingProduct(null);
        setFormData({
            name: '',
            category: 'T-Shirts',
            price: '',
            stock_status: 'in_stock',
            clothing_type: 'upper',
            stock_status: 'in_stock',
            clothing_type: 'upper',
            image_url: '',
            additional_images_text: ''
        });
        setShowModal(true);
    };

    const openEditModal = (product) => {
        setEditingProduct(product);
        setFormData({
            name: product.name,
            category: product.category,
            price: product.price.toString(),
            stock_status: product.stock_status,
            clothing_type: product.clothing_type || 'upper',
            stock_status: product.stock_status,
            clothing_type: product.clothing_type || 'upper',
            image_url: product.image_url || '',
            additional_images_text: product.additional_images ? product.additional_images.join('\n') : ''
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        try {
            const productData = {
                ...formData,
                price: parseFloat(formData.price),
                price: parseFloat(formData.price),
                outlet_id: outlet?.id || 1,
                additional_images: formData.additional_images_text.split('\n').map(s => s.trim()).filter(Boolean)
            };

            if (editingProduct) {
                // Update existing product
                const response = await productsAPI.update(editingProduct.id, productData);
                if (response.success) {
                    setProducts(prev => prev.map(p =>
                        p.id === editingProduct.id ? response.data : p
                    ));
                }
            } else {
                // Create new product
                const response = await productsAPI.create(productData);
                if (response.success) {
                    setProducts(prev => [response.data, ...prev]);
                    fetchProductLimit(); // Refresh limit after adding
                } else if (response.limit_reached) {
                    setError(response.error);
                    setShowModal(false);
                    return;
                }
            }
            setShowModal(false);
        } catch (err) {
            setError(err.message || 'Failed to save product');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (productId) => {
        if (!window.confirm('Are you sure you want to delete this product?')) return;

        try {
            const response = await productsAPI.delete(productId);
            if (response.success) {
                setProducts(prev => prev.filter(p => p.id !== productId));
            }
        } catch (err) {
            setError('Failed to delete product');
        }
    };

    const getStockColor = (status) => {
        switch (status) {
            case 'in_stock': return 'text-green-600 bg-green-50';
            case 'low_stock': return 'text-orange-600 bg-orange-50';
            case 'out_of_stock': return 'text-red-600 bg-red-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    const getStockLabel = (status) => {
        switch (status) {
            case 'in_stock': return 'In Stock';
            case 'low_stock': return 'Low Stock';
            case 'out_of_stock': return 'Out of Stock';
            default: return status;
        }
    };

    const isAtLimit = productLimit.limit !== null && products.length >= productLimit.limit;

    return (
        <div className="max-w-7xl mx-auto">
            {/* Product Limit Banner */}
            {productLimit.limit !== null && (
                <div className={`mb-6 p-4 rounded-sm border-2 flex items-center justify-between ${isAtLimit
                    ? 'bg-red-50 border-red-300 text-red-700'
                    : products.length >= productLimit.limit * 0.8
                        ? 'bg-amber-50 border-amber-300 text-amber-700'
                        : 'bg-blue-50 border-blue-300 text-blue-700'
                    }`}>
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined">
                            {isAtLimit ? 'warning' : 'inventory_2'}
                        </span>
                        <div>
                            <p className="font-bold text-sm uppercase">
                                {isAtLimit ? 'Product Limit Reached' : 'Product Usage'}
                            </p>
                            <p className="text-sm opacity-80">
                                {products.length} / {productLimit.limit} products used ({productLimit.plan} plan)
                            </p>
                        </div>
                    </div>
                    {isAtLimit && (
                        <button
                            onClick={() => navigate('/dashboard/subscription')}
                            className="px-4 py-2 bg-primary text-white font-bold uppercase text-xs rounded-sm border-2 border-slate-900 hover:translate-y-1 shadow-3d transition-all"
                        >
                            Upgrade Plan
                        </button>
                    )}
                </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-white uppercase tracking-tight">Inventory</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium italic">Manage your outlet's collection with precision.</p>
                </div>
                <button
                    onClick={openAddModal}
                    disabled={isAtLimit}
                    className={`flex items-center gap-2 px-6 py-3 border-2 border-slate-900 dark:border-white rounded-sm font-bold uppercase text-xs transition-all ${isAtLimit
                        ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                        : 'bg-primary text-white hover:translate-y-1 shadow-3d hover:shadow-3d-hover'
                        }`}
                >
                    <span className="material-symbols-outlined text-[20px]">{isAtLimit ? 'block' : 'add'}</span>
                    {isAtLimit ? 'Limit Reached' : 'Add New Item'}
                </button>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-sm border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-primary outline-none transition-all text-sm font-medium"
                    />
                </div>
                <div className="relative w-full sm:w-64">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">filter_list</span>
                    <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-sm border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-primary outline-none transition-all text-sm font-medium appearance-none cursor-pointer"
                    >
                        <option value="All">All Categories</option>
                        {availableCategories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-sm">expand_more</span>
                </div>
            </div>

            {error && (
                <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
                    {error}
                    <button onClick={() => setError('')} className="float-right font-bold">×</button>
                </div>
            )}

            {/* Inventory Container */}
            <div className="bg-surface-light dark:bg-surface-dark rounded-sm border-2 border-slate-900 dark:border-white shadow-3d overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800 border-b-2 border-slate-900 dark:border-white text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                                <th className="px-6 py-5">Item Name</th>
                                <th className="px-6 py-5">Category</th>
                                <th className="px-6 py-5">Price</th>
                                <th className="px-6 py-5">Status</th>
                                <th className="px-6 py-5">Type</th>
                                <th className="px-6 py-5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-gray">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-body">
                                        <span className="material-symbols-outlined animate-spin text-4xl">progress_activity</span>
                                        <p className="mt-2">Loading products...</p>
                                    </td>
                                </tr>
                            ) : filteredProducts.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-body">
                                        <span className="material-symbols-outlined text-4xl text-gray-300">search_off</span>
                                        <p className="mt-2">No products found matching your search.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredProducts.map(product => (
                                    <tr key={product.id} className="hover:bg-page/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <ProductImagePreview
                                                    mainImage={product.image_url}
                                                    additionalImages={product.additional_images || []}
                                                    alt={product.name}
                                                    onClick={() => setPreviewImage({
                                                        src: product.image_url,
                                                        alt: product.name,
                                                        allImages: [product.image_url, ...(product.additional_images || [])].filter(Boolean)
                                                    })}
                                                />
                                                <span className="font-medium text-heading">{product.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-body">{product.category}</td>
                                        <td className="px-6 py-4 text-sm font-medium text-heading">${product.price.toFixed(2)}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStockColor(product.stock_status)}`}>
                                                {getStockLabel(product.stock_status)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-body capitalize">{product.clothing_type}</td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openEditModal(product)}
                                                    className="text-body hover:text-primary transition-colors p-1"
                                                    title="Edit"
                                                >
                                                    <span className="material-symbols-outlined text-[20px]">edit</span>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(product.id)}
                                                    className="text-body hover:text-red-500 transition-colors p-1"
                                                    title="Delete"
                                                >
                                                    <span className="material-symbols-outlined text-[20px]">delete</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                {/* Footer */}
                <div className="bg-white px-6 py-4 border-t border-border-gray flex items-center justify-between">
                    <span className="text-sm text-body">
                        Showing {filteredProducts.length} of {products.length} items
                    </span>
                    <button
                        onClick={fetchProducts}
                        className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                        <span className="material-symbols-outlined text-[16px]">refresh</span>
                        Refresh
                    </button>
                </div>
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <div className="bg-surface-light dark:bg-surface-dark border-2 border-slate-900 dark:border-white rounded-sm shadow-3d w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b-2 border-slate-900 dark:border-white flex items-center justify-between bg-slate-50 dark:bg-slate-800">
                            <h2 className="text-xl font-display font-bold text-slate-900 dark:text-white uppercase tracking-tight">
                                {editingProduct ? 'Edit Product' : 'Add New Product'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-slate-900 dark:hover:text-white">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Product Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-sm focus:border-primary transition-all outline-none font-medium text-sm text-slate-900 dark:text-white placeholder:text-slate-400"
                                    placeholder="e.g. Blue Denim Jacket"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Category</label>
                                    <select
                                        name="category"
                                        value={availableCategories.includes(formData.category) ? formData.category : '__custom__'}
                                        onChange={(e) => {
                                            if (e.target.value === '__custom__') {
                                                setFormData(prev => ({ ...prev, category: '' }));
                                            } else {
                                                setFormData(prev => ({ ...prev, category: e.target.value }));
                                            }
                                        }}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-sm focus:border-primary transition-all outline-none font-medium text-sm text-slate-900 dark:text-white"
                                    >
                                        {availableCategories.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                        <option value="__custom__">+ Add Custom Category</option>
                                    </select>
                                    {(!availableCategories.includes(formData.category) || formData.category === '') && (
                                        <input
                                            type="text"
                                            name="category"
                                            value={formData.category}
                                            onChange={handleChange}
                                            placeholder="Enter custom category name..."
                                            className="w-full mt-2 px-4 py-3 bg-white dark:bg-slate-800 border-2 border-primary rounded-sm focus:border-primary transition-all outline-none font-medium text-sm text-slate-900 dark:text-white"
                                            autoFocus
                                        />
                                    )}
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Price ($)</label>
                                    <input
                                        type="number"
                                        name="price"
                                        value={formData.price}
                                        onChange={handleChange}
                                        required
                                        min="0"
                                        step="0.01"
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-sm focus:border-primary transition-all outline-none font-medium text-sm text-slate-900 dark:text-white"
                                        placeholder="29.99"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Stock Status</label>
                                    <select
                                        name="stock_status"
                                        value={formData.stock_status}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-sm focus:border-primary transition-all outline-none font-medium text-sm text-slate-900 dark:text-white"
                                    >
                                        <option value="in_stock">In Stock</option>
                                        <option value="low_stock">Low Stock</option>
                                        <option value="out_of_stock">Out of Stock</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Type</label>
                                    <select
                                        name="clothing_type"
                                        value={formData.clothing_type}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-sm focus:border-primary transition-all outline-none font-medium text-sm text-slate-900 dark:text-white"
                                    >
                                        <option value="upper">Upper Body</option>
                                        <option value="lower">Lower Body</option>
                                        <option value="full">Full Body</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Image URL</label>
                                <input
                                    type="url"
                                    name="image_url"
                                    value={formData.image_url}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-sm focus:border-primary transition-all outline-none font-medium text-sm text-slate-900 dark:text-white placeholder:text-slate-400"
                                    placeholder="https://example.com/image.jpg"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Additional Images (One URL per line)</label>
                                <textarea
                                    name="additional_images_text"
                                    value={formData.additional_images_text}
                                    onChange={handleChange}
                                    rows="3"
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-sm focus:border-primary transition-all outline-none font-medium text-sm text-slate-900 dark:text-white placeholder:text-slate-400"
                                    placeholder="https://example.com/side.jpg&#10;https://example.com/back.jpg"
                                />
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-6 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-sm text-xs font-bold uppercase text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 px-6 py-3 bg-primary text-white border-2 border-slate-900 dark:border-white rounded-sm font-bold uppercase text-xs hover:translate-y-1 shadow-3d hover:shadow-3d-hover transition-all disabled:opacity-50"
                                >
                                    {saving ? 'Saving...' : (editingProduct ? 'Update Item' : 'Add Item')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

            )}

            {/* Image Preview Modal */}
            {
                previewImage && (
                    <div
                        className="fixed inset-0 bg-slate-900/90 backdrop-blur-md flex items-center justify-center z-[110] p-4 cursor-zoom-out"
                        onClick={() => setPreviewImage(null)}
                    >
                        <div
                            className="relative max-w-4xl max-h-[90vh] w-full flex flex-col items-center justify-center animate-in fade-in zoom-in duration-200"
                            onClick={e => e.stopPropagation()} // Prevent close on content click
                        >
                            <button
                                onClick={() => setPreviewImage(null)}
                                className="absolute top-4 right-4 z-50 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-all backdrop-blur-sm"
                            >
                                <span className="material-symbols-outlined text-2xl">close</span>
                            </button>

                            <ImageGallery
                                images={previewImage.allImages}
                                alt={previewImage.alt}
                            />

                            <p className="mt-4 text-white font-display font-bold text-xl tracking-wide">{previewImage.alt}</p>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

// Helper component for image cycling
const ProductImagePreview = ({ mainImage, additionalImages, alt, onClick }) => {
    const [currentSrc, setCurrentSrc] = useState(mainImage);
    const images = [mainImage, ...additionalImages].filter(Boolean);
    const [isHovering, setIsHovering] = useState(false);

    useEffect(() => {
        let interval;
        if (isHovering && images.length > 1) {
            let i = 0;
            interval = setInterval(() => {
                i = (i + 1) % images.length;
                setCurrentSrc(images[i]);
            }, 800);
        } else {
            setCurrentSrc(mainImage);
        }
        return () => clearInterval(interval);
    }, [isHovering, mainImage, images.length]);

    return (
        <div
            className="size-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 overflow-hidden relative group cursor-zoom-in hover:ring-2 hover:ring-primary hover:ring-offset-2 transition-all"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            onClick={onClick}
        >
            {currentSrc ? (
                <img src={currentSrc} alt={alt} className="w-full h-full object-cover transition-opacity duration-300" />
            ) : (
                <span className="material-symbols-outlined text-[20px]">checkroom</span>
            )}

            {/* Indicator dots if multiple */}
            {images.length > 1 && (
                <div className="absolute bottom-0 inset-x-0 h-1 bg-black/20 flex">
                    {images.map((_, idx) => (
                        <div key={idx} className={`flex-1 ${currentSrc === images[idx] ? 'bg-primary' : 'bg-transparent'}`} />
                    ))}
                </div>
            )}
        </div>
    );
};

// Full screen gallery with navigation
const ImageGallery = ({ images, alt }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    const next = () => setCurrentIndex((prev) => (prev + 1) % images.length);
    const prev = () => setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);

    if (!images || images.length === 0) return null;

    return (
        <div className="relative w-full h-full flex flex-col items-center">
            <div className="relative w-full max-h-[70vh] flex items-center justify-center">
                <img
                    src={images[currentIndex]}
                    alt={`${alt} - View ${currentIndex + 1}`}
                    className="max-h-[70vh] max-w-full object-contain rounded-sm shadow-2xl"
                />

                {images.length > 1 && (
                    <>
                        <button
                            onClick={prev}
                            className="absolute left-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 backdrop-blur-sm transition-all"
                        >
                            <span className="material-symbols-outlined text-3xl">chevron_left</span>
                        </button>
                        <button
                            onClick={next}
                            className="absolute right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 backdrop-blur-sm transition-all"
                        >
                            <span className="material-symbols-outlined text-3xl">chevron_right</span>
                        </button>
                    </>
                )}
            </div>

            {images.length > 1 && (
                <div className="flex gap-2 mt-6 overflow-x-auto max-w-full p-2">
                    {images.map((img, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrentIndex(idx)}
                            className={`size-16 rounded-md overflow-hidden border-2 transition-all ${idx === currentIndex ? 'border-primary ring-2 ring-primary ring-offset-2 ring-offset-slate-900' : 'border-transparent opacity-50 hover:opacity-100'
                                }`}
                        >
                            <img src={img} alt="" className="w-full h-full object-cover" />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Inventory;
