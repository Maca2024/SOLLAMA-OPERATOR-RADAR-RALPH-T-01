"""Google Places API Client for Vakmensen Discovery"""
import os
from typing import Optional, List, Dict, Any
from datetime import datetime
from loguru import logger
import httpx
from pydantic import BaseModel


class GooglePlaceResult(BaseModel):
    """Google Places search result model"""
    place_id: str
    name: str
    address: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    rating: Optional[float] = None
    review_count: Optional[int] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    business_status: Optional[str] = None
    types: List[str] = []
    opening_hours: Optional[Dict[str, Any]] = None
    photos: List[str] = []


class GooglePlaceDetails(BaseModel):
    """Detailed Google Place information"""
    place_id: str
    name: str
    formatted_address: Optional[str] = None
    formatted_phone: Optional[str] = None
    website: Optional[str] = None
    rating: Optional[float] = None
    review_count: Optional[int] = None
    reviews: List[Dict[str, Any]] = []
    lat: Optional[float] = None
    lng: Optional[float] = None
    types: List[str] = []
    opening_hours: Optional[Dict[str, Any]] = None
    price_level: Optional[int] = None
    url: Optional[str] = None  # Google Maps URL


class GooglePlacesClient:
    """
    Google Places API Client for finding vakmensen businesses

    Requires GOOGLE_PLACES_API_KEY environment variable

    Free tier: $200/month credit (~17,000 basic requests)
    """

    BASE_URL = "https://maps.googleapis.com/maps/api/place"

    # Search queries for different vakmensen categories
    SEARCH_QUERIES = {
        "loodgieter": "loodgieter plumber",
        "elektricien": "elektricien electrician",
        "schilder": "schilder painter",
        "timmerman": "timmerman carpenter",
        "dakdekker": "dakdekker roofer",
        "aannemer": "aannemer contractor",
        "cv_monteur": "cv monteur heating",
        "installateur": "installateur installer",
        "klusjesman": "klusjesman handyman",
        "tuinman": "hovenier gardener",
        "tegelzetter": "tegelzetter tiler",
        "stukadoor": "stukadoor plasterer",
        "glaszetter": "glaszetter glazier",
        "metselaar": "metselaar mason",
        "isolatie": "isolatie isolatiebedrijf",
        "zonnepanelen": "zonnepanelen solar",
        "warmtepomp": "warmtepomp heat pump",
    }

    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize Google Places client

        Args:
            api_key: Google Places API key (or uses GOOGLE_PLACES_API_KEY env var)
        """
        self.api_key = api_key or os.getenv("GOOGLE_PLACES_API_KEY")

        if not self.api_key:
            logger.warning("Google Places API key not set - some features disabled")

    async def search_nearby(
        self,
        query: str,
        lat: float,
        lng: float,
        radius_m: int = 10000,
        max_results: int = 20,
    ) -> List[GooglePlaceResult]:
        """
        Search for businesses near a location

        Args:
            query: Search query (e.g., "loodgieter")
            lat: Latitude of center point
            lng: Longitude of center point
            radius_m: Search radius in meters (max 50000)
            max_results: Maximum results to return

        Returns:
            List of GooglePlaceResult objects
        """
        if not self.api_key:
            logger.error("Google Places API key required for search")
            return []

        results = []

        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                # Text Search API
                url = f"{self.BASE_URL}/textsearch/json"
                params = {
                    "query": query,
                    "location": f"{lat},{lng}",
                    "radius": min(radius_m, 50000),
                    "key": self.api_key,
                    "language": "nl",
                    "region": "nl",
                }

                response = await client.get(url, params=params)
                data = response.json()

                if data.get("status") != "OK":
                    logger.warning(f"Google Places API error: {data.get('status')}")
                    return []

                for place in data.get("results", [])[:max_results]:
                    try:
                        location = place.get("geometry", {}).get("location", {})

                        result = GooglePlaceResult(
                            place_id=place["place_id"],
                            name=place.get("name", "Unknown"),
                            address=place.get("formatted_address"),
                            lat=location.get("lat"),
                            lng=location.get("lng"),
                            rating=place.get("rating"),
                            review_count=place.get("user_ratings_total"),
                            business_status=place.get("business_status"),
                            types=place.get("types", []),
                            photos=[p.get("photo_reference") for p in place.get("photos", [])],
                        )
                        results.append(result)
                    except Exception as e:
                        logger.debug(f"Could not parse place: {e}")

                logger.info(f"Google Places: Found {len(results)} results for '{query}'")

            except Exception as e:
                logger.error(f"Google Places search error: {e}")

        return results

    async def search_vakmensen(
        self,
        category: str,
        location: str,
        radius_m: int = 15000,
    ) -> List[GooglePlaceResult]:
        """
        Search for vakmensen in a category near a location

        Args:
            category: Category key (loodgieter, elektricien, etc.)
            location: City or address to search near
            radius_m: Search radius in meters

        Returns:
            List of GooglePlaceResult objects
        """
        if not self.api_key:
            logger.error("Google Places API key required")
            return []

        # First geocode the location
        coords = await self._geocode(location)
        if not coords:
            logger.warning(f"Could not geocode location: {location}")
            return []

        # Get search query for category
        query = self.SEARCH_QUERIES.get(category, category)

        # Combine with location for better results
        full_query = f"{query} {location}"

        return await self.search_nearby(
            query=full_query,
            lat=coords["lat"],
            lng=coords["lng"],
            radius_m=radius_m,
        )

    async def get_place_details(self, place_id: str) -> Optional[GooglePlaceDetails]:
        """
        Get detailed information about a place

        Args:
            place_id: Google Place ID

        Returns:
            GooglePlaceDetails object or None
        """
        if not self.api_key:
            logger.error("Google Places API key required")
            return None

        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                url = f"{self.BASE_URL}/details/json"
                params = {
                    "place_id": place_id,
                    "key": self.api_key,
                    "language": "nl",
                    "fields": ",".join([
                        "place_id", "name", "formatted_address", "formatted_phone_number",
                        "website", "rating", "user_ratings_total", "reviews",
                        "geometry", "types", "opening_hours", "price_level", "url",
                        "business_status"
                    ]),
                }

                response = await client.get(url, params=params)
                data = response.json()

                if data.get("status") != "OK":
                    logger.warning(f"Google Places details error: {data.get('status')}")
                    return None

                result = data.get("result", {})
                location = result.get("geometry", {}).get("location", {})

                return GooglePlaceDetails(
                    place_id=result.get("place_id", place_id),
                    name=result.get("name", "Unknown"),
                    formatted_address=result.get("formatted_address"),
                    formatted_phone=result.get("formatted_phone_number"),
                    website=result.get("website"),
                    rating=result.get("rating"),
                    review_count=result.get("user_ratings_total"),
                    reviews=result.get("reviews", []),
                    lat=location.get("lat"),
                    lng=location.get("lng"),
                    types=result.get("types", []),
                    opening_hours=result.get("opening_hours"),
                    price_level=result.get("price_level"),
                    url=result.get("url"),
                )

            except Exception as e:
                logger.error(f"Google Places details error: {e}")
                return None

    async def _geocode(self, address: str) -> Optional[Dict[str, float]]:
        """
        Geocode an address to coordinates

        Args:
            address: Address or city name

        Returns:
            Dict with lat/lng or None
        """
        if not self.api_key:
            return None

        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                url = "https://maps.googleapis.com/maps/api/geocode/json"
                params = {
                    "address": f"{address}, Netherlands",
                    "key": self.api_key,
                    "region": "nl",
                }

                response = await client.get(url, params=params)
                data = response.json()

                if data.get("status") == "OK" and data.get("results"):
                    location = data["results"][0]["geometry"]["location"]
                    return {"lat": location["lat"], "lng": location["lng"]}

            except Exception as e:
                logger.error(f"Geocoding error: {e}")

        return None

    async def search_all_categories(
        self,
        location: str,
        categories: Optional[List[str]] = None,
        radius_m: int = 15000,
    ) -> Dict[str, List[GooglePlaceResult]]:
        """
        Search multiple categories at once

        Args:
            location: City or address
            categories: List of categories (default: popular ones)
            radius_m: Search radius

        Returns:
            Dictionary with category -> list of results
        """
        default_categories = [
            "loodgieter", "elektricien", "aannemer", "cv_monteur",
            "schilder", "dakdekker", "timmerman"
        ]
        categories_to_search = categories or default_categories

        results = {}

        for category in categories_to_search:
            places = await self.search_vakmensen(
                category=category,
                location=location,
                radius_m=radius_m,
            )
            results[category] = places

        total = sum(len(p) for p in results.values())
        logger.info(f"Google Places: Total {total} businesses across {len(categories_to_search)} categories")

        return results

    def get_photo_url(self, photo_reference: str, max_width: int = 400) -> str:
        """
        Get URL for a place photo

        Args:
            photo_reference: Photo reference from search results
            max_width: Maximum width in pixels

        Returns:
            Photo URL
        """
        return (
            f"{self.BASE_URL}/photo"
            f"?maxwidth={max_width}"
            f"&photo_reference={photo_reference}"
            f"&key={self.api_key}"
        )
