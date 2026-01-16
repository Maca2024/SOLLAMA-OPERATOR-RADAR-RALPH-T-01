"""HOOK - Personalized outreach message generator"""
from typing import Optional, Literal
from datetime import datetime
from uuid import UUID
from loguru import logger

from ...models import ProfileClassification, OutreachMessage, ProfileRing
from .templates import TEMPLATES


class HookGenerator:
    """
    🎣 HOOK: The Outreach Engine of Solvari

    Generates hyper-personalized messages based on
    profile classification and extracted data.
    """

    def __init__(self):
        self.templates = TEMPLATES

    def generate(
        self,
        profile_id: UUID,
        classification: ProfileClassification,
        channel: Optional[Literal["email", "dm", "invite"]] = None,
    ) -> OutreachMessage:
        """
        Generate a personalized outreach message

        Args:
            profile_id: UUID of the classified profile
            classification: The profile classification result
            channel: Preferred channel, or auto-select based on ring

        Returns:
            OutreachMessage ready to send
        """
        ring = classification.ring

        # Auto-select channel based on ring if not specified
        if channel is None:
            channel = self._select_channel(ring)

        # Get template
        template = self._get_template(ring, channel)

        # Extract personalization data
        tokens = self._extract_tokens(classification)

        # Generate message
        body = self._personalize(template, tokens)

        # Determine subject for email
        subject = None
        if channel == "email" and "Onderwerp:" in body:
            lines = body.strip().split("\n")
            subject_line = lines[0]
            subject = subject_line.replace("Onderwerp:", "").strip()
            body = "\n".join(lines[1:]).strip()

        logger.info(f"🎣 Generated {channel} message for Ring {ring} profile")

        return OutreachMessage(
            profile_id=profile_id,
            ring=ring,
            template_type=f"ring_{ring}_{channel}",
            subject=subject,
            body=body,
            channel=channel,
            personalization_tokens=tokens,
            generated_at=datetime.utcnow(),
        )

    def _select_channel(self, ring: ProfileRing) -> Literal["email", "dm", "invite"]:
        """Auto-select the best channel based on ring"""
        channel_map = {
            ProfileRing.VAKMAN: "email",      # Professional prefers email
            ProfileRing.ZZP: "dm",            # Tech-savvy prefers DM
            ProfileRing.HOBBYIST: "invite",   # Starter gets invite
            ProfileRing.ACADEMY: "email",     # Internal uses email
        }
        return channel_map.get(ring, "email")

    def _get_template(self, ring: ProfileRing, channel: str) -> str:
        """Get the appropriate template"""
        ring_templates = self.templates.get(ring.value, self.templates[2])
        template = ring_templates.get(channel)

        if not template:
            # Fallback to email template
            template = ring_templates.get("email", "Hallo {name}, ...")

        return template

    def _extract_tokens(self, classification: ProfileClassification) -> dict:
        """Extract personalization tokens from classification data"""
        data = classification.extracted_data

        return {
            "name": data.get("name", data.get("business_name", "daar")),
            "business_name": data.get("business_name", data.get("name", "uw bedrijf")),
            "location": data.get("location", data.get("region", "uw regio")),
            "specialization": self._format_specialization(data.get("specialization", data.get("services", []))),
            "service_description": data.get("service_description", data.get("description", "uw diensten")),
            "years_active": str(data.get("years_in_business", data.get("years_active", ""))),
        }

    def _format_specialization(self, spec) -> str:
        """Format specialization for template"""
        if isinstance(spec, list):
            if len(spec) == 0:
                return "vakman"
            elif len(spec) == 1:
                return spec[0]
            else:
                return f"{spec[0]} en {spec[1]}"
        return str(spec) if spec else "vakman"

    def _personalize(self, template: str, tokens: dict) -> str:
        """Apply personalization tokens to template"""
        result = template.strip()

        for key, value in tokens.items():
            placeholder = "{" + key + "}"
            result = result.replace(placeholder, str(value))

        return result

    def generate_batch(
        self,
        profiles: list,  # List of (profile_id, classification) tuples
    ) -> list[OutreachMessage]:
        """Generate messages for multiple profiles"""
        return [
            self.generate(profile_id, classification)
            for profile_id, classification in profiles
        ]
