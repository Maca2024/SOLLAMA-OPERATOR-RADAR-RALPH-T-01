"""Outreach templates per ring type"""
from typing import Dict

# Template structure: {ring: {channel: template}}
TEMPLATES: Dict[int, Dict[str, str]] = {
    # 🔴 RING 1: VAKMAN - Focus on efficiency and revenue
    1: {
        "email": """
Onderwerp: Directe agenda-vulling voor {business_name} 📅

Beste {name},

Als gevestigd {specialization} in {location} weten wij hoe belangrijk een gevulde agenda is.

Solvari koppelt u direct aan huiseigenaren die NU een vakman zoeken:
✅ Geen acquisitie meer nodig
✅ Instant uitbetaling binnen 24 uur
✅ Alleen serieuze aanvragen in uw regio

Bedrijven zoals het uwe verdienen gemiddeld €2.500 extra per maand via ons platform.

Geïnteresseerd in een vrijblijvend gesprek?

Met vriendelijke groet,
Solvari Team
""",
        "dm": """
Hoi {name}! 👋

Gezien jullie sterke reputatie bij {business_name} - wij helpen vakmensen zoals jullie met directe leads. Interesse in meer info? Geen verplichtingen!
""",
    },

    # 🟠 RING 2: ZZP'ER - Focus on growth and tools
    2: {
        "email": """
Onderwerp: Gratis AI-tool voor je offertes + leads in je inbox 🚀

Hey {name},

Zag je profiel en dacht: dit is iemand die vooruit wil!

Speciaal voor ondernemers zoals jij:
🤖 Gratis Admin-Bot - AI maakt je offertes in 30 sec
📍 Real-time Lead Radar - klussen in jouw buurt
📱 App met push-notificaties

Je bent al actief op social media - waarom niet ook via Solvari groeien?

Check het vrijblijvend op solvari.nl/zzp

Groet,
Team Solvari
""",
        "dm": """
Hey {name}! 🔥

Gave content op je profiel! We hebben gratis tools voor ondernemers zoals jij - AI voor offertes + directe leads. Interesse? Check solvari.nl/zzp 💪
""",
    },

    # 🟡 RING 3: HOBBYIST - Focus on starting safely
    3: {
        "email": """
Onderwerp: Start als vakman - zonder risico 🌱

Hallo {name},

We zagen dat je al actief bent met {service_description}.

Wist je dat je dit kunt uitbouwen tot een echte onderneming?

Het Solvari Starter Programma:
🎯 Max €500 klussen om te beginnen
📋 ZZP Wizard - wij helpen met KvK papierwerk
🛡️ Veilige sandbox omgeving
💡 Geen opstartkosten

Veel van onze beste vakmensen begonnen precies zoals jij!

Nieuwsgierig? Reageer op deze mail.

Succes!
Solvari Team
""",
        "invite": """
🌟 SOLVARI STARTER UITNODIGING 🌟

Hoi {name}!

Je bent uitgenodigd voor het Solvari Starter programma.

Begin met kleine klussen (max €500) en groei op je eigen tempo.
Wij helpen met alles - van KvK tot je eerste klant.

👉 Start nu: solvari.nl/starter?code=WELCOME2024

Groetjes,
Team Solvari
""",
    },
}

# Personalization tokens available
AVAILABLE_TOKENS = [
    "{name}",           # Extracted name
    "{business_name}",  # Company name if available
    "{location}",       # City/region
    "{specialization}", # Main skill/trade
    "{service_description}",  # What they offer
    "{years_active}",   # How long in business
]
