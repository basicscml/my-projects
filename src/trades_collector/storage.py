"""Persistence helpers for collected trades."""

from __future__ import annotations

import csv
from dataclasses import asdict
from pathlib import Path
from typing import Iterable

from .models import Trade

CSV_FIELDS = [
    "filer_name",
    "chamber",
    "state",
    "party",
    "ticker",
    "asset_description",
    "transaction_type",
    "transaction_date",
    "disclosure_date",
    "amount_range",
    "source_url",
]


def _row(trade: Trade) -> dict:
    d = asdict(trade)
    filer = d.pop("filer")
    d.pop("raw", None)
    return {
        "filer_name": filer["name"],
        "chamber": filer["chamber"],
        "state": filer["state"],
        "party": filer["party"],
        "ticker": d["ticker"],
        "asset_description": d["asset_description"],
        "transaction_type": d["transaction_type"],
        "transaction_date": d["transaction_date"],
        "disclosure_date": d["disclosure_date"],
        "amount_range": d["amount_range"],
        "source_url": d["source_url"],
    }


def write_csv(trades: Iterable[Trade], path: str | Path) -> int:
    """Write trades to ``path`` as CSV. Returns the number of rows written."""

    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    count = 0
    with path.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=CSV_FIELDS)
        writer.writeheader()
        for trade in trades:
            writer.writerow(_row(trade))
            count += 1
    return count
