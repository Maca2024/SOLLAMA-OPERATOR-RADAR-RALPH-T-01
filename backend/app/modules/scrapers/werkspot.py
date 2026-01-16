"""Werkspot Public Profile Scraper for Vakmensen Discovery"""
import asyncio
import re
from typing import Optional, List, Dict, Any
from datetime import datetime
from loguru import logger
import httpx
from bs4 import BeautifulSoup
from pydantic import BaseModel


class WerkspotVakman(BaseModel):
    """Werkspot vakman profile model"""
    profile_id: str
    company_name: str
    description: Optional[str] = None
    categories: List[str] = []
    location: Optional[str] = None
    rating: Optional[float] = None
    review_count: Optional[int] = None
    verified: bool = False
    kvk_nummer: Optional[str] = None
    website: Optional[str] = None
    profile_url: str
    scraped_at: datetime


class WerkspotScraper:
    """
    Scraper for Werkspot public vakman profiles

    Note: Only scrapes publicly available information from search results
    and public profile pages. Does not access authenticated areas.
    """

    BASE_URL = "https://www.werkspot.nl"

    # Service categories on Werkspot
    CATEGORIES = {
        "loodgieter": "/loodgieter/",
        "elektricien": "/elektricien/",
        "schilder": "/schilder/",
        "timmerman": "/timmerman/",
        "dakdekker": "/dakdekker/",
        "tuinman": "/hovenier/",
        "aannemer": "/aannemer/",
        "klusjesman": "/klusjesman/",
        "tegelzetter": "/tegelzetter/",
        "stukadoor": "/stukadoor/",
        "metselaar": "/metselaar/",
        "cv_monteur": "/cv-monteur/",
        "glaszetter": "/glaszetter/",
        "kozijnen": "/kozijnen-plaatsen/",
        "isolatie": "/isolatie/",
        "zonnepanelen": "/zonnepanelen/",
        "warmtepomp": "/warmtepomp/",
        "airco": "/airco/",
        "badkamer": "/badkamer-verbouwen/",
        "keuken": "/keuken-plaatsen/",
    }

    def __init__(self, delay_min: float = 2.0, delay_max: float = 4.0):
        self.delay_min = delay_min
        self.delay_max = delay_max
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "nl-NL,nl;q=0.9,en-US;q=0.8,en;q=0.7",
        }

    async def _get_delay(self) -> float:
        """Get random delay for rate limiting"""
        import random
        return random.uniform(self.delay_min, self.delay_max)

    async def search_vakmensen(
        self,
        category: str,
        location: Optional[str] = None,
        max_pages: int = 3,
    ) -> List[WerkspotVakman]:
        """
        Search for vakmensen in a specific category

        Args:
            category: Category key (loodgieter, elektricien, etc.)
            location: City name (e.g., "amsterdam", "rotterdam")
            max_pages: Maximum pages to scrape

        Returns:
            List of WerkspotVakman objects
        """
        if category not in self.CATEGORIES:
            logger.warning(f"Unknown category: {category}")
            return []

        results = []
        category_path = self.CATEGORIES[category]

        async with httpx.AsyncClient(headers=self.headers, timeout=30.0, follow_redirects=True) as client:
            for page in range(1, max_pages + 1):
                try:
                    # Build URL
                    if location:
                        url = f"{self.BASE_URL}{category_path}{location.lower()}/"
                    else:
                        url = f"{self.BASE_URL}{category_path}"

                    if page > 1:
                        url = f"{url}?page={page}"

                    logger.info(f"Werkspot: Scraping {category} in {location or 'NL'} page {page}")

                    # Add delay
                    await asyncio.sleep(await self._get_delay())

                    response = await client.get(url)

                    if response.status_code != 200:
                        logger.warning(f"Werkspot returned {response.status_code}")
                        break

                    # Parse profiles
                    profiles = self._parse_search_page(response.text, category)

                    if not profiles:
                        logger.info(f"No more profiles on page {page}")
                        break

                    results.extend(profiles)
                    logger.info(f"Found {len(profiles)} profiles on page {page}")

                except Exception as e:
                    logger.error(f"Error scraping page {page}: {e}")
                    break

        logger.info(f"Werkspot: Total {len(results)} vakmensen found for {category}")
        return results

    def _parse_search_page(self, html: str, category: str) -> List[WerkspotVakman]:
        """Parse a search results page and extract vakman profiles"""
        soup = BeautifulSoup(html, "html.parser")
        profiles = []

        # Find all profile cards
        cards = soup.find_all("div", {"class": re.compile(r"professional-card|specialist-card", re.I)})

        if not cards:
            # Try alternative selectors
            cards = soup.find_all("article", {"data-testid": re.compile(r"specialist", re.I)})

        if not cards:
            # Try finding any card-like structures with company info
            cards = soup.find_all("div", {"class": re.compile(r"card", re.I)})

        for card in cards:
            try:
                profile = self._parse_profile_card(card, category)
                if profile:
                    profiles.append(profile)
            except Exception as e:
                logger.debug(f"Could not parse profile card: {e}")

        return profiles

    def _parse_profile_card(self, card, category: str) -> Optional[WerkspotVakman]:
        """Parse a single profile card"""
        try:
            # Find profile link
            link = card.find("a", href=re.compile(r"/profiel/"))
            if not link:
                link = card.find("a", href=True)

            if not link:
                return None

            href = link.get("href", "")
            profile_id = re.search(r"/profiel/([^/]+)", href)
            profile_id = profile_id.group(1) if profile_id else href

            # Company name
            name_elem = card.find("h2") or card.find("h3") or card.find("strong")
            company_name = name_elem.get_text(strip=True) if name_elem else "Unknown"

            # Rating
            rating = None
            rating_elem = card.find("span", {"class": re.compile(r"rating|score", re.I)})
            if rating_elem:
                rating_text = rating_elem.get_text(strip=True)
                rating_match = re.search(r"(\d+[.,]\d+)", rating_text)
                if rating_match:
                    rating = float(rating_match.group(1).replace(",", "."))

            # Review count
            review_count = None
            review_elem = card.find("span", {"class": re.compile(r"review", re.I)})
            if review_elem:
                review_text = review_elem.get_text(strip=True)
                review_match = re.search(r"(\d+)", review_text)
                if review_match:
                    review_count = int(review_match.group(1))

            # Location
            location = None
            loc_elem = card.find("span", {"class": re.compile(r"location|city", re.I)})
            if loc_elem:
                location = loc_elem.get_text(strip=True)

            # Verified badge
            verified = bool(card.find("span", {"class": re.compile(r"verified|badge", re.I)}))

            # Description
            desc_elem = card.find("p") or card.find("span", {"class": re.compile(r"description", re.I)})
            description = desc_elem.get_text(strip=True) if desc_elem else None

            profile_url = f"{self.BASE_URL}{href}" if href.startswith("/") else href

            return WerkspotVakman(
                profile_id=str(profile_id),
                company_name=company_name,
                description=description,
                categories=[category],
                location=location,
                rating=rating,
                review_count=review_count,
                verified=verified,
                profile_url=profile_url,
                scraped_at=datetime.utcnow(),
            )
        except Exception as e:
            logger.debug(f"Failed to parse profile card: {e}")
            return None

    async def get_profile_details(self, profile_url: str) -> Optional[Dict[str, Any]]:
        """
        Get detailed information from a vakman profile page

        Args:
            profile_url: Full URL to the profile

        Returns:
            Dictionary with detailed profile info
        """
        async with httpx.AsyncClient(headers=self.headers, timeout=30.0, follow_redirects=True) as client:
            try:
                await asyncio.sleep(await self._get_delay())

                response = await client.get(profile_url)

                if response.status_code != 200:
                    return None

                soup = BeautifulSoup(response.text, "html.parser")

                details = {
                    "url": profile_url,
                    "scraped_at": datetime.utcnow().isoformat(),
                }

                # Company name
                name = soup.find("h1")
                if name:
                    details["company_name"] = name.get_text(strip=True)

                # Description / About
                about = soup.find("div", {"class": re.compile(r"about|description", re.I)})
                if about:
                    details["description"] = about.get_text(strip=True)

                # Rating
                rating = soup.find("span", {"class": re.compile(r"rating-value|score", re.I)})
                if rating:
                    rating_text = rating.get_text(strip=True)
                    rating_match = re.search(r"(\d+[.,]\d+)", rating_text)
                    if rating_match:
                        details["rating"] = float(rating_match.group(1).replace(",", "."))

                # Review count
                reviews = soup.find("span", {"class": re.compile(r"review-count", re.I)})
                if reviews:
                    review_text = reviews.get_text(strip=True)
                    review_match = re.search(r"(\d+)", review_text)
                    if review_match:
                        details["review_count"] = int(review_match.group(1))

                # KvK nummer (if publicly displayed)
                kvk = soup.find(string=re.compile(r"KvK|KVK|Kamer van Koophandel", re.I))
                if kvk:
                    kvk_match = re.search(r"(\d{8})", str(kvk.parent))
                    if kvk_match:
                        details["kvk_nummer"] = kvk_match.group(1)

                # Location
                location = soup.find("span", {"class": re.compile(r"location|address", re.I)})
                if location:
                    details["location"] = location.get_text(strip=True)

                # Services / Categories
                services = soup.find_all("span", {"class": re.compile(r"service|category|specialty", re.I)})
                if services:
                    details["services"] = [s.get_text(strip=True) for s in services]

                # Website
                website = soup.find("a", {"class": re.compile(r"website", re.I)})
                if website:
                    details["website"] = website.get("href")

                # Certifications
                certs = soup.find_all("span", {"class": re.compile(r"cert|badge|qualification", re.I)})
                if certs:
                    details["certifications"] = [c.get_text(strip=True) for c in certs]

                return details

            except Exception as e:
                logger.error(f"Error getting profile details: {e}")
                return None

    async def search_by_location(
        self,
        location: str,
        categories: Optional[List[str]] = None,
        max_pages_per_category: int = 2,
    ) -> Dict[str, List[WerkspotVakman]]:
        """
        Search for vakmensen in a location across multiple categories

        Args:
            location: City name
            categories: List of categories to search (default: popular ones)
            max_pages_per_category: Max pages per category

        Returns:
            Dictionary with category -> list of vakmensen
        """
        # Default to popular categories
        default_categories = [
            "loodgieter", "elektricien", "schilder", "timmerman",
            "dakdekker", "aannemer", "klusjesman", "cv_monteur"
        ]
        categories_to_search = categories or default_categories

        results = {}

        for category in categories_to_search:
            if category in self.CATEGORIES:
                vakmensen = await self.search_vakmensen(
                    category=category,
                    location=location,
                    max_pages=max_pages_per_category,
                )
                results[category] = vakmensen

        total = sum(len(v) for v in results.values())
        logger.info(f"Werkspot: Total {len(results)} vakmensen in {location} across {len(categories_to_search)} categories")

        return results
