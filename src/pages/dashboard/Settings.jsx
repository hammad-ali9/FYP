import React, { useState, useEffect } from 'react';
import { authAPI, outletsAPI } from '../../services/api';

const Settings = () => {
    const outlet = authAPI.getOutlet();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        address: '',
        city: '',
        phone: '',
        business_type: 'boutique'
    });
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (outlet) {
            setFormData({
                name: outlet.name || '',
                email: outlet.email || '',
                address: outlet.address || '',
                city: outlet.city || '',
                phone: outlet.phone || '',
                business_type: outlet.business_type || 'boutique'
            });
        }
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = async () => {
        if (!outlet?.id) return;

        setSaving(true);
        setMessage('');
        try {
            const response = await outletsAPI.update(outlet.id, formData);
            if (response.success) {
                localStorage.setItem('outlet', JSON.stringify(response.data));
                setMessage('Settings saved successfully!');
            } else {
                setMessage('Failed to save settings');
            }
        } catch (err) {
            setMessage('Failed to save settings');
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-heading">Settings</h1>
                <p className="text-body mt-1">Manage your store details and application preferences.</p>
            </div>

            {message && (
                <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${message.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    <span className="material-symbols-outlined text-lg">
                        {message.includes('success') ? 'check_circle' : 'error'}
                    </span>
                    {message}
                </div>
            )}

            <div className="space-y-6">
                {/* General Information */}
                <div className="bg-white rounded-xl border border-border-gray shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-border-gray">
                        <h2 className="font-bold text-lg text-heading">General Information</h2>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-heading">Outlet Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Your outlet name"
                                    className="w-full rounded-lg border border-border-gray py-2 px-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-heading">Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    disabled
                                    className="w-full rounded-lg border border-border-gray py-2 px-3 text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                                />
                            </div>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-heading">Phone</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="Your phone number"
                                    className="w-full rounded-lg border border-border-gray py-2 px-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-heading">Business Type</label>
                                <select
                                    name="business_type"
                                    value={formData.business_type}
                                    onChange={handleChange}
                                    className="w-full rounded-lg border border-border-gray py-2 px-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white"
                                >
                                    <option value="boutique">Independent Boutique</option>
                                    <option value="retail_chain">Retail Chain</option>
                                    <option value="department_store">Department Store</option>
                                    <option value="online_store">Online Store</option>
                                </select>
                            </div>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-heading">Address</label>
                                <input
                                    type="text"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    placeholder="Store address"
                                    className="w-full rounded-lg border border-border-gray py-2 px-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-heading">City</label>
                                <input
                                    type="text"
                                    name="city"
                                    value={formData.city}
                                    onChange={handleChange}
                                    placeholder="City"
                                    className="w-full rounded-lg border border-border-gray py-2 px-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                />
                            </div>
                        </div>
                    </div>
                    <div className="px-6 py-3 bg-page border-t border-border-gray flex justify-end">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
                        >
                            {saving && <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>}
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>

                {/* Brand Customization */}
                <div className="bg-white rounded-xl border border-border-gray shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-border-gray">
                        <h2 className="font-bold text-lg text-heading">Brand Customization</h2>
                        <p className="text-sm text-body mt-0.5">Customize how the try-on interface looks to your customers.</p>
                    </div>
                    <div className="p-6 space-y-6">
                        <div className="flex items-center gap-6">
                            <div>
                                <label className="text-sm font-medium text-heading mb-2 block">Logo</label>
                                <div className="border-2 border-dashed border-border-gray rounded-lg p-4 flex flex-col items-center justify-center w-32 h-32 hover:bg-page transition-colors cursor-pointer">
                                    <span className="material-symbols-outlined text-border-gray text-3xl">cloud_upload</span>
                                    <span className="text-xs text-body mt-2">Upload</span>
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-heading mb-2 block">Primary Color</label>
                                <div className="flex items-center gap-3">
                                    <input type="color" defaultValue="#2D3FE7" className="size-10 p-0.5 rounded border border-border-gray cursor-pointer" />
                                    <span className="text-sm text-heading font-mono">#2D3FE7</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="px-6 py-3 bg-page border-t border-border-gray flex justify-end">
                        <button className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors">Save Changes</button>
                    </div>
                </div>

                {/* Connected Devices - Empty State for now */}
                <div className="bg-white rounded-xl border border-border-gray shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-border-gray flex justify-between items-center">
                        <h2 className="font-bold text-lg text-heading">Connected Devices</h2>
                        <button className="flex items-center gap-1 text-sm text-primary font-medium hover:underline">
                            <span className="material-symbols-outlined text-sm">add</span>
                            Connect Device
                        </button>
                    </div>
                    <div className="p-12 text-center">
                        <div className="size-16 mx-auto mb-4 rounded-full bg-gray-50 flex items-center justify-center">
                            <span className="material-symbols-outlined text-3xl text-gray-300">devices</span>
                        </div>
                        <h3 className="font-medium text-heading mb-1">No Devices Connected</h3>
                        <p className="text-sm text-body">Connect your try-on kiosks and tablets to manage them here.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
