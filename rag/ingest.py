"""
Corpus ingestion script.
Reads all markdown files from corpus/, chunks them, and stores in ChromaDB.

Usage: python -m rag.ingest
"""
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

import config
from rag.chunker import RecursiveTextChunker
from rag.vector_store import VectorStore


def ingest_corpus():
    """Process all corpus documents and store in vector database."""
    corpus_dir = config.CORPUS_DIR

    if not corpus_dir.exists():
        print(f"ERROR: Corpus directory not found: {corpus_dir}")
        return

    md_files = sorted(corpus_dir.glob("*.md"))
    if not md_files:
        print(f"ERROR: No markdown files found in {corpus_dir}")
        return

    print(f"Found {len(md_files)} corpus documents")
    print("=" * 50)

    # Initialize components
    chunker = RecursiveTextChunker()
    store = VectorStore()

    # Clear existing data for clean rebuild
    print("Clearing existing collection...")
    store.clear()

    total_chunks = 0

    for md_file in md_files:
        print(f"\nProcessing: {md_file.name}")

        text = md_file.read_text(encoding="utf-8")

        # Derive metadata from filename
        # e.g., "math_partition_function.md" -> topic="partition function", type="math"
        stem = md_file.stem
        parts = stem.split("_", 1)
        doc_type = parts[0] if parts else "general"
        topic = parts[1].replace("_", " ") if len(parts) > 1 else stem

        chunks = chunker.chunk_document(
            text=text,
            source_file=md_file.name,
            topic=topic,
            doc_type=doc_type,
        )

        print(f"  -> {len(chunks)} chunks (avg {sum(len(c.text) for c in chunks) // max(len(chunks), 1)} chars)")

        store.add_chunks(chunks)
        total_chunks += len(chunks)

    print("\n" + "=" * 50)
    print(f"Ingestion complete!")
    print(f"  Total documents: {len(md_files)}")
    print(f"  Total chunks:    {total_chunks}")
    print(f"  Stored in:       {config.CHROMA_DB_DIR}")

    # Verify
    stats = store.get_stats()
    print(f"  Collection size: {stats['total_chunks']} chunks")


if __name__ == "__main__":
    ingest_corpus()
