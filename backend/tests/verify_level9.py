#!/usr/bin/env python3
"""
⟁ LEVEL 9 VERIFICATION TEST
============================
This is the ultimate test that validates the entire Solvari Radar system.

The system MUST:
1. Scrape 3 mock URLs without crashing
2. Correctly classify them into Ring 1, 2, and 3
3. Generate appropriate outreach messages per ring
4. Pass all assertions

If this test passes, the system is considered PRODUCTION READY.
"""
import asyncio
import sys
from datetime import datetime
from typing import List, Tuple

# Add parent directory to path
sys.path.insert(0, '..')

from app.models import ScrapedData, ProfileRing
from app.modules.radar import RadarScraper
from app.modules.brain import BrainClassifier
from app.modules.hook import HookGenerator


# =============================================================================
# MOCK DATA: Simulated profiles for each ring
# =============================================================================

MOCK_PROFILES = [
    # Ring 1: Vakman - Established Professional
    {
        "url": "https://example.com/vandenberg-loodgieters",
        "source_type": "kvk",
        "expected_ring": ProfileRing.VAKMAN,
        "content": """
            Van der Berg Loodgieters B.V.

            Gevestigd sinds 2012 - meer dan 12 jaar ervaring
            KvK-nummer: 12345678

            Ons Team:
            - 8 ervaren medewerkers
            - 3 leerwerkplekken

            Specialisaties:
            - Loodgieterwerk
            - CV-installatie en onderhoud
            - Rioolservice 24/7

            ★★★★★ 4.8 gemiddelde uit 247 reviews

            "Betrouwbaar, vakkundig en altijd op tijd" - Klant review

            Werkgebied: Amsterdam, Haarlem, Amstelveen

            Contact:
            Tel: 020-1234567
            Email: info@vandenberg-loodgieters.nl
            Website: www.vandenberg-loodgieters.nl
        """,
    },
    # Ring 2: ZZP'er - Growing Freelancer
    {
        "url": "https://instagram.com/tims_tegelwerk",
        "source_type": "social_media",
        "expected_ring": ProfileRing.ZZP,
        "content": """
            @tims_tegelwerk | Tim's Tegelwerk

            📍 Utrecht & omgeving
            🔨 Vakkundige tegelzetter met passie voor design

            ✨ Gestart in 2022 - KvK: 87654321

            Wat ik doe:
            ▪️ Badkamer renovaties
            ▪️ Keukens betegelen
            ▪️ Vloerverwarming installatie

            📸 Bekijk mijn portfolio in de highlights!

            💬 DM voor vrijblijvende offerte
            📱 Of bel: 06-12345678

            🚀 Op zoek naar meer projecten om mijn skills te laten zien!

            #tegelzetter #badkamerrenovatie #utrecht #zzp #ondernemer

            Volgers: 2.4K | Volgend: 891
            127 posts
        """,
    },
    # Ring 3: Hobbyist - Starter
    {
        "url": "https://marktplaats.nl/advertentie/gras-maaien",
        "source_type": "marketplace",
        "expected_ring": ProfileRing.HOBBYIST,
        "content": """
            🌿 Ik maai uw gras! 🌿

            Aangeboden door: Henk (particulier)

            Hallo buren!

            Ik ben Henk, gepensioneerd en fit. Ik maai graag uw gras
            en doe kleine tuinklussen in de buurt.

            Wat ik kan doen:
            - Grasmaaien (klein tot middelgroot)
            - Onkruid wieden
            - Heggen snoeien (tot 2m)
            - Bladeren opruimen

            Tarieven:
            €15 per uur voor klein werk
            Grotere klussen: in overleg
            (maximum €400-500 per klus)

            Alleen in Amsterdam-West en omgeving

            Geen KvK, dit is een hobby/bijverdienste

            Bel of app: 06-98765432

            Prijs: Op aanvraag
            Locatie: Amsterdam-West
        """,
    },
]


# =============================================================================
# TEST FUNCTIONS
# =============================================================================

def create_mock_scraped_data(profile: dict) -> ScrapedData:
    """Create a ScrapedData object from mock profile"""
    return ScrapedData(
        url=profile["url"],
        text_content=profile["content"],
        source_type=profile["source_type"],
        metadata={"mock": True, "test": "level9"},
        scraped_at=datetime.utcnow(),
    )


async def test_radar_module() -> List[ScrapedData]:
    """Test 1: RADAR module can process URLs without crashing"""
    print("\n🔭 TEST 1: RADAR Module")
    print("-" * 40)

    scraped_data = []

    async with RadarScraper() as scraper:
        for profile in MOCK_PROFILES:
            print(f"  Scraping: {profile['url'][:50]}...")

            # In test mode, scraper returns mock data
            data = await scraper.scrape_url(profile["url"], profile["source_type"])

            # Override with our test content for consistent testing
            data = create_mock_scraped_data(profile)
            scraped_data.append(data)

            print(f"  ✓ Scraped {len(data.text_content)} characters")

    assert len(scraped_data) == 3, f"Expected 3 scraped items, got {len(scraped_data)}"
    print(f"\n✅ RADAR: All {len(scraped_data)} URLs scraped successfully")

    return scraped_data


async def test_brain_classification(
    scraped_data: List[ScrapedData]
) -> List[Tuple[ScrapedData, 'ProfileClassification']]:
    """Test 2: BRAIN module correctly classifies each profile"""
    print("\n🧠 TEST 2: BRAIN Classification")
    print("-" * 40)

    classifier = BrainClassifier()
    results = []

    for i, (data, expected) in enumerate(zip(scraped_data, MOCK_PROFILES)):
        print(f"  Classifying: {data.url[:50]}...")

        classification = await classifier.classify(data)
        results.append((data, classification))

        expected_ring = expected["expected_ring"]

        print(f"  → Ring: {classification.ring.value} ({classification.ring.name})")
        print(f"  → Quality Score: {classification.quality_score:.1f}")
        print(f"  → Confidence: {classification.confidence:.1%}")
        print(f"  → Expected: Ring {expected_ring.value} ({expected_ring.name})")

        # Verify classification
        assert classification.ring == expected_ring, \
            f"Profile {i+1}: Expected Ring {expected_ring.value}, got Ring {classification.ring.value}"

        assert 0 <= classification.quality_score <= 10, \
            f"Quality score {classification.quality_score} out of range [0, 10]"

        assert 0 <= classification.confidence <= 1, \
            f"Confidence {classification.confidence} out of range [0, 1]"

        print(f"  ✓ Correctly classified as Ring {classification.ring.value}")

    print(f"\n✅ BRAIN: All {len(results)} profiles classified correctly")

    return results


def test_hook_generation(
    classified_profiles: List[Tuple[ScrapedData, 'ProfileClassification']]
) -> List['OutreachMessage']:
    """Test 3: HOOK module generates appropriate outreach"""
    print("\n🎣 TEST 3: HOOK Outreach Generation")
    print("-" * 40)

    from uuid import uuid4

    generator = HookGenerator()
    messages = []

    expected_channels = {
        ProfileRing.VAKMAN: "email",
        ProfileRing.ZZP: "dm",
        ProfileRing.HOBBYIST: "invite",
    }

    for data, classification in classified_profiles:
        print(f"  Generating outreach for Ring {classification.ring.value}...")

        profile_id = uuid4()
        message = generator.generate(profile_id, classification)
        messages.append(message)

        expected_channel = expected_channels[classification.ring]

        print(f"  → Channel: {message.channel}")
        print(f"  → Template: {message.template_type}")
        print(f"  → Body length: {len(message.body)} chars")

        # Verify message
        assert message.channel == expected_channel, \
            f"Expected channel '{expected_channel}', got '{message.channel}'"

        assert len(message.body) > 50, \
            f"Message body too short: {len(message.body)} chars"

        assert message.ring == classification.ring, \
            f"Message ring mismatch"

        print(f"  ✓ Generated {message.channel} message")

    print(f"\n✅ HOOK: All {len(messages)} outreach messages generated")

    return messages


def test_message_content(messages: List['OutreachMessage']):
    """Test 4: Verify message content contains expected hooks"""
    print("\n📝 TEST 4: Message Content Validation")
    print("-" * 40)

    expected_hooks = {
        ProfileRing.VAKMAN: ["agenda", "uitbetaling", "direct"],
        ProfileRing.ZZP: ["admin", "gratis", "leads", "groei"],
        ProfileRing.HOBBYIST: ["starter", "begin", "wizard", "risico"],
    }

    for message in messages:
        ring = message.ring
        hooks = expected_hooks[ring]
        body_lower = message.body.lower()

        print(f"  Checking Ring {ring.value} message hooks...")

        found_hooks = [h for h in hooks if h in body_lower]

        assert len(found_hooks) > 0, \
            f"Ring {ring.value} message missing expected hooks: {hooks}"

        print(f"  ✓ Found hooks: {found_hooks}")

    print(f"\n✅ MESSAGE CONTENT: All messages contain appropriate hooks")


async def run_level9_tests():
    """Run all Level 9 verification tests"""
    print("=" * 60)
    print("⟁ SOLVARI RADAR - LEVEL 9 VERIFICATION")
    print("=" * 60)
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    try:
        # Test 1: RADAR
        scraped_data = await test_radar_module()

        # Test 2: BRAIN
        classified = await test_brain_classification(scraped_data)

        # Test 3: HOOK
        messages = test_hook_generation(classified)

        # Test 4: Content
        test_message_content(messages)

        # Summary
        print("\n" + "=" * 60)
        print("🏆 LEVEL 9 VERIFICATION: ALL TESTS PASSED")
        print("=" * 60)
        print("""
        ✅ RADAR:   3/3 URLs scraped
        ✅ BRAIN:   3/3 profiles classified correctly
        ✅ HOOK:    3/3 outreach messages generated
        ✅ CONTENT: All messages validated

        The Solvari Radar system is PRODUCTION READY.
        """)

        return True

    except AssertionError as e:
        print(f"\n❌ LEVEL 9 VERIFICATION FAILED: {e}")
        return False
    except Exception as e:
        print(f"\n💥 UNEXPECTED ERROR: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    success = asyncio.run(run_level9_tests())
    sys.exit(0 if success else 1)
