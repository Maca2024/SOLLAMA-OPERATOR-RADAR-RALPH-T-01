"""RADAR - Async web scraper with stealth capabilities"""
import asyncio
from typing import Optional, List, AsyncGenerator, Any, TYPE_CHECKING
from datetime import datetime
from loguru import logger
from bs4 import BeautifulSoup

from ...models import ScrapedData
from .stealth import StealthConfig, create_stealth_config

# Playwright import with fallback for testing
PLAYWRIGHT_AVAILABLE = False
try:
    from playwright.async_api import async_playwright, Page, Browser
    PLAYWRIGHT_AVAILABLE = True
except ImportError:
    logger.warning("Playwright not available - using mock mode")
    # Define dummy types for type hints
    Page = Any
    Browser = Any


class RadarScraper:
    """
    🔭 RADAR: The Eyes of Solvari

    Async web scraper with anti-detection capabilities.
    Supports multiple sources: KvK, Google Maps, Marktplaats, etc.
    """

    def __init__(self, stealth_config: Optional[StealthConfig] = None):
        self.config = stealth_config or create_stealth_config()
        self.browser: Optional[Browser] = None
        self._playwright = None

    async def __aenter__(self):
        await self.start()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.stop()

    async def start(self):
        """Initialize the browser"""
        if not PLAYWRIGHT_AVAILABLE:
            logger.info("Running in mock mode - no browser started")
            return

        try:
            self._playwright = await async_playwright().start()
            self.browser = await self._playwright.chromium.launch(
                headless=True,
                args=[
                    "--disable-blink-features=AutomationControlled",
                    "--disable-dev-shm-usage",
                    "--no-sandbox",
                ]
            )
            logger.info("RADAR browser initialized")
        except Exception as e:
            logger.warning(f"Browser launch failed: {e} - using mock mode")
            self.browser = None
            if self._playwright:
                await self._playwright.stop()
                self._playwright = None

    async def stop(self):
        """Cleanup browser resources"""
        if self.browser:
            await self.browser.close()
        if self._playwright:
            await self._playwright.stop()
        logger.info("🔭 RADAR browser closed")

    async def scrape_url(self, url: str, source_type: str = "generic") -> ScrapedData:
        """
        Scrape a single URL and return structured data

        Args:
            url: The URL to scrape
            source_type: Type of source (kvk, google_maps, marktplaats, etc.)

        Returns:
            ScrapedData object with extracted content
        """
        logger.info(f"🔭 Scraping: {url}")

        # Add delay for stealth
        delay = self.config.get_random_delay()
        await asyncio.sleep(delay)

        if not PLAYWRIGHT_AVAILABLE or not self.browser:
            # Return mock data for testing
            return self._create_mock_data(url, source_type)

        context = await self.browser.new_context(
            **self.config.get_browser_context_options()
        )

        try:
            page = await context.new_page()

            # Navigate with timeout
            await page.goto(url, timeout=self.config.page_load_timeout)

            # Simulate human behavior
            if self.config.scroll_behavior:
                await self._simulate_scrolling(page)

            # Extract content
            html_content = await page.content()
            text_content = await page.inner_text("body")

            # Parse with BeautifulSoup for cleaner extraction
            soup = BeautifulSoup(html_content, "html.parser")

            # Remove scripts and styles
            for element in soup(["script", "style", "nav", "footer"]):
                element.decompose()

            clean_text = soup.get_text(separator="\n", strip=True)

            return ScrapedData(
                url=url,
                html_content=html_content,
                text_content=clean_text,
                source_type=source_type,
                metadata={
                    "title": await page.title(),
                    "url_final": page.url,
                },
                scraped_at=datetime.utcnow(),
            )

        finally:
            await context.close()

    async def scrape_batch(
        self, urls: List[str], source_type: str = "generic", max_concurrent: int = 3
    ) -> AsyncGenerator[ScrapedData, None]:
        """
        Scrape multiple URLs with controlled concurrency

        Args:
            urls: List of URLs to scrape
            source_type: Type of source
            max_concurrent: Maximum concurrent scrapes

        Yields:
            ScrapedData objects as they complete
        """
        semaphore = asyncio.Semaphore(max_concurrent)

        async def scrape_with_semaphore(url: str) -> ScrapedData:
            async with semaphore:
                return await self.scrape_url(url, source_type)

        tasks = [scrape_with_semaphore(url) for url in urls]

        for coro in asyncio.as_completed(tasks):
            try:
                result = await coro
                yield result
            except Exception as e:
                logger.error(f"Scrape failed: {e}")

    async def _simulate_scrolling(self, page: Page):
        """Simulate human-like scrolling behavior"""
        try:
            # Scroll down slowly
            for _ in range(3):
                await page.evaluate("window.scrollBy(0, 300)")
                await asyncio.sleep(0.5)

            # Scroll back up
            await page.evaluate("window.scrollTo(0, 0)")
            await asyncio.sleep(0.3)
        except Exception:
            pass  # Scrolling is optional

    def _create_mock_data(self, url: str, source_type: str) -> ScrapedData:
        """Create mock data for testing without a browser"""
        mock_content = {
            "vakman": """
                Van der Berg Loodgieters BV
                KvK: 12345678
                Opgericht: 2015
                Specialisaties: Loodgieter, CV-installateur
                5 medewerkers
                ★★★★☆ (4.5) - 127 reviews
                Wij zijn een gevestigd loodgietersbedrijf met meer dan 8 jaar ervaring.
            """,
            "zzp": """
                Tim's Tegelwerk
                @tims_tegelwerk op Instagram
                Startende tegelzetter met passie voor mooie badkamers
                Volg mijn projecten! 📱 DM voor offerte
                2 jaar actief - KvK: 87654321
            """,
            "hobbyist": """
                Ik maai uw gras! 🌿
                Handige buurman beschikbaar voor tuinklussen
                Grasmaaien, onkruid wieden, kleine reparaties
                €15 per uur - Max €500 per klus
                Regio Amsterdam-West
            """,
        }

        # Determine mock type from URL keywords
        mock_type = "vakman"
        url_lower = url.lower()
        if "instagram" in url_lower or "tegelzetter" in url_lower:
            mock_type = "zzp"
        elif "marktplaats" in url_lower or "gras" in url_lower:
            mock_type = "hobbyist"

        return ScrapedData(
            url=url,
            html_content=None,
            text_content=mock_content.get(mock_type, mock_content["vakman"]),
            source_type=source_type,
            metadata={"mock": True, "mock_type": mock_type},
            scraped_at=datetime.utcnow(),
        )
