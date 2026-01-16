"""KVK Handelsregister API Client - Test & Production Support"""
import os
from typing import Optional, List
import httpx
from loguru import logger

from .models import (
    KvKSearchResult,
    KvKSearchResultItem,
    KvKBasisprofiel,
    KvKVestiging,
    KvKSbiActiviteit,
    KvKAdres,
)


class KvKClient:
    """
    Client for KVK Handelsregister API

    API Documentation: https://developers.kvk.nl/

    Environment Variables:
    - KVK_API_KEY: Your KVK API key (required for production)
    - KVK_USE_PRODUCTION: Set to "true" to use production API

    Endpoints:
    - Zoeken (v2): Search for companies
    - Basisprofiel (v1): Get company basic profile
    - Vestigingsprofiel (v1): Get branch details
    - Naamgeving (v1): Get trade names
    """

    # Production API
    PROD_BASE_URL = "https://api.kvk.nl/api"
    # Test API (free, with test data)
    TEST_BASE_URL = "https://api.kvk.nl/test/api"

    # Default test API key (public, for test environment only)
    DEFAULT_TEST_API_KEY = "l7xx1f2691f2520d487b902f4e0b57a0b197"

    def __init__(self, api_key: Optional[str] = None, use_test: Optional[bool] = None):
        """
        Initialize KVK client

        Args:
            api_key: KVK API key (uses env KVK_API_KEY or test key if not provided)
            use_test: Use test API (default: checks KVK_USE_PRODUCTION env var)
        """
        # Determine if we should use production
        if use_test is None:
            # Check environment variable
            use_production = os.getenv("KVK_USE_PRODUCTION", "").lower() in ("true", "1", "yes")
            self.use_test = not use_production
        else:
            self.use_test = use_test

        self.base_url = self.TEST_BASE_URL if self.use_test else self.PROD_BASE_URL

        # Use provided key, environment variable, or default test key
        if api_key:
            self.api_key = api_key
        elif os.getenv("KVK_API_KEY"):
            self.api_key = os.getenv("KVK_API_KEY")
            logger.info("KVK: Using API key from environment")
        elif self.use_test:
            self.api_key = self.DEFAULT_TEST_API_KEY
            logger.info("KVK: Using default test API key")
        else:
            self.api_key = None
            logger.warning("KVK: No API key set for PRODUCTION - requests will fail!")

        mode = "TEST" if self.use_test else "PRODUCTION"
        logger.info(f"KVK client initialized ({mode} mode, base={self.base_url})")

    async def _request(self, endpoint: str, params: Optional[dict] = None) -> dict:
        """Make authenticated request to KVK API"""
        headers = {
            "apikey": self.api_key,
            "Accept": "application/json",
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            url = f"{self.base_url}/{endpoint}"
            logger.debug(f"KVK Request: {url}")
            response = await client.get(url, headers=headers, params=params)
            response.raise_for_status()
            return response.json()

    async def search(
        self,
        query: Optional[str] = None,
        kvk_nummer: Optional[str] = None,
        vestigingsnummer: Optional[str] = None,
        handelsnaam: Optional[str] = None,
        straatnaam: Optional[str] = None,
        huisnummer: Optional[str] = None,
        postcode: Optional[str] = None,
        plaats: Optional[str] = None,
        type_filter: Optional[str] = None,
        pagina: int = 1,
        per_pagina: int = 10,
    ) -> KvKSearchResult:
        """
        Search KVK Handelsregister (v2 API)

        Args:
            query: Free text search (naam parameter)
            kvk_nummer: KVK number (8 digits)
            vestigingsnummer: Branch number (12 digits)
            handelsnaam: Trade name
            straatnaam: Street name
            huisnummer: House number
            postcode: Postal code
            plaats: City/municipality
            type_filter: hoofdvestiging, nevenvestiging, rechtspersoon
            pagina: Page number
            per_pagina: Results per page (max 100)

        Returns:
            KvKSearchResult with matching companies
        """
        params = {
            "pagina": pagina,
            "resultatenperpagina": min(per_pagina, 100),
        }

        # Map parameters to KVK API names
        if query:
            params["naam"] = query
        if kvk_nummer:
            params["kvkNummer"] = kvk_nummer
        if vestigingsnummer:
            params["vestigingsnummer"] = vestigingsnummer
        if handelsnaam:
            params["handelsnaam"] = handelsnaam
        if straatnaam:
            params["straatnaam"] = straatnaam
        if huisnummer:
            params["huisnummer"] = huisnummer
        if postcode:
            params["postcode"] = postcode
        if plaats:
            params["plaats"] = plaats
        if type_filter:
            params["type"] = type_filter

        logger.info(f"KVK Search: {params}")

        try:
            data = await self._request("v2/zoeken", params)

            return KvKSearchResult(
                pagina=data.get("pagina", 1),
                resultatenPerPagina=data.get("resultatenPerPagina", 10),
                totaal=data.get("totaal", 0),
                resultaten=[
                    KvKSearchResultItem(
                        kvkNummer=r["kvkNummer"],
                        vestigingsnummer=r.get("vestigingsnummer"),
                        naam=r["naam"],
                        adres=r.get("adres"),
                        type=r.get("type", "onbekend"),
                        sbiActiviteiten=[
                            KvKSbiActiviteit(**sbi) for sbi in r.get("sbiActiviteiten", [])
                        ] if r.get("sbiActiviteiten") else None,
                    )
                    for r in data.get("resultaten", [])
                ],
            )
        except httpx.HTTPStatusError as e:
            logger.error(f"KVK Search failed: {e}")
            # Return empty result on error
            return KvKSearchResult(pagina=1, resultatenPerPagina=10, totaal=0, resultaten=[])

    async def get_basisprofiel(self, kvk_nummer: str) -> Optional[KvKBasisprofiel]:
        """
        Get company basic profile (v1 API)

        Args:
            kvk_nummer: KVK number (8 digits)

        Returns:
            KvKBasisprofiel with company details, or None on error
        """
        try:
            data = await self._request(f"v1/basisprofielen/{kvk_nummer}")

            # Extract embedded data
            embedded = data.get("_embedded", {})
            hoofdvestiging = embedded.get("hoofdvestiging", {})
            eigenaar = embedded.get("eigenaar", {})

            return KvKBasisprofiel(
                kvkNummer=data["kvkNummer"],
                indNonMailing=data.get("indNonMailing"),
                naam=data.get("naam"),
                formeleRegistratiedatum=data.get("formeleRegistratiedatum"),
                statutaireNaam=data.get("statutaireNaam"),
                totaalWerkzamePersonen=data.get("totaalWerkzamePersonen") or hoofdvestiging.get("totaalWerkzamePersonen"),
                handelsnamen=[h.get("naam") for h in data.get("handelsnamen", [])],
                sbiActiviteiten=[
                    KvKSbiActiviteit(**sbi) for sbi in data.get("sbiActiviteiten", [])
                ],
                rechtsvorm=eigenaar.get("rechtsvorm"),
                hoofdvestiging=hoofdvestiging,
            )
        except httpx.HTTPStatusError as e:
            logger.error(f"KVK Basisprofiel failed for {kvk_nummer}: {e}")
            return None

    async def get_vestigingsprofiel(
        self, vestigingsnummer: str, geo_data: bool = False
    ) -> Optional[KvKVestiging]:
        """
        Get branch/location profile (v1 API)

        Args:
            vestigingsnummer: Branch number (12 digits)
            geo_data: Include geographic data (GPS coordinates)

        Returns:
            KvKVestiging with branch details, or None on error
        """
        try:
            params = {"geoData": "true"} if geo_data else None
            data = await self._request(f"v1/vestigingsprofielen/{vestigingsnummer}", params)

            return KvKVestiging(
                vestigingsnummer=data["vestigingsnummer"],
                kvkNummer=data.get("kvkNummer"),
                eersteHandelsnaam=data.get("eersteHandelsnaam"),
                indHoofdvestiging=data.get("indHoofdvestiging"),
                indCommercieleVestiging=data.get("indCommercieleVestiging"),
                voltijdWerkzamePersonen=data.get("voltijdWerkzamePersonen"),
                deeltijdWerkzamePersonen=data.get("deeltijdWerkzamePersonen"),
                totaalWerkzamePersonen=data.get("totaalWerkzamePersonen"),
                adressen=[KvKAdres(**addr) for addr in data.get("adressen", [])],
                websites=data.get("websites"),
                sbiActiviteiten=[
                    KvKSbiActiviteit(**sbi) for sbi in data.get("sbiActiviteiten", [])
                ],
            )
        except httpx.HTTPStatusError as e:
            logger.error(f"KVK Vestigingsprofiel failed for {vestigingsnummer}: {e}")
            return None

    async def get_vestigingen(self, kvk_nummer: str) -> List[dict]:
        """
        Get all vestigingen (branches) for a company

        Args:
            kvk_nummer: KVK number (8 digits)

        Returns:
            List of vestigingen
        """
        try:
            data = await self._request(f"v1/basisprofielen/{kvk_nummer}/vestigingen")
            return data.get("vestigingen", [])
        except httpx.HTTPStatusError as e:
            logger.error(f"KVK Vestigingen failed for {kvk_nummer}: {e}")
            return []

    async def search_vakmensen(
        self,
        plaats: Optional[str] = None,
        vakgebied: Optional[str] = None,
        sbi_code: Optional[str] = None,
    ) -> KvKSearchResult:
        """
        Search for vakmensen (contractors) by location and trade

        This is a convenience method for finding contractors.

        Args:
            plaats: City/municipality
            vakgebied: Trade category (loodgieter, elektra, etc.)
            sbi_code: Specific SBI code to search

        Returns:
            KvKSearchResult with matching contractors
        """
        # Build search query
        search_query = None
        if vakgebied:
            # Map Dutch trade names to search terms
            trade_terms = {
                "loodgieter": "loodgieter",
                "elektra": "elektr",
                "elektrician": "elektr",
                "schilder": "schilder",
                "timmerman": "timmer",
                "dakdekker": "dakdek",
                "tuinman": "hovenier",
                "schoonmaak": "schoonmaak",
                "metselaar": "metsel",
                "stukadoor": "stukadoor",
                "bouw": "bouw",
                "aannemer": "aannemer",
            }
            search_query = trade_terms.get(vakgebied.lower(), vakgebied)

        return await self.search(
            query=search_query,
            plaats=plaats,
            type_filter="hoofdvestiging",
        )

    async def get_company_details(self, kvk_nummer: str) -> dict:
        """
        Get comprehensive company details including all vestigingen

        Args:
            kvk_nummer: KVK number (8 digits)

        Returns:
            Complete company profile with vestigingen
        """
        basisprofiel = await self.get_basisprofiel(kvk_nummer)
        if not basisprofiel:
            return {}

        vestigingen = await self.get_vestigingen(kvk_nummer)

        return {
            "kvkNummer": basisprofiel.kvkNummer,
            "naam": basisprofiel.naam,
            "statutaireNaam": basisprofiel.statutaireNaam,
            "rechtsvorm": basisprofiel.rechtsvorm,
            "registratiedatum": basisprofiel.formeleRegistratiedatum,
            "werkzamePersonen": basisprofiel.totaalWerkzamePersonen,
            "handelsnamen": basisprofiel.handelsnamen,
            "sbiActiviteiten": [
                {"code": s.sbiCode, "omschrijving": s.sbiOmschrijving}
                for s in (basisprofiel.sbiActiviteiten or [])
            ],
            "hoofdvestiging": basisprofiel.hoofdvestiging,
            "vestigingen": vestigingen,
        }
