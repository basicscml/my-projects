"""Collector for U.S. House of Representatives financial disclosures.

Source: Clerk of the House Financial Disclosure portal —
https://disclosures-clerk.house.gov/

This is a scaffold. The fetch/parse logic is intentionally left as a stub
(``NotImplementedError``) so the project structure, models, and CLI can be
wired up and tested before the network/parsing work begins.
"""

from __future__ import annotations

from typing import Iterable

from ..models import Trade
from .base import BaseCollector

HOUSE_DISCLOSURE_URL = "https://disclosures-clerk.house.gov/FinancialDisclosure"


class HouseCollector(BaseCollector):
    """Collects Periodic Transaction Reports from the House Clerk portal."""

    source_name = "house"

    def collect(self) -> Iterable[Trade]:
        # TODO: download the annual PTR index (ZIP/XML), resolve each filing
        # PDF, parse the transactions, and normalize into Trade records.
        raise NotImplementedError("House Clerk collection not yet implemented")
