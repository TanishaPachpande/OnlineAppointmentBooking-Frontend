import axios from 'axios';

const RECORD_URL = 'http://localhost:8080/records';

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

const recordService = {
    createRecord: async (data) => {
        const response = await axios.post(RECORD_URL, data, { headers: getAuthHeaders() });
        return response.data;
    },
    updateRecord: async (recordId, data) => {
        const response = await axios.put(`${RECORD_URL}/${recordId}`, data, { headers: getAuthHeaders() });
        return response.data;
    },
    getRecordByAppointmentId: async (appointmentId) => {
        const response = await axios.get(`${RECORD_URL}/appointment/${appointmentId}`, { headers: getAuthHeaders() });
        return response.data;
    },
    getRecordsByPatient: async (patientId) => {
        const response = await axios.get(`${RECORD_URL}/patient/${patientId}`, { headers: getAuthHeaders() });
        return response.data;
    },
    getRecordsByProvider: async (providerId) => {
        const response = await axios.get(`${RECORD_URL}/provider/${providerId}`, { headers: getAuthHeaders() });
        return response.data;
    },
    deleteRecord: async (recordId) => {
        const response = await axios.delete(`${RECORD_URL}/${recordId}`, { headers: getAuthHeaders() });
        return response.data;
    }
};

export default recordService;
