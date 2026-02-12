import axios from 'axios';

const API_BASE_URL = 'https://akbar909-ai-logistics-backend.hf.space';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 120000,
});

// Add token from localStorage on initialization
const token = localStorage.getItem('token');
if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

// Response interceptor for 401 handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('token');
            delete api.defaults.headers.common['Authorization'];
            // Don't redirect if already on auth pages
            if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

// Route optimization APIs
import type { DeliveryRequest, RiskZone, RouteResponse } from '../types';

export const optimizeRoute = async (request: DeliveryRequest): Promise<RouteResponse> => {
    const response = await api.post<RouteResponse>('/api/optimize', request);
    return response.data;
};

export const getRiskZones = async (): Promise<RiskZone[]> => {
    const response = await api.get<{ risk_zones: RiskZone[] }>('/api/risk-zones');
    return response.data.risk_zones;
};

export const getHistoryDetail = async (id: string) => {
    const response = await api.get(`/api/history/${id}`);
    return response.data;
};

export default api;
