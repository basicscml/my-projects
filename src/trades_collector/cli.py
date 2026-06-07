"""Command-line entrypoint for running a collection."""

from __future__ import annotations

import argparse
import sys
from typing import List

from .collectors import HouseCollector, SenateCollector
from .storage import write_csv

COLLECTORS = {
    "house": HouseCollector,
    "senate": SenateCollector,
}


def main(argv: List[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="trades-collect",
        description="Collect U.S. congressional stock trade disclosures.",
    )
    parser.add_argument(
        "source",
        choices=sorted(COLLECTORS) + ["all"],
        help="Which chamber to collect from.",
    )
    parser.add_argument(
        "-o",
        "--output",
        default="trades.csv",
        help="Output CSV path (default: trades.csv).",
    )
    args = parser.parse_args(argv)

    sources = sorted(COLLECTORS) if args.source == "all" else [args.source]

    trades = []
    for name in sources:
        collector = COLLECTORS[name]()
        trades.extend(collector.collect())

    written = write_csv(trades, args.output)
    print(f"Wrote {written} trade(s) to {args.output}")
    return 0


if __name__ == "__main__":  # pragma: no cover
    sys.exit(main())
