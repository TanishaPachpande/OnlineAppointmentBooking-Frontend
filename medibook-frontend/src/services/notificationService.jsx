import axios from 'axios';

const NOTIFICATION_URL = 'http://localhost:8080/notifications';

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

const notificationService = {
    getNotificationsByUser: async (userId) => {
        const response = await axios.get(`${NOTIFICATION_URL}/user/${userId}`, { headers: getAuthHeaders() });
        return response.data;
    }
};

export default notificationService;
