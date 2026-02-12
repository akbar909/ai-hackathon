import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
import pickle
import os
from typing import Dict, Tuple
from utils.logger import setup_logger

logger = setup_logger(__name__)


class CostPredictor:
    """ML-based fuel cost prediction using Random Forest"""
    
    def __init__(self, model_path: str = "ml/cost_model_v2.pkl"):
        self.model_path = model_path
        self.model: RandomForestRegressor = None
        self.feature_names = [
            'total_distance_km',
            'num_stops',
            'avg_speed_kmh',
            'traffic_factor',
            'vehicle_efficiency_mpg',
            'idle_time_min'
        ]
        self._load_or_train_model()
    
    def _load_or_train_model(self):
        """Load existing model or train new one"""
        if os.path.exists(self.model_path):
            logger.info(f"Loading model from {self.model_path}")
            with open(self.model_path, 'rb') as f:
                self.model = pickle.load(f)
        else:
            logger.info("No existing model found. Training new model...")
            self._train_model()
    
    def _generate_training_data(self, n_samples: int = 1000) -> pd.DataFrame:
        """Generate synthetic training data"""
        np.random.seed(42)
        
        data = {
            'total_distance_km': np.random.uniform(5, 200, n_samples),
            'num_stops': np.random.randint(2, 20, n_samples),
            'avg_speed_kmh': np.random.uniform(20, 80, n_samples),
            'traffic_factor': np.random.uniform(1.0, 2.0, n_samples),
            'vehicle_efficiency_mpg': np.random.uniform(15, 35, n_samples),
            'idle_time_min': np.random.uniform(5, 60, n_samples)
        }
        
        df = pd.DataFrame(data)
        
        # Realistic cost calculation
        # Cost = (Distance / Efficiency) × Fuel Price × Traffic Factor + Idle Cost
        km_per_liter = df['vehicle_efficiency_mpg'] * 0.425  # Convert MPG to km/L
        liters_needed = df['total_distance_km'] / km_per_liter
        fuel_price_per_liter = 268.0  # PKR ~268/liter in Pakistan
        
        fuel_cost = liters_needed * fuel_price_per_liter * df['traffic_factor']
        
        # Add idle cost (engine running)
        idle_cost = (df['idle_time_min'] / 60) * 50  # PKR 50 per hour idle
        
        # Add stop penalty (time spent at each stop)
        stop_cost = df['num_stops'] * 30  # PKR 30 per stop
        
        # Base fare (driver wage/vehicle maintenance start)
        base_fare = 150.0
        
        df['cost_pkr'] = fuel_cost + idle_cost + stop_cost + base_fare
        
        # Add some noise
        df['cost_pkr'] += np.random.normal(0, df['cost_pkr'] * 0.05, n_samples)
        
        return df
    
    def _train_model(self):
        """Train Random Forest model"""
        # Generate training data
        df = self._generate_training_data(n_samples=2000)
        
        X = df[self.feature_names]
        y = df['cost_pkr']
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        
        # Train model
        self.model = RandomForestRegressor(
            n_estimators=100,
            max_depth=15,
            min_samples_split=5,
            random_state=42,
            n_jobs=-1
        )
        
        logger.info("Training Random Forest model...")
        self.model.fit(X_train, y_train)
        
        # Evaluate
        train_score = self.model.score(X_train, y_train)
        test_score = self.model.score(X_test, y_test)
        
        logger.info(f"Model trained - Train R²: {train_score:.3f}, Test R²: {test_score:.3f}")
        
        # Save model
        os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
        with open(self.model_path, 'wb') as f:
            pickle.dump(self.model, f)
        
        logger.info(f"Model saved to {self.model_path}")
    
    def predict_cost(
        self,
        total_distance_km: float,
        num_stops: int,
        avg_speed_kmh: float,
        traffic_factor: float,
        vehicle_efficiency_mpg: float,
        idle_time_min: float = None
    ) -> Dict[str, float]:
        """
        Predict fuel cost for a route.
        
        Args:
            total_distance_km: Total route distance
            num_stops: Number of delivery stops
            avg_speed_kmh: Average traveling speed
            traffic_factor: Traffic multiplier (1.0 = no traffic, 2.0 = heavy)
            vehicle_efficiency_mpg: Vehicle fuel efficiency
            idle_time_min: Estimated idle time (optional, auto-calculated if None)
            
        Returns:
            Dict with prediction and confidence interval
        """
        # Auto-calculate idle time if not provided
        if idle_time_min is None:
            idle_time_min = num_stops * 3  # 3 minutes per stop average
        
        # Prepare features
        features = np.array([[
            total_distance_km,
            num_stops,
            avg_speed_kmh,
            traffic_factor,
            vehicle_efficiency_mpg,
            idle_time_min
        ]])
        
        # Get predictions from all trees for confidence interval
        predictions = np.array([tree.predict(features)[0] for tree in self.model.estimators_])
        
        mean_pred = predictions.mean()
        std_pred = predictions.std()
        
        # 95% confidence interval
        confidence_lower = max(0, mean_pred - 1.96 * std_pred)
        confidence_upper = mean_pred + 1.96 * std_pred
        
        # Calculate components for breakdown
        estimated_liters = total_distance_km / (vehicle_efficiency_mpg * 0.425)
        base_fuel_cost = estimated_liters * 268.0
        traffic_cost = base_fuel_cost * (traffic_factor - 1.0)
        idle_cost = (idle_time_min / 60) * 50
        stop_cost = num_stops * 30
        base_fare = 150.0
        
        return {
            "predicted_cost_usd": round(mean_pred, 0),
            "confidence_lower": round(confidence_lower, 0),
            "confidence_upper": round(confidence_upper, 0),
            "cost_breakdown": {
                "estimated_fuel_liters": round(estimated_liters, 2),
                "base_fuel_cost": round(base_fuel_cost, 0),
                "traffic_penalty": round(traffic_cost, 0),
                "idle_cost": round(idle_cost, 0),
                "stop_penalty": round(stop_cost, 0),
                "base_fare": base_fare
            }
        }


# Global instance
cost_predictor = CostPredictor()
