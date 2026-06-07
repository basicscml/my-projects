"""Collector for U.S. House of Representatives financial disclosures.

Source: Clerk of the House Financial Disclosure portal —
https://disclosures-clerk.house.gov/

The Clerk publishes a yearly bulk ZIP (e.g. ``2024FD.zip``) containing an XML
index of every filing for that year. This collector downloads that ZIP, parses
the index into :class:`FilingIndexEntry` records, and (for Periodic Transaction
Reports) builds the URL of the underlying PDF.

Two levels of data:

* :meth:`collect_filings` — filing-level index (implemented; parses the bulk
  XML). This is fully working given network access to the host.
* :meth:`collect` — ticker-level :class:`Trade` records. These live inside the
  PTR PDFs (frequently scanned), so PDF extraction is a separate step and is
  still stubbed.
"""

from __future__ import annotations

import io
import xml.etree.ElementTree as ET
import zipfile
from datetime import date, datetime
from typing import Iterable, List, Optional

import requests

from ..models import Chamber, Filer, FilingIndexEntry, Trade
from .base import BaseCollector

BASE_URL = "https://disclosures-clerk.house.gov/public_disc"
INDEX_ZIP_URL = BASE_URL + "/financial-pdfs/{year}FD.zip"
PTR_PDF_URL = BASE_URL + "/ptr-pdfs/{year}/{doc_id}.pdf"
DEFAULT_TIMEOUT = 60


def _text(element: Optional[ET.Element]) -> Optional[str]:
    if element is None or element.text is None:
        return None
    value = element.text.strip()
    return value or None


def _parse_filing_date(raw: Optional[str]) -> Optional[date]:
    if not raw:
        return None
    # The House index uses U.S. M/D/YYYY formatting.
    for fmt in ("%m/%d/%Y", "%Y-%m-%d"):
        try:
            return datetime.strptime(raw, fmt).date()
        except ValueError:
            continue
    return None


def _full_name(first: Optional[str], last: Optional[str], suffix: Optional[str]) -> str:
    parts = [p for p in (first, last) if p]
    name = " ".join(parts)
    if suffix:
        name = f"{name} {suffix}"
    return name.strip()


class HouseCollector(BaseCollector):
    """Collects financial disclosures from the House Clerk portal."""

    source_name = "house"

    def __init__(self, year: Optional[int] = None, session: Optional[requests.Session] = None):
        self.year = year or date.today().year
        self._session = session or requests.Session()

    # -- filing-level index ------------------------------------------------

    def fetch_index_xml(self) -> bytes:
        """Download the yearly bulk ZIP and return the contained XML bytes."""

        url = INDEX_ZIP_URL.format(year=self.year)
        resp = self._session.get(url, timeout=DEFAULT_TIMEOUT)
        resp.raise_for_status()
        return self.extract_xml_from_zip(resp.content)

    @staticmethod
    def extract_xml_from_zip(zip_bytes: bytes) -> bytes:
        """Return the first ``.xml`` member from the bulk disclosure ZIP."""

        with zipfile.ZipFile(io.BytesIO(zip_bytes)) as zf:
            for name in zf.namelist():
                if name.lower().endswith(".xml"):
                    return zf.read(name)
        raise ValueError("No XML index found in disclosure ZIP")

    def parse_index(self, xml_bytes: bytes) -> List[FilingIndexEntry]:
        """Parse the bulk XML index into :class:`FilingIndexEntry` records."""

        root = ET.fromstring(xml_bytes)
        entries: List[FilingIndexEntry] = []
        for member in root.findall(".//Member"):
            first = _text(member.find("First"))
            last = _text(member.find("Last"))
            suffix = _text(member.find("Suffix"))
            district = _text(member.find("StateDst"))
            filing_type = _text(member.find("FilingType")) or ""
            year_text = _text(member.find("Year"))
            doc_id = _text(member.find("DocID")) or ""
            year = int(year_text) if year_text and year_text.isdigit() else self.year

            entry = FilingIndexEntry(
                filer=Filer(
                    name=_full_name(first, last, suffix),
                    chamber=Chamber.HOUSE,
                    state=(district[:2] if district else None),
                ),
                filing_type=filing_type,
                year=year,
                doc_id=doc_id,
                filing_date=_parse_filing_date(_text(member.find("FilingDate"))),
                district=district,
            )
            if entry.is_ptr and entry.doc_id:
                entry.document_url = PTR_PDF_URL.format(year=entry.year, doc_id=entry.doc_id)
            entries.append(entry)
        return entries

    def collect_filings(self) -> List[FilingIndexEntry]:
        """Fetch and parse the filing-level index for the configured year."""

        return self.parse_index(self.fetch_index_xml())

    # -- trade-level -------------------------------------------------------

    def collect(self) -> Iterable[Trade]:
        # TODO: for each PTR filing from collect_filings(), download
        # entry.document_url and extract ticker-level transactions. House PTRs
        # are PDFs (often scanned), so this needs PDF text/table extraction.
        raise NotImplementedError(
            "House ticker-level trade extraction from PTR PDFs not yet implemented; "
            "use collect_filings() for the filing-level index"
        )
