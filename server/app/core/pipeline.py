# server/app/core/pipeline.py
from .storage import store_scan
from .models  import ScanIn
from .enrichment import enrich

def ingest_scan(scan: ScanIn) -> dict:
    """Validate ➜ enrich ➜ persist ➜ return summary."""
    enriched = enrich(scan)            # add product metadata, etc.
    store_scan(enriched)               # write to JSON, Excel, or DB
    return {"status": "success", "scan": enriched}
