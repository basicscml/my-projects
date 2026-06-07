"""Tests for the trades_collector scaffold."""

import csv
from datetime import date

import pytest

from trades_collector.collectors import HouseCollector, SenateCollector
from trades_collector.models import Chamber, Filer, Trade, TransactionType
from trades_collector.storage import write_csv


def test_collectors_register_source_names():
    assert HouseCollector.source_name == "house"
    assert SenateCollector.source_name == "senate"


@pytest.mark.parametrize("collector_cls", [HouseCollector, SenateCollector])
def test_collect_is_stubbed(collector_cls):
    # The scaffold stubs collection until parsing is implemented.
    with pytest.raises(NotImplementedError):
        list(collector_cls().collect())


def test_write_csv_round_trip(tmp_path):
    trade = Trade(
        filer=Filer(name="Jane Doe", chamber=Chamber.SENATE, state="CA", party="D"),
        ticker="ACME",
        asset_description="Acme Corp Common Stock",
        transaction_type=TransactionType.BUY,
        transaction_date=date(2026, 1, 15),
        disclosure_date=date(2026, 2, 1),
        amount_range="$1,001 - $15,000",
        source_url="https://example.gov/filing/1",
    )
    out = tmp_path / "trades.csv"
    written = write_csv([trade], out)

    assert written == 1
    rows = list(csv.DictReader(out.open(encoding="utf-8")))
    assert len(rows) == 1
    assert rows[0]["filer_name"] == "Jane Doe"
    assert rows[0]["chamber"] == "senate"
    assert rows[0]["ticker"] == "ACME"
    assert rows[0]["transaction_type"] == "buy"
