import axios from 'axios';

const API_URL = 'http://localhost:8080/providers';
const SCHEDULE_URL = 'http://localhost:8080/slots';

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    if (token) {
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    }
    return { 'Content-Type': 'application/json' };
};

const providerService = {
    registerProvider: async (providerData) => {
        return await axios.post(API_URL, providerData, { headers: getAuthHeaders() });
    },
    getAllProviders: async () => {
        const response = await axios.get(API_URL, { headers: getAuthHeaders() });
        return response.data;
    },
    getProviderByUserId: async (userId) => {
        const response = await axios.get(`${API_URL}/user/${userId}`, { headers: getAuthHeaders() });
        return response.data;
    },

    // Slot Management
    getSlotsByProvider: async (providerId) => {
        const response = await axios.get(`${SCHEDULE_URL}/provider/${providerId}`, { headers: getAuthHeaders() });
        return response.data;
    },

    addSingleSlot: async (slotData) => {
        const response = await axios.post(`${SCHEDULE_URL}`, slotData, { headers: getAuthHeaders() });
        return response.data;
    },

    addBulkSlots: async (bulkData) => {
        const response = await axios.post(`${SCHEDULE_URL}/bulk`, bulkData, { headers: getAuthHeaders() });
        return response.data;
    },

    addRecurringSlots: async (recurringData) => {
        const response = await axios.post(`${SCHEDULE_URL}/recurring`, recurringData, { headers: getAuthHeaders() });
        return response.data;
    },

    deleteSlot: async (slotId) => {
        const response = await axios.delete(`${SCHEDULE_URL}/${slotId}`, { headers: getAuthHeaders() });
        return response.data;
    },

    // Unified toggle function for blocking/unblocking
    toggleBlockSlot: async (slotId, isCurrentlyBlocked) => {
        const action = isCurrentlyBlocked ? 'unblock' : 'block';
        const response = await axios.put(`${SCHEDULE_URL}/${slotId}/${action}`, {}, { headers: getAuthHeaders() });
        return response.data;
    },

    updateProvider: async (id, data) => {
        const response = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeaders() });
        return response.data;
    },
    getProviderById: async (providerId) => {
        const response = await axios.get(`${API_URL}/${providerId}`, { headers: getAuthHeaders() });
        return response.data;
    },
    getProvidersBySpecialization: async (spec) => {
        const response = await axios.get(`${API_URL}/specialization/${spec}`, { headers: getAuthHeaders() });
        return response.data;
    },
    searchProviders: async (keyword) => {
        const response = await axios.get(`${API_URL}/search?keyword=${keyword}`, { headers: getAuthHeaders() });
        return response.data;
    }
};

export default providerService;
