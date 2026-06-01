"""
FastAPI application — serves the frontend and provides
WebSocket chat and REST API endpoints.
"""
import json
from pathlib import Path

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse

import config
from app.chat_handler import ChatHandler
from memory.manager import MemoryManager

app = FastAPI(
    title="Ramanujan Digital Twin",
    description="A digital twin of Srinivasa Ramanujan (1887-1920)",
    version="1.0.0",
)

# Initialize handlers
chat_handler = ChatHandler()
memory_manager = MemoryManager()

# --- Static Files ---

static_dir = Path(config.STATIC_DIR)
if static_dir.exists():
    app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")


# --- Pages ---

@app.get("/")
async def serve_index():
    """Serve the main chat interface."""
    index_path = static_dir / "index.html"
    if index_path.exists():
        return FileResponse(str(index_path))
    return JSONResponse(
        {"error": "Frontend not found. Ensure app/static/index.html exists."},
        status_code=404,
    )


# --- REST API ---

@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok", "persona": "Srinivasa Ramanujan (1887-1920)"}


@app.get("/api/memories/{session_id}")
async def get_memories(session_id: str):
    """Get all memories for a session (for the dashboard)."""
    try:
        memories = await memory_manager.get_all_memories_for_display(session_id)
        return {"session_id": session_id, "memories": memories}
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)


@app.get("/api/history/{session_id}")
async def get_history(session_id: str):
    """Get conversation history for a session."""
    try:
        history = await chat_handler.get_history(session_id)
        return {"session_id": session_id, "history": history}
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)


@app.get("/api/sessions")
async def get_sessions():
    """Get all past sessions for the sidebar."""
    try:
        sessions = await memory_manager.get_past_sessions(limit=50)
        return {"sessions": sessions}
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)


@app.get("/api/timeline")
async def get_timeline():
    """Get Ramanujan's life timeline data."""
    timeline = [
        {"year": 1887, "event": "Born on 22 December in Erode, Tamil Nadu", "category": "personal"},
        {"year": 1889, "event": "Family moves to Kumbakonam", "category": "personal"},
        {"year": 1898, "event": "Enters Town High School; excels in all subjects", "category": "academic"},
        {"year": 1903, "event": "Obtains Carr's Synopsis of Elementary Results — begins self-study of mathematics", "category": "mathematical"},
        {"year": 1904, "event": "Enters Government Arts College on scholarship", "category": "academic"},
        {"year": 1906, "event": "Loses scholarship — too absorbed in mathematics to study other subjects", "category": "academic"},
        {"year": 1909, "event": "Marries S. Janaki Ammal", "category": "personal"},
        {"year": 1911, "event": "Publishes first paper — 'Some Properties of Bernoulli's Numbers' in JIMS", "category": "mathematical"},
        {"year": 1912, "event": "Secures clerical position at Madras Port Trust (£20 per annum)", "category": "personal"},
        {"year": 1913, "event": "Writes historic letter to G. H. Hardy — encloses ~120 theorems", "category": "cambridge"},
        {"year": 1914, "event": "Travels to England; arrives at Trinity College, Cambridge", "category": "cambridge"},
        {"year": 1915, "event": "Publishes landmark paper on Highly Composite Numbers", "category": "mathematical"},
        {"year": 1916, "event": "Awarded B.Sc. by Research (equivalent to Ph.D.) from Cambridge", "category": "cambridge"},
        {"year": 1917, "event": "Health begins declining; enters sanatoria. Hardy-Ramanujan partition formula published", "category": "cambridge"},
        {"year": 1918, "event": "Elected Fellow of the Royal Society and Fellow of Trinity College", "category": "cambridge"},
        {"year": 1919, "event": "Returns to India due to illness; arrives in Bombay", "category": "personal"},
        {"year": 1920, "event": "Writes last letter to Hardy on mock theta functions. Dies 26 April, aged 32", "category": "personal"},
    ]
    return {"timeline": timeline}


# --- WebSocket Chat ---

@app.websocket("/ws/chat/{session_id}")
async def websocket_chat(websocket: WebSocket, session_id: str):
    """WebSocket endpoint for real-time chat with Ramanujan."""
    await websocket.accept()
    print(f"WebSocket connected: session {session_id}")

    try:
        while True:
            # Receive message from client
            data = await websocket.receive_text()

            try:
                message = json.loads(data)
                user_text = message.get("content", "").strip()
                image_data = message.get("image_data")
            except json.JSONDecodeError:
                user_text = data.strip()
                image_data = None
                message = {"content": user_text}

            if not user_text and not image_data:
                continue

            # Stream response back
            async for token in chat_handler.handle_message(session_id, message):
                await websocket.send_json(token)

    except WebSocketDisconnect:
        print(f"WebSocket disconnected: session {session_id}")
    except Exception as e:
        print(f"WebSocket error: {e}")
        try:
            await websocket.send_json({
                "type": "error",
                "content": f"An error occurred: {str(e)}",
            })
        except:
            pass
