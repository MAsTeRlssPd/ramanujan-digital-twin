"""
Central configuration for the Ramanujan Digital Twin.
"""
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# --- Paths ---
BASE_DIR = Path(__file__).parent
CORPUS_DIR = BASE_DIR / "corpus"
DATA_DIR = BASE_DIR / "data"
CHROMA_DB_DIR = DATA_DIR / "chroma_db"
MEMORY_DB_PATH = DATA_DIR / "memory.db"
STATIC_DIR = BASE_DIR / "app" / "static"

# Ensure data directories exist
DATA_DIR.mkdir(exist_ok=True)
CHROMA_DB_DIR.mkdir(parents=True, exist_ok=True)

# --- API ---
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")

# --- Models ---
GENERATION_MODEL = "gemini-2.5-flash"
EMBEDDING_MODEL = "gemini-embedding-2"
EMBEDDING_DIMENSIONS = 768

# --- RAG ---
CHROMA_COLLECTION_NAME = "ramanujan_knowledge"
CHUNK_SIZE = 700
CHUNK_OVERLAP = 100
RAG_TOP_K = 5
RAG_RELEVANCE_THRESHOLD = 1.5

# --- Memory ---
MAX_CONVERSATION_HISTORY = 20  # turns kept in short-term memory
MEMORY_EXTRACTION_ENABLED = True

# --- Server ---
HOST = "0.0.0.0"
PORT = 8000
