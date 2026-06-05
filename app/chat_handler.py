"""
Chat handler — orchestrates the full pipeline for each user message:
RAG retrieval → memory recall → prompt assembly → Gemini streaming → memory extraction.
"""
import asyncio
from google import genai
from google.genai import types

import config
from rag.retriever import Retriever
from memory.manager import MemoryManager
from memory.extractor import extract_memories
from persona.system_prompt import build_system_prompt


class ChatHandler:
    """Manages the end-to-end chat pipeline."""

    def __init__(self):
        self.memory = MemoryManager()
        self._retriever = None
        self._gemini_client = genai.Client(api_key=config.GOOGLE_API_KEY)

    @property
    def retriever(self):
        """Lazy-load retriever to avoid importing ChromaDB at startup if corpus isn't ready."""
        if self._retriever is None:
            try:
                self._retriever = Retriever()
            except Exception as e:
                print(f"Warning: RAG retriever not available: {e}")
        return self._retriever

    async def handle_message(self, session_id: str, user_payload: dict):
        """
        Process a user message (which may contain text and/or an image) and yield streaming response tokens.

        Yields:
            dicts with 'type' and 'content' keys:
            - {"type": "stream", "content": "token..."}
            - {"type": "sources", "content": [...]}
            - {"type": "end", "content": ""}
        """
        user_message = user_payload.get("content", "").strip()
        image_data = user_payload.get("image_data")
        mime_type = user_payload.get("mime_type", "image/jpeg")

        # 1. Ensure session exists
        await self.memory.get_or_create_session(session_id)

        # 2. Store user message in short-term memory (with image placeholder if present)
        memory_text = user_message
        if image_data:
            memory_text = f"[Image uploaded] {user_message}".strip()
        await self.memory.add_turn(session_id, "user", memory_text)

        # 3. Retrieve RAG context
        rag_context = ""
        sources = []
        if self.retriever:
            try:
                rag_context, sources = self.retriever.retrieve_as_context(
                    user_message
                )
            except Exception as e:
                print(f"RAG retrieval warning: {e}")

        # 4. Recall long-term memories
        memory_context = await self.memory.get_memories_as_context(session_id)

        # 5. Build system prompt
        system_prompt = build_system_prompt(
            rag_context=rag_context,
            memory_context=memory_context,
        )
        
        # 5.5 Math Counter Logic (Per-Prompt)
        math_keywords = ['solve', 'equation', 'theorem', 'proof', 'formula', 'calculate', 'integrate', 'differentiate', 'series', 'function', 'integral', 'derivative', 'geometry', 'algebra', 'calculus', '+', '=', 'sin', 'cos', 'tan', 'math']
        lower_msg = user_message.lower()
        has_math_context = any(kw in lower_msg for kw in math_keywords)
        
        q_count = user_message.count('?')
        q_count += lower_msg.count('solve')
        q_count += lower_msg.count('calculate')
        q_count += lower_msg.count('find')
        q_count += lower_msg.count('evaluate')
            
        # Only trigger if it has math context AND >= 3 questions, OR if explicitly requested
        if (has_math_context and q_count >= 3) or ('image' in lower_msg and 'handwriting' in lower_msg):
            system_prompt += "\n\nCRITICAL INSTRUCTION: The user has asked 3 or more mathematical questions in this single prompt! You MUST provide your ENTIRE mathematical solution inside a ```handwriting\n...\n``` markdown block. DO NOT use normal text for the math solution, and absolutely DO NOT output any ```plot``` or ```plot3d``` blocks. Use the handwriting block exclusively so it can be rendered as an image of your actual handwriting. CRITICAL: Inside the handwriting block, you MUST NOT use LaTeX formatting (like \\frac, \\int, \\pi, or $$). Write all math using plain readable text (like x^2, a/b, pi, integral) because the handwriting canvas does not support LaTeX."

        # 6. Build conversation history for Gemini
        history = await self.memory.get_conversation_history(session_id)
        contents = []
        for turn in history[:-1]:  # Exclude the just-added user message
            role = "user" if turn["role"] == "user" else "model"
            contents.append(types.Content(
                role=role,
                parts=[types.Part(text=turn["content"])],
            ))
        # Add current user message
        user_parts = []
        if user_message:
            user_parts.append(types.Part(text=user_message))
        if image_data:
            import base64
            image_bytes = base64.b64decode(image_data.split(",")[1] if "," in image_data else image_data)
            user_parts.append(types.Part.from_bytes(data=image_bytes, mime_type=mime_type))
            
        if not user_parts: # Fallback if empty payload
            user_parts.append(types.Part(text="Please look at this."))

        contents.append(types.Content(
            role="user",
            parts=user_parts,
        ))

        # 7. Stream response from Gemini
        full_response = ""
        try:
            response_stream = await self._gemini_client.aio.models.generate_content_stream(
                model=config.GENERATION_MODEL,
                contents=contents,
                config=types.GenerateContentConfig(
                    system_instruction=system_prompt,
                    temperature=0.7,
                    top_p=0.9,
                    thinking_config=types.ThinkingConfig(thinking_budget=0),
                ),
            )

            async for chunk in response_stream:
                if chunk.text:
                    full_response += chunk.text
                    yield {"type": "stream", "content": chunk.text}

        except Exception as e:
            error_msg = f"I am afraid something went wrong — {str(e)}"
            full_response = error_msg
            yield {"type": "stream", "content": error_msg}

        # 8. Send sources
        if sources:
            yield {"type": "sources", "content": sources}

        # 9. Signal end
        yield {"type": "end", "content": ""}

        # 10. Store assistant response in short-term memory
        await self.memory.add_turn(session_id, "assistant", full_response)

        # 11. Extract and store long-term memories (non-blocking)
        asyncio.create_task(
            self._extract_and_store_memories(session_id, user_message, full_response)
        )

    async def _extract_and_store_memories(
        self, session_id: str, user_message: str, assistant_response: str
    ):
        """Background task to extract and store memories."""
        try:
            facts = await extract_memories(user_message, assistant_response)
            for fact in facts:
                await self.memory.save_memory(
                    session_id=session_id,
                    category=fact["category"],
                    key=fact["key"],
                    value=fact["value"],
                )
        except Exception as e:
            print(f"Memory storage warning: {e}")

    async def get_history(self, session_id: str) -> list[dict]:
        """Get conversation history for a session."""
        await self.memory.get_or_create_session(session_id)
        return await self.memory.get_conversation_history(session_id)
