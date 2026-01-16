"""Unit tests for individual modules"""
import pytest
import asyncio
from datetime import datetime

import sys
sys.path.insert(0, '..')

from app.models import ScrapedData, ProfileRing, ProfileClassification
from app.modules.radar import RadarScraper, StealthConfig
from app.modules.brain import BrainClassifier
from app.modules.hook import HookGenerator


class TestRadarModule:
    """Tests for the RADAR scraper module"""

    def test_stealth_config_creation(self):
        """Test stealth configuration is created correctly"""
        config = StealthConfig()
        assert config.min_delay > 0
        assert config.max_delay > config.min_delay
        assert config.viewport_width > 0

    def test_random_user_agent(self):
        """Test user agent rotation works"""
        config = StealthConfig()
        ua1 = config.get_random_user_agent()
        assert isinstance(ua1, str)
        assert len(ua1) > 0

    def test_random_delay(self):
        """Test random delay is within bounds"""
        config = StealthConfig(min_delay=1.0, max_delay=2.0)
        for _ in range(10):
            delay = config.get_random_delay()
            assert 1.0 <= delay <= 2.0

    @pytest.mark.asyncio
    async def test_scraper_mock_mode(self):
        """Test scraper works in mock mode"""
        async with RadarScraper() as scraper:
            data = await scraper.scrape_url("https://example.com/test", "test")
            assert isinstance(data, ScrapedData)
            assert len(data.text_content) > 0


class TestBrainModule:
    """Tests for the BRAIN classifier module"""

    def test_classifier_initialization(self):
        """Test classifier initializes correctly"""
        classifier = BrainClassifier()
        assert classifier is not None

    @pytest.mark.asyncio
    async def test_rule_based_vakman_classification(self):
        """Test rule-based classification for Vakman"""
        classifier = BrainClassifier()

        data = ScrapedData(
            url="https://test.com",
            text_content="""
                Loodgietersbedrijf Van Dijk BV
                KvK: 12345678
                8 jaar ervaring, 5 medewerkers
                ★★★★☆ 127 reviews
            """,
            source_type="test",
        )

        result = await classifier.classify(data)
        assert result.ring == ProfileRing.VAKMAN

    @pytest.mark.asyncio
    async def test_rule_based_zzp_classification(self):
        """Test rule-based classification for ZZP"""
        classifier = BrainClassifier()

        data = ScrapedData(
            url="https://instagram.com/test",
            text_content="""
                @tegelzetter_tim
                ZZP ondernemer - DM voor offerte
                Volg mijn werk!
            """,
            source_type="social",
        )

        result = await classifier.classify(data)
        assert result.ring == ProfileRing.ZZP

    @pytest.mark.asyncio
    async def test_rule_based_hobbyist_classification(self):
        """Test rule-based classification for Hobbyist"""
        classifier = BrainClassifier()

        data = ScrapedData(
            url="https://marktplaats.nl/test",
            text_content="""
                Handige buurman voor kleine klussen
                €20 per uur, max €500
                Hobby bijverdienste
            """,
            source_type="marketplace",
        )

        result = await classifier.classify(data)
        assert result.ring == ProfileRing.HOBBYIST


class TestHookModule:
    """Tests for the HOOK outreach module"""

    def test_generator_initialization(self):
        """Test generator initializes with templates"""
        generator = HookGenerator()
        assert len(generator.templates) > 0

    def test_vakman_outreach_email(self):
        """Test email generation for Vakman"""
        from uuid import uuid4

        generator = HookGenerator()
        classification = ProfileClassification(
            ring=ProfileRing.VAKMAN,
            quality_score=8.5,
            confidence=0.9,
            reasoning="Test",
            extracted_data={"name": "Test BV", "location": "Amsterdam"},
            recommended_hook="Agenda-vulling",
        )

        message = generator.generate(uuid4(), classification)

        assert message.channel == "email"
        assert "agenda" in message.body.lower() or "vulling" in message.body.lower()
        assert message.ring == ProfileRing.VAKMAN

    def test_zzp_outreach_dm(self):
        """Test DM generation for ZZP'er"""
        from uuid import uuid4

        generator = HookGenerator()
        classification = ProfileClassification(
            ring=ProfileRing.ZZP,
            quality_score=7.0,
            confidence=0.85,
            reasoning="Test",
            extracted_data={"name": "Tim"},
            recommended_hook="Admin-Bot",
        )

        message = generator.generate(uuid4(), classification)

        assert message.channel == "dm"
        assert message.ring == ProfileRing.ZZP

    def test_hobbyist_outreach_invite(self):
        """Test invite generation for Hobbyist"""
        from uuid import uuid4

        generator = HookGenerator()
        classification = ProfileClassification(
            ring=ProfileRing.HOBBYIST,
            quality_score=5.5,
            confidence=0.7,
            reasoning="Test",
            extracted_data={"name": "Henk"},
            recommended_hook="Starter",
        )

        message = generator.generate(uuid4(), classification)

        assert message.channel == "invite"
        assert message.ring == ProfileRing.HOBBYIST


class TestModels:
    """Tests for Pydantic models"""

    def test_profile_ring_enum(self):
        """Test ProfileRing enum values"""
        assert ProfileRing.VAKMAN == 1
        assert ProfileRing.ZZP == 2
        assert ProfileRing.HOBBYIST == 3
        assert ProfileRing.ACADEMY == 4

    def test_scraped_data_creation(self):
        """Test ScrapedData model creation"""
        data = ScrapedData(
            url="https://test.com",
            text_content="Test content",
            source_type="test",
        )
        assert data.url == "https://test.com"
        assert data.scraped_at is not None

    def test_classification_result(self):
        """Test ProfileClassification model"""
        result = ProfileClassification(
            ring=ProfileRing.VAKMAN,
            quality_score=8.0,
            confidence=0.9,
            reasoning="Test classification",
            extracted_data={"key": "value"},
            recommended_hook="Test hook",
        )
        assert result.ring == ProfileRing.VAKMAN
        assert 0 <= result.quality_score <= 10


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
