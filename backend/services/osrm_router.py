"""
OSRM (Open Source Routing Machine) integration for real road routing.
Provides turn-by-turn directions and actual driving distances.
"""
import httpx
from typing import List, Tuple, Optional, Dict
from utils.logger import setup_logger

logger = setup_logger(__name__)


class OSRMRouter:
    """Real-world routing using OSRM"""
    
    def __init__(self):
        # Using public OSRM demo server (for production, host your own!)
        self.base_url = "http://router.project-osrm.org"
        
    def get_route(
        self, 
        coordinates: List[Tuple[float, float]], 
        profile: str = "driving"
    ) -> Optional[Dict]:
        """
        Get actual road route between multiple points.
        
        Args:
            coordinates: List of (lat, lng) tuples
            profile: 'driving', 'walking', or 'cycling'
            
        Returns:
            Dict with route geometry, distance, duration, and steps
        """
        try:
            # OSRM expects lng,lat (not lat,lng!)
            coords_str = ";".join([f"{lng},{lat}" for lat, lng in coordinates])
            
            url = f"{self.base_url}/route/v1/{profile}/{coords_str}"
            params = {
                "overview": "full",
                "geometries": "geojson",
                "steps": "true",
                "annotations": "true"
            }
            
            with httpx.Client(timeout=30) as client:
                response = client.get(url, params=params)
                response.raise_for_status()
                
                data = response.json()
                
                if data["code"] != "Ok":
                    logger.error(f"OSRM error: {data.get('message', 'Unknown error')}")
                    return None
                
                route = data["routes"][0]
                
                return {
                    "geometry": route["geometry"]["coordinates"],  # List of [lng, lat]
                    "distance_meters": route["distance"],
                    "duration_seconds": route["duration"],
                    "steps": self._extract_steps(route.get("legs", []))
                }
                
        except Exception as e:
            logger.error(f"OSRM routing failed: {e}")
            return None
    
    def _extract_steps(self, legs: List[Dict]) -> List[Dict]:
        """Extract turn-by-turn directions from OSRM legs"""
        all_steps = []
        
        for leg in legs:
            for step in leg.get("steps", []):
                all_steps.append({
                    "instruction": step.get("maneuver", {}).get("instruction", "Continue"),
                    "distance_meters": step.get("distance", 0),
                    "duration_seconds": step.get("duration", 0),
                    "type": step.get("maneuver", {}).get("type", "turn"),
                    "modifier": step.get("maneuver", {}).get("modifier", ""),
                    "name": step.get("name", "")
                })
        
        return all_steps
    
    def get_distance_matrix(
        self, 
        coordinates: List[Tuple[float, float]]
    ) -> Optional[List[List[float]]]:
        """
        Get driving distance matrix between all points.
        
        Args:
            coordinates: List of (lat, lng) tuples
            
        Returns:
            2D matrix of distances in kilometers
        """
        try:
            # OSRM expects lng,lat
            coords_str = ";".join([f"{lng},{lat}" for lat, lng in coordinates])
            
            url = f"{self.base_url}/table/v1/driving/{coords_str}"
            params = {
                "annotations": "distance"
            }
            
            with httpx.Client(timeout=30) as client:
                response = client.get(url, params=params)
                response.raise_for_status()
                
                data = response.json()
                
                if data["code"] != "Ok":
                    logger.error(f"OSRM table error: {data.get('message')}")
                    return None
                
                # Convert from meters to kilometers
                distances = data["distances"]
                return [[d / 1000.0 for d in row] for row in distances]
                
        except Exception as e:
            logger.error(f"OSRM distance matrix failed: {e}")
            return None


# Global instance
osrm_router = OSRMRouter()
