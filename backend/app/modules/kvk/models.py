"""KVK API Data Models"""
from typing import Optional, List
from pydantic import BaseModel, Field


class KvKGeoData(BaseModel):
    """Geographic data for an address"""
    addresseerbaarObjectId: Optional[str] = None
    nummerAanduidingId: Optional[str] = None
    gpsLatitude: Optional[float] = None
    gpsLongitude: Optional[float] = None
    rijksdriehoekX: Optional[float] = None
    rijksdriehoekY: Optional[float] = None
    rijksdriehoekZ: Optional[float] = None


class KvKAdres(BaseModel):
    """KVK Address model"""
    type: Optional[str] = None  # bezoekadres, correspondentieadres
    indAfgeschermd: Optional[str] = None
    volledigAdres: Optional[str] = None
    straatnaam: Optional[str] = None
    huisnummer: Optional[int] = None
    huisnummerToevoeging: Optional[str] = None
    huisletter: Optional[str] = None
    postcode: Optional[str] = None
    postbusnummer: Optional[int] = None
    plaats: Optional[str] = None
    land: Optional[str] = None
    geoData: Optional[KvKGeoData] = None


class KvKSbiActiviteit(BaseModel):
    """SBI Activity code and description"""
    sbiCode: str
    sbiOmschrijving: str
    indHoofdactiviteit: Optional[str] = None


class KvKVestiging(BaseModel):
    """KVK Vestiging (branch/location) model"""
    vestigingsnummer: str
    kvkNummer: Optional[str] = None
    eersteHandelsnaam: Optional[str] = None
    indHoofdvestiging: Optional[str] = None
    indCommercieleVestiging: Optional[str] = None
    volledigAdres: Optional[str] = None
    adressen: Optional[List[KvKAdres]] = None
    websites: Optional[List[str]] = None
    sbiActiviteiten: Optional[List[KvKSbiActiviteit]] = None
    voltijdWerkzamePersonen: Optional[int] = None
    deeltijdWerkzamePersonen: Optional[int] = None
    totaalWerkzamePersonen: Optional[int] = None


class KvKBasisprofiel(BaseModel):
    """KVK Basisprofiel (company profile) model"""
    kvkNummer: str
    indNonMailing: Optional[str] = None
    naam: Optional[str] = None
    formeleRegistratiedatum: Optional[str] = None
    statutaireNaam: Optional[str] = None
    totaalWerkzamePersonen: Optional[int] = None
    handelsnamen: Optional[List[str]] = None
    sbiActiviteiten: Optional[List[KvKSbiActiviteit]] = None
    rechtsvorm: Optional[str] = None
    hoofdvestiging: Optional[dict] = None


class KvKSearchResultItem(BaseModel):
    """Single search result from KVK"""
    kvkNummer: str
    vestigingsnummer: Optional[str] = None
    naam: str
    adres: Optional[dict] = None
    type: str  # hoofdvestiging, nevenvestiging, rechtspersoon
    sbiActiviteiten: Optional[List[KvKSbiActiviteit]] = None


class KvKSearchResult(BaseModel):
    """KVK Search API response"""
    pagina: int = 1
    resultatenPerPagina: int = 10
    totaal: int = 0
    resultaten: List[KvKSearchResultItem] = Field(default_factory=list)


class KvKSearchRequest(BaseModel):
    """Request for KVK search"""
    query: Optional[str] = None
    kvkNummer: Optional[str] = None
    vestigingsnummer: Optional[str] = None
    handelsnaam: Optional[str] = None
    straatnaam: Optional[str] = None
    plaats: Optional[str] = None
    postcode: Optional[str] = None
    sbi: Optional[str] = None  # SBI activity code
    type: Optional[str] = None  # hoofdvestiging, nevenvestiging, rechtspersoon
    pagina: int = 1
    resultatenPerPagina: int = 10
