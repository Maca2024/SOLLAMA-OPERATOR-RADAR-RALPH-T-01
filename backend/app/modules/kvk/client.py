"""KVK Handelsregister API Client"""
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
)


class KvKClient:
    """
    Client for KVK Handelsregister API

    API Documentation: https://developers.kvk.nl/

    Endpoints:
    - Zoeken: Search for companies
    - Basisprofiel: Get company basic profile
    - Vestigingsprofiel: Get branch details
    - Naamgeving: Get trade names
    """

    # Production API
    BASE_URL = "https://api.kvk.nl/api/v1"
    # Test API (for development)
    TEST_URL = "https://api.kvk.nl/test/api/v1"

    def __init__(self, api_key: Optional[str] = None, use_test: bool = True):
        """
        Initialize KVK client

        Args:
            api_key: KVK API key (from kvk.nl developer portal)
            use_test: Use test API (default True for development)
        """
        self.api_key = api_key or os.getenv("KVK_API_KEY")
        self.base_url = self.TEST_URL if use_test else self.BASE_URL
        self.use_mock = not self.api_key

        if self.use_mock:
            logger.warning("KVK API key not found - using mock data")
        else:
            logger.info(f"KVK client initialized (test={use_test})")

    async def _request(self, endpoint: str, params: Optional[dict] = None) -> dict:
        """Make authenticated request to KVK API"""
        if self.use_mock:
            return self._get_mock_response(endpoint, params)

        headers = {
            "apikey": self.api_key,
            "Accept": "application/json",
        }

        async with httpx.AsyncClient() as client:
            url = f"{self.base_url}/{endpoint}"
            response = await client.get(url, headers=headers, params=params)
            response.raise_for_status()
            return response.json()

    def _get_mock_response(self, endpoint: str, params: Optional[dict] = None) -> dict:
        """Return mock data for development/demo"""
        if "zoeken" in endpoint.lower() or endpoint == "":
            plaats = params.get("plaats", "Amsterdam") if params else "Amsterdam"
            sbi = params.get("sbi", "") if params else ""
            query = params.get("handelsnaam", params.get("q", "")) if params else ""

            # Generate mock vakmensen based on search
            mock_trades = {
                "4322": [
                    ("Van der Berg Loodgieters BV", "12345678", "Loodgieterswerk"),
                    ("Pieterse Sanitair", "23456789", "Sanitair installatie"),
                    ("Amsterdam Loodgieter Direct", "34567890", "Loodgieterswerkzaamheden"),
                ],
                "4321": [
                    ("Jansen Elektrotechniek", "45678901", "Elektrotechnische installatie"),
                    ("ElektroFix Nederland", "56789012", "Elektrische installaties"),
                    ("Stroom & Meer BV", "67890123", "Elektricien werkzaamheden"),
                ],
                "4334": [
                    ("Schildersbedrijf De Kwast", "78901234", "Schilderwerk"),
                    ("ColorPro Painters", "89012345", "Schilderen en behangen"),
                ],
                "4332": [
                    ("Timmerbedrijf Hout & Co", "90123456", "Timmerwerk"),
                    ("De Gouden Spijker", "01234567", "Timmerwerkzaamheden"),
                ],
                "41": [
                    ("Bouwbedrijf Nederland BV", "11223344", "Algemene bouw"),
                    ("Constructie Van Dijk", "22334455", "Burgerlijke utiliteitsbouw"),
                    ("ModernBouw Holding", "33445566", "Nieuwbouw en renovatie"),
                ],
            }

            # Get trades for SBI or default
            trades = mock_trades.get(sbi, [
                ("Vakwerk Nederland BV", "44556677", "Diverse vakwerkzaamheden"),
                ("Handyman Services", "55667788", "Klussenbedrijf"),
                ("Pro Onderhoud", "66778899", "Onderhoud en reparatie"),
            ])

            resultaten = []
            for naam, kvk, omschrijving in trades:
                resultaten.append({
                    "kvkNummer": kvk,
                    "vestigingsnummer": f"000{kvk[:8]}",
                    "naam": naam,
                    "adres": {
                        "binnenlandsAdres": {
                            "type": "bezoekadres",
                            "straatnaam": "Hoofdstraat",
                            "huisnummer": len(kvk) * 2,
                            "postcode": f"1{kvk[:3]}AB",
                            "plaats": plaats,
                        }
                    },
                    "type": "hoofdvestiging",
                    "sbiActiviteiten": [
                        {"sbiCode": sbi or "41", "sbiOmschrijving": omschrijving}
                    ],
                })

            return {
                "pagina": 1,
                "resultatenPerPagina": 10,
                "totaal": len(resultaten),
                "resultaten": resultaten,
            }

        elif "basisprofielen" in endpoint.lower():
            kvk = endpoint.split("/")[-1] if "/" in endpoint else "12345678"
            return {
                "kvkNummer": kvk,
                "naam": "Mock Bedrijf BV",
                "formeleRegistratiedatum": "20150101",
                "sbiActiviteiten": [
                    {"sbiCode": "41", "sbiOmschrijving": "Algemene bouw", "indHoofdactiviteit": "Ja"}
                ],
            }

        return {}

    async def search(
        self,
        query: Optional[str] = None,
        kvk_nummer: Optional[str] = None,
        handelsnaam: Optional[str] = None,
        straatnaam: Optional[str] = None,
        plaats: Optional[str] = None,
        postcode: Optional[str] = None,
        sbi: Optional[str] = None,
        type_filter: Optional[str] = None,
        pagina: int = 1,
        per_pagina: int = 10,
    ) -> KvKSearchResult:
        """
        Search KVK Handelsregister

        Args:
            query: Free text search
            kvk_nummer: KVK number (8 digits)
            handelsnaam: Trade name
            straatnaam: Street name
            plaats: City/municipality
            postcode: Postal code
            sbi: SBI activity code
            type_filter: hoofdvestiging, nevenvestiging, rechtspersoon
            pagina: Page number
            per_pagina: Results per page (max 100)

        Returns:
            KvKSearchResult with matching companies
        """
        params = {
            "pagina": pagina,
            "resultatenPerPagina": min(per_pagina, 100),
        }

        if query:
            params["q"] = query
        if kvk_nummer:
            params["kvkNummer"] = kvk_nummer
        if handelsnaam:
            params["handelsnaam"] = handelsnaam
        if straatnaam:
            params["straatnaam"] = straatnaam
        if plaats:
            params["plaats"] = plaats
        if postcode:
            params["postcode"] = postcode
        if sbi:
            params["sbi"] = sbi
        if type_filter:
            params["type"] = type_filter

        logger.info(f"KVK Search: {params}")
        data = await self._request("zoeken", params)

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

    async def get_basisprofiel(self, kvk_nummer: str) -> KvKBasisprofiel:
        """
        Get company basic profile

        Args:
            kvk_nummer: KVK number (8 digits)

        Returns:
            KvKBasisprofiel with company details
        """
        data = await self._request(f"basisprofielen/{kvk_nummer}")
        return KvKBasisprofiel(**data)

    async def get_vestigingsprofiel(
        self, vestigingsnummer: str, geo_data: bool = False
    ) -> KvKVestiging:
        """
        Get branch/location profile

        Args:
            vestigingsnummer: Branch number (12 digits)
            geo_data: Include geographic data

        Returns:
            KvKVestiging with branch details
        """
        params = {"geoData": "true"} if geo_data else None
        data = await self._request(f"vestigingsprofielen/{vestigingsnummer}", params)
        return KvKVestiging(**data)

    async def search_vakmensen(
        self,
        plaats: Optional[str] = None,
        vakgebied: Optional[str] = None,
        sbi_codes: Optional[List[str]] = None,
    ) -> KvKSearchResult:
        """
        Search for vakmensen (contractors) by location and trade

        This is a convenience method for finding contractors.

        Args:
            plaats: City/municipality
            vakgebied: Trade category (loodgieter, elektra, etc.)
            sbi_codes: Specific SBI codes to search

        Returns:
            KvKSearchResult with matching contractors
        """
        # Map vakgebied to SBI codes
        vakgebied_sbi_map = {
            "bouw": ["41", "4120"],
            "loodgieter": ["4322"],
            "elektra": ["4321"],
            "schilder": ["4334"],
            "timmerman": ["4332"],
            "dakdekker": ["4391"],
            "tuinman": ["8130"],
            "schoonmaak": ["8121"],
            "cv": ["4322"],  # CV installation often under loodgieter
            "metselaar": ["4399"],
            "stukadoor": ["4331"],
            "glaszetter": ["4334"],
        }

        # Get SBI codes
        if sbi_codes:
            codes = sbi_codes
        elif vakgebied and vakgebied.lower() in vakgebied_sbi_map:
            codes = vakgebied_sbi_map[vakgebied.lower()]
        else:
            codes = ["41"]  # Default to construction

        # Search with first SBI code (API limitation)
        return await self.search(
            plaats=plaats,
            sbi=codes[0] if codes else None,
            type_filter="hoofdvestiging",
        )
