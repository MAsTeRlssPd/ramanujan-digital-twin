"""
Memory manager — handles short-term conversation history
and long-term persistent memory across sessions.
"""
from datetime import datetime
from typing import Optional

import config
from memory.models import get_db, init_db


class MemoryManager:
    """Two-tier memory: short-term (in-conversation) and long-term (cross-session)."""

    def __init__(self):
        self._initialized = False

    async def _ensure_init(self):
        """Ensure database is initialized."""
        if not self._initialized:
            await init_db()
            self._initialized = True

    # --- Session Management ---

    async def get_or_create_session(self, session_id: str, user_id: str) -> dict:
        """Get existing session or create a new one."""
        await self._ensure_init()
        db = await get_db()
        try:
            cursor = await db.execute(
                "SELECT * FROM sessions WHERE session_id = ? AND user_id = ?", (session_id, user_id)
            )
            row = await cursor.fetchone()
            if row:
                # Update last_active
                await db.execute(
                    "UPDATE sessions SET last_active = CURRENT_TIMESTAMP WHERE session_id = ?",
                    (session_id,),
                )
                await db.commit()
                return dict(row)
            else:
                await db.execute(
                    "INSERT INTO sessions (session_id, user_id) VALUES (?, ?)", (session_id, user_id)
                )
                await db.commit()
                return {
                    "session_id": session_id,
                    "user_id": user_id,
                    "created_at": datetime.now().isoformat(),
                    "last_active": datetime.now().isoformat(),
                    "summary": "",
                }
        finally:
            await db.close()

    async def verify_session_owner(self, session_id: str, user_id: str) -> bool:
        """Verify that a session belongs to the given user."""
        await self._ensure_init()
        db = await get_db()
        try:
            cursor = await db.execute("SELECT 1 FROM sessions WHERE session_id = ? AND user_id = ?", (session_id, user_id))
            return bool(await cursor.fetchone())
        finally:
            await db.close()

    # --- Short-Term Memory (Conversation History) ---

    async def add_turn(self, session_id: str, role: str, content: str):
        """Add a conversation turn to the history."""
        await self._ensure_init()
        db = await get_db()
        try:
            await db.execute(
                "INSERT INTO conversations (session_id, role, content) VALUES (?, ?, ?)",
                (session_id, role, content),
            )
            await db.execute(
                "UPDATE sessions SET last_active = CURRENT_TIMESTAMP WHERE session_id = ?",
                (session_id,),
            )
            await db.commit()
        finally:
            await db.close()

    async def get_conversation_history(
        self, session_id: str, limit: int = None
    ) -> list[dict]:
        """Get recent conversation history for a session."""
        await self._ensure_init()
        limit = limit or config.MAX_CONVERSATION_HISTORY
        db = await get_db()
        try:
            cursor = await db.execute(
                """SELECT role, content, timestamp FROM conversations
                WHERE session_id = ?
                ORDER BY id DESC LIMIT ?""",
                (session_id, limit),
            )
            rows = await cursor.fetchall()
            # Reverse to get chronological order
            return [dict(r) for r in reversed(rows)]
        finally:
            await db.close()

    # --- Long-Term Memory ---

    async def save_memory(
        self, session_id: str, category: str, key: str, value: str
    ):
        """Store a long-term memory fact."""
        await self._ensure_init()
        db = await get_db()
        try:
            # Check for duplicates (same session, category, key)
            cursor = await db.execute(
                """SELECT id FROM long_term_memories
                WHERE session_id = ? AND category = ? AND key = ?""",
                (session_id, category, key),
            )
            existing = await cursor.fetchone()
            if existing:
                # Update existing memory
                await db.execute(
                    """UPDATE long_term_memories
                    SET value = ?, created_at = CURRENT_TIMESTAMP
                    WHERE id = ?""",
                    (value, existing["id"]),
                )
            else:
                await db.execute(
                    """INSERT INTO long_term_memories
                    (session_id, category, key, value)
                    VALUES (?, ?, ?, ?)""",
                    (session_id, category, key, value),
                )
            await db.commit()
        finally:
            await db.close()

    async def get_memories(
        self, session_id: str, category: Optional[str] = None
    ) -> list[dict]:
        """Get long-term memories for a session, optionally filtered by category."""
        await self._ensure_init()
        db = await get_db()
        try:
            if category:
                cursor = await db.execute(
                    """SELECT category, key, value, created_at
                    FROM long_term_memories
                    WHERE session_id = ? AND category = ?
                    ORDER BY created_at DESC""",
                    (session_id, category),
                )
            else:
                cursor = await db.execute(
                    """SELECT category, key, value, created_at
                    FROM long_term_memories
                    WHERE session_id = ?
                    ORDER BY created_at DESC""",
                    (session_id,),
                )
            rows = await cursor.fetchall()
            return [dict(r) for r in rows]
        finally:
            await db.close()

    async def get_all_memories_for_display(self, session_id: str) -> dict:
        """Get all memories organized by category for the dashboard."""
        await self._ensure_init()
        memories = await self.get_memories(session_id)

        organized = {}
        for mem in memories:
            cat = mem["category"]
            if cat not in organized:
                organized[cat] = []
            organized[cat].append({
                "key": mem["key"],
                "value": mem["value"],
                "created_at": mem["created_at"],
            })

        return organized

    async def get_memories_as_context(self, session_id: str) -> str:
        """Format long-term memories as context for the system prompt."""
        await self._ensure_init()
        memories = await self.get_memories(session_id)

        if not memories:
            return ""

        lines = [
            "You remember the following from previous conversations with this person:"
        ]
        for mem in memories[:15]:  # Limit to avoid token overflow
            lines.append(f"- [{mem['category']}] {mem['key']}: {mem['value']}")

        return "\n".join(lines)

    async def save_session_summary(self, session_id: str, summary: str):
        """Save a summary for the session."""
        await self._ensure_init()
        db = await get_db()
        try:
            await db.execute(
                "UPDATE sessions SET summary = ? WHERE session_id = ?",
                (summary, session_id),
            )
            await db.commit()
        finally:
            await db.close()

    async def get_past_sessions(self, user_id: str, limit: int = 5) -> list[dict]:
        """Get summaries of past sessions."""
        await self._ensure_init()
        db = await get_db()
        try:
            cursor = await db.execute(
                """SELECT session_id, created_at, last_active, summary
                FROM sessions
                WHERE user_id = ?
                ORDER BY last_active DESC LIMIT ?""",
                (user_id, limit),
            )
            rows = await cursor.fetchall()
            return [dict(r) for r in rows]
        finally:
            await db.close()

    async def delete_session(self, session_id: str, user_id: str):
        """Delete a session and all its associated data (cascade)."""
        await self._ensure_init()
        db = await get_db()
        try:
            # Verify ownership
            cursor = await db.execute("SELECT session_id FROM sessions WHERE session_id = ? AND user_id = ?", (session_id, user_id))
            if not await cursor.fetchone():
                return
            
            await db.execute(
                "DELETE FROM long_term_memories WHERE session_id = ?", (session_id,)
            )
            await db.execute(
                "DELETE FROM conversations WHERE session_id = ?", (session_id,)
            )
            await db.execute(
                "DELETE FROM sessions WHERE session_id = ?", (session_id,)
            )
            await db.commit()
        finally:
            await db.close()

    async def update_session_name(self, session_id: str, user_id: str, name: str):
        """Update the display name (summary) of a session."""
        await self._ensure_init()
        db = await get_db()
        try:
            await db.execute(
                "UPDATE sessions SET summary = ? WHERE session_id = ? AND user_id = ?",
                (name[:80], session_id, user_id),
            )
            await db.commit()
        finally:
            await db.close()
