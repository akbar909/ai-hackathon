import axios from 'axios';
import type { DeliveryRequest, RiskZone, RouteResponse } from '../types';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 120000, // 2 minutes for route optimization
});

export const optimizeRoute = async (request: DeliveryRequest): Promise<RouteResponse> => {
    const response = await api.post<RouteResponse>('/api/optimize', request);
    return response.data;
};

export const getRiskZones = async (): Promise<RiskZone[]> => {
    const response = await api.get<{ risk_zones: RiskZone[] }>('/api/risk-zones');
    return response.data.risk_zones;
};

export default api;
