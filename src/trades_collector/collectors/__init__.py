"""Collectors for each disclosure source."""

from .base import BaseCollector
from .house import HouseCollector
from .senate import SenateCollector

__all__ = ["BaseCollector", "HouseCollector", "SenateCollector"]
