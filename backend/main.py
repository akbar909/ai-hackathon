from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from models import (
    DeliveryRequest, RouteResponse, OptimizedRoute, CostPrediction,
    AlternativeRoute, RouteExplanation, RouteSegment, Coordinates
)
from services.geocoding import geocoding_service
from services.graph_builder import GraphBuilder
from services.route_optimizer import RouteOptimizer
from services.cost_predictor import cost_predictor
from services.risk_analyzer import risk_analyzer
from services.alternative_generator import AlternativeGenerator
from services.explainer import explainer_service
from services.osrm_router import osrm_router
from config import settings
from utils.logger import setup_logger
from database import connect_db, close_db, get_db
from auth import get_optional_user
from routes.auth_routes import router as auth_router
from routes.history_routes import router as history_router
import time
import uuid
from datetime import datetime

logger = setup_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown lifecycle"""
    await connect_db()
    yield
    await close_db()


app = FastAPI(
    title="AI Logistics Route Optimizer",
    description="Optimize delivery routes with AI-powered cost prediction and risk analysis",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(history_router)


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "AI Logistics Route Optimizer",
        "version": "1.0.0"
    }


@app.get("/api/risk-zones")
async def get_risk_zones():
    """Get all risk zones for map visualization"""
    try:
        zones = risk_analyzer.get_all_zones()
        return {"risk_zones": zones}
    except Exception as e:
        logger.error(f"Error fetching risk zones: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch risk zones")


@app.post("/api/optimize", response_model=RouteResponse)
async def optimize_route(request: DeliveryRequest, current_user: dict = Depends(get_optional_user)):
    """
    Main route optimization endpoint.
    
    Process:
    1. Geocode all addresses
    2. Build weighted graph
    3. Optimize primary route
    4. Predict costs
    5. Analyze risks
    6. Generate alternatives
    7. Get LLM explanation
    """
    start_time = time.time()
    
    try:
        logger.info(f"Received optimization request with {len(request.stops)} stops")
        
        # Step 1: Geocode all addresses
        logger.info("Step 1: Geocoding addresses...")
        all_addresses = [request.start_location] + [stop.address for stop in request.stops]
        coordinates = []
        valid_addresses = []
        
        for addr in all_addresses:
            coords = geocoding_service.geocode_address(addr)
            if coords is None:
                raise HTTPException(
                    status_code=400,
                    detail=f"Failed to geocode address: {addr}"
                )
            coordinates.append(coords)
            valid_addresses.append(addr)
        
        logger.info(f"Geocoded {len(coordinates)} addresses")
        
        # Step 2: Build graph with risk factors
        logger.info("Step 2: Building weighted graph...")
        graph_builder = GraphBuilder()
        
        # Get risk factors for each node
        risk_factors = [
            risk_analyzer.get_node_risk_factor(lat, lng)
            for lat, lng in coordinates
        ]
        
        # Traffic factor (simplified - could be time-based)
        traffic_factor = 1.5 if not request.avoid_peak_hours else 1.1
        traffic_factors = [traffic_factor] * len(coordinates)
        
        
        # Step 2: Get real road distances using OSRM
        logger.info("Step 2: Getting road distances with OSRM...")
        
        # Try OSRM for actual driving distances
        base_distance_matrix = osrm_router.get_distance_matrix(coordinates)
        
        # Fallback to Haversine if OSRM unavailable
        if base_distance_matrix is None:
            logger.warning("OSRM unavailable, using Haversine distances")
            from utils.distance import calculate_distance_matrix
            base_distance_matrix = calculate_distance_matrix(coordinates)
        
        # Build weighted graph
        if request.prioritize_safety:
            # Amplify risk factors for safer routing
            risk_factors = [rf ** 1.5 for rf in risk_factors]
        
        weighted_matrix = graph_builder.build_graph(
            coordinates,
            valid_addresses,
            traffic_factors,
            risk_factors
        )
        
        # Step 3: Optimize primary route
        logger.info("Step 3: Optimizing route...")
        optimizer = RouteOptimizer()
        # Use very high penalty to force visiting all nodes even with weighted matrix
        route_indices = optimizer.optimize_route(
            weighted_matrix, 
            start_index=0, 
            time_limit_seconds=2,  # Fast optimization for delivery routes
            penalty_cost=1000000  # Very high penalty to force all visits
        )
        
        if not route_indices:
            raise HTTPException(status_code=500, detail="Failed to find optimal route")
        
        logger.info(f"Route indices: {route_indices}")
        logger.info(f"Base distance matrix shape: {len(base_distance_matrix)}x{len(base_distance_matrix[0]) if base_distance_matrix else 0}")
        
        # Calculate actual distance (unweighted)
        total_distance = optimizer.get_route_distance(base_distance_matrix, route_indices)
        
        logger.info(f"Total distance calculated: {total_distance} km")
        
        # Build ordered route
        ordered_stops = [valid_addresses[i] for i in route_indices]
        ordered_coords = [coordinates[i] for i in route_indices]
        
        # Create route segments
        segments = []
        for i in range(len(route_indices) - 1):
            from_idx = route_indices[i]
            to_idx = route_indices[i + 1]
            
            seg_coords = [coordinates[from_idx], coordinates[to_idx]]
            seg_risk = risk_analyzer.analyze_route(seg_coords)
            
            segment = RouteSegment(
                from_address=valid_addresses[from_idx],
                to_address=valid_addresses[to_idx],
                from_coords=Coordinates(lat=coordinates[from_idx][0], lng=coordinates[from_idx][1]),
                to_coords=Coordinates(lat=coordinates[to_idx][0], lng=coordinates[to_idx][1]),
                distance_km=round(base_distance_matrix[from_idx][to_idx], 2),
                estimated_time_min=round(base_distance_matrix[from_idx][to_idx] / 50 * 60, 1),
                risk_score=seg_risk["total_risk_score"]
            )
            segments.append(segment)
        
        # Step 4: Analyze risk
        logger.info("Step 4: Analyzing route risks...")
        risk_analysis = risk_analyzer.analyze_route(ordered_coords)
        
        # Cost prediction moved after OSRM fetch to use accurate distance
        
        # Get actual road geometry from OSRM
        logger.info("Getting road geometry from OSRM...")
        route_geometry = None
        osrm_route = osrm_router.get_route(ordered_coords)
        if osrm_route:
            route_geometry = osrm_route["geometry"]
            # Use OSRM's actual distance/time if available
            osrm_distance = osrm_route["distance_meters"] / 1000.0
            osrm_time = osrm_route["duration_seconds"] / 60.0
            if osrm_distance > 0:
                total_distance = osrm_distance
                total_time_min = osrm_time
                logger.info(f"OSRM distance: {total_distance:.1f} km, time: {total_time_min:.1f} min")

        # Step 5: Predict cost (Recalculate with accurate OSRM distance if available)
        logger.info("Step 5: Predicting fuel costs...")
        avg_speed = 65 if request.avoid_peak_hours else 50
        cost_prediction = cost_predictor.predict_cost(
            total_distance_km=total_distance,
            num_stops=len(request.stops),
            avg_speed_kmh=avg_speed,
            traffic_factor=traffic_factor,
            vehicle_efficiency_mpg=request.vehicle.fuel_efficiency_mpg
        )
        
        # Update estimated time if OSRM failed (otherwise valid from OSRM block)
        if not osrm_route:
            total_time_min = (total_distance / avg_speed) * 60
        
        # Calculate route quality score (0-100)
        distance_score = max(0, 100 - (total_distance / 2))
        risk_score = max(0, 100 - (risk_analysis["total_risk_score"] * 10))
        cost_score = max(0, 100 - (cost_prediction["predicted_cost_usd"] / 50))  # Adjusted for PKR
        quality_score = (distance_score * 0.4 + risk_score * 0.4 + cost_score * 0.2)
        
        # Build primary route
        primary_route = OptimizedRoute(
            route_id=str(uuid.uuid4()),
            ordered_stops=ordered_stops,
            coordinates=[Coordinates(lat=c[0], lng=c[1]) for c in ordered_coords],
            segments=segments,
            total_distance_km=round(total_distance, 2),
            total_time_min=round(total_time_min, 1),
            total_risk_score=risk_analysis["total_risk_score"],
            route_quality_score=round(quality_score, 1),
            route_geometry=route_geometry
        )
        
        # Step 6: Generate alternatives
        logger.info("Step 6: Generating alternative routes...")
        alt_generator = AlternativeGenerator(
            graph_builder=graph_builder,
            route_optimizer=optimizer,
            cost_predictor=cost_predictor,
            risk_analyzer=risk_analyzer,
            osrm_router=osrm_router
        )
        
        alternatives_data = alt_generator.generate_alternatives(
            coordinates,
            valid_addresses,
            base_distance_matrix,
            request.vehicle.fuel_efficiency_mpg,
            traffic_factor
        )
        
        # Format alternatives
        alternatives = []
        for alt_data in alternatives_data:
            alt_route = OptimizedRoute(
                route_id=str(uuid.uuid4()),
                ordered_stops=[valid_addresses[i] for i in alt_data["route_indices"]],
                coordinates=[Coordinates(lat=c[0], lng=c[1]) for c in alt_data["route_coords"]],
                segments=[],  # Skip detailed segments for alternatives
                total_distance_km=alt_data["total_distance_km"],
                total_time_min=alt_data["total_time_min"],
                total_risk_score=alt_data["risk_score"],
                route_quality_score=70.0  # Placeholder
            )
            
            alt = AlternativeRoute(
                route=alt_route,
                cost=CostPrediction(**alt_data["cost"]),
                recommendation=alt_data["recommendation"],
                trade_offs=alt_data["trade_offs"]
            )
            alternatives.append(alt)
        
        # Step 7: Generate LLM explanation
        logger.info("Step 7: Generating AI explanation...")
        explanation = None
        
        # Only try LLM if API key is configured
        if settings.gemini_api_key and len(settings.gemini_api_key) > 20:
            try:
                explanation_data = explainer_service.generate_explanation(
                    primary_route={
                        "total_distance_km": total_distance,
                        "total_time_min": total_time_min,
                        "num_stops": len(request.stops)
                    },
                    alternatives=[
                        {
                            "name": alt_data["name"],
                            "total_distance_km": alt_data["total_distance_km"],
                            "total_time_min": alt_data["total_time_min"],
                            "risk_score": alt_data["risk_score"],
                            "cost": alt_data["cost"],
                            "trade_offs": alt_data["trade_offs"]
                        }
                        for alt_data in alternatives_data
                    ],
                    cost_data=cost_prediction,
                    risk_data=risk_analysis
                )
                
                if explanation_data:
                    explanation = RouteExplanation(**explanation_data)
            except Exception as e:
                logger.warning(f"Failed to generate explanation: {e}")
        else:
            logger.info("Gemini API key not configured, skipping AI explanation")
        
        # Calculate processing time
        processing_time_ms = (time.time() - start_time) * 1000
        
        logger.info(f"Route optimization completed in {processing_time_ms:.0f}ms")
        
        # Build response
        response = RouteResponse(
            primary_route=primary_route,
            cost_prediction=CostPrediction(**cost_prediction),
            risk_analysis=risk_analysis,
            alternatives=alternatives,
            explanation=explanation,
            processing_time_ms=round(processing_time_ms, 2)
        )
        
        # Save to history if user is authenticated
        if current_user:
            try:
                db = get_db()
                await db.history.insert_one({
                    "user_id": current_user["user_id"],
                    "start_location": request.start_location,
                    "num_stops": len(request.stops),
                    "total_distance_km": round(total_distance, 2),
                    "total_time_min": round(total_time_min, 1),
                    "predicted_cost": cost_prediction["predicted_cost_usd"],
                    "risk_score": risk_analysis["total_risk_score"],
                    "quality_score": round(quality_score, 1),
                    "created_at": datetime.utcnow(),
                })
                logger.info(f"Saved optimization to history for user {current_user['user_id']}")
            except Exception as e:
                logger.warning(f"Failed to save history: {e}")
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error during optimization: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=settings.backend_port)
