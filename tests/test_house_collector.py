"""Tests for the House collector's index parsing (offline, fixture-based)."""

import io
import zipfile
from datetime import date
from pathlib import Path

import pytest

from trades_collector.collectors import HouseCollector
from trades_collector.models import Chamber

FIXTURE = Path(__file__).parent / "fixtures" / "sample_house_index.xml"


def test_parse_index_reads_members():
    collector = HouseCollector(year=2024)
    entries = collector.parse_index(FIXTURE.read_bytes())

    assert len(entries) == 2

    ptr = entries[0]
    assert ptr.filer.name == "Jane Doe"
    assert ptr.filer.chamber is Chamber.HOUSE
    assert ptr.filer.state == "CA"
    assert ptr.district == "CA11"
    assert ptr.filing_type == "P"
    assert ptr.is_ptr is True
    assert ptr.year == 2024
    assert ptr.doc_id == "20012345"
    assert ptr.filing_date == date(2024, 3, 14)
    # PTRs get a resolved PDF URL.
    assert ptr.document_url == (
        "https://disclosures-clerk.house.gov/public_disc/ptr-pdfs/2024/20012345.pdf"
    )


def test_suffix_and_non_ptr_handling():
    collector = HouseCollector(year=2024)
    entries = collector.parse_index(FIXTURE.read_bytes())

    other = entries[1]
    assert other.filer.name == "Richard Roe Jr."
    assert other.filing_type == "O"
    assert other.is_ptr is False
    # Non-PTR filings do not get a PTR PDF URL.
    assert other.document_url is None


def test_extract_xml_from_zip():
    xml = FIXTURE.read_bytes()
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w") as zf:
        zf.writestr("2024FD.txt", "ignored index text\n")
        zf.writestr("2024FD.xml", xml)

    extracted = HouseCollector.extract_xml_from_zip(buf.getvalue())
    assert extracted == xml


def test_extract_xml_from_zip_missing_xml():
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w") as zf:
        zf.writestr("readme.txt", "no xml here")
    with pytest.raises(ValueError):
        HouseCollector.extract_xml_from_zip(buf.getvalue())


def test_collect_trades_still_stubbed():
    with pytest.raises(NotImplementedError):
        list(HouseCollector(year=2024).collect())
