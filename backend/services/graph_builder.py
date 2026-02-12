from typing import List, Tuple, Dict
import numpy as np
from utils.distance import calculate_distance_matrix
from utils.logger import setup_logger

logger = setup_logger(__name__)


class GraphBuilder:
    """Build weighted road network graph for route optimization"""
    
    def __init__(self):
        self.nodes = []  # List of (lat, lng) tuples
        self.node_names = []  # Corresponding address names
        self.distance_matrix = []
        self.weighted_matrix = []
    
    def build_graph(
        self,
        coordinates: List[Tuple[float, float]],
        names: List[str],
        traffic_factors: List[float] = None,
        risk_factors: List[float] = None
    ) -> np.ndarray:
        """
        Build weighted graph from coordinates.
        
        Args:
            coordinates: List of (lat, lng) tuples
            names: List of location names
            traffic_factors: Optional traffic multipliers for each node
            risk_factors: Optional risk multipliers for each node
            
        Returns:
            Weighted distance matrix (NxN numpy array)
        """
        self.nodes = coordinates
        self.node_names = names
        n = len(coordinates)
        
        # Calculate base distance matrix
        self.distance_matrix = calculate_distance_matrix(coordinates)
        
        # Initialize traffic and risk factors if not provided
        if traffic_factors is None:
            traffic_factors = [1.0] * n
        if risk_factors is None:
            risk_factors = [1.0] * n
        
        # Build weighted matrix
        # Edge weight = Distance × (avg traffic of endpoints) × (avg risk of endpoints)
        weighted = np.zeros((n, n))
        
        for i in range(n):
            for j in range(n):
                if i != j:
                    base_dist = self.distance_matrix[i][j]
                    avg_traffic = (traffic_factors[i] + traffic_factors[j]) / 2
                    avg_risk = (risk_factors[i] + risk_factors[j]) / 2
                    weighted[i][j] = base_dist * avg_traffic * avg_risk
        
        self.weighted_matrix = weighted
        logger.info(f"Built graph with {n} nodes")
        
        return weighted
    
    def get_edge_weight(self, from_idx: int, to_idx: int) -> float:
        """Get weight of edge between two nodes"""
        return self.weighted_matrix[from_idx][to_idx]
    
    def get_distance(self, from_idx: int, to_idx: int) -> float:
        """Get actual distance between two nodes (without weights)"""
        return self.distance_matrix[from_idx][to_idx]
    
    def get_node_info(self, idx: int) -> Dict:
        """Get information about a node"""
        return {
            "index": idx,
            "name": self.node_names[idx],
            "coordinates": self.nodes[idx]
        }
