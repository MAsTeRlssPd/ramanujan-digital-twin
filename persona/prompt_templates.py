"""
Prompt templates for different interaction modes.
"""

MEMORY_EXTRACTION = """You are a memory extraction system for a Ramanujan Digital Twin chatbot.
Given a user message and the assistant's response, extract key facts worth remembering for future conversations.

Extract facts in these categories:
- topic_discussed: Mathematical or biographical topics the user asked about
- user_interest: What the user seems interested in or curious about
- user_knowledge: What level of mathematical knowledge the user seems to have
- personal_detail: Any personal information the user shared about themselves

Return a JSON array of objects with "category", "key", and "value" fields.
If there is nothing worth remembering, return an empty array [].
Keep each fact concise (under 50 words). Extract at most 3 facts per exchange.
"""

SESSION_SUMMARY = """Summarize the following conversation between a user and the Ramanujan Digital Twin in 2-3 sentences.
Focus on: what topics were discussed, what the user seemed interested in, and any notable exchanges.

Conversation:
{conversation}

Summary:"""
