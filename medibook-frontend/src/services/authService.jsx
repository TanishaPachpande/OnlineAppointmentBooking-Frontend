import axios from 'axios';

const API_URL = 'http://localhost:8080/auth'

const authService = {
  register: async (userData) => {
    // Matches your RegisterRequestDto
    const response = await axios.post(`${API_URL}/register`, userData);
    if (response.data.token) {
      localStorage.setItem('user', JSON.stringify(response.data));
    }
    return response.data;
  },

  login: async ({ email, password }) => {  // destructure the object
  const response = await axios.post('http://localhost:8080/auth/login', {
    email,
    password
  });

  if (response.data.token) {
    localStorage.setItem('user', JSON.stringify(response.data));
  }
  return response.data;
},

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
  },

  getCurrentUser: () => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const userId = localStorage.getItem('userId');
    if (token && role) {
      return { token, role, userId };
    }
    return null;
  }
};

export default authService;