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
