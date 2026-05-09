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
        if (!userId) throw new Error('userId is required');
        const response = await axios.get(`${NOTIFICATION_URL}/user/${userId}`, {
            headers: getAuthHeaders()
        });
        return response.data;
    },

    markAsRead: async (notificationId) => {
        const response = await axios.put(
            `${NOTIFICATION_URL}/${notificationId}/read`,
            {},
            { headers: getAuthHeaders() }
        );
        return response.data;
    },

    deleteNotification: async (notificationId) => {
        const response = await axios.delete(
            `${NOTIFICATION_URL}/${notificationId}`,
            { headers: getAuthHeaders() }
        );
        return response.data;
    }
};

export default notificationService;
