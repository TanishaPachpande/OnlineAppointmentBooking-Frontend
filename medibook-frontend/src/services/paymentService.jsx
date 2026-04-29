import axios from 'axios';

const PAYMENT_URL = 'http://localhost:8080/payments';

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    if (token) {
        return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
    }
    return { 'Content-Type': 'application/json' };
};

const paymentService = {
    processPayment: async (data) => {
        const response = await axios.post(PAYMENT_URL, data, { headers: getAuthHeaders() });
        return response.data;
    },
    getPaymentByAppointmentId: async (appointmentId) => {
        const response = await axios.get(`${PAYMENT_URL}/appointment/${appointmentId}`, { headers: getAuthHeaders() });
        return response.data;
    },
    getPaymentsByPatient: async (patientId) => {
        const response = await axios.get(`${PAYMENT_URL}/patient/${patientId}`, { headers: getAuthHeaders() });
        return response.data;
    },
    refundPayment: async (paymentId, reason) => {
        const response = await axios.put(`${PAYMENT_URL}/${paymentId}/refund`, { reason }, { headers: getAuthHeaders() });
        return response.data;
    },
    getAllPayments: async () => {
        const response = await axios.get(PAYMENT_URL, { headers: getAuthHeaders() });
        return response.data;
    }
};

export default paymentService;
