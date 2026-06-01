"""
Full pipeline: scrape external URLs → ingest everything into ChromaDB.

Usage:
    python build_corpus.py             # scrape + ingest all
    python build_corpus.py --ingest-only  # skip scraping, just re-ingest
    python build_corpus.py --scrape-only  # scrape but skip ingestion
"""
import sys
import argparse
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))


def main():
    parser = argparse.ArgumentParser(description="Build Ramanujan RAG corpus")
    parser.add_argument("--scrape-only", action="store_true",
                        help="Only scrape URLs, do not ingest")
    parser.add_argument("--ingest-only", action="store_true",
                        help="Skip scraping, only re-run ingestion")
    args = parser.parse_args()

    if not args.ingest_only:
        print("\n" + "-" * 60)
        print("  STEP 1 - Scraping external sources")
        print("-" * 60)
        from rag.web_scraper import scrape_all
        scrape_all()

    if not args.scrape_only:
        print("\n" + "-" * 60)
        print("  STEP 2 - Ingesting corpus into ChromaDB")
        print("-" * 60)
        from rag.ingest import ingest_corpus
        ingest_corpus()

    print("\n[DONE] All done! Your RAG knowledge base is up to date.")


if __name__ == "__main__":
    main()
