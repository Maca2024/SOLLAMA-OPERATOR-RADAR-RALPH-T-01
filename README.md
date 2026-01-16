# ⟁ SOLVARI RADAR

> **Autonomous Supply-Side Acquisition Engine**

AI-powered contractor discovery and classification system for the Dutch market.

![Solvari Radar](https://img.shields.io/badge/Status-Production_Ready-green)
![Python](https://img.shields.io/badge/Python-3.11+-blue)
![React](https://img.shields.io/badge/React-18-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)

## 🎯 Overview

Solvari Radar automatically discovers, classifies, and engages with potential contractors using an AI-powered 4-Ring classification system. From established professionals to ambitious starters, the system tailors its outreach for maximum conversion.

## 🔴🟠🟡🔵 The 4-Ring System

| Ring | Type | Profile | Hook |
|------|------|---------|------|
| 🔴 1 | **Vakman** | Established businesses (>5 years) | Agenda-vulling, Instant Payouts |
| 🟠 2 | **ZZP'er** | Growing freelancers, tech-savvy | Admin-Bot, Lead Radar |
| 🟡 3 | **Hobbyist** | Part-timers & starters | Starter Program, ZZP Wizard |
| 🔵 4 | **Academy** | Internal Solvari staff | Dashboard, Monitoring |

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    SOLVARI RADAR                            │
├─────────────────────────────────────────────────────────────┤
│  🔭 RADAR        │  🧠 BRAIN         │  🎣 HOOK             │
│  ─────────       │  ─────────        │  ─────────           │
│  Playwright      │  OpenAI/Claude    │  Template Engine     │
│  Stealth Mode    │  Ring Classifier  │  Personalization     │
│  Async Scraping  │  Quality Scoring  │  Multi-channel       │
├─────────────────────────────────────────────────────────────┤
│                    FastAPI Backend                          │
│  ───────────────────────────────────────────────────────    │
│  PostgreSQL │ Redis │ ChromaDB (Vector Store)              │
├─────────────────────────────────────────────────────────────┤
│              React Dashboard (TypeScript + Tailwind)        │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- Docker & Docker Compose

### 1. Clone & Setup

```bash
git clone https://github.com/Maca2024/SOLLAMA-OPERATOR-RADAR-RALPH-T-01.git
cd SOLLAMA-OPERATOR-RADAR-RALPH-T-01

# Copy environment file
cp backend/.env.example backend/.env
# Add your API keys to backend/.env
```

### 2. Start with Docker

```bash
docker-compose up -d
```

This starts:
- **PostgreSQL** on port 5432
- **Redis** on port 6379
- **Backend API** on port 8000
- **Frontend** on port 3000

### 3. Manual Setup (Development)

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
playwright install chromium
uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## 📡 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/health` | GET | Health check |
| `/api/v1/stats` | GET | Dashboard statistics |
| `/api/v1/profiles` | GET | List discovered profiles |
| `/api/v1/pipeline` | POST | Run full pipeline |
| `/api/v1/classify` | POST | Classify text content |
| `/api/v1/scrape` | POST | Scrape URLs |
| `/api/v1/outreach/generate` | POST | Generate outreach |
| `/api/v1/rings` | GET | Ring system info |

## 🧪 Running Tests

```bash
cd backend

# Run Level 9 Verification
python -m tests.verify_level9

# Run Unit Tests
pytest tests/ -v
```

## 🤖 The Ralph Loop

The Ralph Loop is an iterative development protocol that drives the system towards convergence:

```bash
chmod +x ralph.sh
./ralph.sh
```

**Protocol:**
1. Falen is Data (Failure is Data)
2. Filesystem is Geheugen (Filesystem is Memory)
3. Geen Halve Oplossingen (No Half Solutions)
4. Autonomie (Autonomy)

## 📁 Project Structure

```
├── CONTEXT.md          # Master context for AI agents
├── TODO.md             # Task tracking
├── ralph.sh            # Ralph Loop automation
├── docker-compose.yml  # Container orchestration
│
├── backend/
│   ├── app/
│   │   ├── api/        # FastAPI routes
│   │   ├── core/       # Configuration
│   │   ├── db/         # Database layer
│   │   ├── models/     # Pydantic models
│   │   └── modules/
│   │       ├── radar/  # 🔭 Scraper
│   │       ├── brain/  # 🧠 Classifier
│   │       └── hook/   # 🎣 Outreach
│   └── tests/
│       └── verify_level9.py
│
└── frontend/
    └── src/
        ├── components/ # React components
        ├── hooks/      # Custom hooks
        ├── types/      # TypeScript types
        └── utils/      # API utilities
```

## 🔐 Environment Variables

```env
# AI Providers
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Database
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/solvari_radar
REDIS_URL=redis://localhost:6379/0

# Scraper
SCRAPER_DELAY_MIN=1.0
SCRAPER_DELAY_MAX=3.0
```

## 🎨 Frontend Features

- **Live Radar Visualization** - Real-time discovery animation
- **Stats Dashboard** - Key metrics at a glance
- **Ring Distribution Chart** - Pie chart of profile types
- **Profile Cards** - Detailed view per contractor
- **Pipeline Control** - Run scraping jobs from UI
- **Dark Mode** - Sleek, professional interface

## 📝 License

MIT License - See [LICENSE](LICENSE)

---

<p align="center">
  <strong>⟁ SOLVARI RADAR</strong><br>
  <em>Autonomous Supply-Side Acquisition Engine</em><br>
  Built with AI | For the Dutch Market
</p>
