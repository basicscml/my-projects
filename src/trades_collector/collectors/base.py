"""Abstract base class for disclosure collectors."""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Iterable

from ..models import Trade


class BaseCollector(ABC):
    """Common interface every chamber collector implements."""

    #: Human-readable name of the source, set by subclasses.
    source_name: str = "base"

    @abstractmethod
    def collect(self) -> Iterable[Trade]:
        """Fetch disclosures and yield :class:`Trade` records.

        Subclasses are responsible for fetching, parsing, and normalizing
        the source into :class:`Trade` objects.
        """
        raise NotImplementedError
