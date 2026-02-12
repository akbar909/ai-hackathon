import json
from typing import Dict, Optional
import google.generativeai as genai
import httpx
import time
from config import settings
from utils.logger import setup_logger

logger = setup_logger(__name__)


class ExplainerService:
    """LLM-based route explanation using Gemini API or OpenRouter"""
    
    def __init__(self):
        self.provider = settings.llm_provider
        self._configure_llm()
    
    def _configure_llm(self):
        """Configure LLM based on provider setting"""
        if self.provider == "gemini":
            if not settings.gemini_api_key:
                logger.warning("Gemini API key not set. Explanations will be disabled.")
                return
            
            try:
                genai.configure(api_key=settings.gemini_api_key)
                self.model = genai.GenerativeModel(settings.gemini_model)
                logger.info(f"Configured Gemini model: {settings.gemini_model}")
            except Exception as e:
                logger.error(f"Failed to configure Gemini: {e}")
                self.model = None
        
        elif self.provider == "openrouter":
            if not settings.openrouter_api_key:
                logger.warning("OpenRouter API key not set. Explanations will be disabled.")
            logger.info(f"Configured OpenRouter with model: {settings.openrouter_model}")
    
    def generate_explanation(
        self,
        primary_route: Dict,
        alternatives: list[Dict],
        cost_data: Dict,
        risk_data: Dict
    ) -> Optional[Dict[str, str]]:
        """
        Generate AI explanation for route selection.
        
        Args:
            primary_route: Main optimized route data
            alternatives: List of alternative routes
            cost_data: Cost prediction data
            risk_data: Risk analysis data
            
        Returns:
            Dict with explanation components or None if LLM unavailable
        """
        try:
            # Build structured prompt
            prompt = self._build_prompt(primary_route, alternatives, cost_data, risk_data)
            
            # Get explanation from LLM
            if self.provider == "gemini":
                explanation = self._call_gemini(prompt)
            elif self.provider == "openrouter":
                explanation = self._call_openrouter(prompt)
            else:
                return None
            
            if explanation:
                logger.info("Generated route explanation successfully")
                return explanation
            else:
                logger.warning("LLM returned empty explanation")
                return None
                
        except Exception as e:
            logger.error(f"Failed to generate explanation: {e}")
            return None
    
    def _build_prompt(
        self,
        primary_route: Dict,
        alternatives: list[Dict],
        cost_data: Dict,
        risk_data: Dict
    ) -> str:
        """Build structured prompt for LLM"""
        
        prompt = f"""You are an AI logistics analyst. Explain why the primary route was chosen for a delivery optimization task.

**Primary Route:**
- Distance: {primary_route.get('total_distance_km', 0):.2f} km
- Estimated Time: {primary_route.get('total_time_min', 0):.1f} minutes
- Risk Score: {risk_data.get('total_risk_score', 0):.2f}/10 ({risk_data.get('risk_level', 'unknown')})
- Predicted Cost: Rs. {cost_data.get('predicted_cost_usd', 0):.0f} (PKR)
- Number of Stops: {primary_route.get('num_stops', 0)}

**Risk Analysis:**
- Zones Encountered: {', '.join(risk_data.get('risk_zones_encountered', [])) if risk_data.get('risk_zones_encountered') else 'None'}
- Zone Types: {json.dumps(risk_data.get('zones_by_type', {}))}

**Alternative Routes Available:**
"""
        
        for i, alt in enumerate(alternatives, 1):
            prompt += f"""
{i}. {alt.get('name', f'Alternative {i}')}:
   - Distance: {alt.get('total_distance_km', 0):.2f} km
   - Time: {alt.get('total_time_min', 0):.1f} min
   - Risk: {alt.get('risk_score', 0):.2f}/10
   - Cost: Rs. {alt.get('cost', {}).get('predicted_cost_usd', 0):.0f} (PKR)
   - Trade-off: {alt.get('trade_offs', 'N/A')}
"""
        
        prompt += """

Provide a clear, concise explanation in JSON format with these exact keys:
{
  "summary": "One sentence summary of the route choice",
  "reasoning": "2-3 sentences explaining why this route was selected (mention specific metrics)",
  "trade_offs": "Key trade-offs made (e.g., distance vs safety, cost vs time)",
  "recommendations": "Any additional recommendations for the driver"
}

CRITICAL INSTRUCTIONS:
1. Return ONLY valid JSON - no markdown, no code blocks, no extra text
2. Use double quotes for all strings
3. Escape any quotes within strings
4. Only use facts from the data provided above
5. Be specific with numbers

Return the JSON object now:
"""
        
        return prompt
    
    def _call_gemini(self, prompt: str) -> Optional[Dict[str, str]]:
        """Call Gemini API"""
        if not self.model:
            return None
        
        retries = 3
        for attempt in range(retries):
            try:
                response = self.model.generate_content(
                    prompt,
                    generation_config=genai.GenerationConfig(
                        temperature=0.3,
                        max_output_tokens=10000
                    )
                )
                
                # Log raw response for debugging
                text = response.text.strip()
                logger.debug(f"Raw LLM response: {text[:200]}...")
                
                # Remove markdown code blocks if present
                if text.startswith("```json"):
                    text = text[7:]
                elif text.startswith("```"):
                    text = text[3:]
                
                if text.endswith("```"):
                    text = text[:-3]
                
                text = text.strip()
                
                # Try to parse JSON
                explanation = json.loads(text)
                
                # Validate required keys
                required_keys = ["summary", "reasoning", "trade_offs", "recommendations"]
                if all(key in explanation for key in required_keys):
                    return explanation
                else:
                    logger.warning(f"LLM response missing required keys. Got: {list(explanation.keys())}")
                    return None
            
            except Exception as e:
                is_quota = "429" in str(e) or "quota" in str(e).lower()
                if is_quota and attempt < retries - 1:
                    wait_time = (attempt + 1) * 3  # 3s, 6s...
                    logger.warning(f"Gemini quota exceeded. Retrying in {wait_time}s...")
                    time.sleep(wait_time)
                    continue
                
                logger.error(f"Failed to call Gemini API (Attempt {attempt+1}/{retries}): {e}")
                if attempt == retries - 1:
                     return None
                

    
    def _call_openrouter(self, prompt: str) -> Optional[Dict[str, str]]:
        """Call OpenRouter API as fallback"""
        if not settings.openrouter_api_key:
            return None
        
        try:
            url = "https://openrouter.ai/api/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {settings.openrouter_api_key}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "model": settings.openrouter_model,
                "messages": [
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.3,
                "max_tokens": 500
            }
            
            with httpx.Client(timeout=30) as client:
                response = client.post(url, headers=headers, json=payload)
                response.raise_for_status()
                
                data = response.json()
                text = data["choices"][0]["message"]["content"].strip()
                
                # Parse JSON
                if text.startswith("```json"):
                    text = text[7:]
                if text.startswith("```"):
                    text = text[3:]
                if text.endswith("```"):
                    text = text[:-3]
                
                text = text.strip()
                explanation = json.loads(text)
                
                required_keys = ["summary", "reasoning", "trade_offs", "recommendations"]
                if all(key in explanation for key in required_keys):
                    return explanation
                return None
                
        except Exception as e:
            logger.error(f"OpenRouter API error: {e}")
            return None


# Global instance
explainer_service = ExplainerService()
