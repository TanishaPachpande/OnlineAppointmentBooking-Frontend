import axios from 'axios';

const APPOINTMENT_URL = 'http://localhost:8080/appointments';

const getAuthHeaders = () => {
    const rawUser = localStorage.getItem('user');
    const user = rawUser ? JSON.parse(rawUser) : null;
    if (user && user.token) {
        return {
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'application/json'
        };
    }
    return { 'Content-Type': 'application/json' };
};

const appointmentService = {
    bookAppointment: async (data) => {
        const response = await axios.post(APPOINTMENT_URL, data, { headers: getAuthHeaders() });
        return response.data;
    },
    getById: async (appointmentId) => {
        const response = await axios.get(`${APPOINTMENT_URL}/${appointmentId}`, { headers: getAuthHeaders() });
        return response.data;
    },
    getByPatient: async (patientId) => {
        const response = await axios.get(`${APPOINTMENT_URL}/patient/${patientId}`, { headers: getAuthHeaders() });
        return response.data;
    },
    getUpcomingByPatient: async (patientId) => {
        const response = await axios.get(`${APPOINTMENT_URL}/patient/${patientId}/upcoming`, { headers: getAuthHeaders() });
        return response.data;
    },
    getByProvider: async (providerId) => {
        const response = await axios.get(`${APPOINTMENT_URL}/provider/${providerId}`, { headers: getAuthHeaders() });
        return response.data;
    },
    getByProviderAndDate: async (providerId, date) => {
        const response = await axios.get(`${APPOINTMENT_URL}/provider/${providerId}/date/${date}`, { headers: getAuthHeaders() });
        return response.data;
    },
    cancelAppointment: async (appointmentId) => {
        const response = await axios.put(`${APPOINTMENT_URL}/${appointmentId}/cancel`, {}, { headers: getAuthHeaders() });
        return response.data;
    },
    rescheduleAppointment: async (appointmentId, newSlotId) => {
        const response = await axios.put(`${APPOINTMENT_URL}/${appointmentId}/reschedule`, { newSlotId }, { headers: getAuthHeaders() });
        return response.data;
    },
    completeAppointment: async (appointmentId) => {
        const response = await axios.put(`${APPOINTMENT_URL}/${appointmentId}/complete`, {}, { headers: getAuthHeaders() });
        return response.data;
    },
    updateStatus: async (appointmentId, status) => {
        const response = await axios.put(`${APPOINTMENT_URL}/${appointmentId}/status?status=${status}`, {}, { headers: getAuthHeaders() });
        return response.data;
    },
    getAppointmentCount: async (providerId) => {
        const response = await axios.get(`${APPOINTMENT_URL}/provider/${providerId}/count`, { headers: getAuthHeaders() });
        return response.data;
    }
};

export default appointmentService;