export interface Coordinates {
    lat: number;
    lng: number;
}

export interface VehicleInfo {
    vehicle_type: string;
    fuel_efficiency_mpg: number;
    fuel_price_per_gallon?: number;
}

export interface TimeWindow {
    start_time: string;
    end_time: string;
}

export interface DeliveryStop {
    address: string;
    time_window?: TimeWindow;
    priority?: number;
}

export interface DeliveryRequest {
    stops: DeliveryStop[];
    vehicle: VehicleInfo;
    start_location: string;
    avoid_peak_hours?: boolean;
    prioritize_safety?: boolean;
}

export interface RouteSegment {
    from_address: string;
    to_address: string;
    from_coords: Coordinates;
    to_coords: Coordinates;
    distance_km: number;
    estimated_time_min: number;
    risk_score: number;
}

export interface OptimizedRoute {
    route_id: string;
    ordered_stops: string[];
    coordinates: Coordinates[];
    segments: RouteSegment[];
    total_distance_km: number;
    total_time_min: number;
    total_risk_score: number;
    route_quality_score: number;
    route_geometry?: number[][];  // [[lng,lat],...] from OSRM
}

export interface CostPrediction {
    predicted_cost_usd: number;
    confidence_lower: number;
    confidence_upper: number;
    cost_breakdown: {
        estimated_fuel_liters: number;
        base_fuel_cost: number;
        traffic_penalty: number;
        idle_cost: number;
        stop_penalty: number;
    };
}

export interface RiskAnalysis {
    total_risk_score: number;
    risk_zones_encountered: string[];
    risk_segments: any[];
    risk_level: 'none' | 'low' | 'medium' | 'high' | 'critical';
    zones_by_type: Record<string, number>;
}

export interface RouteExplanation {
    summary: string;
    reasoning: string;
    trade_offs: string;
    recommendations: string;
}

export interface AlternativeRoute {
    route: OptimizedRoute;
    cost: CostPrediction;
    recommendation: string;
    trade_offs: string;
}

export interface RouteResponse {
    primary_route: OptimizedRoute;
    cost_prediction: CostPrediction;
    risk_analysis: RiskAnalysis;
    alternatives: AlternativeRoute[];
    explanation?: RouteExplanation;
    processing_time_ms: number;
}

export interface RiskZone {
    name: string;
    center: Coordinates;
    radius_km: number;
    risk_level: number;
    zone_type: 'construction' | 'accident' | 'congestion' | 'crime';
}
