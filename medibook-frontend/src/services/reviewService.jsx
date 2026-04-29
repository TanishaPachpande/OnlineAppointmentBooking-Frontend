import axios from 'axios';

const REVIEW_URL = 'http://localhost:8080/reviews';

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    if (token) {
        return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
    }
    return { 'Content-Type': 'application/json' };
};

const reviewService = {
    addReview: async (data) => {
        const response = await axios.post(REVIEW_URL, data, { headers: getAuthHeaders() });
        return response.data;
    },
    getReviewByAppointmentId: async (appointmentId) => {
        const response = await axios.get(`${REVIEW_URL}/appointment/${appointmentId}`, { headers: getAuthHeaders() });
        return response.data;
    },
    getReviewsByPatient: async (patientId) => {
        const response = await axios.get(`${REVIEW_URL}/patient/${patientId}`, { headers: getAuthHeaders() });
        return response.data;
    },
    getReviewsByProvider: async (providerId) => {
        const response = await axios.get(`${REVIEW_URL}/provider/${providerId}`, { headers: getAuthHeaders() });
        return response.data;
    },
    getProviderRatingSummary: async (providerId) => {
        const response = await axios.get(`${REVIEW_URL}/provider/${providerId}/summary`, { headers: getAuthHeaders() });
        return response.data;
    },
    deleteReview: async (reviewId) => {
        const response = await axios.delete(`${REVIEW_URL}/${reviewId}`, { headers: getAuthHeaders() });
        return response.data;
    }
};

export default reviewService;
