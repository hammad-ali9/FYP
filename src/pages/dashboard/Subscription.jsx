import React, { useState, useEffect } from 'react';
import { authAPI, subscriptionsAPI } from '../../services/api';

const PLANS = [
    { id: 'starter', name: 'Starter', price: 99, items: '50 products', features: ['Basic Analytics', 'Email Support', '1 Device'] },
    { id: 'professional', name: 'Professional', price: 129, items: '200 products', features: ['Advanced Analytics', 'Priority Support', 'Custom Branding', '3 Devices'], popular: true },
    { id: 'enterprise', name: 'Enterprise', price: 299, items: 'Unlimited', features: ['Full Analytics Suite', 'Dedicated Manager', 'White-label', 'Unlimited Devices', 'API Access'] }
];

const Subscription = () => {
    const [subscription, setSubscription] = useState(null);
    const [invoices, setInvoices] = useState([]);
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal states
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showPlanModal, setShowPlanModal] = useState(false);
    const [showCheckoutModal, setShowCheckoutModal] = useState(false);

    // Checkout state
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [selectedCard, setSelectedCard] = useState(null);
    const [voucherCode, setVoucherCode] = useState('');
    const [voucherData, setVoucherData] = useState(null);
    const [voucherError, setVoucherError] = useState('');
    const [checkoutStep, setCheckoutStep] = useState(1); // 1=plan, 2=payment, 3=confirm

    const [paymentForm, setPaymentForm] = useState({ cardNumber: '', expiry: '', cvv: '', cardHolder: '' });
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    const outlet = authAPI.getOutlet();

    useEffect(() => {
        if (outlet?.id) fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [subRes, invRes] = await Promise.all([
                subscriptionsAPI.get(outlet?.id),
                subscriptionsAPI.getInvoices(outlet?.id, 10)
            ]);
            if (subRes.success) {
                setSubscription(subRes.data);
                setPaymentMethods(subRes.data?.payment_methods || []);
            }
            if (invRes.success) setInvoices(invRes.data);
        } catch (err) {
            console.error('Failed to load subscription:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const formatCurrency = (amount) => `$${parseFloat(amount).toFixed(2)}`;

    // Start checkout flow
    const startCheckout = (plan) => {
        setSelectedPlan(plan);
        setSelectedCard(null);
        setVoucherCode('');
        setVoucherData(null);
        setVoucherError('');
        setCheckoutStep(paymentMethods.length > 0 ? 2 : 2);
        setShowPlanModal(false);
        setShowCheckoutModal(true);
    };

    // Validate voucher
    const handleValidateVoucher = async () => {
        if (!voucherCode.trim()) return;
        setVoucherError('');

        try {
            const res = await subscriptionsAPI.validateVoucher(voucherCode, selectedPlan.id);
            if (res.success) {
                setVoucherData(res.data);
            } else {
                setVoucherError(res.error || 'Invalid voucher');
                setVoucherData(null);
            }
        } catch (err) {
            setVoucherError('Failed to validate voucher');
            setVoucherData(null);
        }
    };

    // Process payment
    const handlePayment = async () => {
        if (!selectedCard && !voucherData?.is_free) {
            setMessage('Please select a payment method');
            return;
        }

        setSaving(true);
        setMessage('');

        try {
            // Step 1: Select plan
            const planRes = await subscriptionsAPI.selectPlan(outlet.id, selectedPlan.id);
            if (!planRes.success) throw new Error(planRes.error);

            // Step 2: Process payment
            const payRes = await subscriptionsAPI.pay(
                planRes.data.id,
                selectedCard?.id || paymentMethods[0]?.id,
                voucherData ? voucherCode : null
            );

            if (payRes.success) {
                setMessage('Payment successful! Subscription activated.');
                setShowCheckoutModal(false);
                fetchData();
            } else {
                throw new Error(payRes.error);
            }
        } catch (err) {
            setMessage(err.message || 'Payment failed');
        } finally {
            setSaving(false);
        }
    };

    // Card form handling
    const handlePaymentChange = (e) => {
        let { name, value } = e.target;
        if (name === 'cardNumber') {
            value = value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
            if (value.length > 19) return;
        }
        if (name === 'expiry') {
            value = value.replace(/\D/g, '');
            if (value.length >= 2) value = value.slice(0, 2) + '/' + value.slice(2, 4);
            if (value.length > 5) return;
        }
        if (name === 'cvv' && value.length > 4) return;
        setPaymentForm({ ...paymentForm, [name]: value });
    };

    const handleAddCard = async () => {
        if (!paymentForm.cardNumber || !paymentForm.expiry || !paymentForm.cvv) {
            alert('Please fill in all card details');
            return;
        }
        setSaving(true);
        try {
            const last4 = paymentForm.cardNumber.replace(/\s/g, '').slice(-4);
            const cardBrand = detectCardBrand(paymentForm.cardNumber);

            await subscriptionsAPI.addCard(subscription.id, {
                card_last4: last4,
                card_brand: cardBrand,
                card_expiry: paymentForm.expiry,
                card_holder_name: paymentForm.cardHolder
            });

            setShowPaymentModal(false);
            setPaymentForm({ cardNumber: '', expiry: '', cvv: '', cardHolder: '' });
            fetchData();
        } catch (err) {
            alert('Failed to add card');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteCard = async (cardId) => {
        if (!confirm('Remove this card?')) return;
        try {
            await subscriptionsAPI.deleteCard(subscription.id, cardId);
            fetchData();
        } catch (err) { console.error(err); }
    };

    const handleSetDefault = async (cardId) => {
        try {
            await subscriptionsAPI.setDefaultCard(subscription.id, cardId);
            fetchData();
        } catch (err) { console.error(err); }
    };

    const detectCardBrand = (number) => {
        const cleaned = number.replace(/\s/g, '');
        if (cleaned.startsWith('4')) return 'visa';
        if (/^5[1-5]/.test(cleaned)) return 'mastercard';
        if (/^3[47]/.test(cleaned)) return 'amex';
        return 'card';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <span className="material-symbols-outlined animate-spin text-4xl text-slate-400">progress_activity</span>
            </div>
        );
    }

    const isTrial = subscription?.status === 'trial';
    const isExpired = subscription?.status === 'expired';
    const isPending = subscription?.status === 'pending_payment';
    const isActive = subscription?.status === 'active';

    const getFinalPrice = () => {
        if (!selectedPlan) return 0;
        if (voucherData) return voucherData.final_price;
        return selectedPlan.price;
    };

    return (
        <div className="space-y-8">
            {/* Status Banners */}
            {isTrial && (
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-4 rounded-sm border-2 border-slate-900 shadow-3d flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-2xl">hourglass_top</span>
                        <div>
                            <p className="font-bold uppercase text-sm">Free Trial</p>
                            <p className="text-sm opacity-90">{subscription?.trial_days_remaining || 0} days remaining</p>
                        </div>
                    </div>
                    <button onClick={() => setShowPlanModal(true)} className="px-4 py-2 bg-white text-orange-600 font-bold uppercase text-xs rounded-sm border-2 border-slate-900 hover:translate-y-1 shadow-3d transition-all">
                        Upgrade Now
                    </button>
                </div>
            )}

            {isExpired && (
                <div className="bg-gradient-to-r from-red-500 to-rose-500 text-white p-4 rounded-sm border-2 border-slate-900 shadow-3d flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-2xl">warning</span>
                        <div>
                            <p className="font-bold uppercase text-sm">Subscription Expired</p>
                            <p className="text-sm opacity-90">Please renew to continue</p>
                        </div>
                    </div>
                    <button onClick={() => setShowPlanModal(true)} className="px-4 py-2 bg-white text-red-600 font-bold uppercase text-xs rounded-sm border-2 border-slate-900 hover:translate-y-1 shadow-3d transition-all">
                        Choose Plan
                    </button>
                </div>
            )}

            {isActive && (
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-4 rounded-sm border-2 border-slate-900 shadow-3d flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-2xl">verified</span>
                        <div>
                            <p className="font-bold uppercase text-sm">Active Subscription</p>
                            <p className="text-sm opacity-90">{subscription?.subscription_days_remaining || 0} days until renewal</p>
                        </div>
                    </div>
                </div>
            )}

            <div>
                <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-white uppercase tracking-tight">Subscription & Billing</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium italic">Manage your plan and payment methods.</p>
            </div>

            {message && (
                <div className={`p-4 rounded-sm border-2 ${message.includes('success') ? 'bg-green-50 border-green-300 text-green-700' : 'bg-red-50 border-red-300 text-red-700'}`}>
                    {message}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Current Plan */}
                <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-sm border-2 border-slate-900 dark:border-white shadow-3d">
                    <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Current Plan</h3>
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-white uppercase">{subscription?.plan_name || 'No Plan'}</h2>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase mt-2 ${isActive ? 'bg-green-500 text-white' : isTrial ? 'bg-amber-500 text-white' : 'bg-slate-300 text-slate-700'
                                }`}>
                                {subscription?.status || 'Inactive'}
                            </span>
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-display font-bold text-slate-900 dark:text-white">{formatCurrency(subscription?.plan_price || 0)}</p>
                            <p className="text-[10px] font-bold uppercase text-slate-500">/month</p>
                        </div>
                    </div>

                    {isActive && subscription?.current_period_end && (
                        <div className="pt-4 border-t-2 border-slate-200 dark:border-slate-700 mb-4">
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-500">Renews on</span>
                                <span className="font-bold text-slate-900 dark:text-white">{formatDate(subscription.current_period_end)}</span>
                            </div>
                        </div>
                    )}

                    <button onClick={() => setShowPlanModal(true)} className="w-full py-3 px-4 bg-primary text-white border-2 border-slate-900 rounded-sm font-bold uppercase text-xs hover:translate-y-1 shadow-3d transition-all">
                        {isActive ? 'Change Plan' : 'Choose a Plan'}
                    </button>
                </div>

                {/* Payment Methods */}
                <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-sm border-2 border-slate-900 dark:border-white shadow-3d">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Payment Methods</h3>
                        <span className="text-[10px] font-bold text-slate-400">{paymentMethods.length} card(s)</span>
                    </div>

                    {paymentMethods.length === 0 ? (
                        <div className="p-6 text-center border-2 border-dashed border-slate-300 rounded-sm mb-4">
                            <span className="material-symbols-outlined text-3xl text-slate-400">credit_card_off</span>
                            <p className="mt-2 text-sm text-slate-500">No payment methods</p>
                        </div>
                    ) : (
                        <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
                            {paymentMethods.map((card) => (
                                <div key={card.id} className={`flex items-center gap-3 p-3 rounded-sm border-2 ${card.is_default ? 'border-primary bg-primary/5' : 'border-slate-200'}`}>
                                    <span className="material-symbols-outlined text-slate-600">credit_card</span>
                                    <div className="flex-1">
                                        <p className="text-xs font-bold">•••• {card.last4} {card.is_default && <span className="text-primary">(Default)</span>}</p>
                                        <p className="text-[10px] text-slate-500">Expires {card.expiry}</p>
                                    </div>
                                    <div className="flex gap-1">
                                        {!card.is_default && <button onClick={() => handleSetDefault(card.id)} className="p-1 text-slate-400 hover:text-primary"><span className="material-symbols-outlined text-lg">star</span></button>}
                                        <button onClick={() => handleDeleteCard(card.id)} className="p-1 text-slate-400 hover:text-red-500"><span className="material-symbols-outlined text-lg">delete</span></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <button onClick={() => setShowPaymentModal(true)} className="w-full py-3 px-4 bg-white border-2 border-slate-900 text-slate-900 rounded-sm font-bold uppercase text-xs hover:translate-y-1 shadow-3d transition-all flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-lg">add</span> Add Card
                    </button>
                </div>
            </div>

            {/* Billing History */}
            <div className="bg-surface-light dark:bg-surface-dark rounded-sm border-2 border-slate-900 dark:border-white shadow-3d overflow-hidden">
                <div className="p-6 border-b-2 border-slate-900 dark:border-white bg-slate-50 dark:bg-slate-800">
                    <h3 className="font-display font-bold text-slate-900 dark:text-white text-lg uppercase">Billing History</h3>
                </div>
                {invoices.length === 0 ? (
                    <div className="p-12 text-center">
                        <span className="material-symbols-outlined text-4xl text-slate-300">receipt_long</span>
                        <p className="mt-2 text-slate-500">No billing history yet</p>
                        <p className="text-xs text-slate-400 mt-1">Invoices appear after successful payments</p>
                    </div>
                ) : (
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-page text-xs font-semibold text-body uppercase tracking-wider">
                                <th className="px-6 py-3">Date</th>
                                <th className="px-6 py-3">Description</th>
                                <th className="px-6 py-3">Amount</th>
                                <th className="px-6 py-3">Voucher</th>
                                <th className="px-6 py-3">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-gray">
                            {invoices.map((inv) => (
                                <tr key={inv.id} className="text-sm">
                                    <td className="px-6 py-4 font-medium">{formatDate(inv.paid_at || inv.created_at)}</td>
                                    <td className="px-6 py-4 text-slate-600">{inv.description}</td>
                                    <td className="px-6 py-4 font-bold">{formatCurrency(inv.amount)}</td>
                                    <td className="px-6 py-4">{inv.voucher_code ? <span className="font-mono text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">{inv.voucher_code}</span> : '-'}</td>
                                    <td className="px-6 py-4"><span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded">Paid</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Plan Selection Modal */}
            {showPlanModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-sm border-2 border-slate-900 shadow-3d w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <div className="px-6 py-4 border-b-2 border-slate-900 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-900 z-10">
                            <h3 className="font-display font-bold text-lg uppercase">Choose Your Plan</h3>
                            <button onClick={() => setShowPlanModal(false)} className="text-slate-400 hover:text-slate-900"><span className="material-symbols-outlined">close</span></button>
                        </div>
                        <div className="p-6 grid md:grid-cols-3 gap-4">
                            {PLANS.map((plan) => (
                                <div key={plan.id} className={`relative p-6 rounded-sm border-2 ${subscription?.plan_name === plan.id && isActive ? 'border-primary bg-primary/5' : plan.popular ? 'border-amber-500' : 'border-slate-900'}`}>
                                    {plan.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-amber-500 text-white text-[10px] font-bold uppercase rounded-sm">Popular</div>}
                                    <h4 className="font-display font-bold text-xl uppercase">{plan.name}</h4>
                                    <p className="text-slate-500 text-sm mb-4">{plan.items}</p>
                                    <div className="mb-4">
                                        <span className="text-3xl font-display font-bold">${plan.price}</span>
                                        <span className="text-slate-500 text-sm">/mo</span>
                                    </div>
                                    <ul className="space-y-2 mb-6">
                                        {plan.features.map((f, i) => (
                                            <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                                                <span className="material-symbols-outlined text-green-500 text-lg">check_circle</span>{f}
                                            </li>
                                        ))}
                                    </ul>
                                    <button
                                        onClick={() => startCheckout(plan)}
                                        disabled={subscription?.plan_name === plan.id && isActive}
                                        className={`w-full py-3 rounded-sm font-bold uppercase text-xs border-2 ${subscription?.plan_name === plan.id && isActive ? 'bg-slate-100 text-slate-400 border-slate-300 cursor-not-allowed' : 'bg-primary text-white border-slate-900 hover:translate-y-1 shadow-3d'
                                            }`}
                                    >
                                        {subscription?.plan_name === plan.id && isActive ? 'Current' : 'Select'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Checkout Modal */}
            {showCheckoutModal && selectedPlan && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-sm border-2 border-slate-900 shadow-3d w-full max-w-lg">
                        <div className="px-6 py-4 border-b-2 border-slate-900 flex items-center justify-between">
                            <h3 className="font-display font-bold text-lg uppercase">Complete Payment</h3>
                            <button onClick={() => setShowCheckoutModal(false)} className="text-slate-400 hover:text-slate-900"><span className="material-symbols-outlined">close</span></button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Plan Summary */}
                            <div className="p-4 bg-slate-50 rounded-sm border-2 border-slate-200">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="font-bold uppercase">{selectedPlan.name} Plan</p>
                                        <p className="text-sm text-slate-500">{selectedPlan.items}</p>
                                    </div>
                                    <div className="text-right">
                                        {voucherData ? (
                                            <>
                                                <p className="text-sm text-slate-400 line-through">${selectedPlan.price}</p>
                                                <p className="text-2xl font-bold text-green-600">{formatCurrency(voucherData.final_price)}</p>
                                            </>
                                        ) : (
                                            <p className="text-2xl font-bold">${selectedPlan.price}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Voucher Input */}
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Have a voucher code?</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={voucherCode}
                                        onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                                        placeholder="Enter code"
                                        className="flex-1 px-4 py-3 border-2 border-slate-300 rounded-sm text-sm font-mono uppercase focus:border-primary focus:outline-none"
                                    />
                                    <button onClick={handleValidateVoucher} className="px-4 py-3 bg-slate-900 text-white rounded-sm font-bold uppercase text-xs">Apply</button>
                                </div>
                                {voucherError && <p className="text-red-500 text-xs mt-2">{voucherError}</p>}
                                {voucherData && (
                                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-sm text-green-700 text-sm flex items-center gap-2">
                                        <span className="material-symbols-outlined text-lg">check_circle</span>
                                        {voucherData.is_free ? 'FREE! No payment required' : `${formatCurrency(voucherData.discount)} discount applied`}
                                    </div>
                                )}
                            </div>

                            {/* Select Payment Method (if not free) */}
                            {!voucherData?.is_free && (
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Select Payment Method</label>
                                    {paymentMethods.length === 0 ? (
                                        <div className="text-center p-4 border-2 border-dashed border-slate-300 rounded-sm">
                                            <p className="text-slate-500 mb-2">No cards added</p>
                                            <button onClick={() => { setShowCheckoutModal(false); setShowPaymentModal(true); }} className="text-primary font-bold text-sm underline">
                                                Add a card first
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {paymentMethods.map((card) => (
                                                <div
                                                    key={card.id}
                                                    onClick={() => setSelectedCard(card)}
                                                    className={`flex items-center gap-3 p-3 rounded-sm border-2 cursor-pointer transition-all ${selectedCard?.id === card.id ? 'border-primary bg-primary/5' : 'border-slate-200 hover:border-slate-400'
                                                        }`}
                                                >
                                                    <span className="material-symbols-outlined text-slate-600">credit_card</span>
                                                    <p className="flex-1 text-sm font-bold">•••• {card.last4}</p>
                                                    {selectedCard?.id === card.id && <span className="material-symbols-outlined text-primary">check_circle</span>}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="px-6 py-4 border-t-2 border-slate-200 bg-slate-50 flex gap-3">
                            <button onClick={() => setShowCheckoutModal(false)} className="flex-1 py-3 border-2 border-slate-900 text-slate-900 rounded-sm font-bold uppercase text-xs">Cancel</button>
                            <button
                                onClick={handlePayment}
                                disabled={saving || (!voucherData?.is_free && !selectedCard && paymentMethods.length === 0)}
                                className="flex-1 py-3 bg-primary text-white border-2 border-slate-900 rounded-sm font-bold uppercase text-xs hover:translate-y-1 shadow-3d transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {saving && <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>}
                                {voucherData?.is_free ? 'Activate Free' : `Pay ${formatCurrency(getFinalPrice())}`}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Card Modal */}
            {showPaymentModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-sm border-2 border-slate-900 shadow-3d w-full max-w-md mx-4">
                        <div className="px-6 py-4 border-b-2 border-slate-900 flex items-center justify-between">
                            <h3 className="font-display font-bold text-lg uppercase">Add Payment Method</h3>
                            <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-slate-900"><span className="material-symbols-outlined">close</span></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Card Holder</label>
                                <input type="text" name="cardHolder" value={paymentForm.cardHolder} onChange={handlePaymentChange} placeholder="John Doe" className="w-full px-4 py-3 border-2 border-slate-300 rounded-sm" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Card Number</label>
                                <input type="text" name="cardNumber" value={paymentForm.cardNumber} onChange={handlePaymentChange} placeholder="4242 4242 4242 4242" className="w-full px-4 py-3 border-2 border-slate-300 rounded-sm font-mono" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Expiry</label>
                                    <input type="text" name="expiry" value={paymentForm.expiry} onChange={handlePaymentChange} placeholder="MM/YY" className="w-full px-4 py-3 border-2 border-slate-300 rounded-sm font-mono" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">CVV</label>
                                    <input type="password" name="cvv" value={paymentForm.cvv} onChange={handlePaymentChange} placeholder="***" className="w-full px-4 py-3 border-2 border-slate-300 rounded-sm font-mono" />
                                </div>
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t-2 border-slate-200 bg-slate-50 flex gap-3">
                            <button onClick={() => setShowPaymentModal(false)} className="flex-1 py-3 border-2 border-slate-900 rounded-sm font-bold uppercase text-xs">Cancel</button>
                            <button onClick={handleAddCard} disabled={saving} className="flex-1 py-3 bg-primary text-white border-2 border-slate-900 rounded-sm font-bold uppercase text-xs hover:translate-y-1 shadow-3d disabled:opacity-50">
                                {saving ? 'Adding...' : 'Add Card'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Subscription;
