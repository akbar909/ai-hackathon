from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut, GeocoderServiceError
from typing import Optional, Tuple
import time
from utils.logger import setup_logger

logger = setup_logger(__name__)


class GeocodingService:
    """Geocoding service using free Nominatim (OpenStreetMap) API"""
    
    def __init__(self):
        self.geolocator = Nominatim(user_agent="ai-logistics-optimizer")
        self.cache = {}  # Simple in-memory cache
        
        # Fallback coordinates for common addresses (Hyderabad, Pakistan area)
        self.fallback_coords = {
            "Saddar, Hyderabad, Sindh, Pakistan": (25.3782, 68.3642),
            "saddar": (25.3782, 68.3642),
            "saddar, hyderabad": (25.3782, 68.3642),
            
            "Latifabad, Hyderabad, Sindh, Pakistan": (25.3624, 68.3462),
            "latifabad": (25.3624, 68.3462),
            "latifabad, hyderabad": (25.3624, 68.3462),
            
            "Qasimabad, Hyderabad, Sindh, Pakistan": (25.4112, 68.3889),
            "qasimabad": (25.4112, 68.3889),
            "qasimabad, hyderabad": (25.4112, 68.3889),
            
            "Auto Bahn Road, Hyderabad, Pakistan": (25.3960, 68.3578),
            "auto bahn": (25.3960, 68.3578),
            "auto bahn road": (25.3960, 68.3578),
            
            "Hyder Chowk, Hyderabad, Pakistan": (25.3701, 68.3581),
            "hyder chowk": (25.3701, 68.3581),
            
            "Kotri, Pakistan": (25.3606, 68.3094),
            "kotri": (25.3606, 68.3094),
            "kotri, sindh": (25.3606, 68.3094),
            
            "Hyderabad, Pakistan": (25.3960, 68.3578),
            "hyderabad": (25.3960, 68.3578),
        }
    
    def geocode_address(self, address: str, retry_count: int = 3) -> Optional[Tuple[float, float]]:
        """
        Convert address to coordinates.
        
        Args:
            address: Full address string
            retry_count: Number of retries on failure
            
        Returns:
            Tuple of (latitude, longitude) or None if geocoding fails
        """
        # Check cache
        if address in self.cache:
            logger.info(f"Cache hit for address: {address}")
            return self.cache[address]
        
        # Check fallback coordinates (for demo reliability)
        address_lower = address.lower()
        if address in self.fallback_coords:
            coords = self.fallback_coords[address]
            self.cache[address] = coords
            logger.info(f"Fallback coords for '{address}' -> {coords}")
            return coords
        elif address_lower in self.fallback_coords:
            coords = self.fallback_coords[address_lower]
            self.cache[address] = coords
            logger.info(f"Fallback coords for '{address}' -> {coords}")
            return coords
        
        # Try Nominatim geocoding with variations
        search_queries = [address]
        if "pakistan" not in address.lower():
            search_queries.append(f"{address}, Pakistan")
            
        for query in search_queries:
            for attempt in range(retry_count):
                try:
                    # Nominatim rate limiting: max 1 request per second
                    time.sleep(1.2)
                    
                    location = self.geolocator.geocode(query, timeout=15, exactly_one=True)
                    
                    if location:
                        coords = (location.latitude, location.longitude)
                        self.cache[address] = coords  # Cache original address
                        logger.info(f"Geocoded '{query}' -> {coords}")
                        return coords
                    
                    if attempt < retry_count - 1:
                        logger.warning(f"Retrying '{query}' (attempt {attempt+1})")
                        time.sleep(1)
                        
                except GeocoderTimedOut:
                    logger.warning(f"Geocoding timeout for '{query}'")
                    time.sleep(2)
                    continue
                    
                except GeocoderServiceError as e:
                    logger.error(f"Geocoding service error: {e}")
                    break
        
        logger.error(f"Failed to geocode address: {address}")
        return None
    
    def reverse_geocode(self, lat: float, lng: float) -> Optional[str]:
        """
        Convert coordinates to address.
        
        Args:
            lat: Latitude
            lng: Longitude
            
        Returns:
            Address string or None
        """
        try:
            time.sleep(1)  # Rate limiting
            location = self.geolocator.reverse(f"{lat}, {lng}", timeout=10)
            
            if location:
                return location.address
            return None
            
        except Exception as e:
            logger.error(f"Reverse geocoding error: {e}")
            return None


# Global instance
geocoding_service = GeocodingService()
