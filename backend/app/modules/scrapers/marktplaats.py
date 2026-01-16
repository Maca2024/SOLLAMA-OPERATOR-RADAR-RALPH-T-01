"""Marktplaats Diensten Scraper for Vakmensen Discovery"""
import asyncio
import re
from typing import Optional, List, Dict, Any
from datetime import datetime
from loguru import logger
import httpx
from bs4 import BeautifulSoup
from pydantic import BaseModel


class MarktplaatsVakman(BaseModel):
    """Marktplaats Diensten listing model"""
    listing_id: str
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None
    location: Optional[str] = None
    price: Optional[str] = None
    seller_name: Optional[str] = None
    seller_since: Optional[str] = None
    phone: Optional[str] = None
    url: str
    scraped_at: datetime


class MarktplaatsScraper:
    """
    Scraper for Marktplaats Diensten section

    Categories for vakmensen:
    - /diensten-en-vakmensen/bouw/
    - /diensten-en-vakmensen/loodgieters/
    - /diensten-en-vakmensen/elektriciens/
    - /diensten-en-vakmensen/schilders/
    - /diensten-en-vakmensen/tuinlieden/
    """

    BASE_URL = "https://www.marktplaats.nl"

    # Category mappings for vakmensen
    CATEGORIES = {
        "bouw": "/l/diensten-en-vakmensen/bouw/",
        "loodgieter": "/l/diensten-en-vakmensen/loodgieters/",
        "elektricien": "/l/diensten-en-vakmensen/elektriciens/",
        "schilder": "/l/diensten-en-vakmensen/schilders/",
        "timmerman": "/l/diensten-en-vakmensen/timmerlieden/",
        "tuinman": "/l/diensten-en-vakmensen/tuinlieden/",
        "dakdekker": "/l/diensten-en-vakmensen/dakdekkers/",
        "stukadoor": "/l/diensten-en-vakmensen/stukadoors/",
        "tegelzetter": "/l/diensten-en-vakmensen/tegelzetters/",
        "schoonmaak": "/l/diensten-en-vakmensen/schoonmaak/",
        "verhuizen": "/l/diensten-en-vakmensen/verhuizers/",
        "klusjesman": "/l/diensten-en-vakmensen/klussers/",
    }

    def __init__(self, delay_min: float = 1.0, delay_max: float = 3.0):
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
        distance_km: int = 30,
        max_pages: int = 3,
    ) -> List[MarktplaatsVakman]:
        """
        Search for vakmensen in a specific category

        Args:
            category: Category key (loodgieter, elektricien, etc.)
            location: City or postal code
            distance_km: Search radius in km
            max_pages: Maximum pages to scrape

        Returns:
            List of MarktplaatsVakman objects
        """
        if category not in self.CATEGORIES:
            logger.warning(f"Unknown category: {category}")
            return []

        results = []
        category_path = self.CATEGORIES[category]

        async with httpx.AsyncClient(headers=self.headers, timeout=30.0, follow_redirects=True) as client:
            for page in range(1, max_pages + 1):
                try:
                    # Build URL with filters
                    url = f"{self.BASE_URL}{category_path}"
                    params = {"currentPage": page}

                    if location:
                        params["postcode"] = location
                        params["distanceMeters"] = distance_km * 1000

                    logger.info(f"Marktplaats: Scraping {category} page {page}")

                    # Add delay
                    await asyncio.sleep(await self._get_delay())

                    response = await client.get(url, params=params)

                    if response.status_code != 200:
                        logger.warning(f"Marktplaats returned {response.status_code}")
                        break

                    # Parse listings
                    listings = self._parse_listing_page(response.text, category)

                    if not listings:
                        logger.info(f"No more listings on page {page}")
                        break

                    results.extend(listings)
                    logger.info(f"Found {len(listings)} listings on page {page}")

                except Exception as e:
                    logger.error(f"Error scraping page {page}: {e}")
                    break

        logger.info(f"Marktplaats: Total {len(results)} vakmensen found for {category}")
        return results

    def _parse_listing_page(self, html: str, category: str) -> List[MarktplaatsVakman]:
        """Parse a listing page and extract vakmensen"""
        soup = BeautifulSoup(html, "html.parser")
        listings = []

        # Find all listing cards
        # Marktplaats uses data attributes for listings
        cards = soup.find_all("li", {"class": re.compile(r"hz-Listing")})

        if not cards:
            # Try alternative selectors
            cards = soup.find_all("article", {"data-testid": re.compile(r"listing")})

        for card in cards:
            try:
                listing = self._parse_listing_card(card, category)
                if listing:
                    listings.append(listing)
            except Exception as e:
                logger.debug(f"Could not parse listing card: {e}")

        return listings

    def _parse_listing_card(self, card, category: str) -> Optional[MarktplaatsVakman]:
        """Parse a single listing card"""
        try:
            # Extract listing ID from link
            link = card.find("a", href=True)
            if not link:
                return None

            href = link.get("href", "")
            listing_id = re.search(r"/a(\d+)", href)
            listing_id = listing_id.group(1) if listing_id else href

            # Title
            title_elem = card.find("h3") or card.find("span", {"class": re.compile(r"title", re.I)})
            title = title_elem.get_text(strip=True) if title_elem else "Unknown"

            # Description
            desc_elem = card.find("p") or card.find("span", {"class": re.compile(r"description", re.I)})
            description = desc_elem.get_text(strip=True) if desc_elem else None

            # Price
            price_elem = card.find("span", {"class": re.compile(r"price", re.I)})
            price = price_elem.get_text(strip=True) if price_elem else None

            # Location
            loc_elem = card.find("span", {"class": re.compile(r"location", re.I)})
            location = loc_elem.get_text(strip=True) if loc_elem else None

            # Seller info
            seller_elem = card.find("span", {"class": re.compile(r"seller", re.I)})
            seller_name = seller_elem.get_text(strip=True) if seller_elem else None

            url = f"{self.BASE_URL}{href}" if href.startswith("/") else href

            return MarktplaatsVakman(
                listing_id=str(listing_id),
                title=title,
                description=description,
                category="diensten-en-vakmensen",
                subcategory=category,
                location=location,
                price=price,
                seller_name=seller_name,
                url=url,
                scraped_at=datetime.utcnow(),
            )
        except Exception as e:
            logger.debug(f"Failed to parse card: {e}")
            return None

    async def get_listing_details(self, listing_url: str) -> Optional[Dict[str, Any]]:
        """
        Get detailed information from a single listing page

        Args:
            listing_url: Full URL to the listing

        Returns:
            Dictionary with detailed listing info
        """
        async with httpx.AsyncClient(headers=self.headers, timeout=30.0, follow_redirects=True) as client:
            try:
                await asyncio.sleep(await self._get_delay())

                response = await client.get(listing_url)

                if response.status_code != 200:
                    return None

                soup = BeautifulSoup(response.text, "html.parser")

                # Extract detailed info
                details = {
                    "url": listing_url,
                    "scraped_at": datetime.utcnow().isoformat(),
                }

                # Title
                title = soup.find("h1")
                if title:
                    details["title"] = title.get_text(strip=True)

                # Description
                desc = soup.find("div", {"class": re.compile(r"description", re.I)})
                if desc:
                    details["description"] = desc.get_text(strip=True)

                # Price
                price = soup.find("span", {"class": re.compile(r"price", re.I)})
                if price:
                    details["price"] = price.get_text(strip=True)

                # Seller info
                seller_section = soup.find("div", {"class": re.compile(r"seller", re.I)})
                if seller_section:
                    seller_name = seller_section.find("a")
                    if seller_name:
                        details["seller_name"] = seller_name.get_text(strip=True)

                    # Member since
                    member_since = seller_section.find(string=re.compile(r"sinds", re.I))
                    if member_since:
                        details["seller_since"] = str(member_since).strip()

                # Phone number (may be hidden)
                phone = soup.find("a", href=re.compile(r"tel:"))
                if phone:
                    details["phone"] = phone.get("href", "").replace("tel:", "")

                # Location
                location = soup.find("span", {"class": re.compile(r"location", re.I)})
                if location:
                    details["location"] = location.get_text(strip=True)

                return details

            except Exception as e:
                logger.error(f"Error getting listing details: {e}")
                return None

    async def search_all_categories(
        self,
        location: Optional[str] = None,
        categories: Optional[List[str]] = None,
        max_pages_per_category: int = 2,
    ) -> Dict[str, List[MarktplaatsVakman]]:
        """
        Search multiple categories at once

        Args:
            location: City or postal code
            categories: List of categories to search (default: all)
            max_pages_per_category: Max pages per category

        Returns:
            Dictionary with category -> list of vakmensen
        """
        categories_to_search = categories or list(self.CATEGORIES.keys())
        results = {}

        for category in categories_to_search:
            vakmensen = await self.search_vakmensen(
                category=category,
                location=location,
                max_pages=max_pages_per_category,
            )
            results[category] = vakmensen

        total = sum(len(v) for v in results.values())
        logger.info(f"Marktplaats: Total {total} vakmensen across {len(categories_to_search)} categories")

        return results
