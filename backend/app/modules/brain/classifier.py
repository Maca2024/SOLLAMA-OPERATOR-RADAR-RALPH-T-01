"""BRAIN - AI-powered profile classifier"""
import json
import re
from typing import Optional
from loguru import logger

from ...models import ScrapedData, ProfileClassification, ProfileRing
from ...core.config import settings
from .prompts import CLASSIFICATION_PROMPT

# AI imports with fallback
try:
    from openai import AsyncOpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False

try:
    from anthropic import AsyncAnthropic
    ANTHROPIC_AVAILABLE = True
except ImportError:
    ANTHROPIC_AVAILABLE = False


class BrainClassifier:
    """
    🧠 BRAIN: The Intelligence of Solvari

    AI-powered classifier that determines profile rings
    and generates quality scores using LLM analysis.
    """

    def __init__(self, provider: str = "auto"):
        """
        Initialize the classifier

        Args:
            provider: "openai", "anthropic", or "auto" (tries both)
        """
        self.provider = provider
        self._openai_client: Optional[AsyncOpenAI] = None
        self._anthropic_client: Optional[AsyncAnthropic] = None
        self._setup_clients()

    def _setup_clients(self):
        """Initialize AI clients based on available API keys"""
        if OPENAI_AVAILABLE and settings.OPENAI_API_KEY:
            self._openai_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
            logger.info("🧠 BRAIN: OpenAI client initialized")

        if ANTHROPIC_AVAILABLE and settings.ANTHROPIC_API_KEY:
            self._anthropic_client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
            logger.info("🧠 BRAIN: Anthropic client initialized")

        if not self._openai_client and not self._anthropic_client:
            logger.warning("🧠 BRAIN: No AI clients available - using rule-based fallback")

    async def classify(self, scraped_data: ScrapedData) -> ProfileClassification:
        """
        Classify scraped data into the appropriate ring

        Args:
            scraped_data: Raw scraped content to analyze

        Returns:
            ProfileClassification with ring, score, and details
        """
        logger.info(f"🧠 Classifying profile from: {scraped_data.url}")

        # Try AI classification first
        if self._openai_client and (self.provider in ["openai", "auto"]):
            try:
                return await self._classify_with_openai(scraped_data)
            except Exception as e:
                logger.error(f"OpenAI classification failed: {e}")

        if self._anthropic_client and (self.provider in ["anthropic", "auto"]):
            try:
                return await self._classify_with_anthropic(scraped_data)
            except Exception as e:
                logger.error(f"Anthropic classification failed: {e}")

        # Fallback to rule-based classification
        return self._classify_with_rules(scraped_data)

    async def _classify_with_openai(self, data: ScrapedData) -> ProfileClassification:
        """Classify using OpenAI GPT-4"""
        prompt = CLASSIFICATION_PROMPT.format(profile_data=data.text_content)

        response = await self._openai_client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "Je bent een expert classificatie-AI. Respond alleen met valid JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            response_format={"type": "json_object"}
        )

        result = json.loads(response.choices[0].message.content)
        return self._parse_classification_result(result)

    async def _classify_with_anthropic(self, data: ScrapedData) -> ProfileClassification:
        """Classify using Anthropic Claude"""
        prompt = CLASSIFICATION_PROMPT.format(profile_data=data.text_content)

        response = await self._anthropic_client.messages.create(
            model="claude-3-sonnet-20240229",
            max_tokens=1024,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )

        # Extract JSON from response
        content = response.content[0].text
        json_match = re.search(r'\{.*\}', content, re.DOTALL)
        if json_match:
            result = json.loads(json_match.group())
            return self._parse_classification_result(result)

        raise ValueError("Could not extract JSON from Anthropic response")

    def _classify_with_rules(self, data: ScrapedData) -> ProfileClassification:
        """
        Rule-based classification fallback

        Uses keyword matching and heuristics when AI is unavailable
        """
        text = data.text_content.lower()
        score = 5.0
        confidence = 0.7

        # Check for Ring 1 (Vakman) indicators
        vakman_indicators = [
            "kvk" in text and any(c.isdigit() for c in text),
            "jaar ervaring" in text or "years experience" in text,
            "medewerkers" in text or "employees" in text,
            "bv" in text or "b.v." in text,
            "reviews" in text or "★" in text,
        ]

        # Check for Ring 2 (ZZP) indicators
        zzp_indicators = [
            "zzp" in text or "freelance" in text,
            "instagram" in text or "@" in text,
            "dm" in text or "volg" in text,
            "startend" in text or "jong" in text,
        ]

        # Check for Ring 3 (Hobbyist) indicators
        hobbyist_indicators = [
            "hobby" in text or "bijverdienste" in text,
            "buurman" in text or "buurvrouw" in text,
            "€" in text and any(x in text for x in ["15", "20", "25"]),
            "marktplaats" in text or "kleine klussen" in text,
            "geen kvk" in text or "zonder kvk" in text,
        ]

        # Count indicators
        vakman_score = sum(vakman_indicators)
        zzp_score = sum(zzp_indicators)
        hobbyist_score = sum(hobbyist_indicators)

        # Determine ring
        if vakman_score >= 2:
            ring = ProfileRing.VAKMAN
            score = 7.0 + min(vakman_score, 3)
            hook = "Directe agenda-vulling en Instant Payouts"
        elif zzp_score >= 2:
            ring = ProfileRing.ZZP
            score = 6.0 + min(zzp_score, 3)
            hook = "Gratis Admin-Bot en Real-time Lead Radar"
        elif hobbyist_score >= 1:
            ring = ProfileRing.HOBBYIST
            score = 5.0 + min(hobbyist_score, 3)
            hook = "Solvari Starter Programma"
        else:
            # Default to ZZP if unclear
            ring = ProfileRing.ZZP
            score = 5.0
            confidence = 0.4
            hook = "Algemene Solvari introductie"

        return ProfileClassification(
            ring=ring,
            quality_score=min(score, 10.0),
            confidence=confidence,
            reasoning=f"Rule-based classification: vakman={vakman_score}, zzp={zzp_score}, hobbyist={hobbyist_score}",
            extracted_data={"source_url": data.url, "source_type": data.source_type},
            recommended_hook=hook,
        )

    def _parse_classification_result(self, result: dict) -> ProfileClassification:
        """Parse AI response into ProfileClassification"""
        ring_value = result.get("ring", 2)
        if isinstance(ring_value, str):
            ring_value = int(ring_value)

        return ProfileClassification(
            ring=ProfileRing(ring_value),
            quality_score=float(result.get("quality_score", 5.0)),
            confidence=float(result.get("confidence", 0.8)),
            reasoning=result.get("reasoning", "AI classification"),
            extracted_data=result.get("extracted_data", {}),
            recommended_hook=result.get("recommended_hook", ""),
        )
