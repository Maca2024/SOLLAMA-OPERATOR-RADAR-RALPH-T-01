"""
⟁ SOLVARI RADAR - Autonomous Supply-Side Acquisition Engine
Main FastAPI Application
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger
import sys

from .core.config import settings
from .api import router
from .db import init_database


# Configure logging
logger.remove()
logger.add(
    sys.stderr,
    format="<green>{time:HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan> - <level>{message}</level>",
    level="DEBUG" if settings.DEBUG else "INFO",
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    logger.info("⟁ SOLVARI RADAR INITIALIZING...")
    logger.info(f"🔧 Debug mode: {settings.DEBUG}")

    try:
        await init_database()
        logger.info("✅ Database initialized")
    except Exception as e:
        logger.warning(f"⚠️ Database initialization skipped: {e}")

    logger.info("🚀 SOLVARI RADAR ONLINE")
    logger.info("=" * 50)
    logger.info("  🔴 Ring 1: Vakman Detection Active")
    logger.info("  🟠 Ring 2: ZZP'er Detection Active")
    logger.info("  🟡 Ring 3: Hobbyist Detection Active")
    logger.info("  🔵 Ring 4: Academy Monitoring Active")
    logger.info("=" * 50)

    yield

    # Shutdown
    logger.info("⟁ SOLVARI RADAR SHUTTING DOWN...")


# Create FastAPI app
app = FastAPI(
    title="Solvari Radar",
    description="""
    # ⟁ Solvari Radar API

    **Autonomous Supply-Side Acquisition Engine**

    This API powers the Solvari Radar system, which automatically:
    - 🔭 **RADAR**: Scrapes and discovers potential contractors
    - 🧠 **BRAIN**: Classifies them using AI into 4 rings
    - 🎣 **HOOK**: Generates personalized outreach messages

    ## The 4-Ring Classification System

    | Ring | Type | Profile |
    |------|------|---------|
    | 🔴 1 | Vakman | Established businesses (>5 years) |
    | 🟠 2 | ZZP'er | Growing freelancers |
    | 🟡 3 | Hobbyist | Part-timers & starters |
    | 🔵 4 | Academy | Internal staff |
    """,
    version=settings.APP_VERSION,
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(router, prefix=settings.API_PREFIX)


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with system status"""
    return {
        "service": "Solvari Radar",
        "status": "operational",
        "version": settings.APP_VERSION,
        "modules": {
            "radar": "🔭 Active",
            "brain": "🧠 Active",
            "hook": "🎣 Active",
        },
        "docs": "/docs",
        "api": settings.API_PREFIX,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
    )
