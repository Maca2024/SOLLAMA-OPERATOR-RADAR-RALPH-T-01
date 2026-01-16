"""Additional Scrapers for Vakmensen Discovery"""
from .marktplaats import MarktplaatsScraper
from .werkspot import WerkspotScraper
from .google_places import GooglePlacesClient

__all__ = ["MarktplaatsScraper", "WerkspotScraper", "GooglePlacesClient"]
