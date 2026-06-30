"""
FastAPI application — serves the frontend and provides
WebSocket chat and REST API endpoints.
"""
import json
import io
from pathlib import Path

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request, Header, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse

import edge_tts

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
    """Serve the main chat interface without caching."""
    index_path = static_dir / "index.html"
    if index_path.exists():
        headers = {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0",
        }
        return FileResponse(str(index_path), headers=headers)
    raise HTTPException(status_code=404, detail="index.html not found")


# --- REST API ---

@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok", "persona": "Srinivasa Ramanujan (1887-1920)"}


@app.get("/api/memories/{session_id}")
async def get_memories(session_id: str, x_user_id: str | None = Header(None)):
    """Get all memories for a session (for the dashboard)."""
    if not x_user_id:
        return JSONResponse({"error": "Missing X-User-ID header"}, status_code=400)
    try:
        if not await memory_manager.verify_session_owner(session_id, x_user_id):
            return JSONResponse({"error": "Unauthorized"}, status_code=403)
        memories = await memory_manager.get_all_memories_for_display(session_id)
        return {"session_id": session_id, "memories": memories}
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)


@app.get("/api/history/{session_id}")
async def get_history(session_id: str, x_user_id: str | None = Header(None)):
    """Get conversation history for a session."""
    if not x_user_id:
        return JSONResponse({"error": "Missing X-User-ID header"}, status_code=400)
    try:
        # Note: chat_handler.get_history handles ownership check via get_or_create_session
        # which will throw IntegrityError if trying to steal a session
        history = await chat_handler.get_history(session_id, x_user_id)
        return {"session_id": session_id, "history": history}
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)


@app.get("/api/sessions")
async def get_sessions(x_user_id: str | None = Header(None)):
    """Get all past sessions for the sidebar."""
    if not x_user_id:
        return JSONResponse({"error": "Missing X-User-ID header"}, status_code=400)
    try:
        sessions = await memory_manager.get_past_sessions(user_id=x_user_id, limit=50)
        return {"sessions": sessions}
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)


@app.delete("/api/sessions/{session_id}")
async def delete_session(session_id: str, x_user_id: str | None = Header(None)):
    """Delete a session and all its associated data."""
    if not x_user_id:
        return JSONResponse({"error": "Missing X-User-ID header"}, status_code=400)
    try:
        await memory_manager.delete_session(session_id, x_user_id)
        return {"status": "deleted", "session_id": session_id}
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)


@app.patch("/api/sessions/{session_id}/name")
async def rename_session(session_id: str, request: Request, x_user_id: str | None = Header(None)):
    """Update the display name (summary) of a session."""
    if not x_user_id:
        return JSONResponse({"error": "Missing X-User-ID header"}, status_code=400)
    try:
        body = await request.json()
        name = body.get("name", "").strip()
        if name:
            await memory_manager.update_session_name(session_id, x_user_id, name)
        return {"status": "ok", "session_id": session_id, "name": name}
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


@app.get("/api/corpus/{filename}")
async def get_corpus_file(filename: str):
    """Serve the original markdown corpus file content."""
    # Ensure it's just a filename without paths to prevent directory traversal
    safe_filename = Path(filename).name
    corpus_dir = Path(config.CORPUS_DIR)
    file_path = corpus_dir / safe_filename
    
    if file_path.exists() and file_path.is_file():
        # Read as plain text so browsers display it instead of downloading it
        from fastapi.responses import PlainTextResponse
        content = file_path.read_text(encoding="utf-8")
        return PlainTextResponse(content)
    
    return JSONResponse(
        {"error": "Corpus file not found."},
        status_code=404,
    )

# --- Text-to-Speech (Server-Side) ---

TTS_VOICE = "en-IN-PrabhatNeural"  # Indian English Male neural voice

@app.post("/api/tts")
async def text_to_speech(request: Request):
    """Generate speech audio from text using edge-tts (Indian English male voice)."""
    try:
        body = await request.json()
        text = body.get("text", "").strip()
        if not text:
            return JSONResponse({"error": "No text provided"}, status_code=400)

        # Limit text length to prevent abuse
        if len(text) > 5000:
            text = text[:5000]

        communicate = edge_tts.Communicate(text, TTS_VOICE)
        audio_buffer = io.BytesIO()
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_buffer.write(chunk["data"])

        audio_buffer.seek(0)
        return StreamingResponse(
            audio_buffer,
            media_type="audio/mpeg",
            headers={"Content-Disposition": "inline; filename=speech.mp3"},
        )
    except Exception as e:
        print(f"TTS error: {e}")
        return JSONResponse({"error": str(e)}, status_code=500)


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
