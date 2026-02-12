from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Tuple
from datetime import datetime


class VehicleInfo(BaseModel):
    """Vehicle information for cost calculation"""
    vehicle_type: str = Field(..., description="Type of vehicle (e.g., 'van', 'truck', 'car')")
    fuel_efficiency_mpg: float = Field(..., description="Miles per gallon", gt=0)
    fuel_price_per_gallon: float = Field(default=3.5, description="Current fuel price per gallon", gt=0)


class TimeWindow(BaseModel):
    """Delivery time window constraint"""
    start_time: str = Field(..., description="Start time in HH:MM format")
    end_time: str = Field(..., description="End time in HH:MM format")


class DeliveryStop(BaseModel):
    """Single delivery stop"""
    address: str = Field(..., description="Full delivery address")
    time_window: Optional[TimeWindow] = Field(None, description="Optional delivery time window")
    priority: int = Field(default=1, description="Delivery priority (1=normal, 2=high, 3=urgent)")


class DeliveryRequest(BaseModel):
    """Request for route optimization"""
    stops: List[DeliveryStop] = Field(..., min_length=1, description="List of delivery stops (1 or more)")
    vehicle: VehicleInfo = Field(..., description="Vehicle information")
    start_location: str = Field(..., description="Starting depot/warehouse address")
    avoid_peak_hours: bool = Field(default=True, description="Try to avoid peak traffic hours")
    prioritize_safety: bool = Field(default=False, description="Prioritize safer routes over shorter ones")


class Coordinates(BaseModel):
    """Geographic coordinates"""
    lat: float = Field(..., description="Latitude", ge=-90, le=90)
    lng: float = Field(..., description="Longitude", ge=-180, le=180)


class RiskZone(BaseModel):
    """Geographic risk zone definition"""
    name: str
    center: Coordinates
    radius_km: float = Field(..., gt=0)
    risk_level: int = Field(..., ge=1, le=10, description="1=low, 10=critical")
    zone_type: str = Field(..., description="Type: 'accident', 'congestion', 'crime', 'construction'")


class RouteSegment(BaseModel):
    """Single segment in the route"""
    from_address: str
    to_address: str
    from_coords: Coordinates
    to_coords: Coordinates
    distance_km: float
    estimated_time_min: float
    risk_score: float = Field(..., ge=0, le=10)


class OptimizedRoute(BaseModel):
    """Optimized route result"""
    route_id: str
    ordered_stops: List[str]
    coordinates: List[Coordinates]
    segments: List[RouteSegment]
    total_distance_km: float
    total_time_min: float
    total_risk_score: float
    route_quality_score: float = Field(..., description="Overall quality (0-100)")
    route_geometry: Optional[List[List[float]]] = Field(None, description="Road geometry [[lng,lat],...] from OSRM")


class CostPrediction(BaseModel):
    """Fuel cost prediction"""
    predicted_cost_usd: float
    confidence_lower: float
    confidence_upper: float
    cost_breakdown: dict = Field(default_factory=dict)


class AlternativeRoute(BaseModel):
    """Alternative route option"""
    route: OptimizedRoute
    cost: CostPrediction
    recommendation: str
    trade_offs: str


class RouteExplanation(BaseModel):
    """LLM-generated explanation"""
    summary: str = Field(..., description="Brief summary of the route selection")
    reasoning: str = Field(..., description="Why this route was chosen")
    trade_offs: str = Field(..., description="Key trade-offs made")
    recommendations: str = Field(..., description="Additional recommendations")


class RouteResponse(BaseModel):
    """Complete route optimization response"""
    primary_route: OptimizedRoute
    cost_prediction: CostPrediction
    risk_analysis: dict
    alternatives: List[AlternativeRoute]
    explanation: Optional[RouteExplanation] = None
    processing_time_ms: float
