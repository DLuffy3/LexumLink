import axios from 'axios';

// In production (single-site IIS) the SPA and API share an origin, so use a
// relative path. In dev the API runs on its own HTTPS port.
const API_BASE = import.meta.env.PROD ? '/api' : 'https://localhost:7269/api';

// Origin without the /api suffix — used for static files like avatar images.
// Resolves to '' in production (same-origin) and the dev server origin locally.
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