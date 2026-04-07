import React from 'react';

const Profile = () => {
    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-heading">Your Profile</h1>
                <p className="text-body mt-1">Manage your personal account settings.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                {/* Profile Card */}
                <div className="md:col-span-1">
                    <div className="bg-white rounded-xl border border-border-gray shadow-sm p-6 flex flex-col items-center text-center">
                        <div className="relative mb-4">
                            <div className="size-24 rounded-full bg-primary/10 flex items-center justify-center text-primary text-3xl font-bold border-4 border-white shadow-sm">
                                JD
                            </div>
                            <button className="absolute bottom-0 right-0 p-1.5 bg-white border border-border-gray rounded-full shadow-sm text-body hover:text-primary transition-colors">
                                <span className="material-symbols-outlined text-[16px]">edit</span>
                            </button>
                        </div>
                        <h2 className="font-bold text-lg text-heading">Jane Doe</h2>
                        <p className="text-sm text-body">Store Manager</p>
                        <div className="mt-4 flex gap-2">
                            <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">Admin</span>
                        </div>
                    </div>
                </div>

                {/* Profile Form */}
                <div className="md:col-span-2">
                    <div className="bg-white rounded-xl border border-border-gray shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-border-gray">
                            <h2 className="font-bold text-lg text-heading">Personal Details</h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-medium text-heading">First Name</label>
                                    <input type="text" defaultValue="Jane" className="w-full rounded-lg border-border-gray py-2 px-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-medium text-heading">Last Name</label>
                                    <input type="text" defaultValue="Doe" className="w-full rounded-lg border-border-gray py-2 px-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                                </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-heading">Email Address</label>
                                <input type="email" defaultValue="jane.doe@urbanstyle.com" className="w-full rounded-lg border-border-gray py-2 px-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-heading">Phone Number</label>
                                <input type="tel" defaultValue="+1 (555) 123-4567" className="w-full rounded-lg border-border-gray py-2 px-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                            </div>
                        </div>
                        <div className="px-6 py-3 bg-page border-t border-border-gray flex justify-end">
                            <button className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors">Save Changes</button>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-border-gray shadow-sm overflow-hidden mt-6">
                        <div className="px-6 py-4 border-b border-border-gray">
                            <h2 className="font-bold text-lg text-heading">Security</h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-heading">Password</p>
                                    <p className="text-xs text-body">Last changed 3 months ago</p>
                                </div>
                                <button className="px-3 py-1.5 border border-border-gray rounded-lg text-sm font-medium hover:bg-page transition-colors">Change Password</button>
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-heading">Two-Factor Authentication</p>
                                    <p className="text-xs text-body">Add an extra layer of security</p>
                                </div>
                                <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                                    <input type="checkbox" name="toggle" id="toggle" className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer border-gray-300 left-0" />
                                    <label htmlFor="toggle" className="toggle-label block overflow-hidden h-5 rounded-full bg-gray-300 cursor-pointer"></label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
