#!/bin/bash
# startup.sh — Entrypoint for Render.com deployment
# 1. Build the RAG corpus (ChromaDB) if it hasn't been built yet.
# 2. Start the uvicorn server.

set -e

echo "=============================================="
echo "  Ramanujan Digital Twin — Starting Up"
echo "=============================================="

# Check if ChromaDB has already been built on the persistent disk.
# We look for any files inside the chroma_db directory.
CHROMA_DIR="/data/chroma_db"

if [ -z "$(ls -A $CHROMA_DIR 2>/dev/null)" ]; then
    echo ""
    echo "  [INFO] ChromaDB not found. Building RAG corpus from scratch..."
    echo "         This only happens on first deploy (~2-3 minutes)."
    echo ""
    python build_corpus.py --ingest-only
    echo ""
    echo "  [INFO] Corpus build complete!"
else
    echo ""
    echo "  [INFO] ChromaDB already exists at $CHROMA_DIR — skipping build."
fi

echo ""
echo "  [INFO] Starting uvicorn server on port $PORT..."
echo "=============================================="

exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
