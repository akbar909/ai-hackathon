# 🚚 AI Logistics Route Optimizer + Cost Predictor

[![Python](https://img.shields.io/badge/Python-3.10+-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109-green.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.2-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)

A comprehensive full-stack AI-powered logistics optimization system that combines **classical optimization algorithms**, **machine learning**, and **LLM reasoning** to minimize delivery costs, reduce risks, and provide explainable route recommendations.

![AI Logistics Demo](https://via.placeholder.com/800x400/0a0a0a/3b82f6?text=AI+Logistics+Route+Optimizer)

---

## ✨ Features

### 🎯 Core Capabilities
- **Multi-Stop Route Optimization** - TSP/VRP solving using Google OR-Tools
- **ML-Based Cost Prediction** - Random Forest model for fuel cost forecasting
- **Risk Zone Detection** - Identify and avoid accident-prone, congested, or high-crime areas
- **Alternative Route Generation** - Multiple optimization strategies (shortest, safest, off-peak)
- **AI-Powered Explanations** - LLM-generated insights using Gemini API
- **Interactive Map Visualization** - Beautiful Leaflet maps with custom markers and overlays

### 🎨 Premium Design
- **Dark Theme** with glassmorphism effects
- **Responsive Design** - Mobile to desktop (320px - 1920px+)
- **Smooth Animations** - Framer Motion micro-interactions
- **Beautiful Charts** - Recharts for data visualization
- **Modern Typography** - Inter font family

### 🛠️ Technology Stack

#### Backend
- **FastAPI** - High-performance async web framework
- **OR-Tools** - Google's optimization library
- **scikit-learn** - ML cost prediction model
- **Gemini API** - AI explanations (with OpenRouter fallback)
- **Nominatim** - Free geocoding (OpenStreetMap)

#### Frontend
- **React 18** + **Vite** - Fast, modern development
- **TypeScript** - Type-safe code
- **Tailwind CSS** - Utility-first styling
- **Leaflet** - Interactive maps
- **Recharts** - Charts and dashboards

---

## 🚀 Quick Start

### Prerequisites
- **Python 3.10+**
- **Node.js 18+** and npm
- **Gemini API Key** (get from [Google AI Studio](https://makersuite.google.com/app/apikey))

### 1. Clone Repository
```bash
git clone <your-repo-url>
cd ai-hackathon
```

### 2. Backend Setup

#### Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

#### Configure Environment
```bash
# Copy example env file
copy .env.example .env

# Edit .env and add your Gemini API key
# GEMINI_API_KEY=your_actual_api_key_here
```

#### Create ML Model Directory
```bash
mkdir ml
```

#### Run Backend
```bash
python main.py
```

Backend will start on `http://localhost:8000`

### 3. Frontend Setup

#### Install Dependencies
```bash
cd frontend
npm install
```

#### Run Frontend
```bash
npm run dev
```

Frontend will start on `http://localhost:5173`

### 4. Open Application
Navigate to `http://localhost:5173` in your browser.

---

## 📖 Usage Guide

### Step 1: Enter Delivery Details
1. **Starting Location** - Your depot/warehouse address
2. **Delivery Stops** - Add multiple delivery addresses (minimum 2)
3. **Vehicle Configuration** - Select vehicle type and fuel efficiency (MPG)
4. **Options**:
   - ✅ Avoid peak traffic hours
   - ✅ Prioritize safer routes

### Step 2: Optimize Route
Click **"Optimize Route"** - The system will:
- Geocode all addresses
- Build weighted graph with traffic and risk factors
- Solve TSP/VRP optimization problem
- Predict fuel costs using ML model
- Analyze route risks
- Generate alternative routes
- Get AI explanation from Gemini

### Step 3: Review Results
- **Interactive Map** - Visualize optimized route and risk zones
- **Cost Dashboard** - Fuel cost prediction with breakdown
- **Risk Analysis** - Safety score and zones encountered
- **Alternative Routes** - Compare different optimization strategies
- **AI Insights** - Understand why this route was chosen

---

## 🏗️ Project Structure

```
ai-hackathon/
├── backend/
│   ├── main.py                 # FastAPI application
│   ├── config.py               # Settings management
│   ├── models.py               # Pydantic data models
│   ├── requirements.txt        # Python dependencies
│   ├── data/
│   │   ├── risk_zones.json     # Mock risk zone data
│   │   └── traffic_factors.json
│   ├── services/
│   │   ├── geocoding.py        # Address → coordinates
│   │   ├── graph_builder.py    # Weighted graph construction
│   │   ├── route_optimizer.py  # OR-Tools TSP solver
│   │   ├── cost_predictor.py   # ML cost prediction
│   │   ├── risk_analyzer.py    # Risk zone detection
│   │   ├── alternative_generator.py  # Alternative routes
│   │   └── explainer.py        # LLM integration
│   ├── ml/
│   │   └── cost_model.pkl      # Trained ML model (auto-generated)
│   └── utils/
│       ├── distance.py         # Haversine calculations
│       └── logger.py           # Logging setup
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── DeliveryForm.tsx
│   │   │   ├── RouteMap.tsx
│   │   │   ├── CostDashboard.tsx
│   │   │   ├── RouteComparison.tsx
│   │   │   ├── ExplanationPanel.tsx
│   │   │   └── LoadingSpinner.tsx
│   │   ├── pages/
│   │   │   ├── Home.tsx
│   │   │   └── Optimizer.tsx
│   │   ├── services/
│   │   │   └── api.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
│
└── README.md
```

---

## 🧮 Core Algorithms

### 1. Route Optimization (OR-Tools)
```python
Edge Weight = Distance × Traffic Factor × Risk Factor

# Objective: Minimize total weighted cost
# Constraints: Visit all stops, time windows, vehicle capacity
# Solver: Guided Local Search metaheuristic
```

### 2. ML Cost Prediction
```python
Features:
- Total distance (km)
- Number of stops
- Average speed (km/h)
- Traffic factor
- Vehicle efficiency (MPG)
- Idle time (minutes)

Model: Random Forest Regressor
Output: Predicted cost + 95% confidence interval
```

### 3. Risk Scoring
```python
Route Risk Score = Σ (Zone Risk Level × Distance in Zone)

Risk Levels:
- 1-3: Low (green)
- 4-5: Medium (yellow)
- 6-7: High (orange)
- 8-10: Critical (red)
```

### 4. Alternative Strategies
1. **Shortest Distance** - Minimize total km
2. **Safest Route** - Avoid high-risk areas (may be longer)
3. **Off-Peak Schedule** - Deliver during low-traffic hours

---

## 🎨 Design System

### Colors
```css
Primary:   #3b82f6  /* Blue - routes, CTAs */
Success:   #10b981  /* Green - optimal, savings */
Warning:   #f59e0b  /* Amber - medium risk */
Danger:    #ef4444  /* Red - high risk, errors */
BG Dark:   #0a0a0a  /* Deep black background */
BG Card:   #1a1a1a  /* Card backgrounds */
```

### Typography
- **Font Family**: Inter (Google Fonts)
- **Headings**: 700-800 weight
- **Body**: 400-500 weight

### Effects
- **Glassmorphism**: `backdrop-filter: blur(10px)`
- **Shadows**: Multi-layer for depth
- **Animations**: Framer Motion (0.3-0.6s ease-out)

---

## 🔧 API Endpoints

### `POST /api/optimize`
Optimize delivery route.

**Request:**
```json
{
  "stops": [
    {"address": "123 Main St, New York, NY", "priority": 1}
  ],
  "vehicle": {
    "vehicle_type": "van",
    "fuel_efficiency_mpg": 22
  },
  "start_location": "100 Warehouse Ave, New York, NY",
  "avoid_peak_hours": true,
  "prioritize_safety": false
}
```

**Response:**
```json
{
  "primary_route": {...},
  "cost_prediction": {...},
  "risk_analysis": {...},
  "alternatives": [...],
  "explanation": {...},
  "processing_time_ms": 1234.56
}
```

### `GET /api/risk-zones`
Get all risk zones for visualization.

---

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest tests/
```

### Frontend Tests
```bash
cd frontend
npm run test
```

### Manual Testing Checklist
- [ ] 3-stop route optimization (<2s)
- [ ] 10-stop route optimization (<5s)
- [ ] Time window constraints respected
- [ ] Risk zones avoided when `prioritize_safety=true`
- [ ] Cost prediction reasonable
- [ ] All 3 alternative routes generated
- [ ] LLM explanation factual (no hallucinations)
- [ ] Mobile responsive (320px width)
- [ ] Map interactions smooth

---

## 🎯 Hackathon Highlights

### Decision Intelligence
- ✅ **Not just optimization** - Shows WHY this route was chosen
- ✅ **Trade-off analysis** - Cost vs. time vs. safety
- ✅ **Multiple strategies** - User can choose based on priorities

### Technical Excellence
- ✅ **Classical optimization** - OR-Tools TSP/VRP solver
- ✅ **Machine learning** - Predictive modeling with confidence intervals
- ✅ **AI reasoning** - LLM explanations with hallucination prevention
- ✅ **Real-world data** - Geocoding, risk zones, traffic factors

### User Experience
- ✅ **Beautiful UI** - Premium dark theme, glassmorphism
- ✅ **Interactive maps** - Leaflet with custom markers
- ✅ **Responsive** - Works on all devices
- ✅ **Fast** - Route optimization in <2 seconds

---

## 🔐 Environment Variables

### Backend (.env)
```bash
# Required
GEMINI_API_KEY=your_gemini_api_key_here

# Optional (with defaults)
LLM_PROVIDER=gemini               # or "openrouter"
GEMINI_MODEL=gemini-1.5-flash
BACKEND_PORT=8000
LOG_LEVEL=INFO
```

### Frontend (.env)
```bash
VITE_API_URL=http://localhost:8000
```

---

## 📦 Production Build

### Backend
```bash
cd backend
pip install -r requirements.txt
python main.py
```

### Frontend
```bash
cd frontend
npm run build
npm run preview
```

---

## 🤝 Contributing

This is a hackathon project. Contributions welcome!

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 📄 License

MIT License - see LICENSE file for details

---

## 🙏 Acknowledgments

- **Google OR-Tools** - Optimization algorithms
- **Nominatim/OpenStreetMap** - Free geocoding
- **Google Gemini** - AI explanations
- **Leaflet** - Interactive maps
- **FastAPI** - Modern Python web framework
- **React** - UI framework

---

## 📞 Support

For issues or questions:
- Open a GitHub issue
- Email: jamaliakbar909@gmail.com

---

**Built with ❤️ for Hackathon 2026**

*Demonstrating the power of AI-driven decision intelligence in logistics optimization.*
