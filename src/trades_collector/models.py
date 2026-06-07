"""Data models for congressional trade disclosures."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date
from enum import Enum
from typing import Optional


class Chamber(str, Enum):
    """Which chamber of Congress the filer belongs to."""

    HOUSE = "house"
    SENATE = "senate"


class TransactionType(str, Enum):
    """Type of disclosed transaction."""

    BUY = "buy"
    SELL = "sell"
    SELL_PARTIAL = "sell_partial"
    EXCHANGE = "exchange"
    UNKNOWN = "unknown"


@dataclass
class Filer:
    """A member of Congress who filed a disclosure."""

    name: str
    chamber: Chamber
    state: Optional[str] = None
    party: Optional[str] = None


@dataclass
class FilingIndexEntry:
    """A single filing listed in a bulk disclosure index.

    The House Clerk publishes a yearly bulk XML index of filings. Each entry
    is filing-level metadata (who filed, what type, when) plus the identifiers
    needed to locate the underlying document — it does *not* contain the
    ticker-level transactions, which live in the linked PTR PDF.
    """

    filer: Filer
    filing_type: str  # raw source code, e.g. "P" (Periodic Transaction Report)
    year: Optional[int]
    doc_id: str
    filing_date: Optional[date] = None
    district: Optional[str] = None  # e.g. "CA11"
    document_url: Optional[str] = None

    @property
    def is_ptr(self) -> bool:
        """Whether this filing is a Periodic Transaction Report (trades)."""

        return self.filing_type.upper() == "P"


@dataclass
class Trade:
    """A single disclosed transaction (Periodic Transaction Report line)."""

    filer: Filer
    ticker: Optional[str]
    asset_description: str
    transaction_type: TransactionType
    transaction_date: Optional[date]
    disclosure_date: Optional[date]
    amount_range: Optional[str] = None  # e.g. "$1,001 - $15,000"
    source_url: Optional[str] = None
    raw: dict = field(default_factory=dict)
