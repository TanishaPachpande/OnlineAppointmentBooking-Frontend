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

    // ── Razorpay flow ────────────────────────────────────────────────────────

    /**
     * Step 1: Ask backend to create a Razorpay order.
     * Returns { razorpayOrderId, amount, currency, keyId, appointmentId, patientId }
     */
    createRazorpayOrder: async ({ appointmentId, patientId, amount, notes }) => {
        const response = await axios.post(
            `${PAYMENT_URL}/razorpay/create-order`,
            { appointmentId, patientId, amount, notes },
            { headers: getAuthHeaders() }
        );
        return response.data;
    },

    /**
     * Step 2: After Razorpay checkout succeeds, verify the signature on the backend
     * and save the payment record.
     */
    verifyRazorpayPayment: async (verifyPayload) => {
        const response = await axios.post(
            `${PAYMENT_URL}/razorpay/verify`,
            verifyPayload,
            { headers: getAuthHeaders() }
        );
        return response.data;
    },

    // ── Query endpoints ──────────────────────────────────────────────────────

    getPaymentByAppointmentId: async (appointmentId) => {
        const response = await axios.get(
            `${PAYMENT_URL}/appointment/${appointmentId}`,
            { headers: getAuthHeaders() }
        );
        return response.data;
    },

    getPaymentsByPatient: async (patientId) => {
        const response = await axios.get(
            `${PAYMENT_URL}/patient/${patientId}`,
            { headers: getAuthHeaders() }
        );
        return response.data;
    },

    refundPayment: async (paymentId, reason) => {
        const response = await axios.put(
            `${PAYMENT_URL}/${paymentId}/refund`,
            { reason },
            { headers: getAuthHeaders() }
        );
        return response.data;
    },

    getAllPayments: async () => {
        const response = await axios.get(PAYMENT_URL, { headers: getAuthHeaders() });
        return response.data;
    },

    // Legacy mock endpoint (kept for backward compat)
    processPayment: async (data) => {
        const response = await axios.post(PAYMENT_URL, data, { headers: getAuthHeaders() });
        return response.data;
    },
};

export default paymentService;
