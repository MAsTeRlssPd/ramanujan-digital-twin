"""
SQLite database models and schema for the memory system.
"""
import aiosqlite

import config

SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS sessions (
    session_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    summary TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES sessions(session_id)
);

CREATE TABLE IF NOT EXISTS long_term_memories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    category TEXT NOT NULL,
    key TEXT NOT NULL,
    value TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES sessions(session_id)
);

CREATE INDEX IF NOT EXISTS idx_conversations_session
    ON conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_memories_session
    ON long_term_memories(session_id);
CREATE INDEX IF NOT EXISTS idx_memories_category
    ON long_term_memories(category);
"""


async def get_db() -> aiosqlite.Connection:
    """Get a database connection."""
    db = await aiosqlite.connect(str(config.MEMORY_DB_PATH))
    db.row_factory = aiosqlite.Row
    await db.execute("PRAGMA journal_mode=WAL")
    return db


async def init_db():
    """Initialize the database schema."""
    db = await get_db()
    try:
        await db.executescript(SCHEMA_SQL)
        
        # Migration: Add user_id to sessions if it doesn't exist
        cursor = await db.execute("PRAGMA table_info(sessions)")
        columns = [row["name"] for row in await cursor.fetchall()]
        if "user_id" not in columns:
            await db.execute("ALTER TABLE sessions ADD COLUMN user_id TEXT DEFAULT 'default_user'")
            
        await db.commit()
    finally:
        await db.close()
