from typing import List, Tuple, Optional
import numpy as np
from ortools.constraint_solver import routing_enums_pb2
from ortools.constraint_solver import pywrapcp
from utils.logger import setup_logger
import uuid

logger = setup_logger(__name__)


class RouteOptimizer:
    """
    Route optimization using Google OR-Tools.
    Solves TSP (Traveling Salesman Problem) and VRP (Vehicle Routing Problem).
    """
    
    def __init__(self):
        self.manager = None
        self.routing = None
        self.solution = None
    
    def optimize_route(
        self,
        distance_matrix: np.ndarray,
        start_index: int = 0,
        time_limit_seconds: int = 30,
        penalty_cost: int = 10000
    ) -> Optional[List[int]]:
        """
        Find optimal route visiting all locations.
        
        Args:
            distance_matrix: NxN matrix of distances (can be weighted)
            start_index: Index of starting location (depot)
            time_limit_seconds: Maximum solving time
            penalty_cost: Penalty for dropping nodes (high = must visit all)
            
        Returns:
            List of node indices in optimal order, or None if no solution
        """
        # Convert to numpy array if needed
        if not isinstance(distance_matrix, np.ndarray):
            distance_matrix = np.array(distance_matrix)
        
        # Convert to integer matrix (OR-Tools requirement)
        # Multiply by 1000 to preserve precision
        int_matrix = (distance_matrix * 1000).astype(int).tolist()
        
        num_locations = len(int_matrix)
        num_vehicles = 1  # Single vehicle TSP
        
        # Create routing index manager
        self.manager = pywrapcp.RoutingIndexManager(
            num_locations,
            num_vehicles,
            start_index
        )
        
        # Create routing model
        self.routing = pywrapcp.RoutingModel(self.manager)
        
        # Create distance callback
        def distance_callback(from_index, to_index):
            from_node = self.manager.IndexToNode(from_index)
            to_node = self.manager.IndexToNode(to_index)
            return int_matrix[from_node][to_node]
        
        transit_callback_index = self.routing.RegisterTransitCallback(distance_callback)
        
        # Set arc cost evaluator
        self.routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)
        
        # Add penalty for dropping nodes (forces all nodes to be visited)
        for node in range(1, num_locations):
            self.routing.AddDisjunction([self.manager.NodeToIndex(node)], penalty_cost)
        
        # Set search parameters
        search_parameters = pywrapcp.DefaultRoutingSearchParameters()
        search_parameters.first_solution_strategy = (
            routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
        )
        search_parameters.local_search_metaheuristic = (
            routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
        )
        search_parameters.time_limit.seconds = time_limit_seconds
        search_parameters.log_search = False
        
        # Solve
        logger.info(f"Solving TSP for {num_locations} locations...")
        self.solution = self.routing.SolveWithParameters(search_parameters)
        
        if self.solution:
            logger.info(f"Solution status: {self.routing.status()}")
            route = self._extract_route()
            total_distance = self.solution.ObjectiveValue() / 1000  # Convert back
            logger.info(f"Solution found! Total distance: {total_distance:.2f} km")
            return route
        else:
            logger.error("No solution found!")
            return None
    
    def _extract_route(self) -> List[int]:
        """Extract route from solution (one-way, no return to depot)"""
        route = []
        index = self.routing.Start(0)
        
        max_iterations = 1000  # Safety limit
        iterations = 0
        
        while not self.routing.IsEnd(index) and iterations < max_iterations:
            node = self.manager.IndexToNode(index)
            route.append(node)
            index = self.solution.Value(self.routing.NextVar(index))
            iterations += 1
        
        # Don't add depot return - delivery driver doesn't return to start
        # The route goes: Start → Stop1 → Stop2 → ... → Last Stop
        
        logger.info(f"Extracted route with {len(route)} nodes: {route}")
        
        return route
    
    def get_route_distance(self, distance_matrix: np.ndarray, route: List[int]) -> float:
        """
        Calculate total distance for a given route.
        
        Args:
            distance_matrix: Distance matrix
            route: Ordered list of node indices
            
        Returns:
            Total distance in km
        """
        # Convert to numpy array if needed
        if not isinstance(distance_matrix, np.ndarray):
            distance_matrix = np.array(distance_matrix)
        
        total = 0.0
        for i in range(len(route) - 1):
            total += distance_matrix[route[i]][route[i + 1]]
        return total
    
    def generate_alternative_route(
        self,
        distance_matrix: np.ndarray,
        start_index: int = 0,
        optimization_objective: str = "balanced"
    ) -> Optional[List[int]]:
        """
        Generate alternative routes with different optimization objectives.
        
        Args:
            distance_matrix: Distance matrix
            start_index: Starting location
            optimization_objective: "shortest", "safest", or "balanced"
            
        Returns:
            Alternative route
        """
        if optimization_objective == "shortest":
            # Use unweighted distance (ignore risk/traffic)
            return self.optimize_route(distance_matrix, start_index, time_limit_seconds=20)
        
        elif optimization_objective == "safest":
            # Heavily penalize risk (increase risk weights)
            # This would be passed from the caller
            return self.optimize_route(distance_matrix, start_index, time_limit_seconds=20)
        
        else:  # balanced
            return self.optimize_route(distance_matrix, start_index, time_limit_seconds=20)


# Global instance
route_optimizer = RouteOptimizer()
