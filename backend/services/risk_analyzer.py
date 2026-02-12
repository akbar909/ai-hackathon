import json
from typing import List, Tuple, Dict
from models import RiskZone, Coordinates
from models import RiskZone, Coordinates
from utils.distance import segment_intersects_circle, point_in_circle, haversine_distance
from utils.logger import setup_logger

logger = setup_logger(__name__)


class RiskAnalyzer:
    """Analyze route risks based on geographic risk zones"""
    
    def __init__(self, risk_zones_file: str = "data/risk_zones.json"):
        self.risk_zones: List[RiskZone] = []
        self._load_risk_zones(risk_zones_file)
    
    def _load_risk_zones(self, filename: str):
        """Load risk zones from JSON file"""
        try:
            with open(filename, 'r') as f:
                data = json.load(f)
                self.risk_zones = [RiskZone(**zone) for zone in data]
            logger.info(f"Loaded {len(self.risk_zones)} risk zones")
        except Exception as e:
            logger.error(f"Failed to load risk zones: {e}")
            self.risk_zones = []
    
    def analyze_route(
        self,
        route_coordinates: List[Tuple[float, float]]
    ) -> Dict:
        """
        Analyze risk for an entire route.
        
        Args:
            route_coordinates: Ordered list of (lat, lng) tuples
            
        Returns:
            Dict with risk analysis results
        """
        if not route_coordinates or len(route_coordinates) < 2:
            return {
                "total_risk_score": 0.0,
                "risk_zones_encountered": [],
                "risk_segments": [],
                "risk_level": "none"
            }
        
        total_risk_score = 0.0
        zones_encountered = []
        risk_segments = []
        
        # Analyze each segment
        total_distance = 0.0
        weighted_risk_sum = 0.0
        
        for i in range(len(route_coordinates) - 1):
            seg_start = route_coordinates[i]
            seg_end = route_coordinates[i + 1]
            
            # Calculate segment length
            seg_len = haversine_distance(seg_start[0], seg_start[1], seg_end[0], seg_end[1])
            total_distance += seg_len
            
            if seg_len == 0:
                continue
                
            segment_risk = self._analyze_segment(seg_start, seg_end)
            
            # Max risk level for this segment (if multiple zones overlap)
            # Use the highest risk level encountered on this segment
            # Or use risk_score if it represents accumulated risk? 
            # Let's use the segment_risk["risk_score"] but capped at 10 for logic consistency
            # Actually, _analyze_segment currently returns sum of (risk * portion). 
            # If segment is fully inside, risk_score = risk_level.
            
            current_seg_risk = segment_risk["risk_score"]
            weighted_risk_sum += current_seg_risk * seg_len
            
            if current_seg_risk > 0:
                risk_segments.append({
                    "segment_index": i,
                    "from": seg_start,
                    "to": seg_end,
                    "risk_score": current_seg_risk,
                    "zones": segment_risk["zones"]
                })
                
                for zone_name in segment_risk["zones"]:
                    if zone_name not in zones_encountered:
                        zones_encountered.append(zone_name)
        
        # Calculate weighted average risk (0-10 scale)
        if total_distance > 0:
            avg_risk = weighted_risk_sum / total_distance
            # Use the raw average risk.
            # Previously we multiplied by 2.0, which made medium risks (5/10) count as critical (10/10).
            # Now we keep it 1:1, so 5/10 risk = 50% safety, which is more reasonable.
            normalized_risk = min(avg_risk, 10.0)
        else:
            normalized_risk = 0.0
        
        # Determine risk level
        if normalized_risk < 2:
            risk_level = "low"
        elif normalized_risk < 5:
            risk_level = "medium"
        elif normalized_risk < 7:
            risk_level = "high"
        else:
            risk_level = "critical"
        
        return {
            "total_risk_score": round(normalized_risk, 2),
            "risk_zones_encountered": zones_encountered,
            "risk_segments": risk_segments,
            "risk_level": risk_level,
            "zones_by_type": self._categorize_zones(zones_encountered)
        }
    
    def _analyze_segment(
        self,
        seg_start: Tuple[float, float],
        seg_end: Tuple[float, float]
    ) -> Dict:
        """
        Analyze risk for a single route segment.
        
        Returns:
            Dict with segment risk info
        """
        segment_risk_score = 0.0
        zones_hit = []
        
        for zone in self.risk_zones:
            center = (zone.center.lat, zone.center.lng)
            intersects, dist_in_zone = segment_intersects_circle(
                seg_start, seg_end, center, zone.radius_km
            )
            
            if intersects:
                # Risk contribution = zone risk × distance in zone
                risk_contribution = zone.risk_level * (dist_in_zone / zone.radius_km)
                segment_risk_score += risk_contribution
                zones_hit.append(zone.name)
        
        return {
            "risk_score": segment_risk_score,
            "zones": zones_hit
        }
    
    def get_node_risk_factor(self, lat: float, lng: float) -> float:
        """
        Get risk factor for a single node/location.
        Returns multiplier (1.0 = no risk, higher = more risk)
        """
        risk_factor = 1.0
        
        for zone in self.risk_zones:
            center = (zone.center.lat, zone.center.lng)
            if point_in_circle(lat, lng, center[0], center[1], zone.radius_km):
                # Increase risk factor based on zone risk level
                risk_factor += (zone.risk_level / 10)
        
        return risk_factor
    
    def _categorize_zones(self, zone_names: List[str]) -> Dict[str, int]:
        """Categorize encountered zones by type"""
        categories = {}
        
        for zone_name in zone_names:
            zone = next((z for z in self.risk_zones if z.name == zone_name), None)
            if zone:
                zone_type = zone.zone_type
                categories[zone_type] = categories.get(zone_type, 0) + 1
        
        return categories
    
    def get_all_zones(self) -> List[Dict]:
        """Get all risk zones for visualization"""
        return [
            {
                "name": zone.name,
                "center": {"lat": zone.center.lat, "lng": zone.center.lng},
                "radius_km": zone.radius_km,
                "risk_level": zone.risk_level,
                "zone_type": zone.zone_type
            }
            for zone in self.risk_zones
        ]


# Global instance
risk_analyzer = RiskAnalyzer()
