"""API endpoints for Solvari Radar"""
from typing import List, Optional
from uuid import UUID
from datetime import datetime

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger

from ..db import get_db, Database
from ..models import ProfileRing, ScrapedData, ProfileClassification, OutreachMessage
from ..modules.radar import RadarScraper
from ..modules.brain import BrainClassifier
from ..modules.hook import HookGenerator

router = APIRouter()


# ============== Request/Response Models ==============

class ScrapeRequest(BaseModel):
    """Request to scrape URLs"""
    urls: List[str] = Field(..., min_length=1, max_length=100)
    source_type: str = "generic"


class ClassifyRequest(BaseModel):
    """Request to classify text content"""
    text: str
    source_url: Optional[str] = None


class ProfileResponse(BaseModel):
    """Profile response model"""
    id: UUID
    name: Optional[str]
    ring: int
    ring_name: str
    ring_emoji: str
    quality_score: float
    location: Optional[str]
    specialization: List[str]
    source_url: str
    outreach_sent: bool
    created_at: datetime

    class Config:
        from_attributes = True


class StatsResponse(BaseModel):
    """Dashboard statistics"""
    total_profiles: int
    by_ring: dict
    average_quality_score: float
    outreach_sent: int


class OutreachRequest(BaseModel):
    """Request to generate outreach"""
    profile_id: UUID
    channel: Optional[str] = None


class PipelineRequest(BaseModel):
    """Full pipeline request: scrape -> classify -> generate outreach"""
    urls: List[str]
    source_type: str = "generic"
    auto_generate_outreach: bool = True


class PipelineResult(BaseModel):
    """Result of pipeline processing"""
    url: str
    success: bool
    profile_id: Optional[UUID] = None
    ring: Optional[int] = None
    ring_name: Optional[str] = None
    quality_score: Optional[float] = None
    outreach_channel: Optional[str] = None
    error: Optional[str] = None


# ============== Dependencies ==============

async def get_session():
    """Get database session"""
    db = get_db()
    async for session in db.get_session():
        yield session


# ============== Endpoints ==============

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "Solvari Radar", "timestamp": datetime.utcnow()}


@router.get("/stats", response_model=StatsResponse)
async def get_stats(session: AsyncSession = Depends(get_session)):
    """Get dashboard statistics"""
    db = get_db()
    stats = await db.get_stats(session)
    return StatsResponse(**stats)


@router.get("/profiles", response_model=List[ProfileResponse])
async def list_profiles(
    ring: Optional[int] = None,
    limit: int = 50,
    session: AsyncSession = Depends(get_session),
):
    """List profiles, optionally filtered by ring"""
    db = get_db()

    if ring is not None:
        profiles = await db.get_profiles_by_ring(session, ring, limit)
    else:
        profiles = await db.get_recent_profiles(session, limit)

    return [
        ProfileResponse(
            id=p.id,
            name=p.name,
            ring=p.ring,
            ring_name=p.ring_name,
            ring_emoji=p.ring_emoji,
            quality_score=p.quality_score,
            location=p.location,
            specialization=p.specialization or [],
            source_url=p.source_url,
            outreach_sent=p.outreach_sent,
            created_at=p.created_at,
        )
        for p in profiles
    ]


@router.get("/profiles/{profile_id}", response_model=ProfileResponse)
async def get_profile(
    profile_id: UUID,
    session: AsyncSession = Depends(get_session),
):
    """Get a specific profile by ID"""
    db = get_db()
    profile = await db.get_profile(session, profile_id)

    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    return ProfileResponse(
        id=profile.id,
        name=profile.name,
        ring=profile.ring,
        ring_name=profile.ring_name,
        ring_emoji=profile.ring_emoji,
        quality_score=profile.quality_score,
        location=profile.location,
        specialization=profile.specialization or [],
        source_url=profile.source_url,
        outreach_sent=profile.outreach_sent,
        created_at=profile.created_at,
    )


@router.post("/scrape")
async def scrape_urls(request: ScrapeRequest):
    """Scrape URLs and return raw data"""
    async with RadarScraper() as scraper:
        results = []
        async for data in scraper.scrape_batch(request.urls, request.source_type):
            results.append({
                "url": data.url,
                "text_length": len(data.text_content),
                "source_type": data.source_type,
                "metadata": data.metadata,
            })
    return {"scraped": len(results), "results": results}


@router.post("/classify")
async def classify_content(request: ClassifyRequest):
    """Classify text content into a ring"""
    classifier = BrainClassifier()

    scraped = ScrapedData(
        url=request.source_url or "manual-input",
        text_content=request.text,
        source_type="manual",
    )

    classification = await classifier.classify(scraped)

    return {
        "ring": classification.ring.value,
        "ring_name": ProfileRing(classification.ring).name,
        "quality_score": classification.quality_score,
        "confidence": classification.confidence,
        "reasoning": classification.reasoning,
        "recommended_hook": classification.recommended_hook,
    }


@router.post("/outreach/generate")
async def generate_outreach(
    request: OutreachRequest,
    session: AsyncSession = Depends(get_session),
):
    """Generate outreach message for a profile"""
    db = get_db()
    profile = await db.get_profile(session, request.profile_id)

    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    # Create classification from profile data
    classification = ProfileClassification(
        ring=ProfileRing(profile.ring),
        quality_score=profile.quality_score,
        confidence=profile.confidence,
        reasoning=profile.classification_reasoning or "",
        extracted_data=profile.extracted_data or {},
        recommended_hook="",
    )

    generator = HookGenerator()
    message = generator.generate(
        profile_id=profile.id,
        classification=classification,
        channel=request.channel,
    )

    # Save outreach to database
    outreach = await db.save_outreach(session, {
        "profile_id": message.profile_id,
        "ring": message.ring.value,
        "channel": message.channel,
        "template_type": message.template_type,
        "subject": message.subject,
        "body": message.body,
        "personalization_tokens": message.personalization_tokens,
    })
    await session.commit()

    return {
        "id": outreach.id,
        "channel": message.channel,
        "subject": message.subject,
        "body": message.body,
    }


@router.post("/pipeline", response_model=List[PipelineResult])
async def run_pipeline(
    request: PipelineRequest,
    background_tasks: BackgroundTasks,
    session: AsyncSession = Depends(get_session),
):
    """
    Run the full pipeline: Scrape -> Classify -> Generate Outreach

    This is the main endpoint that powers the Solvari Radar.
    """
    db = get_db()
    results = []

    logger.info(f"🚀 Starting pipeline for {len(request.urls)} URLs")

    async with RadarScraper() as scraper:
        classifier = BrainClassifier()
        generator = HookGenerator()

        async for scraped_data in scraper.scrape_batch(request.urls, request.source_type):
            result = PipelineResult(url=scraped_data.url, success=False)

            try:
                # Classify
                classification = await classifier.classify(scraped_data)

                # Save profile
                profile_data = {
                    "source_url": scraped_data.url,
                    "source_type": scraped_data.source_type,
                    "name": classification.extracted_data.get("name"),
                    "location": classification.extracted_data.get("location"),
                    "specialization": classification.extracted_data.get("specialization", []),
                    "ring": classification.ring.value,
                    "quality_score": classification.quality_score,
                    "confidence": classification.confidence,
                    "classification_reasoning": classification.reasoning,
                    "extracted_data": classification.extracted_data,
                    "raw_text": scraped_data.text_content[:5000],  # Truncate
                    "classified_at": datetime.utcnow(),
                }
                profile = await db.save_profile(session, profile_data)

                result.success = True
                result.profile_id = profile.id
                result.ring = classification.ring.value
                result.ring_name = ProfileRing(classification.ring).name
                result.quality_score = classification.quality_score

                # Generate outreach if requested
                if request.auto_generate_outreach:
                    message = generator.generate(profile.id, classification)
                    await db.save_outreach(session, {
                        "profile_id": message.profile_id,
                        "ring": message.ring.value,
                        "channel": message.channel,
                        "template_type": message.template_type,
                        "subject": message.subject,
                        "body": message.body,
                        "personalization_tokens": message.personalization_tokens,
                    })
                    result.outreach_channel = message.channel

                logger.info(f"✅ Processed: {scraped_data.url} -> Ring {classification.ring.value}")

            except Exception as e:
                result.error = str(e)
                logger.error(f"❌ Failed: {scraped_data.url} - {e}")

            results.append(result)

    await session.commit()
    logger.info(f"🏁 Pipeline complete: {sum(1 for r in results if r.success)}/{len(results)} successful")

    return results


@router.get("/rings")
async def get_ring_info():
    """Get information about the 4-Ring classification system"""
    return {
        "rings": [
            {
                "number": 1,
                "name": "Vakman",
                "emoji": "🔴",
                "description": "Gevestigde bedrijven (>5 jaar), conservatief, zoekt efficiëntie",
                "hooks": ["Directe agenda-vulling", "Instant Payouts"],
            },
            {
                "number": 2,
                "name": "ZZP'er",
                "emoji": "🟠",
                "description": "Jonge ondernemers, tech-savvy, zoekt groei",
                "hooks": ["Gratis Admin-Bot", "Real-time Lead Radar"],
            },
            {
                "number": 3,
                "name": "Hobbyist",
                "emoji": "🟡",
                "description": "Handige buren, part-timers, nog geen KvK",
                "hooks": ["Solvari Starter Programma", "ZZP Wizard"],
            },
            {
                "number": 4,
                "name": "Academy",
                "emoji": "🔵",
                "description": "Interne Solvari medewerkers",
                "hooks": ["Monitoring Dashboard", "Flagging System"],
            },
        ]
    }
