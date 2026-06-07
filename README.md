# my-projects

## trades-collector

A collector for U.S. **congressional stock trade disclosures** (House & Senate
Periodic Transaction Reports).

> **Status:** scaffold. The project structure, data models, storage, CLI, and
> tests are in place. The actual fetch/parse logic for each chamber is stubbed
> (`NotImplementedError`) and ready to be implemented.

### Layout

```
src/trades_collector/
├── __init__.py
├── models.py              # Filer / Trade dataclasses + enums
├── storage.py             # write collected trades to CSV
├── cli.py                 # `trades-collect` entrypoint
└── collectors/
    ├── base.py            # BaseCollector ABC
    ├── house.py           # House Clerk disclosures (stub)
    └── senate.py          # Senate eFD disclosures (stub)
tests/
└── test_collectors.py
```

### Sources to implement

- **Senate** — Electronic Financial Disclosure (eFD): https://efdsearch.senate.gov/
- **House** — Clerk Financial Disclosure portal: https://disclosures-clerk.house.gov/

### Develop

```bash
pip install -e ".[dev]"
pytest
```

### Run (once collectors are implemented)

```bash
trades-collect senate -o trades.csv
trades-collect house  -o trades.csv
trades-collect all    -o trades.csv
```
