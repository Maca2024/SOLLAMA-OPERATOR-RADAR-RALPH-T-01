"""SQLAlchemy database models"""
from datetime import datetime
from typing import Optional, List
from uuid import uuid4

from sqlalchemy import String, Integer, Float, Boolean, DateTime, Text, JSON, Enum
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

from ..models.profiles import ProfileRing


class Base(DeclarativeBase):
    """Base class for all database models"""
    pass


class ProfileDB(Base):
    """Database model for scraped and classified profiles"""
    __tablename__ = "profiles"

    id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)

    # Source info
    source_url: Mapped[str] = mapped_column(String(2048), nullable=False)
    source_type: Mapped[str] = mapped_column(String(50), nullable=False)

    # Basic info
    name: Mapped[Optional[str]] = mapped_column(String(255))
    email: Mapped[Optional[str]] = mapped_column(String(255))
    phone: Mapped[Optional[str]] = mapped_column(String(50))
    location: Mapped[Optional[str]] = mapped_column(String(255))
    description: Mapped[Optional[str]] = mapped_column(Text)

    # Specialization stored as JSON array
    specialization: Mapped[Optional[dict]] = mapped_column(JSON, default=list)

    # Classification
    ring: Mapped[int] = mapped_column(Integer, nullable=False)
    quality_score: Mapped[float] = mapped_column(Float, default=0.0)
    confidence: Mapped[float] = mapped_column(Float, default=0.0)
    classification_reasoning: Mapped[Optional[str]] = mapped_column(Text)

    # Ring-specific data
    kvk_number: Mapped[Optional[str]] = mapped_column(String(20))
    years_in_business: Mapped[Optional[int]] = mapped_column(Integer)
    employee_count: Mapped[Optional[int]] = mapped_column(Integer)
    has_website: Mapped[bool] = mapped_column(Boolean, default=False)
    has_reviews: Mapped[bool] = mapped_column(Boolean, default=False)
    average_rating: Mapped[Optional[float]] = mapped_column(Float)
    social_media: Mapped[Optional[dict]] = mapped_column(JSON, default=list)

    # Raw data
    raw_text: Mapped[Optional[str]] = mapped_column(Text)
    extracted_data: Mapped[Optional[dict]] = mapped_column(JSON)

    # Status
    outreach_sent: Mapped[bool] = mapped_column(Boolean, default=False)
    outreach_response: Mapped[Optional[str]] = mapped_column(String(50))

    # Timestamps
    scraped_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    classified_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    @property
    def ring_name(self) -> str:
        names = {1: "Vakman", 2: "ZZP'er", 3: "Hobbyist", 4: "Academy"}
        return names.get(self.ring, "Unknown")

    @property
    def ring_emoji(self) -> str:
        emojis = {1: "🔴", 2: "🟠", 3: "🟡", 4: "🔵"}
        return emojis.get(self.ring, "⚪")


class OutreachDB(Base):
    """Database model for generated outreach messages"""
    __tablename__ = "outreach_messages"

    id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    profile_id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), nullable=False)

    # Message content
    ring: Mapped[int] = mapped_column(Integer, nullable=False)
    channel: Mapped[str] = mapped_column(String(20), nullable=False)
    template_type: Mapped[str] = mapped_column(String(50), nullable=False)
    subject: Mapped[Optional[str]] = mapped_column(String(255))
    body: Mapped[str] = mapped_column(Text, nullable=False)

    # Personalization
    personalization_tokens: Mapped[Optional[dict]] = mapped_column(JSON)

    # Status
    status: Mapped[str] = mapped_column(String(20), default="draft")  # draft, sent, delivered, responded
    sent_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    response_at: Mapped[Optional[datetime]] = mapped_column(DateTime)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class ScrapeJobDB(Base):
    """Database model for scrape job tracking"""
    __tablename__ = "scrape_jobs"

    id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)

    # Job info
    source_type: Mapped[str] = mapped_column(String(50), nullable=False)
    target_urls: Mapped[dict] = mapped_column(JSON, default=list)
    status: Mapped[str] = mapped_column(String(20), default="pending")  # pending, running, completed, failed

    # Results
    total_urls: Mapped[int] = mapped_column(Integer, default=0)
    processed_urls: Mapped[int] = mapped_column(Integer, default=0)
    successful_urls: Mapped[int] = mapped_column(Integer, default=0)
    failed_urls: Mapped[int] = mapped_column(Integer, default=0)

    # Error tracking
    errors: Mapped[Optional[dict]] = mapped_column(JSON)

    # Timestamps
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
