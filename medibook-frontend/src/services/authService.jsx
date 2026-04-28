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
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    return JSON.parse(localStorage.getItem('user'));
  }
};

export default authService;