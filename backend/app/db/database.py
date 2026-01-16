"""Database connection and session management"""
from typing import AsyncGenerator, Optional, List
from datetime import datetime
from uuid import UUID

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import select, func
from loguru import logger

from ..core.config import settings
from .models import Base, ProfileDB, OutreachDB, ScrapeJobDB


class Database:
    """Async database manager for Solvari Radar"""

    def __init__(self, database_url: Optional[str] = None):
        self.database_url = database_url or settings.DATABASE_URL
        self.engine = create_async_engine(
            self.database_url,
            echo=settings.DEBUG,
            pool_pre_ping=True,
        )
        self.async_session = async_sessionmaker(
            self.engine,
            class_=AsyncSession,
            expire_on_commit=False,
        )

    async def init_db(self):
        """Create all tables"""
        async with self.engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("📊 Database tables created")

    async def get_session(self) -> AsyncGenerator[AsyncSession, None]:
        """Get a database session"""
        async with self.async_session() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise

    # Profile operations
    async def save_profile(self, session: AsyncSession, profile_data: dict) -> ProfileDB:
        """Save a new profile"""
        profile = ProfileDB(**profile_data)
        session.add(profile)
        await session.flush()
        logger.info(f"📊 Saved profile: {profile.id}")
        return profile

    async def get_profile(self, session: AsyncSession, profile_id: UUID) -> Optional[ProfileDB]:
        """Get a profile by ID"""
        result = await session.execute(
            select(ProfileDB).where(ProfileDB.id == profile_id)
        )
        return result.scalar_one_or_none()

    async def get_profiles_by_ring(
        self, session: AsyncSession, ring: int, limit: int = 100
    ) -> List[ProfileDB]:
        """Get profiles filtered by ring"""
        result = await session.execute(
            select(ProfileDB)
            .where(ProfileDB.ring == ring)
            .order_by(ProfileDB.quality_score.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_recent_profiles(
        self, session: AsyncSession, limit: int = 50
    ) -> List[ProfileDB]:
        """Get most recently scraped profiles"""
        result = await session.execute(
            select(ProfileDB)
            .order_by(ProfileDB.created_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_stats(self, session: AsyncSession) -> dict:
        """Get dashboard statistics"""
        total = await session.execute(select(func.count(ProfileDB.id)))
        ring_counts = await session.execute(
            select(ProfileDB.ring, func.count(ProfileDB.id))
            .group_by(ProfileDB.ring)
        )
        avg_quality = await session.execute(
            select(func.avg(ProfileDB.quality_score))
        )
        outreach_sent = await session.execute(
            select(func.count(ProfileDB.id))
            .where(ProfileDB.outreach_sent == True)
        )

        return {
            "total_profiles": total.scalar() or 0,
            "by_ring": {row[0]: row[1] for row in ring_counts.all()},
            "average_quality_score": round(avg_quality.scalar() or 0, 2),
            "outreach_sent": outreach_sent.scalar() or 0,
        }

    # Outreach operations
    async def save_outreach(
        self, session: AsyncSession, outreach_data: dict
    ) -> OutreachDB:
        """Save an outreach message"""
        outreach = OutreachDB(**outreach_data)
        session.add(outreach)
        await session.flush()
        return outreach

    async def get_outreach_for_profile(
        self, session: AsyncSession, profile_id: UUID
    ) -> List[OutreachDB]:
        """Get all outreach messages for a profile"""
        result = await session.execute(
            select(OutreachDB)
            .where(OutreachDB.profile_id == profile_id)
            .order_by(OutreachDB.created_at.desc())
        )
        return list(result.scalars().all())


# Global database instance
_db: Optional[Database] = None


def get_db() -> Database:
    """Get the global database instance"""
    global _db
    if _db is None:
        _db = Database()
    return _db


async def init_database():
    """Initialize the database on startup"""
    db = get_db()
    await db.init_db()
