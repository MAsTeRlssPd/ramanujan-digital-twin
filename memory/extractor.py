"""
Memory extractor — uses Gemini to extract memorable facts
from conversations for long-term storage.
"""
import json
from google import genai
from google.genai import types

import config

EXTRACTION_PROMPT = """You are a memory extraction system for a Ramanujan Digital Twin chatbot.
Given a user message and the assistant's response, extract key facts worth remembering for future conversations.

Extract facts in these categories:
- topic_discussed: Mathematical or biographical topics the user asked about
- user_interest: What the user seems interested in or curious about
- user_knowledge: What level of mathematical knowledge the user seems to have
- personal_detail: Any personal information the user shared about themselves

Return a JSON array of objects with "category", "key", and "value" fields.
If there is nothing worth remembering, return an empty array [].
Keep each fact concise (under 50 words).
Extract at most 3 facts per exchange.

Example output:
[
  {"category": "topic_discussed", "key": "partition function", "value": "User asked about the Hardy-Ramanujan asymptotic formula for p(n)"},
  {"category": "user_interest", "key": "number theory", "value": "User shows deep interest in number theory and partition congruences"}
]
"""


async def extract_memories(
    user_message: str, assistant_response: str
) -> list[dict]:
    """
    Extract memorable facts from a conversation exchange.

    Args:
        user_message: What the user said.
        assistant_response: What Ramanujan replied.

    Returns:
        List of dicts with 'category', 'key', 'value'.
    """
    if not config.MEMORY_EXTRACTION_ENABLED:
        return []

    try:
        client = genai.Client(api_key=config.GOOGLE_API_KEY)

        prompt = f"""User message: {user_message}

Assistant response: {assistant_response[:500]}

Extract memorable facts as JSON:"""

        response = await client.aio.models.generate_content(
            model=config.GENERATION_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=EXTRACTION_PROMPT,
                temperature=0.1,
                thinking_config=types.ThinkingConfig(thinking_budget=0),
            ),
        )

        # Parse JSON from response
        text = response.text.strip()
        # Handle markdown code blocks
        if text.startswith("```"):
            text = text.split("\n", 1)[1]
            text = text.rsplit("```", 1)[0]

        memories = json.loads(text)

        # Validate structure
        valid = []
        for mem in memories:
            if all(k in mem for k in ("category", "key", "value")):
                valid.append(mem)

        return valid[:3]  # Max 3 facts per exchange

    except Exception as e:
        # Memory extraction is non-critical — never crash the chat
        print(f"Memory extraction warning: {e}")
        return []
