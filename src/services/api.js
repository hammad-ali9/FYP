// API Service for VirtualFit Backend

const API_BASE_URL = 'http://127.0.0.1:5000/api';

// Helper to get auth token
const getToken = () => localStorage.getItem('token');

// Helper for API requests
const apiRequest = async (endpoint, options = {}) => {
    const url = `${API_BASE_URL}${endpoint}`;

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    // Add auth token if available
    const token = getToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
        ...options,
        headers,
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || 'API request failed');
    }

    return data;
};

// Auth API
export const authAPI = {
    login: async (email, password) => {
        const data = await apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });

        if (data.access_token) {
            localStorage.setItem('token', data.access_token);
            localStorage.setItem('outlet', JSON.stringify(data.outlet));
        }

        return data;
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('outlet');
    },

    getMe: async () => {
        return apiRequest('/auth/me');
    },

    isAuthenticated: () => {
        return !!getToken();
    },

    getOutlet: () => {
        const outlet = localStorage.getItem('outlet');
        return outlet ? JSON.parse(outlet) : null;
    },

    forgotPassword: async (email) => {
        return apiRequest('/auth/forgot-password', {
            method: 'POST',
            body: JSON.stringify({ email }),
        });
    },

    resetPassword: async (token, password) => {
        return apiRequest('/auth/reset-password', {
            method: 'POST',
            body: JSON.stringify({ token, password }),
        });
    }
};

// Outlets API
export const outletsAPI = {
    register: async (outletData) => {
        return apiRequest('/outlets', {
            method: 'POST',
            body: JSON.stringify(outletData),
        });
    },

    getAll: async () => {
        return apiRequest('/outlets');
    },

    getById: async (id) => {
        return apiRequest(`/outlets/${id}`);
    },

    update: async (id, data) => {
        return apiRequest(`/outlets/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }
};

// Products API
export const productsAPI = {
    getAll: async (outletId = null) => {
        const query = outletId ? `?outlet_id=${outletId}` : '';
        return apiRequest(`/products${query}`);
    },

    getById: async (id) => {
        return apiRequest(`/products/${id}`);
    },

    create: async (productData) => {
        return apiRequest('/products', {
            method: 'POST',
            body: JSON.stringify(productData),
        });
    },

    update: async (id, data) => {
        return apiRequest(`/products/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    delete: async (id) => {
        return apiRequest(`/products/${id}`, {
            method: 'DELETE',
        });
    },

    // For file upload, use FormData
    createWithImage: async (formData) => {
        const token = getToken();
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_BASE_URL}/products`, {
            method: 'POST',
            headers,
            body: formData, // Don't set Content-Type for FormData
        });

        return response.json();
    }
};

// Subscriptions API
export const subscriptionsAPI = {
    get: async (outletId) => {
        return apiRequest(`/subscriptions?outlet_id=${outletId}`);
    },

    // Step 1: Select a plan
    selectPlan: async (outletId, plan) => {
        return apiRequest('/subscriptions/select-plan', {
            method: 'POST',
            body: JSON.stringify({ outlet_id: outletId, plan }),
        });
    },

    // Step 2: Validate voucher
    validateVoucher: async (code, plan) => {
        return apiRequest('/subscriptions/validate-voucher', {
            method: 'POST',
            body: JSON.stringify({ code, plan }),
        });
    },

    // Step 3: Process payment
    pay: async (subscriptionId, paymentMethodId, voucherCode = null) => {
        return apiRequest('/subscriptions/pay', {
            method: 'POST',
            body: JSON.stringify({
                subscription_id: subscriptionId,
                payment_method_id: paymentMethodId,
                voucher_code: voucherCode
            }),
        });
    },

    update: async (id, data) => {
        return apiRequest(`/subscriptions/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    getInvoices: async (outletId, limit = 10) => {
        return apiRequest(`/subscriptions/invoices?outlet_id=${outletId}&limit=${limit}`);
    },

    getPlans: async () => {
        return apiRequest('/subscriptions/plans');
    },

    // Card management
    addCard: async (subscriptionId, cardData) => {
        return apiRequest(`/subscriptions/${subscriptionId}/cards`, {
            method: 'POST',
            body: JSON.stringify(cardData),
        });
    },

    deleteCard: async (subscriptionId, cardId) => {
        return apiRequest(`/subscriptions/${subscriptionId}/cards/${cardId}`, {
            method: 'DELETE',
        });
    },

    setDefaultCard: async (subscriptionId, cardId) => {
        return apiRequest(`/subscriptions/${subscriptionId}/cards/${cardId}/default`, {
            method: 'PUT',
        });
    },

    // Product limit check
    checkProductLimit: async (outletId) => {
        return apiRequest(`/subscriptions/check-limit?outlet_id=${outletId}`);
    }
};

// Gestures API
export const gesturesAPI = {
    start: async () => {
        return apiRequest('/gestures/start', { method: 'POST' });
    },
    stop: async () => {
        return apiRequest('/gestures/stop', { method: 'POST' });
    },
    status: async () => {
        return apiRequest('/gestures/status');
    }
};


// Sessions API
export const sessionsAPI = {
    getAll: async (outletId = null, limit = 50) => {
        const params = new URLSearchParams();
        if (outletId) params.append('outlet_id', outletId);
        if (limit) params.append('limit', limit);
        return apiRequest(`/sessions?${params.toString()}`);
    },

    getById: async (id) => {
        return apiRequest(`/sessions/${id}`);
    },

    create: async (outletId, kioskId = 'web') => {
        return apiRequest('/sessions', {
            method: 'POST',
            body: JSON.stringify({ outlet_id: outletId, kiosk_id: kioskId }),
        });
    },

    end: async (id, status = 'completed') => {
        return apiRequest(`/sessions/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ status }),
        });
    },

    addEvent: async (sessionId, productId, durationSeconds = null) => {
        return apiRequest(`/sessions/${sessionId}/events`, {
            method: 'POST',
            body: JSON.stringify({
                product_id: productId,
                duration_seconds: durationSeconds
            }),
        });
    },

    getAnalytics: async (outletId, days = 7) => {
        return apiRequest(`/sessions/analytics?outlet_id=${outletId}&days=${days}`);
    }
};

// Try-On API
export const tryonAPI = {
    init: async (token = '') => {
        return apiRequest('/tryon/init', {
            method: 'POST',
            body: JSON.stringify({ token }),
        });
    },
    capture: async () => {
        return apiRequest('/tryon/capture', {
            method: 'POST',
        });
    },
    analyze: async (step = 'FRONT', clothingTypes = {}) => {
        return apiRequest('/tryon/analyze', {
            method: 'POST',
            body: JSON.stringify({ 
                step,
                selected_upper: !!clothingTypes.upper,
                selected_lower: !!clothingTypes.lower
            })
        });
    },
    generate: async (personImage, garmentImage, token = '') => {
        return apiRequest('/tryon/generate', {
            method: 'POST',
            body: JSON.stringify({
                person_image: personImage,
                garment_image: garmentImage,
                token
            }),
        });
    }
};

export default { authAPI, outletsAPI, productsAPI, subscriptionsAPI, sessionsAPI, tryonAPI };
