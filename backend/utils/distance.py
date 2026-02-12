import math
from typing import Tuple


def haversine_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """
    Calculate the great circle distance between two points on Earth.
    
    Args:
        lat1, lng1: First point coordinates
        lat2, lng2: Second point coordinates
        
    Returns:
        Distance in kilometers
    """
    # Convert to radians
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lng = math.radians(lng2 - lng1)
    
    # Haversine formula
    a = (math.sin(delta_lat / 2) ** 2 +
         math.cos(lat1_rad) * math.cos(lat2_rad) *
         math.sin(delta_lng / 2) ** 2)
    c = 2 * math.asin(math.sqrt(a))
    
    # Earth's radius in kilometers
    radius_km = 6371.0
    
    return radius_km * c


def calculate_distance_matrix(coordinates: list[Tuple[float, float]]) -> list[list[float]]:
    """
    Calculate pairwise distance matrix for a list of coordinates.
    
    Args:
        coordinates: List of (lat, lng) tuples
        
    Returns:
        2D matrix of distances in kilometers
    """
    n = len(coordinates)
    matrix = [[0.0] * n for _ in range(n)]
    
    for i in range(n):
        for j in range(i + 1, n):
            dist = haversine_distance(
                coordinates[i][0], coordinates[i][1],
                coordinates[j][0], coordinates[j][1]
            )
            matrix[i][j] = dist
            matrix[j][i] = dist
    
    return matrix


def point_in_circle(point_lat: float, point_lng: float,
                    center_lat: float, center_lng: float,
                    radius_km: float) -> bool:
    """
    Check if a point is within a circular area.
    
    Args:
        point_lat, point_lng: Point coordinates
        center_lat, center_lng: Circle center coordinates
        radius_km: Circle radius in kilometers
        
    Returns:
        True if point is inside the circle
    """
    distance = haversine_distance(point_lat, point_lng, center_lat, center_lng)
    return distance <= radius_km


def segment_intersects_circle(seg_start: Tuple[float, float],
                              seg_end: Tuple[float, float],
                              center: Tuple[float, float],
                              radius_km: float) -> tuple[bool, float]:
    """
    Check if a line segment intersects a circular zone and calculate distance traveled in zone.
    
    Args:
        seg_start: (lat, lng) of segment start
        seg_end: (lat, lng) of segment end
        center: (lat, lng) of circle center
        radius_km: Circle radius in kilometers
        
    Returns:
        Tuple of (intersects: bool, distance_in_zone: float)
    """
    # Simple approximation: check if start or end points are in circle
    # For production, use proper line-circle intersection algorithm
    start_in = point_in_circle(seg_start[0], seg_start[1], center[0], center[1], radius_km)
    end_in = point_in_circle(seg_end[0], seg_end[1], center[0], center[1], radius_km)
    
    if start_in or end_in:
        # Approximate distance in zone
        segment_length = haversine_distance(seg_start[0], seg_start[1], seg_end[0], seg_end[1])
        
        if start_in and end_in:
            # Entire segment in zone
            return True, segment_length
        else:
            # Partial segment in zone (approximate as half)
            return True, segment_length * 0.5
    
    # Check if segment passes through circle (simplified)
    # Calculate closest point on segment to circle center
    dist_to_center_start = haversine_distance(seg_start[0], seg_start[1], center[0], center[1])
    dist_to_center_end = haversine_distance(seg_end[0], seg_end[1], center[0], center[1])
    
    if min(dist_to_center_start, dist_to_center_end) <= radius_km:
        return True, haversine_distance(seg_start[0], seg_start[1], seg_end[0], seg_end[1]) * 0.3
    
    return False, 0.0
