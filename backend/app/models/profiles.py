"""Profile models implementing the 4-Ring Strategy"""
from pydantic import BaseModel, Field, computed_field
from typing import Optional, List, Literal
from datetime import datetime
from enum import IntEnum
from uuid import UUID, uuid4


class ProfileRing(IntEnum):
    """The 4-Ring Classification System"""
    VAKMAN = 1      # 🔴 Established professionals (>5 years)
    ZZP = 2         # 🟠 Growing freelancers (tech-savvy)
    HOBBYIST = 3    # 🟡 Part-timers, no KvK yet
    ACADEMY = 4     # 🔵 Internal Solvari staff


class BaseProfile(BaseModel):
    """Base profile shared by all ring types"""
    id: UUID = Field(default_factory=uuid4)
    source_url: str
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    specialization: List[str] = Field(default_factory=list)
    description: Optional[str] = None

    # Classification
    ring: ProfileRing
    quality_score: float = Field(ge=0, le=10)
    confidence: float = Field(ge=0, le=1)

    # Metadata
    scraped_at: datetime = Field(default_factory=datetime.utcnow)
    processed_at: Optional[datetime] = None
    outreach_sent: bool = False

    @computed_field
    @property
    def ring_emoji(self) -> str:
        emojis = {1: "🔴", 2: "🟠", 3: "🟡", 4: "🔵"}
        return emojis.get(self.ring, "⚪")

    @computed_field
    @property
    def ring_name(self) -> str:
        names = {1: "Vakman", 2: "ZZP'er", 3: "Hobbyist", 4: "Academy"}
        return names.get(self.ring, "Unknown")


class VakmanProfile(BaseProfile):
    """🔴 Ring 1: Established Professional (>5 years)"""
    ring: Literal[ProfileRing.VAKMAN] = ProfileRing.VAKMAN

    # Vakman-specific fields
    kvk_number: Optional[str] = None
    years_in_business: int = Field(ge=5)
    employee_count: Optional[int] = None
    has_website: bool = False
    has_reviews: bool = False
    average_rating: Optional[float] = Field(default=None, ge=0, le=5)

    # Hook preferences
    interested_in_agenda_filling: bool = True
    interested_in_instant_payouts: bool = True


class ZZPProfile(BaseProfile):
    """🟠 Ring 2: Growing Freelancer (tech-savvy)"""
    ring: Literal[ProfileRing.ZZP] = ProfileRing.ZZP

    # ZZP-specific fields
    kvk_number: Optional[str] = None
    years_in_business: int = Field(ge=0, lt=5)
    social_media_presence: List[str] = Field(default_factory=list)
    tech_savviness_score: float = Field(ge=0, le=10)

    # Hook preferences
    interested_in_admin_bot: bool = True
    interested_in_lead_radar: bool = True


class HobbyistProfile(BaseProfile):
    """🟡 Ring 3: Part-timer / Starter (no KvK yet)"""
    ring: Literal[ProfileRing.HOBBYIST] = ProfileRing.HOBBYIST

    # Hobbyist-specific fields
    has_kvk: bool = False
    platform_source: Optional[str] = None  # e.g., Marktplaats, NextDoor
    service_description: Optional[str] = None
    max_job_value: float = Field(default=500.0)  # Sandbox limit

    # Hook preferences
    interested_in_starter_program: bool = True
    interested_in_zzp_wizard: bool = True


class ProfileClassification(BaseModel):
    """Result of AI classification"""
    ring: ProfileRing
    quality_score: float = Field(ge=0, le=10)
    confidence: float = Field(ge=0, le=1)
    reasoning: str
    extracted_data: dict
    recommended_hook: str


class ScrapedData(BaseModel):
    """Raw scraped data before classification"""
    url: str
    html_content: Optional[str] = None
    text_content: str
    metadata: dict = Field(default_factory=dict)
    scraped_at: datetime = Field(default_factory=datetime.utcnow)
    source_type: str  # kvk, google_maps, marktplaats, etc.


class OutreachMessage(BaseModel):
    """Generated outreach message"""
    profile_id: UUID
    ring: ProfileRing
    template_type: str
    subject: Optional[str] = None
    body: str
    channel: Literal["email", "dm", "sms", "invite"]
    personalization_tokens: dict = Field(default_factory=dict)
    generated_at: datetime = Field(default_factory=datetime.utcnow)
