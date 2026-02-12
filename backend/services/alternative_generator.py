from typing import List, Dict, Tuple
import numpy as np
from models import OptimizedRoute, AlternativeRoute, CostPrediction, Coordinates
from services.route_optimizer import RouteOptimizer
from services.graph_builder import GraphBuilder
from services.cost_predictor import CostPredictor
from services.risk_analyzer import RiskAnalyzer
from utils.logger import setup_logger
import copy

logger = setup_logger(__name__)


class AlternativeGenerator:
    """Generate alternative route options with different trade-offs"""
    
    def __init__(
        self,
        graph_builder: GraphBuilder,
        route_optimizer: RouteOptimizer,
        cost_predictor: CostPredictor,
        risk_analyzer: RiskAnalyzer,
        osrm_router=None
    ):
        self.graph_builder = graph_builder
        self.optimizer = route_optimizer
        self.cost_predictor = cost_predictor
        self.risk_analyzer = risk_analyzer
        self.osrm_router = osrm_router
    
    def _get_osrm_stats(self, route_indices: List[int], coordinates: List[Tuple[float, float]]) -> Tuple[float, float, object]:
        """Helper to get real stats from OSRM if available"""
        if not self.osrm_router:
            return None, None, None
            
        ordered_coords = [coordinates[i] for i in route_indices]
        # Get route from OSRM
        osrm_route = self.osrm_router.get_route(ordered_coords)
        
        if osrm_route:
            dist_km = osrm_route["distance_meters"] / 1000.0
            time_min = osrm_route["duration_seconds"] / 60.0
            geometry = osrm_route["geometry"]
            return dist_km, time_min, geometry
            
        return None, None, None
    
    def generate_alternatives(
        self,
        coordinates: List[Tuple[float, float]],
        names: List[str],
        base_distance_matrix: np.ndarray,
        vehicle_efficiency_mpg: float,
        traffic_factor: float = 1.2
    ) -> List[Dict]:
        """
        Generate alternative routes with different optimization strategies.
        
        Returns:
            List of alternative route dictionaries
        """
        alternatives = []
        
        # Alternative 1: Shortest distance (minimize distance only)
        alt1 = self._generate_shortest_route(
            coordinates, names, base_distance_matrix,
            vehicle_efficiency_mpg, traffic_factor
        )
        if alt1:
            alternatives.append(alt1)
        
        # Alternative 2: Safest route (minimize risk)
        alt2 = self._generate_safest_route(
            coordinates, names, base_distance_matrix,
            vehicle_efficiency_mpg, traffic_factor
        )
        if alt2:
            # Check if Safest is identical to Shortest (common for single A->B trips)
            if alt1 and abs(alt2['total_distance_km'] - alt1['total_distance_km']) < 0.05 and abs(alt2['risk_score'] - alt1['risk_score']) < 0.01:
                alt2['recommendation'] += " (Same path as shortest)"
                alt2['trade_offs'] = "No safer alternative path found (single optimal road)"
            alternatives.append(alt2)
        
        # Alternative 3: Off-peak timing (reduce traffic factor)
        alt3 = self._generate_offpeak_route(
            coordinates, names, base_distance_matrix,
            vehicle_efficiency_mpg
        )
        if alt3:
            alternatives.append(alt3)
        
        logger.info(f"Generated {len(alternatives)} alternative routes")
        return alternatives
    
    def _generate_shortest_route(
        self,
        coordinates: List[Tuple[float, float]],
        names: List[str],
        distance_matrix: np.ndarray,
        vehicle_efficiency_mpg: float,
        traffic_factor: float
    ) -> Dict:
        """Generate route optimized purely for shortest distance"""
        # Use unweighted distance matrix (no risk/traffic penalties)
        route_indices = self.optimizer.optimize_route(distance_matrix, start_index=0, time_limit_seconds=2, penalty_cost=1000000)
        
        if not route_indices:
            return None
        
        total_distance = self.optimizer.get_route_distance(distance_matrix, route_indices)
        total_time_min = total_distance / 50 * 60  # Default estimate
        geometry = None
        
        # Try to get real OSRM stats
        real_dist, real_time, real_geometry = self._get_osrm_stats(route_indices, coordinates)
        if real_dist:
            total_distance = real_dist
            total_time_min = real_time
            geometry = real_geometry
        
        # Get route coordinates
        route_coords = [coordinates[i] for i in route_indices]
        
        # Analyze risk
        risk_analysis = self.risk_analyzer.analyze_route(route_coords)
        
        # Predict cost
        cost_pred = self.cost_predictor.predict_cost(
            total_distance_km=total_distance,
            num_stops=len(coordinates) - 1,
            avg_speed_kmh=50,
            traffic_factor=traffic_factor,
            vehicle_efficiency_mpg=vehicle_efficiency_mpg
        )
        
        return {
            "name": "Shortest Distance",
            "route_indices": route_indices,
            "route_coords": route_coords,
            "total_distance_km": round(total_distance, 2),
            "total_time_min": round(total_time_min, 1),
            "risk_score": risk_analysis["total_risk_score"],
            "cost": cost_pred,
            "recommendation": "Fastest delivery time, but may pass through risky areas",
            "trade_offs": f"Saves {round(total_distance * 0.02, 1)} km but risk is {risk_analysis['risk_level']}",
            "geometry": geometry
        }
    
    def _generate_safest_route(
        self,
        coordinates: List[Tuple[float, float]],
        names: List[str],
        base_distance_matrix: np.ndarray,
        vehicle_efficiency_mpg: float,
        traffic_factor: float
    ) -> Dict:
        """Generate route optimized for safety (avoid risk zones)"""
        # Get risk factors for each node
        risk_factors = []
        for lat, lng in coordinates:
            rf = self.risk_analyzer.get_node_risk_factor(lat, lng)
            risk_factors.append(rf)
        
        # Create heavily risk-weighted matrix
        n = len(coordinates)
        risk_weighted_matrix = np.zeros((n, n))
        
        for i in range(n):
            for j in range(n):
                if i != j:
                    base_dist = base_distance_matrix[i][j]
                    avg_risk = (risk_factors[i] + risk_factors[j]) / 2
                    # Amplify risk penalty (square it)
                    risk_weighted_matrix[i][j] = base_dist * (avg_risk ** 2)
        
        # Optimize with risk-weighted matrix
        route_indices = self.optimizer.optimize_route(
            risk_weighted_matrix, 
            start_index=0,
            time_limit_seconds=2,
            penalty_cost=1000000  # High penalty to ensure all nodes visited
        )
        
        if not route_indices:
            return None
        
        # Calculate real distance (not weighted)
        total_distance = self.optimizer.get_route_distance(base_distance_matrix, route_indices)
        total_time_min = total_distance / 50 * 60  # Default estimate
        geometry = None
        
        # Try to get real OSRM stats
        real_dist, real_time, real_geometry = self._get_osrm_stats(route_indices, coordinates)
        if real_dist:
            total_distance = real_dist
            total_time_min = real_time
            geometry = real_geometry
        
        route_coords = [coordinates[i] for i in route_indices]
        risk_analysis = self.risk_analyzer.analyze_route(route_coords)
        
        cost_pred = self.cost_predictor.predict_cost(
            total_distance_km=total_distance,
            num_stops=len(coordinates) - 1,
            avg_speed_kmh=50,
            traffic_factor=traffic_factor,
            vehicle_efficiency_mpg=vehicle_efficiency_mpg
        )
        
        return {
            "name": "Safest Route",
            "route_indices": route_indices,
            "route_coords": route_coords,
            "total_distance_km": round(total_distance, 2),
            "total_time_min": round(total_time_min, 1),
            "risk_score": risk_analysis["total_risk_score"],
            "cost": cost_pred,
            "recommendation": "Avoids high-risk zones, may be slightly longer",
            "trade_offs": f"Risk level: {risk_analysis['risk_level']}, may add {round(total_distance * 0.05, 1)} km",
            "geometry": geometry
        }
    
    def _generate_offpeak_route(
        self,
        coordinates: List[Tuple[float, float]],
        names: List[str],
        distance_matrix: np.ndarray,
        vehicle_efficiency_mpg: float
    ) -> Dict:
        """Generate route optimized for off-peak hours (low traffic)"""
        route_indices = self.optimizer.optimize_route(distance_matrix, start_index=0, time_limit_seconds=2, penalty_cost=1000000)
        
        if not route_indices:
            return None
        
        total_distance = self.optimizer.get_route_distance(distance_matrix, route_indices)
        geometry = None
        
        # Try to get real OSRM stats
        real_dist, _, real_geometry = self._get_osrm_stats(route_indices, coordinates)
        if real_dist:
            total_distance = real_dist
            geometry = real_geometry
        
        route_coords = [coordinates[i] for i in route_indices]
        risk_analysis = self.risk_analyzer.analyze_route(route_coords)
        
        # Off-peak traffic factor is much lower
        off_peak_traffic = 0.9
        
        cost_pred = self.cost_predictor.predict_cost(
            total_distance_km=total_distance,
            num_stops=len(coordinates) - 1,
            avg_speed_kmh=65,  # Faster during off-peak
            traffic_factor=off_peak_traffic,
            vehicle_efficiency_mpg=vehicle_efficiency_mpg
        )
        
        return {
            "name": "Off-Peak Schedule",
            "route_indices": route_indices,
            "route_coords": route_coords,
            "total_distance_km": round(total_distance, 2),
            "total_time_min": round(total_distance / 65 * 60, 1),
            "risk_score": risk_analysis["total_risk_score"],
            "cost": cost_pred,
            "recommendation": "Deliver during off-peak hours (10 PM - 6 AM) for lower costs",
            "trade_offs": "Requires night shift, but saves ~20-30% on fuel cost due to less traffic",
            "geometry": geometry
        }
