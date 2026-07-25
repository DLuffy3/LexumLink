import axios from 'axios';

const API_BASE = 'https://localhost:7269/api'; // adjust port if needed

// Origin without the /api suffix — used for static files like avatar images.
export const SERVER_ORIGIN = API_BASE.replace(/\/api\/?$/, '');

const api = axios.create({
    baseURL: API_BASE,
    headers: { 'Content-Type': 'application/json' },
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;