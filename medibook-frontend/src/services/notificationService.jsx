import axios from 'axios';

const NOTIFICATION_URL = 'http://localhost:8080/notifications';

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

const notificationService = {
    getNotificationsByUser: async (userId) => {
        const response = await axios.get(`${NOTIFICATION_URL}/user/${userId}`, { headers: getAuthHeaders() });
        return response.data;
    }
};

export default notificationService;