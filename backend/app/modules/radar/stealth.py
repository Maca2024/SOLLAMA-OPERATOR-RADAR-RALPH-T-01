"""Stealth configuration for anti-detection scraping"""
import random
from dataclasses import dataclass, field
from typing import List
from fake_useragent import UserAgent


@dataclass
class StealthConfig:
    """Configuration for stealth scraping operations"""

    # User agent rotation
    user_agents: List[str] = field(default_factory=list)
    _ua_generator: UserAgent = field(default_factory=UserAgent, repr=False)

    # Timing
    min_delay: float = 1.0
    max_delay: float = 3.0
    page_load_timeout: int = 30000  # ms

    # Browser fingerprint
    viewport_width: int = 1920
    viewport_height: int = 1080
    locale: str = "nl-NL"
    timezone: str = "Europe/Amsterdam"

    # Behavior
    scroll_behavior: bool = True
    mouse_movement: bool = True

    def get_random_user_agent(self) -> str:
        """Get a random desktop user agent"""
        if self.user_agents:
            return random.choice(self.user_agents)
        return self._ua_generator.chrome

    def get_random_delay(self) -> float:
        """Get a random delay between requests"""
        return random.uniform(self.min_delay, self.max_delay)

    def get_browser_context_options(self) -> dict:
        """Get Playwright browser context options"""
        return {
            "user_agent": self.get_random_user_agent(),
            "viewport": {
                "width": self.viewport_width,
                "height": self.viewport_height
            },
            "locale": self.locale,
            "timezone_id": self.timezone,
            "permissions": ["geolocation"],
            "geolocation": {"latitude": 52.3676, "longitude": 4.9041},  # Amsterdam
            "color_scheme": "light",
        }


# Common user agents for Netherlands
DUTCH_USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15",
]


def create_stealth_config(aggressive: bool = False) -> StealthConfig:
    """Factory function for stealth configuration"""
    if aggressive:
        return StealthConfig(
            user_agents=DUTCH_USER_AGENTS,
            min_delay=2.0,
            max_delay=5.0,
            scroll_behavior=True,
            mouse_movement=True,
        )
    return StealthConfig(
        user_agents=DUTCH_USER_AGENTS,
        min_delay=1.0,
        max_delay=3.0,
    )
