"""Collector for U.S. Senate financial disclosures.

Source: Senate Electronic Financial Disclosure (eFD) Periodic Transaction
Reports — https://efdsearch.senate.gov/

This is a scaffold. The fetch/parse logic is intentionally left as a stub
(``NotImplementedError``) so the project structure, models, and CLI can be
wired up and tested before the network/parsing work begins.
"""

from __future__ import annotations

from typing import Iterable

from ..models import Trade
from .base import BaseCollector

EFD_SEARCH_URL = "https://efdsearch.senate.gov/search/"


class SenateCollector(BaseCollector):
    """Collects Periodic Transaction Reports from the Senate eFD system."""

    source_name = "senate"

    def collect(self) -> Iterable[Trade]:
        # TODO: accept the eFD terms-of-service, query the search endpoint,
        # paginate results, fetch each PTR, and normalize into Trade records.
        raise NotImplementedError("Senate eFD collection not yet implemented")
